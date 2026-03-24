/**
 * AI-assisted work time log entry drafting (preview — submit via POST /api/workdays).
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { createChatCompletionJson, isOpenAIConfigured } = require('./openaiService')
const {
	normalizeWorkdayPayload,
	validateNewWorkdayEntry,
	toWarsawYmd,
} = require('../utils/workdayEntryValidation')

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

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {Array} input.messages
 * @param {string} [input.locale] 'pl' | 'en'
 */
async function runWorkdayDraftTurn(input) {
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
	const today = warsawTodayYmd()

	const systemPrompt = [
		`You help an employee compose a WORK TIME / ATTENDANCE log entry for the Planopia app. The user writes in ${locale === 'en' ? 'English' : 'Polish'}.`,
		`Today's calendar date in Europe/Warsaw is **${today}** (YYYY-MM-DD). Interpret "today", "yesterday", "last Monday" using Warsaw local calendar.`,
		`Map the user's text to these form fields:`,
		`- date: YYYY-MM-DD (required when ready=true)`,
		`- hoursWorked: total hours (e.g. 8, 8.5). Null if only absence or only notes.`,
		`- additionalWorked: overtime hours included in the total (e.g. 1, 1.5). Null if none.`,
		`- realTimeDayWorked: time range string like "8-16" or "8:00-16:30". Null if not mentioned.`,
		`- absenceType: free text for absence type (sick leave, remote work, etc.) when NOT a normal working hours entry. Null if logging hours.`,
		`- notes: optional remarks. Combine user intent into concise notes.`,
		`Reply ONLY with a single JSON object (no markdown fences) with these keys:`,
		`- "assistantMessage": string — short reply in the user's language (Markdown allowed). Ask for missing info or confirm.`,
		`- "ready": boolean — true ONLY if you have a concrete calendar date and a clear intent (hours, OR absence type, OR notes-only for that day).`,
		`- "draft": null OR object with keys: "date" (YYYY-MM-DD), "hoursWorked" (number|null), "additionalWorked" (number|null), "realTimeDayWorked" (string|null), "absenceType" (string|null), "notes" (string|null).`,
		`Rules:`,
		`- Never set both hoursWorked and absenceType for the same day (mutually exclusive).`,
		`- If the user describes normal work with hours and range, fill hoursWorked, optional additionalWorked, optional realTimeDayWorked.`,
		`- If unclear or off-topic, set ready=false and draft=null.`,
	].join('\n')

	const openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages]

	const { content, model, usage } = await createChatCompletionJson({
		messages: openaiMessages,
		temperature: 0.2,
		maxTokens: 1600,
	})

	let parsed
	try {
		parsed = JSON.parse(content)
	} catch {
		return {
			reply:
				locale === 'en'
					? 'Could not interpret the assistant response. Describe the day, hours or absence, and date in one message.'
					: 'Nie udało się odczytać odpowiedzi. Opisz datę, godziny lub nieobecność w jednej wiadomości.',
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
				(locale === 'en' ? 'Please specify the date and what to log (hours, absence, or notes).' : 'Podaj datę oraz co zapisać (godziny, nieobecność lub uwagi).'),
			draft: null,
			draftError: null,
			model,
			usage,
		}
	}

	const dateStr = typeof rawDraft.date === 'string' ? rawDraft.date.trim().slice(0, 10) : ''
	if (!isIsoDate(dateStr)) {
		return {
			reply: assistantMessage || (locale === 'en' ? 'Invalid date format.' : 'Nieprawidłowy format daty.'),
			draft: null,
			draftError: 'INVALID_DATE',
			model,
			usage,
		}
	}

	const body = {
		hoursWorked: rawDraft.hoursWorked,
		additionalWorked: rawDraft.additionalWorked,
		realTimeDayWorked: rawDraft.realTimeDayWorked,
		absenceType: rawDraft.absenceType,
		notes: rawDraft.notes,
	}
	const normalized = normalizeWorkdayPayload(body)

	const v = await validateNewWorkdayEntry({
		WorkdayModel: Workday,
		LeaveRequestModel: LeaveRequest,
		// Must preserve Mongoose model as `this` inside getSettings (uses this.findOne)
		getSettings: teamId => Settings.getSettings(teamId),
		userId: user._id,
		teamId,
		dateYmd: dateStr,
		normalized,
		locale,
	})

	if (!v.ok) {
		return {
			reply:
				assistantMessage ||
				(locale === 'en'
					? 'This entry cannot be saved with the current rules. Adjust the date or details.'
					: 'Tego wpisu nie można zapisać przy obecnych zasadach. Popraw datę lub szczegóły.'),
			draft: null,
			draftError: v.code,
			draftMessage: v.message,
			model,
			usage,
		}
	}

	const draft = {
		date: dateStr,
		hoursWorked: v.sanitized.hoursWorked,
		additionalWorked: v.sanitized.additionalWorked,
		realTimeDayWorked: v.sanitized.realTimeDayWorked,
		absenceType: v.sanitized.absenceType,
		notes: v.sanitized.notes,
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
	runWorkdayDraftTurn,
}
