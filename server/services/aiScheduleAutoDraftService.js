/**
 * Conversational AI draft for schedule auto-fill (month planner).
 * Preview only — user confirms; actual generation via POST .../entries/auto-generate (same validation path).
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { canSupervisorManageSchedule } = require('./roleService')
const { createChatCompletionJson, isOpenAIConfigured } = require('./openaiService')
const { getScheduleUsers, normalizeShiftsConfig, sanitizeAutoEntryNotes } = require('./scheduleAutoPlannerService')
const { getHolidaysInRange } = require('../utils/holidays')

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 4000

function normalizeMessages(messages) {
	if (!Array.isArray(messages)) return []
	return messages
		.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
		.map(m => ({
			role: m.role,
			content: m.content.slice(0, MAX_MESSAGE_LENGTH).trim(),
		}))
		.filter(m => m.content.length > 0)
		.slice(-MAX_MESSAGES)
}

function toDateKey(dateValue) {
	const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue)
	if (Number.isNaN(date.getTime())) return null
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function dateInMonthKey(dateYmd, year, month) {
	if (typeof dateYmd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return false
	const prefix = `${year}-${String(month).padStart(2, '0')}-`
	return dateYmd.startsWith(prefix)
}

async function assertCanAutoGenerateSchedule(userId, schedule) {
	const user = await User.findById(userId)
	if (!user) {
		const err = new Error('User not found')
		err.code = 'USER_INVALID'
		throw err
	}
	if (!schedule) {
		const err = new Error('Schedule not found')
		err.code = 'NOT_FOUND'
		throw err
	}

	const isAdmin = user.roles && user.roles.includes('Admin')
	const isHR = user.roles && user.roles.includes('HR')
	const isCreator =
		schedule.type === 'custom' && schedule.createdBy && schedule.createdBy.toString() === userId.toString()

	if (isAdmin || isHR) {
		if (user.teamId.toString() !== schedule.teamId.toString()) {
			const err = new Error('Access denied')
			err.code = 'FORBIDDEN'
			throw err
		}
	} else if (isCreator) {
		if (user.teamId.toString() !== schedule.teamId.toString()) {
			const err = new Error('Access denied')
			err.code = 'FORBIDDEN'
			throw err
		}
	} else {
		const canManage = await canSupervisorManageSchedule(user, schedule)
		if (!canManage) {
			const err = new Error('Access denied. You do not have permission to auto-generate this schedule.')
			err.code = 'FORBIDDEN'
			throw err
		}
	}
	return user
}

/** Zwraca listę przedziałów HH:mm–HH:mm z Settings.workHours (tablica lub pojedynczy obiekt). */
function formatTeamWorkHoursLines(settings) {
	if (!settings?.workHours) return ''
	const raw = settings.workHours
	const arr = Array.isArray(raw)
		? raw.filter((w) => w && w.timeFrom && w.timeTo)
		: raw.timeFrom && raw.timeTo
			? [raw]
			: []
	if (arr.length === 0) return ''
	return arr
		.map((w, i) => {
			const hrs = w.hours != null && !Number.isNaN(Number(w.hours)) ? ` (${Number(w.hours)}h)` : ''
			return `${i + 1}. ${String(w.timeFrom).trim()}–${String(w.timeTo).trim()}${hrs}`
		})
		.join('\n')
}

function resolveUserHint(users, hint) {
	if (!hint || typeof hint !== 'string') return null
	const h = hint.trim().toLowerCase()
	if (!h) return null
	if (/^[a-f\d]{24}$/i.test(h)) {
		const byId = users.find(u => u._id.toString() === h)
		return byId ? byId._id.toString() : null
	}
	for (const u of users) {
		const full = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase()
		const un = (u.username || '').toLowerCase()
		if (full && h === full) return u._id.toString()
		if (un && h === un) return u._id.toString()
	}
	for (const u of users) {
		const full = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase()
		if (full && (full.includes(h) || h.includes(full))) return u._id.toString()
	}
	return null
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.scheduleId
 * @param {number} input.year
 * @param {number} input.month 1-12
 * @param {Array} input.messages
 * @param {string} [input.locale] pl|en
 */
async function runScheduleAutoDraftTurn(input) {
	if (!isOpenAIConfigured()) {
		console.error('[ai] OPENAI_API_KEY is not configured')
		const err = new Error('AI assistant is not configured')
		err.code = 'OPENAI_NOT_CONFIGURED'
		throw err
	}

	const year = Number(input.year)
	const month = Number(input.month)
	if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
		const err = new Error('Invalid year/month')
		err.code = 'VALIDATION'
		throw err
	}

	const schedule = await Schedule.findById(input.scheduleId)
	await assertCanAutoGenerateSchedule(input.userId, schedule)

	const teamSettings = await Settings.getSettings(schedule.teamId)
	const workOnWeekends = teamSettings?.workOnWeekends !== false

	const locale = input.locale === 'en' ? 'en' : 'pl'
	const messages = normalizeMessages(input.messages)
	if (messages.length === 0) {
		const err = new Error('No valid messages')
		err.code = 'VALIDATION'
		throw err
	}

	const users = await getScheduleUsers(schedule)
	const roster = users.map(u => ({
		id: u._id.toString(),
		label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u._id.toString(),
		username: u.username || '',
	}))

	const rosterLines = roster.map(r => `- ${r.id} — ${r.label}`).join('\n')

	const teamWorkHoursLines = formatTeamWorkHoursLines(teamSettings)
	const teamWorkHoursBlock =
		teamWorkHoursLines.length > 0
			? [
					`TEAM WORK HOURS PRESETS (from team settings — standard intervals used as quick-picks in the app):`,
					teamWorkHoursLines,
					locale === 'en'
						? `Use these as the DEFAULT suggested shifts (one shift per line: timeFrom/timeTo) unless the user wants something else. Early in the flow, ASK whether these intervals are still correct for THIS month's auto-fill, or if they want to change times, min headcount per shift, or weekdays. When building draft.shifts, mirror these presets by default (same number of shifts as listed above) until the user adjusts them.`
						: `Traktuj je jako DOMYŚLNE proponowane zmiany (jedna zmiana na wiersz: timeFrom/timeTo), chyba że użytkownik poda inaczej. Na początku rozmowy ZAPYTAJ, czy te przedziały są nadal aktualne dla TEGO miesiąca w auto-uzupełnieniu, czy trzeba je zmienić (godziny, min. osób, dni tygodnia). Gdy budujesz draft.shifts, domyślnie odwzoruj te presety (tyle zmian, ile wierszy powyżej), dopóki użytkownik ich nie zmieni.`,
				].join('\n')
			: locale === 'en'
				? `No team work-hours presets are configured in settings — ask the user for shift times (from–to), min people, and weekdays.`
				: `Brak zapisanych „wspólnych godzin pracy” zespołu w ustawieniach — dopytaj użytkownika o przedziały (od–do), min. osób i dni tygodnia.`

	const weekendPolicyPl = workOnWeekends
		? 'Zespół MOŻE pracować w weekendy (sobota i niedziela mogą mieć zmiany jak inne dni).'
		: 'Zespół NIE pracuje w weekendy — planer pomija całkowicie soboty i niedziele (nie planuj zmian na weekend ani dayOverrides tylko na weekend, chyba że użytkownik wyraźnie prosi o wyjątek; domyślnie używaj dni pn–pt w weekdays: [1,2,3,4,5]).'
	const weekendPolicyEn = workOnWeekends
		? 'The team MAY work on weekends (Sat/Sun can have shifts like weekdays).'
		: 'The team does NOT work on weekends — the planner skips Saturday/Sunday entirely (do not plan weekend shifts or weekend-only overrides by default; use weekdays Mon–Fri [1,2,3,4,5] unless the user explicitly asks otherwise).'

	const trackHolidays =
		teamSettings?.includePolishHolidays === true || teamSettings?.includeCustomHolidays === true
	const lastDayOfMonth = new Date(year, month, 0).getDate()
	const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`
	const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
	const holidaysInMonthList = trackHolidays ? getHolidaysInRange(monthStartStr, monthEndStr, teamSettings) : []
	const holidayPolicyBlock = trackHolidays
		? locale === 'en'
			? `HOLIDAYS in ${year}-${String(month).padStart(2, '0')}: the team does NOT work on these days (auto-planner skips them). ${holidaysInMonthList.length ? holidaysInMonthList.map((h) => `${h.date} ${h.name}`).join(' | ') : 'No holiday dates fall in this month (or list empty).' } Do NOT propose shifts or dayOverrides on these dates unless the user explicitly overrides. Ask if the user wants to keep these days non-working.`
			: `ŚWIĘTA w ${year}-${String(month).padStart(2, '0')}: zespół nie pracuje w te dni (planer je pomija). ${holidaysInMonthList.length ? holidaysInMonthList.map((h) => `${h.date} ${h.name}`).join(' | ') : 'Brak świąt w tym miesiącu.'} Nie proponuj zmian ani dayOverrides w te dni, chyba że użytkownik wyraźnie chce wyjątek. Zapytać, czy te dni mają zostać wolne.`
		: locale === 'en'
			? `Holidays: team settings do NOT include Polish/custom holidays — treat all calendar days as potentially working unless the user says otherwise.`
			: `Święta: w ustawieniach zespołu nie włączono świąt polskich/własnych — traktuj dni jak zwykle przy planowaniu, chyba że użytkownik poda inaczej.`

	const systemPrompt = [
		`You help a manager configure AUTOMATIC SCHEDULE FILL for one calendar month in Planopia (work shifts).`,
		`User language: ${locale === 'en' ? 'English' : 'Polish'}. Reply assistantMessage in that language.`,
		`FIXED CONTEXT (do not change): schedule name="${(schedule.name || '').trim()}", year=${year}, month=${month} (month number 1..12).`,
		`TEAM / COMPANY SETTING (from team settings — must respect in your advice and draft):`,
		locale === 'en' ? weekendPolicyEn : weekendPolicyPl,
		holidayPolicyBlock,
		teamWorkHoursBlock,
		`Employees in this schedule (use ONLY these ids for manualExclusions.userId when you need a specific person):`,
		rosterLines || '(none)',
		`Output a single JSON object (no markdown fences) with:`,
		`- "assistantMessage": string — short, conversational; ask for missing details (shifts, times, min headcount, weekdays) or confirm what you understood.`,
		`- "ready": boolean — true ONLY when you have at least one valid shift (timeFrom, timeTo, minEmployees, weekdays 0..6 Sun..Sat) for this month.`,
		`- "draft": null OR object with:`,
		`  - "shifts": array of { "timeFrom":"HH:mm", "timeTo":"HH:mm", "minEmployees": number, "weekdays": number[] }`,
		`  - "dayOverrides": optional array of { "date":"YYYY-MM-DD", "timeFrom,timeTo,minEmployees" } for specific days (same shape as shift for that day).`,
		`  - "manualExclusions": optional array of { "userId": "24hex id from roster above", "date":"YYYY-MM-DD", "timeFrom": null|string, "timeTo": null|string } — use this for "person X cannot work on date Y" (NOT the notes field).`,
		`  - "notes": string OPTIONAL — CRITICAL: this exact string is copied onto EVERY generated shift row for ALL employees. Use ONLY a very short generic label (e.g. "Auto-plan" or empty). NEVER put names, dates, or exclusion reasons in "notes"; those belong ONLY in manualExclusions.`,
		`  - "allowMultipleShiftsPerDay": boolean (default false)`,
		`  - "preferAvailability": boolean (default true)`,
		`  - "strictAvailability": boolean (default false)`,
		`Rules:`,
		`- Weekdays: 0=Sunday .. 6=Saturday (JavaScript convention).`,
		`- Dates in dayOverrides and manualExclusions must fall inside the fixed month ${year}-${String(month).padStart(2, '0')}.`,
		`- Never invent employee ids; pick from the roster list.`,
		`- If the user has not specified enough to run generation, set ready=false and draft=null.`,
	].join('\n')

	const openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages]

	const { content, model, usage } = await createChatCompletionJson({
		messages: openaiMessages,
		temperature: 0.25,
		maxTokens: 2200,
	})

	let parsed
	try {
		parsed = JSON.parse(content)
	} catch {
		return {
			reply:
				locale === 'en'
					? 'Could not read the assistant response. Describe shifts and times in one message.'
					: 'Nie udało się odczytać odpowiedzi. Opisz zmiany i godziny w jednej wiadomości.',
			draft: null,
			draftError: 'PARSE',
			model,
			usage,
		}
	}

	const assistantMessage = typeof parsed.assistantMessage === 'string' ? parsed.assistantMessage : ''
	const ready = parsed.ready === true
	const rawDraft = parsed.draft

	if (!ready || !rawDraft || typeof rawDraft !== 'object') {
		return {
			reply:
				assistantMessage ||
				(locale === 'en'
					? 'Describe the shifts (from–to), how many people per shift, and which weekdays.'
					: 'Opisz zmiany (od–do), ile osób na zmianę i które dni tygodnia.'),
			draft: null,
			draftError: null,
			model,
			usage,
		}
	}

	const shiftsRaw = Array.isArray(rawDraft.shifts) ? rawDraft.shifts : []
	const normalizedShifts = normalizeShiftsConfig({
		shifts: shiftsRaw,
		timeFrom: null,
		timeTo: null,
		minEmployeesPerDay: 1,
	})
	if (!normalizedShifts.length) {
		return {
			reply:
				assistantMessage ||
				(locale === 'en'
					? 'Shift configuration is invalid. Add at least one shift with HH:mm times and min employees.'
					: 'Konfiguracja zmian jest nieprawidłowa. Podaj co najmniej jedną zmianę z godzinami HH:mm i liczbą osób.'),
			draft: null,
			draftError: 'INVALID_SHIFTS',
			model,
			usage,
		}
	}

	const dayOverridesRaw = Array.isArray(rawDraft.dayOverrides) ? rawDraft.dayOverrides : []
	const dayOverrides = []
	for (const o of dayOverridesRaw) {
		const dk = o?.date ? toDateKey(o.date) : null
		if (!dk || !dateInMonthKey(dk, year, month)) continue
		const me = Number(o.minEmployees)
		if (!o.timeFrom || !o.timeTo || Number.isNaN(me) || me < 1) continue
		dayOverrides.push({
			date: dk,
			timeFrom: o.timeFrom,
			timeTo: o.timeTo,
			minEmployees: me,
		})
	}

	const manualRaw = Array.isArray(rawDraft.manualExclusions) ? rawDraft.manualExclusions : []
	const validUserIds = new Set(users.map(u => u._id.toString()))
	const manualExclusions = []
	for (const m of manualRaw) {
		let uid = m?.userId ? String(m.userId) : null
		if (!uid || !validUserIds.has(uid)) {
			const hint = m?.userLabel || m?.userName || m?.name || ''
			const resolved = resolveUserHint(users, hint)
			if (resolved) uid = resolved
		}
		const dk = m?.date ? toDateKey(m.date) : null
		if (!uid || !validUserIds.has(uid) || !dk || !dateInMonthKey(dk, year, month)) continue
		const timeFrom = m.timeFrom && String(m.timeFrom).trim() ? String(m.timeFrom) : null
		const timeTo = m.timeTo && String(m.timeTo).trim() ? String(m.timeTo) : null
		if ((timeFrom && !timeTo) || (!timeFrom && timeTo)) continue
		manualExclusions.push({ userId: uid, date: dk, timeFrom, timeTo })
	}

	const rawNotes = typeof rawDraft.notes === 'string' ? rawDraft.notes.trim().slice(0, 500) : ''
	const notes = sanitizeAutoEntryNotes(rawNotes || 'Auto-plan (AI)')
	const allowMultipleShiftsPerDay = Boolean(rawDraft.allowMultipleShiftsPerDay)
	const preferAvailability = rawDraft.preferAvailability !== false
	const strictAvailability = Boolean(rawDraft.strictAvailability)

	const draft = {
		year,
		month,
		shifts: normalizedShifts.map(s => ({
			timeFrom: s.timeFrom,
			timeTo: s.timeTo,
			minEmployees: s.minEmployees,
			weekdays: s.weekdays,
		})),
		dayOverrides,
		manualExclusions,
		allowMultipleShiftsPerDay,
		notes,
		preferAvailability,
		strictAvailability,
	}

	return {
		reply: assistantMessage,
		draft,
		draftError: null,
		model,
		usage,
	}
}

module.exports = {
	runScheduleAutoDraftTurn,
}
