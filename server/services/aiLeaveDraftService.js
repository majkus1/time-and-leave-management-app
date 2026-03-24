/**
 * AI-assisted leave request drafting (preview only — submit via existing POST /leaveworks/leave-request).
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { createChatCompletionJson, isOpenAIConfigured } = require('./openaiService')
const { getEnabledLeaveRequestTypes, requiresApproval, getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')
const { findConflictingApprovedLeaveRequest } = require('../utils/leaveRequestConflicts')
const { makeTrimAndRange } = require('../utils/leaveRequestDateUtils')

const { trimWeekendsFromDateRange, generateDateRange } = makeTrimAndRange(Settings)

const MAX_MESSAGES = 16
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

function isIsoDate(s) {
	if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
	const t = Date.parse(`${s}T12:00:00.000Z`)
	return !Number.isNaN(t)
}

function warsawTodayYmd() {
	const f = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
	const parts = f.formatToParts(new Date())
	const y = parts.find(p => p.type === 'year')?.value
	const m = parts.find(p => p.type === 'month')?.value
	const d = parts.find(p => p.type === 'day')?.value
	if (!y || !m || !d) {
		return new Date().toISOString().slice(0, 10)
	}
	return `${y}-${m}-${d}`
}

function buildTypeCatalog(enabledTypes, locale) {
	return enabledTypes
		.map(t => {
			const label = locale === 'en' && t.nameEn ? t.nameEn : t.name
			return `- "${t.id}" — ${label}`
		})
		.join('\n')
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {Array} input.messages
 * @param {string} [input.locale] 'pl' | 'en'
 */
async function runLeaveDraftTurn(input) {
	if (!isOpenAIConfigured()) {
		const err = new Error('AI assistant is not configured (missing OPENAI_API_KEY).')
		err.code = 'OPENAI_NOT_CONFIGURED'
		throw err
	}

	const user = await User.findById(input.userId)
	if (!user || user.isActive === false) {
		const err = new Error('User not found or inactive')
		err.code = 'USER_INVALID'
		throw err
	}

	const teamId = user.teamId
	const messages = normalizeMessages(input.messages)
	if (messages.length === 0) {
		const err = new Error('No valid messages')
		err.code = 'VALIDATION'
		throw err
	}

	const locale = input.locale === 'en' ? 'en' : 'pl'
	const settings = await Settings.getSettings(teamId)
	const enabledTypes = getEnabledLeaveRequestTypes(settings)

	if (!enabledTypes.length) {
		return {
			reply:
				locale === 'en'
					? 'Your team has no leave request types enabled. Ask an administrator to configure leave types in Settings.'
					: 'W zespole nie ma włączonych typów wniosków urlopowych. Poproś administratora o konfigurację w ustawieniach.',
			draft: null,
			draftError: null,
			model: null,
			usage: null,
		}
	}

	const today = warsawTodayYmd()
	const typeCatalog = buildTypeCatalog(enabledTypes, locale)
	const allowedIds = new Set(enabledTypes.map(t => t.id))

	const systemPrompt = [
		`You help an employee compose a LEAVE / ABSENCE REQUEST in the Planopia app. The user writes in ${locale === 'en' ? 'English' : 'Polish'}.`,
		`Today's calendar date in Europe/Warsaw is **${today}** (YYYY-MM-DD). Interpret relative phrases like "tomorrow", "next Monday", "this week" using this date and Warsaw local calendar.`,
		`Reply ONLY with a single JSON object (no markdown fences) with these keys:`,
		`- "assistantMessage": string — short message for the user in their language (Markdown allowed). Ask for missing details, or summarize what you understood.`,
		`- "ready": boolean — true ONLY if you have a concrete leave type, valid start and end dates, and the user is not asking something unrelated.`,
		`- "draft": null OR an object with:`,
		`  - "typeId": string — MUST be exactly one of the ids listed below.`,
		`  - "startDate": "YYYY-MM-DD"`,
		`  - "endDate": "YYYY-MM-DD" (same as start for a single day)`,
		`  - "replacement": string (optional, empty if none)`,
		`  - "additionalInfo": string (optional, empty if none)`,
		``,
		`Enabled leave types for this team (pick typeId from this list only):`,
		typeCatalog,
		``,
		`Rules:`,
		`- Never invent a typeId that is not in the list.`,
		`- If the user has not chosen a type and several could fit, set ready=false and ask which type.`,
		`- If dates are unclear, ready=false.`,
		`- For unrelated questions (not about submitting leave), set ready=false and draft=null; briefly redirect to leave requests.`,
	].join('\n')

	const openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages]

	const { content, model, usage } = await createChatCompletionJson({
		messages: openaiMessages,
		temperature: 0.2,
		maxTokens: 1800,
	})

	let parsed
	try {
		parsed = JSON.parse(content)
	} catch {
		return {
			reply:
				locale === 'en'
					? 'Could not interpret the assistant response. Please describe your leave (type and dates) in one message.'
					: 'Nie udało się odczytać odpowiedzi asystenta. Opisz proszę urlop (typ i daty) w jednej wiadomości.',
			draft: null,
			draftError: 'PARSE',
			model,
			usage,
		}
	}

	const assistantMessage = typeof parsed.assistantMessage === 'string' ? parsed.assistantMessage : ''
	let ready = parsed.ready === true
	const rawDraft = parsed.draft

	if (!ready || !rawDraft || typeof rawDraft !== 'object') {
		return {
			reply: assistantMessage || (locale === 'en' ? 'Please specify leave type and dates.' : 'Podaj typ urlopu i daty.'),
			draft: null,
			draftError: null,
			model,
			usage,
		}
	}

	const typeId = typeof rawDraft.typeId === 'string' ? rawDraft.typeId.trim() : ''
	let startDate = typeof rawDraft.startDate === 'string' ? rawDraft.startDate.trim() : ''
	let endDate = typeof rawDraft.endDate === 'string' ? rawDraft.endDate.trim() : ''
	const replacement = typeof rawDraft.replacement === 'string' ? rawDraft.replacement : ''
	const additionalInfo = typeof rawDraft.additionalInfo === 'string' ? rawDraft.additionalInfo : ''

	if (!allowedIds.has(typeId)) {
		return {
			reply:
				assistantMessage ||
				(locale === 'en' ? 'Invalid leave type for this team. Choose one of the configured types.' : 'Nieprawidłowy typ wniosku dla tego zespołu.'),
			draft: null,
			draftError: 'INVALID_TYPE',
			model,
			usage,
		}
	}

	if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
		return {
			reply: assistantMessage || (locale === 'en' ? 'Invalid date format.' : 'Nieprawidłowy format daty.'),
			draft: null,
			draftError: 'INVALID_DATE',
			model,
			usage,
		}
	}

	if (startDate > endDate) {
		;[startDate, endDate] = [endDate, startDate]
	}

	const { trimmedStartDate, trimmedEndDate } = await trimWeekendsFromDateRange(startDate, endDate, teamId)
	if (!trimmedStartDate || !trimmedEndDate) {
		return {
			reply:
				locale === 'en'
					? 'The selected range has no working days (e.g. only weekends/holidays while weekends are off). Change the dates.'
					: 'W wybranym zakresie nie ma dni roboczych (np. same weekendy/święta przy wyłączonych weekendach). Zmień daty.',
			draft: null,
			draftError: 'NO_WORKING_DAYS',
			model,
			usage,
		}
	}

	const dates = await generateDateRange(trimmedStartDate, trimmedEndDate, teamId)
	const daysRequested = dates.length
	if (daysRequested < 1) {
		return {
			reply:
				locale === 'en'
					? 'Could not count working days in this range. Adjust the dates.'
					: 'Nie można policzyć dni roboczych w tym zakresie. Popraw daty.',
			draft: null,
			draftError: 'ZERO_DAYS',
			model,
			usage,
		}
	}

	function daysBetweenYmd(ymdA, ymdB) {
		const [ay, am, ad] = ymdA.split('-').map(Number)
		const [by, bm, bd] = ymdB.split('-').map(Number)
		const t0 = Date.UTC(ay, am - 1, ad)
		const t1 = Date.UTC(by, bm - 1, bd)
		return Math.round((t1 - t0) / 86400000)
	}

	const selectedType = enabledTypes.find(t => t.id === typeId)
	if (selectedType && selectedType.minDaysBefore != null && selectedType.minDaysBefore > 0) {
		const diffDays = daysBetweenYmd(today, trimmedStartDate)
		if (diffDays < selectedType.minDaysBefore) {
			const typeName = getLeaveRequestTypeName(settings, typeId, null, locale)
			return {
				reply:
					locale === 'en'
						? `This leave type ("${typeName}") must be submitted at least ${selectedType.minDaysBefore} day(s) before the start. Choose later dates.`
						: `Ten typ wniosku („${typeName}”) wymaga złożenia co najmniej ${selectedType.minDaysBefore} dni przed początkiem. Wybierz późniejsze daty.`,
				draft: null,
				draftError: 'MIN_DAYS',
				model,
				usage,
			}
		}
	}

	const conflict = await findConflictingApprovedLeaveRequest({
		LeaveRequest,
		userId: user._id,
		startDate: trimmedStartDate,
		endDate: trimmedEndDate,
	})
	if (conflict) {
		return {
			reply:
				locale === 'en'
					? 'This period overlaps an already approved leave. Change the dates or update the existing request.'
					: 'Ten okres pokrywa się z już zatwierdzonym urlopem. Zmień daty lub edytuj istniejący wniosek.',
			draft: null,
			draftError: 'CONFLICT',
			model,
			usage,
		}
	}

	const typeLabel = getLeaveRequestTypeName(settings, typeId, null, locale)
	const needsApproval = requiresApproval(settings, typeId)

	const draft = {
		type: typeId,
		startDate: trimmedStartDate,
		endDate: trimmedEndDate,
		daysRequested,
		replacement: replacement || '',
		additionalInfo: additionalInfo || '',
		typeLabel,
		requiresApproval: needsApproval,
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
	runLeaveDraftTurn,
}
