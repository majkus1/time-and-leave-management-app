/**
 * Builds structured text context for the AI assistant (role-scoped).
 * Supports compact aggregates for long / "all-time" ranges.
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const Announcement = require('../models/Announcement')(firmDb)
const Team = require('../models/Team')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Department = require('../models/Department')(firmDb)
const {
	resolveDetailedDataScope,
	getTeamUserIdsForAggregates,
} = require('./aiAssistantScopeService')
const { buildVerifiedStatsForAi } = require('./aiVerifiedStatsService')
const { roundWorkHoursForDisplay } = require('../utils/workHoursDisplay')

const MS_PER_DAY = 86400000
const MAX_RANGE_DAYS = 366
const MAX_RANGE_ALL_TIME_DAYS = 5475 // ~15 years
const MAX_WORKDAY_DOCS = 400
const MAX_WORKDAY_DOCS_COMPACT = 120
const MAX_TASKS = 200
const MAX_TASKS_ALL = 400
const MAX_ANNOUNCEMENTS = 40
const MAX_ANNOUNCEMENTS_ALL = 80
const MAX_LEAVE_LINES = 220
const MAX_LEAVE_LINES_COMPACT = 90
/** Workday docs scanned for timer description aggregates (separate from detailed JSON cap). */
const MAX_WORKDAYS_FOR_TIMER_AGG = 10000
const TIMER_AGG_TOP_DESCRIPTIONS_PER_USER = 12

function formatDate(d) {
	if (!d) return null
	const x = new Date(d)
	return x.toISOString().slice(0, 10)
}

/**
 * Human-readable leave status for AI context (avoid raw codes like status.pending in assistant answers).
 * @param {string} [status]
 * @param {string} [locale]
 */
function formatLeaveStatusForContext(status, locale) {
	const raw = String(status || '').trim()
	const isEn = String(locale || '').toLowerCase().startsWith('en')
	const norm =
		raw === 'pending'
			? 'status.pending'
			: raw === 'accepted'
				? 'status.accepted'
				: raw === 'rejected'
					? 'status.rejected'
					: raw === 'sent'
						? 'status.sent'
						: raw

	const PL = {
		'status.pending': 'Oczekuje na akceptację',
		'status.accepted': 'Zaakceptowany',
		'status.rejected': 'Odrzucony',
		'status.sent': 'Zapisany (np. zwolnienie / bez akceptacji)',
	}
	const EN = {
		'status.pending': 'Pending approval',
		'status.accepted': 'Accepted',
		'status.rejected': 'Rejected',
		'status.sent': 'Recorded (e.g. sick leave / no approval)',
	}
	const map = isEn ? EN : PL
	return map[norm] || raw || (isEn ? 'Unknown' : 'Nieznany')
}

function timerAggregatesSectionHeader(locale) {
	return String(locale || '').toLowerCase().startsWith('en')
		? '--- Time clock: read plain-text breakdown first, then JSON ---'
		: '--- Licznik czasu: najpierw podział tekstowy, potem JSON ---'
}

/**
 * Short plain-text lines so the model copies per-description rows instead of collapsing to one total per user.
 * @param {Array<{ name: string, totalTimerSessionHours: number, byDescription: Array<{ description: string, totalHours: number, percentOfUserTimer: number, sessions?: number }> }>} byUser
 */
function formatTimerAggregatesPlainText(byUser, hitDocLimit, locale) {
	const isEn = String(locale || '').toLowerCase().startsWith('en')
	const lines = []
	lines.push(
		isEn
			? 'READ THIS BLOCK FIRST. In "## Time clock breakdown", for each person output a markdown table: Description | Hours | %. You MUST list every bullet line below — do NOT replace with a single row "total hours / 100%" per person when multiple breakdown lines exist.'
			: 'CZYTAJ TEN BLOK NAJPIERW. W „## Praca wg licznika” dla każdej osoby wstaw tabelę markdown: Opis | Godziny | %. MUSISZ wypisać **każdą** linię z „•” poniżej — **zabronione** jest zastąpienie tego jednym wierszem „suma godzin / 100%” na osobę, gdy jest kilka wierszy podziału.'
	)
	if (hitDocLimit) {
		lines.push(
			isEn
				? 'Warning: workday scan limit reached — breakdown may be incomplete.'
				: 'Uwaga: osiągnięto limit skanowanych dni roboczych — podział może być niepełny.'
		)
	}
	if (!byUser.length) {
		lines.push(
			isEn
				? '(No timer breakdown rows in aggregated data for this period.)'
				: '(Brak wierszy podziału licznika w agregacie dla tego okresu.)'
		)
		return lines.join('\n')
	}
	for (const u of byUser) {
		lines.push('')
		lines.push(
			isEn
				? `Person: ${u.name} | period total: ${u.totalTimerSessionHours} h`
				: `Osoba: ${u.name} | suma w okresie: ${u.totalTimerSessionHours} h`
		)
		for (const row of u.byDescription || []) {
			const extra =
				row.sessions != null && row.sessions > 0
					? isEn
						? ` (${row.sessions} sessions or day-rows)`
						: ` (${row.sessions} sesji lub wierszy-dni)`
					: ''
			lines.push(
				`  • ${row.description} — ${row.totalHours} h — ${row.percentOfUserTimer}%${extra}`
			)
		}
	}
	return lines.join('\n')
}

function daysBetween(start, end) {
	return Math.ceil((end - start) / MS_PER_DAY) + 1
}

/**
 * @param {{ start: Date, end: Date }} range
 * @param {{ isAllTime?: boolean }} opts
 */
function validateAndClampRange(range, opts = {}) {
	const start = new Date(range.start)
	const end = new Date(range.end)
	start.setHours(0, 0, 0, 0)
	end.setHours(23, 59, 59, 999)
	if (start > end) return { start: end, end: start, clamped: false }
	const maxDays = opts.isAllTime ? MAX_RANGE_ALL_TIME_DAYS : MAX_RANGE_DAYS
	const span = daysBetween(start.getTime(), end.getTime())
	if (span > maxDays) {
		const clampedStart = new Date(end)
		clampedStart.setDate(clampedStart.getDate() - (maxDays - 1))
		clampedStart.setHours(0, 0, 0, 0)
		return { start: clampedStart, end, clamped: true, isAllTime: !!opts.isAllTime }
	}
	return { start, end, clamped: false, isAllTime: !!opts.isAllTime }
}

function announcementVisibleToUser(ann, userId, userDepartments) {
	if (ann.targetScope === 'all') return true
	if (ann.targetScope === 'department' && ann.targetDepartment) {
		const depts = Array.isArray(userDepartments) ? userDepartments : []
		return depts.includes(ann.targetDepartment)
	}
	if (ann.targetScope === 'users' && Array.isArray(ann.targetUsers)) {
		return ann.targetUsers.some(id => id.toString() === userId.toString())
	}
	return false
}

/**
 * Groups timer sessions (timeEntries) by user and work description for AI monthly / period reports.
 * Hours match server logic for sessions: wall-clock (endTime − startTime), same as hoursWorked per session.
 * Skips break-flagged entries and open sessions without endTime.
 *
 * @param {Array<{ userId: unknown, timeEntries?: Array }>} workdaysLean
 * @param {Array<{ _id: unknown, firstName?: string, lastName?: string }>} usersLean
 * @param {number} docLimit
 * @param {string} locale
 * @returns {{ jsonString: string, plainText: string }}
 */
function buildTimerSessionAggregatesPack(workdaysLean, usersLean, docLimit, locale) {
	const isEn = String(locale || '').toLowerCase().startsWith('en')
	const nameById = Object.fromEntries(
		(usersLean || []).map(u => {
			const id = u._id?.toString?.() || String(u._id)
			const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
			return [id, n || id]
		})
	)
	const emptyLabel = isEn ? '(no description)' : '(brak opisu)'
	const otherLabel = isEn
		? count => `(other descriptions, ${count} variants)`
		: count => `(inne opisy, ${count} wariantów)`
	/** Hours on days where hoursWorked exceeds sum of closed sessions (manual entry, legacy rows, or sessions without endTime). */
	const unallocatedLabel = isEn
		? '(day book hours not covered by closed timer sessions in stored data)'
		: '(godziny z ewidencji dnia — bez zamkniętych sesji timera w zapisanych danych)'

	const byUserMap = new Map() // userId -> Map description -> { hours, count }

	for (const wd of workdaysLean || []) {
		const uid = wd.userId?.toString?.() || String(wd.userId)
		if (!byUserMap.has(uid)) byUserMap.set(uid, new Map())
		const dm = byUserMap.get(uid)

		let daySessionSum = 0
		for (const te of wd.timeEntries || []) {
			if (te.isBreak) continue
			if (!te.startTime || !te.endTime) continue
			const ms = new Date(te.endTime).getTime() - new Date(te.startTime).getTime()
			if (ms <= 0) continue
			const h = ms / 3600000
			daySessionSum += h
			const raw = (te.workDescription || '').replace(/\s+/g, ' ').trim()
			const key = raw.slice(0, 200) || emptyLabel
			if (!dm.has(key)) dm.set(key, { hours: 0, count: 0 })
			const cell = dm.get(key)
			cell.hours += h
			cell.count += 1
		}

		const hw = wd.hoursWorked != null ? Number(wd.hoursWorked) : 0
		const gap = Math.max(0, hw - daySessionSum)
		if (gap > 0.02) {
			if (!dm.has(unallocatedLabel)) dm.set(unallocatedLabel, { hours: 0, count: 0 })
			const u = dm.get(unallocatedLabel)
			u.hours += gap
			u.count += 1
		}
	}

	const byUser = []
	for (const [uid, dm] of byUserMap) {
		let totalUserHoursRaw = 0
		for (const v of dm.values()) totalUserHoursRaw += v.hours
		const totalUserHours = Math.round(totalUserHoursRaw * 100) / 100

		const arr = [...dm.entries()].map(([description, v]) => ({
			description,
			totalHours: Math.round(v.hours * 100) / 100,
			hoursRaw: v.hours,
			sessions: v.count,
		}))
		arr.sort((a, b) => b.hoursRaw - a.hoursRaw)
		const top = arr.slice(0, TIMER_AGG_TOP_DESCRIPTIONS_PER_USER)
		const rest = arr.slice(TIMER_AGG_TOP_DESCRIPTIONS_PER_USER)
		const restHoursRaw = rest.reduce((s, x) => s + x.hoursRaw, 0)
		const restCount = rest.reduce((s, x) => s + x.sessions, 0)
		if (rest.length > 0 && (restHoursRaw > 0 || restCount > 0)) {
			top.push({
				description: otherLabel(rest.length),
				totalHours: Math.round(restHoursRaw * 100) / 100,
				hoursRaw: restHoursRaw,
				sessions: restCount,
			})
		}
		if (top.length === 0) continue

		const pct = h =>
			totalUserHoursRaw > 0
				? Math.round((h / totalUserHoursRaw) * 1000) / 10
				: 0
		const byDescription = top.map(({ hoursRaw, ...row }) => ({
			...row,
			percentOfUserTimer: pct(hoursRaw),
		}))

		byUser.push({
			userId: uid,
			name: nameById[uid] || uid,
			totalTimerSessionHours: totalUserHours,
			byDescription,
		})
	}
	byUser.sort((a, b) => a.name.localeCompare(b.name, isEn ? 'en' : 'pl'))

	const note = isEn
		? 'Rows from closed timer entries use (endTime−startTime) in hours; isBreak skipped; sessions without endTime do not add to session sum. If a workday’s hoursWorked is higher than the sum of closed sessions that day, the difference is added once under the “day book hours not covered…” row (manual entry, legacy data, or missing endTime). totalTimerSessionHours = sum of all byDescription rows for that user (basis for percentOfUserTimer). If hitDocLimit is true, scanning may be incomplete. Prefer the plain-text bullets above in your answer when listing breakdowns.'
		: 'Wiersze z zamkniętych sesji: (endTime−startTime); pominięto isBreak; sesje bez endTime nie wchodzą w sumę sesji. Różnica hoursWorked minus sesje trafia do wiersza o ewidencji dnia bez zamkniętych sesji. totalTimerSessionHours = suma wierszy byDescription (podstawa percentOfUserTimer). Preferuj powyższe linie z „•” przy wypisywaniu podziału w raporcie. Przy hitDocLimit=true skan może być niepełny.'

	const hitDocLimit = (workdaysLean || []).length >= docLimit
	const plainText = formatTimerAggregatesPlainText(byUser, hitDocLimit, locale)
	const jsonString = JSON.stringify({
		note,
		hitDocLimit,
		byUser,
	})
	return { jsonString, plainText }
}

/**
 * Team settings, boards, schedules, departments — safe snapshot (no secrets).
 */
async function buildStaticTeamSnapshot(teamId, locale) {
	const team = await Team.findById(teamId).select('name maxUsers createdAt isActive').lean()
	const settingsDoc = await Settings.getSettings(teamId)
	const settingsLean = settingsDoc.toObject ? settingsDoc.toObject() : { ...settingsDoc }

	const leaveTypes = (settingsLean.leaveRequestTypes || []).map(t => ({
		id: t.id,
		name: t.name,
		nameEn: t.nameEn || null,
		isEnabled: t.isEnabled !== false,
		requireApproval: t.requireApproval !== false,
		allowDaysLimit: !!t.allowDaysLimit,
		minDaysBefore: t.minDaysBefore ?? null,
	}))

	const settingsForAi = {
		workOnWeekends: settingsLean.workOnWeekends !== false,
		includePolishHolidays: !!settingsLean.includePolishHolidays,
		includeCustomHolidays: !!settingsLean.includeCustomHolidays,
		customHolidays: (settingsLean.customHolidays || []).slice(0, 80),
		workHours: settingsLean.workHours || [],
		leaveRequestTypes: leaveTypes,
		leaveCalculationMode: settingsLean.leaveCalculationMode || 'days',
		leaveHoursPerDay: settingsLean.leaveHoursPerDay,
		timerEnabled: settingsLean.timerEnabled !== false,
	}

	const boards = await Board.find({ teamId, isActive: true })
		.select('name type departmentName isTeamBoard members')
		.lean()

	const boardLines = boards.map(b => {
		const m = Array.isArray(b.members) ? b.members.length : 0
		return `- "${b.name}" | type:${b.type}${b.departmentName ? ` | dept:${b.departmentName}` : ''} | members:${m}${b.isTeamBoard ? ' | teamBoard' : ''}`
	})

	const schedules = await Schedule.find({ teamId, isActive: true })
		.select('name type departmentName members availabilityEnabled')
		.lean()

	const scheduleLines = schedules.map(s => {
		const m = Array.isArray(s.members) ? s.members.length : 0
		return `- "${s.name}" | type:${s.type}${s.departmentName ? ` | dept:${s.departmentName}` : ''} | members:${m} | availability:${!!s.availabilityEnabled}`
	})

	const departments = await Department.find({ teamId, isActive: true }).select('name').lean()
	const deptNames = departments.map(d => d.name).filter(Boolean)

	const leaveLegend = leaveTypes
		.filter(t => t.isEnabled)
		.map(t => `  - ${t.id} → "${t.name}"${t.nameEn ? ` (EN: "${t.nameEn}")` : ''}`)
		.join('\n')

	const roleHelp =
		locale === 'en'
			? 'Roles: Leave rows in DATA CONTEXT always list **all active team members** (aligned with the in-app leave planner). Workdays, timer aggregates, and tasks still follow role scope: Admin/HR (full team), Supervisor (per config), Worker (own / supervised visibility as in “Users in scope”).'
			: 'Role: Wiersze urlopów w DATA CONTEXT zawsze obejmują **cały aktywny zespół** (jak w planerze urlopów). Ewidencja czasu, licznik i zadania nadal wg zakresu roli: Admin/HR (cały zespół), Przełożony (wg konfiguracji), Pracownik (własne / widoczność jak w „Users in scope”).'

	const parts = []
	parts.push('--- Team & app configuration (current) ---')
	parts.push(`Team: ${team?.name || '?'} | active:${team?.isActive !== false} | maxUsers:${team?.maxUsers ?? '?'} | created:${team?.createdAt ? formatDate(team.createdAt) : '?'}`)
	parts.push(roleHelp)
	parts.push('')
	parts.push('SETTINGS (affects behaviour):')
	parts.push(`workOnWeekends=${settingsForAi.workOnWeekends} (if false, team policy treats weekends as non-working for timer / some checks)`)
	parts.push(`includePolishHolidays=${settingsForAi.includePolishHolidays} | includeCustomHolidays=${settingsForAi.includeCustomHolidays}`)
	parts.push(`timerEnabled=${settingsForAi.timerEnabled} | leaveCalculationMode=${settingsForAi.leaveCalculationMode} | leaveHoursPerDay=${settingsForAi.leaveHoursPerDay}`)
	parts.push(`standardWorkHoursSlots: ${JSON.stringify(settingsForAi.workHours)}`)
	if (settingsForAi.customHolidays.length) {
		parts.push(`customHolidays: ${JSON.stringify(settingsForAi.customHolidays)}`)
	}
	parts.push('')
	parts.push('LEAVE TYPE IDS → LABELS (use human names in answers, not only raw ids):')
	parts.push(leaveLegend || '(none)')
	parts.push('')
	parts.push(`Departments (model): ${deptNames.length ? deptNames.join(', ') : '(none or only on users)'}`)
	parts.push('')
	parts.push('Task boards (Kanban):')
	parts.push(boardLines.length ? boardLines.join('\n') : '(none)')
	parts.push('')
	parts.push('Schedules (shifts / planning):')
	parts.push(scheduleLines.length ? scheduleLines.join('\n') : '(none)')
	parts.push('--- End team snapshot ---')
	return parts.join('\n')
}

/**
 * @param {object} params
 * @param {import('mongoose').Document} params.requestingUser
 * @param {{ start: Date, end: Date }} params.range
 * @param {string} [params.locale]
 * @param {boolean} [params.isAllTime]
 * @param {number|null} [params.yearMessageOverride] - calendar year if message forced range (e.g. 2025)
 * @param {string|null} [params.monthFromMessageCaption] - human label e.g. "luty 2026" for UI hint
 * @param {string|null} [params.monthFromMessageKey] - YYYY-MM when message pinned a calendar month
 */
exports.buildTeamDataContext = async function buildTeamDataContext({
	requestingUser,
	range,
	locale = 'pl',
	isAllTime = false,
	yearMessageOverride = null,
	monthFromMessageCaption = null,
	monthFromMessageKey = null,
}) {
	const { start, end, clamped } = validateAndClampRange(range, { isAllTime })
	const spanDays = daysBetween(start.getTime(), end.getTime())
	const useCompact = isAllTime || spanDays > 200

	const teamId = requestingUser.teamId
	const requesterId = requestingUser._id

	const { scope, detailedUserIds } = await resolveDetailedDataScope(requestingUser)
	const teamUserIds = await getTeamUserIdsForAggregates(teamId)

	const verifiedStats = await buildVerifiedStatsForAi({
		requestingUser,
		range,
		detailedUserIds,
		scope,
		yearMessageOverride,
		monthMessageOverride: monthFromMessageKey,
	})

	const staticSnapshot = await buildStaticTeamSnapshot(teamId, locale)

	const users = await User.find({ _id: { $in: detailedUserIds } })
		.select('firstName lastName department roles')
		.lean()

	const userLines = users.map(u => {
		const depts = Array.isArray(u.department) ? u.department.join(', ') : u.department || ''
		return `- id:${u._id} | ${u.firstName} ${u.lastName} | departments:[${depts}] | roles:${(u.roles || []).join(',')}`
	})

	const displayNameByUserId = new Map(
		users.map(u => {
			const id = u._id?.toString?.() || String(u._id)
			const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
			return [id, n]
		})
	)

	// Leave planner shows all team members' requests — mirror that in AI context (names for all active team users).
	const teamUsersForLeaveNames = await User.find({ _id: { $in: teamUserIds } })
		.select('firstName lastName')
		.lean()
	const leaveDisplayNameByUserId = new Map(
		teamUsersForLeaveNames.map(u => {
			const id = u._id?.toString?.() || String(u._id)
			const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
			return [id, n]
		})
	)

	const leavesDetailed = await LeaveRequest.find({
		userId: { $in: teamUserIds },
		startDate: { $lte: end },
		endDate: { $gte: start },
	})
		.sort({ startDate: -1 })
		.lean()

	const maxLeaves = useCompact ? MAX_LEAVE_LINES_COMPACT : MAX_LEAVE_LINES
	let leaveLines = leavesDetailed.map(lr => {
		const uid = lr.userId?.toString?.() || String(lr.userId)
		const st = formatLeaveStatusForContext(lr.status, locale)
		const person = (leaveDisplayNameByUserId.get(uid) || '').trim()
		const nameSeg = person ? `name:${person} | ` : ''
		return `- ${nameSeg}userId:${uid} | ${formatDate(lr.startDate)}→${formatDate(lr.endDate)} | type:${lr.type} | days:${lr.daysRequested} | status:${st}`
	})

	let leaveExtra = ''
	if (leaveLines.length > maxLeaves) {
		const byStatus = {}
		const byType = {}
		for (const lr of leavesDetailed) {
			const stLabel = formatLeaveStatusForContext(lr.status, locale)
			byStatus[stLabel] = (byStatus[stLabel] || 0) + 1
			byType[lr.type] = (byType[lr.type] || 0) + 1
		}
		leaveExtra = `\nLeave summary in range: byStatus=${JSON.stringify(byStatus)} byTypeId=${JSON.stringify(byType)}`
		leaveLines = leaveLines.slice(0, maxLeaves)
		leaveExtra += `\n(showing last ${maxLeaves} leave rows; totals above are for full range)`
	}

	let workdaysTruncated = false
	let workdayJson = '[]'

	if (useCompact) {
		const agg = await Workday.aggregate([
			{
				$match: {
					userId: { $in: detailedUserIds },
					date: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: '$userId',
					daysWithRecords: { $sum: 1 },
					totalHoursWorked: { $sum: { $ifNull: ['$hoursWorked', 0] } },
					totalAdditional: { $sum: { $ifNull: ['$additionalWorked', 0] } },
				},
			},
		])
		const recent = await Workday.find({
			userId: { $in: detailedUserIds },
			date: { $gte: start, $lte: end },
		})
			.sort({ date: -1 })
			.limit(MAX_WORKDAY_DOCS_COMPACT)
			.lean()

		const samples = recent.map(wd => {
			const uid = wd.userId?.toString?.() || String(wd.userId)
			const notes = (wd.notes || '').slice(0, 200)
			const descs = (wd.timeEntries || [])
				.map(te => (te.workDescription || '').slice(0, 120))
				.filter(Boolean)
				.slice(0, 2)
			const hw = wd.hoursWorked != null ? roundWorkHoursForDisplay(wd.hoursWorked) : null
			return { userId: uid, date: formatDate(wd.date), hoursWorked: hw, notes, sessionDescHints: descs }
		})

		workdayJson = JSON.stringify({
			mode: 'compact',
			perUserTotals: agg.map(a => ({
				userId: String(a._id),
				daysWithRecords: a.daysWithRecords,
				totalHoursWorked: roundWorkHoursForDisplay(a.totalHoursWorked),
				totalAdditional: roundWorkHoursForDisplay(a.totalAdditional),
			})),
			recentDaySamples: samples,
		})
	} else {
		let workdays = await Workday.find({
			userId: { $in: detailedUserIds },
			date: { $gte: start, $lte: end },
		})
			.sort({ date: 1 })
			.lean()

		if (workdays.length > MAX_WORKDAY_DOCS) {
			workdaysTruncated = true
			workdays = workdays.slice(-MAX_WORKDAY_DOCS)
		}

		const workdaySummaries = workdays.map(wd => {
			const uid = wd.userId?.toString?.() || String(wd.userId)
			const sessions = (wd.timeEntries || []).map(te => ({
				start: te.startTime,
				end: te.endTime,
				break: te.isBreak,
				desc: (te.workDescription || '').slice(0, 400),
			}))
			return {
				userId: uid,
				date: formatDate(wd.date),
				hoursWorked: wd.hoursWorked != null ? roundWorkHoursForDisplay(wd.hoursWorked) : null,
				additionalWorked: wd.additionalWorked != null ? roundWorkHoursForDisplay(wd.additionalWorked) : null,
				notes: (wd.notes || '').slice(0, 600),
				absenceType: wd.absenceType || null,
				sessions,
			}
		})

		let workdaySummariesLocal = workdaySummaries
		workdayJson = JSON.stringify(workdaySummariesLocal)
		if (workdayJson.length > 95000) {
			const byUser = {}
			for (const w of workdaySummariesLocal) {
				if (!byUser[w.userId]) {
					byUser[w.userId] = { days: 0, totalHours: 0, notesSample: [], sessionDescSample: [] }
				}
				const b = byUser[w.userId]
				b.days += 1
				b.totalHours += Number(w.hoursWorked) || 0
				if (w.notes && b.notesSample.length < 3) b.notesSample.push(`${w.date}: ${w.notes.slice(0, 200)}`)
				for (const s of w.sessions || []) {
					if (s.desc && b.sessionDescSample.length < 8) b.sessionDescSample.push(`${w.date}: ${s.desc.slice(0, 200)}`)
				}
			}
			for (const uid of Object.keys(byUser)) {
				const th = roundWorkHoursForDisplay(byUser[uid].totalHours)
				byUser[uid].totalHours = th === null ? 0 : th
			}
			workdaySummariesLocal = [{ aggregated: true, byUserId: byUser }]
			workdayJson = JSON.stringify(workdaySummariesLocal)
		}
	}

	const workdaysForTimerAgg = await Workday.find({
		userId: { $in: detailedUserIds },
		date: { $gte: start, $lte: end },
	})
		.select('userId date timeEntries hoursWorked')
		.sort({ date: 1 })
		.limit(MAX_WORKDAYS_FOR_TIMER_AGG)
		.lean()

	const timerPack = buildTimerSessionAggregatesPack(
		workdaysForTimerAgg,
		users,
		MAX_WORKDAYS_FOR_TIMER_AGG,
		locale
	)
	const timerSessionAggregatesHitDocLimit = workdaysForTimerAgg.length >= MAX_WORKDAYS_FOR_TIMER_AGG

	const boards = await Board.find({ teamId, isActive: true }).select('_id name type departmentName').lean()
	const boardIds = boards.map(b => b._id)
	const boardMap = Object.fromEntries(boards.map(b => [b._id.toString(), b]))

	const taskLimit = useCompact || isAllTime ? MAX_TASKS_ALL : MAX_TASKS
	const taskBase = { boardId: { $in: boardIds }, isActive: { $ne: false } }
	let tasks
	if (isAllTime) {
		tasks = await Task.find(taskBase).sort({ updatedAt: -1 }).limit(taskLimit * 2).lean()
	} else {
		// Uwzględnij też zadania wg terminu / okresu realizacji (nie tylko data utworzenia/edycji),
		// żeby asystent widział np. „co wypada w tym tygodniu” przy starszych kartach.
		tasks = await Task.find({
			...taskBase,
			$or: [
				{ createdAt: { $gte: start, $lte: end } },
				{ updatedAt: { $gte: start, $lte: end } },
				{ dueDate: { $gte: start, $lte: end } },
				{
					$and: [
						{ workPeriodStart: { $ne: null } },
						{ workPeriodEnd: { $ne: null } },
						{ workPeriodStart: { $lte: end } },
						{ workPeriodEnd: { $gte: start } },
					],
				},
			],
		})
			.sort({ updatedAt: -1 })
			.limit(taskLimit * 2)
			.lean()
	}

	const detailedSet = new Set(detailedUserIds.map(id => id.toString()))
	tasks = tasks.filter(t => {
		const createdBy = t.createdBy?.toString?.()
		const assigned = (t.assignedTo || []).map(a => a.toString())
		const touches = createdBy && detailedSet.has(createdBy)
		const assignedToVisible = assigned.some(a => detailedSet.has(a))
		if (scope === 'team') return true
		return touches || assignedToVisible
	}).slice(0, taskLimit)

	const taskLines = tasks.map(t => {
		const b = boardMap[t.boardId?.toString()] || {}
		const assigned = (t.assignedTo || []).map(a => a.toString()).join(',')
		const due = t.dueDate ? formatDate(t.dueDate) : ''
		const wp0 = t.workPeriodStart ? formatDate(t.workPeriodStart) : ''
		const wp1 = t.workPeriodEnd ? formatDate(t.workPeriodEnd) : ''
		const workPeriod =
			wp0 || wp1 ? `${wp0 || '?'}→${wp1 || '?'}` : ''
		const placement = t.calendarOnly ? 'calendar-only' : 'kanban'
		const descHint = (t.description || '').replace(/\s+/g, ' ').trim().slice(0, 100)
		return `- taskId:${t._id} | board:"${b.name || ''}" (${b.type || ''}) | title:${(t.title || '').slice(0, 120)} | status:${t.status} | priority:${t.priority} | dueDate:${due || '-'} | workPeriod:${workPeriod || '-'} | placement:${placement}${descHint ? ` | desc:${descHint}` : ''} | assignedTo:[${assigned}] | createdBy:${t.createdBy}`
	})

	const annLimit = useCompact || isAllTime ? MAX_ANNOUNCEMENTS_ALL : MAX_ANNOUNCEMENTS
	const allAnnouncements = await Announcement.find({
		teamId,
		createdAt: { $gte: start, $lte: end },
	})
		.sort({ createdAt: -1 })
		.limit(annLimit * 2)
		.lean()

	const userDepts = Array.isArray(requestingUser.department)
		? requestingUser.department
		: requestingUser.department
			? [requestingUser.department]
			: []

	const announcements = allAnnouncements.filter(a =>
		announcementVisibleToUser(a, requesterId, userDepts)
	).slice(0, annLimit)

	const annLines = announcements.map(a =>
		`- ${formatDate(a.createdAt)} | ${(a.title || '').slice(0, 160)} | scope:${a.targetScope}`
	)

	const meta = {
		locale,
		scope,
		periodFrom: formatDate(start),
		periodTo: formatDate(end),
		rangeClampedToMaxDays: !!clamped,
		allTime: !!isAllTime,
		dataMode: useCompact ? 'compact' : 'detailed',
		workdaysTruncated,
		timerSessionAggregatesHitDocLimit,
		generatedAt: new Date().toISOString(),
		yearMessageOverride: yearMessageOverride || null,
		monthFromMessageCaption: monthFromMessageCaption || null,
		monthFromMessageKey: monthFromMessageKey || null,
	}

	const parts = []
	parts.push('=== PLANOPIA DATA CONTEXT (authorized for this user only) ===')
	parts.push(`Meta: ${JSON.stringify(meta)}`)
	parts.push('')
	parts.push('--- VERIFIED STATS (authoritative numbers; read before other JSON) ---')
	parts.push(JSON.stringify(verifiedStats))
	parts.push('')
	parts.push(staticSnapshot)
	parts.push('')
	parts.push('--- Users in scope (detailed) ---')
	parts.push(userLines.length ? userLines.join('\n') : '(none)')
	parts.push('')
	parts.push('--- Leave requests (in period, whole active team — same idea as leave planner) ---')
	parts.push(
		String(locale || '').toLowerCase().startsWith('en')
			? 'These rows cover **all active team members** (not only “Users in scope” above). `(none)` means no leave requests overlap Meta.periodFrom–periodTo — not missing permissions.'
			: 'Wiersze obejmują **wszystkich aktywnych członków zespołu** (nie tylko listę „Users in scope” powyżej). `(none)` oznacza brak wniosków nakładających się na okres z Meta — **nie** brak uprawnień.'
	)
	parts.push(
		String(locale || '').toLowerCase().startsWith('en')
			? 'Each row includes `name:` (when known) before `userId:` — use the name in markdown tables for team/supervisor summaries so the answer matches exports.'
			: 'Każdy wiersz zawiera `name:` (gdy znane) przed `userId:` — w tabelach markdown (raport zespołu / przełożonego) podawaj imię i nazwisko jak w eksporcie PDF/Excel.'
	)
	parts.push((leaveLines.length ? leaveLines.join('\n') : '(none)') + leaveExtra)
	parts.push('')
	parts.push('--- Workdays & timer sessions ---')
	parts.push(workdayJson.slice(0, 120000))
	parts.push('')
	parts.push(timerAggregatesSectionHeader(locale))
	parts.push(timerPack.plainText)
	parts.push('')
	parts.push(timerPack.jsonString.slice(0, 80000))
	parts.push('')
	parts.push('--- Tasks (boards / kanban, in period) ---')
	parts.push(taskLines.length ? taskLines.join('\n') : '(none)')
	parts.push('')
	parts.push('--- Announcements visible to this user (titles) ---')
	parts.push(annLines.length ? annLines.join('\n') : '(none)')
	parts.push('=== END CONTEXT ===')

	return {
		contextText: parts.join('\n'),
		meta,
	}
}
