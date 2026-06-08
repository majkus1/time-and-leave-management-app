/**
 * Detects export intent from the user's message (LLM JSON) and resolves allowed DB scope.
 * File bytes are built in aiExportFileService — data always from MongoDB, not from chat text.
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { resolveDetailedDataScope } = require('./aiAssistantScopeService')
const { createChatCompletionJson } = require('./openaiService')
const {
	resolveAssistantDateRange,
	resolveAssistantRangeWithMessage,
	formatLocalYmd,
} = require('./aiAssistantService')

const LEAVE_STATUSES = ['status.pending', 'status.accepted', 'status.rejected', 'status.sent']

/**
 * Heuristic: user likely wants a DB-backed export for the selected chat period.
 * Period summaries (e.g. „Podsumuj luty 2026…”) often omit the words pdf/excel; we still attach export buttons so assistant text about downloads stays truthful.
 */
function messageSuggestsDatabaseExport(text) {
	if (!text || text.length < 6) return false
	const wantsFile = /(eksport|export|excel|xlsx|pdf|raport|report|pobierz|download|wygeneruj|generate|plik|file|csv)/i.test(
		text
	)
	// Musi brzmieć jak prośba o dane z aplikacji, nie tylko „wyślij pdf”.
	// Uwaga: „podsumuj” nie zawiera podciągu „podsumow” — używamy szerszego `podsumu`.
	// EN: summarize, period, database, overview.
	const wantsData =
		/(urlop|leave|wniosk|nieobec|ewidencj|work\s*day|czas\w*\s+pracy|time\s*sheet|godzin|hours|zadani|task|kanban|tablic|board|czynno|activit|wydajn|produktyw|wykonan|iloś|ilosc|quantity|output|podsumu|okres|timer|sesj|raport|dane|summar|period|database|overview)/i.test(
			text
		)
	const periodSummary =
		/(podsumu|podsumow|ten\s+okres|z\s+okresu|pełny\s+raport|pelny\s+raport|wszystko\s+z|cały\s+okres|caly\s+okres|summar|overview|combined|\bfull\s+report|period\s+summary)/i.test(
			text
		)
	return wantsData && (wantsFile || periodSummary)
}

function prefilterExportQuestion(text) {
	return messageSuggestsDatabaseExport(text)
}

/**
 * Gdy klasyfikator JSON zawiedzie, a prefilter był OK — bezpieczny domyślny typ raportu.
 * @param {string} userMessage
 */
function buildFallbackExportIntent(userMessage) {
	const t = (userMessage || '').toLowerCase()
	const wantsPeriodSummary =
		/(podsumu|podsumow|ten\s+okres|z\s+okresu|pełny\s+raport|pelny\s+raport|wszystko\s+z|cały\s+okres|caly\s+okres|summar|overview|combined|\bfull\s+report|period\s+summary)/i.test(
			userMessage
		) ||
		(/(pdf|excel|xlsx|pobierz|export|plik|z\s+bazy)/i.test(userMessage) &&
			/(okres|raport|dane|wszystk|podsumu|summar)/i.test(userMessage))

	const urlopOnly =
		/(urlop|wniosk|leave|vacation|nieobecn)/i.test(t) &&
		!/(podsumu|podsumow|okres|summar|overview|raport|ewidenc|czas|godzin|zadani|task|kanban|tablic|czynno|activit|wydajn|produktyw|wykonan|iloś|ilosc|quantity|output)/i.test(t)

	const tasksOnly =
		/(zadani|task|kanban|tablic|\bboard\b)/i.test(t) &&
		!/czas\w*\s+pracy|godzin|ewidenc|timer|sesj|przeprac|podsumu|podsumow|okres|summar|overview|raport|urlop|wniosk|czynno|activit|wydajn|produktyw|wykonan|iloś|ilosc|quantity|output/i.test(
			t
		)

	let reportType = 'workdays'
	if (wantsPeriodSummary) reportType = 'combined'
	else if (urlopOnly) reportType = 'leaves'
	else if (tasksOnly) reportType = 'tasks'

	return {
		wantsExport: true,
		reportType,
		leaveStatuses: [],
		scopeTarget: 'team',
		departmentHint: null,
	}
}

/** Gdy użytkownik prosi o podsumowanie okresu, a model zwróci tylko „workdays” — pełny raport z bazy. */
function shouldPreferCombinedReport(userMessage) {
	return /(podsumu|podsumow|ten\s+okres|z\s+okresu|pełny\s+raport|pelny\s+raport|wszystko\s+z|summar|overview|raport\s+okresu|period\s+summary)/i.test(
		userMessage || ''
	)
}

/**
 * @param {string} userMessage
 * @param {string} locale
 * @returns {Promise<object|null>}
 */
async function extractExportIntentJson(userMessage, locale) {
	const lang = locale === 'en' ? 'en' : 'pl'
	const system = `You classify whether the user wants to DOWNLOAD / EXPORT data as Excel or PDF from the Planopia HR app (not only a conversational answer).
Reply with JSON only, no markdown:
{
  "wantsExport": boolean,
  "reportType": "leaves" | "workdays" | "tasks" | "combined" | null,
  "leaveStatuses": string[],
  "scopeTarget": "team" | "department" | "self",
  "departmentHint": string | null
}
Rules:
- wantsExport=true if they ask to generate/export/download a file, spreadsheet, report, excel, pdf of records.
- wantsExport=false for normal questions without file request.
- reportType: leaves = only leave requests; workdays = time tracking / workdays, including timesheet task-hour split, activity split, activity quantity and productivity/efficiency metrics when available; tasks = only Kanban cards/status/deadlines without time entries.
- reportType combined = full period report: period summary stats + workdays + timesheet activities/task hours + leave requests + Kanban tasks (use when they ask to summarize the period, full overview, or export everything for the period).
- leaveStatuses must use EXACTLY these strings if listed: status.pending, status.accepted, status.rejected, status.sent. Empty array means all statuses.
- scopeTarget team = whole team / all employees they may see; department = filter by department name; self = only their own data.
- departmentHint: short fragment of department name if mentioned, else null.
Language context: ${lang}.`

	const { content } = await createChatCompletionJson({
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: userMessage.slice(0, 8000) },
		],
		maxTokens: 350,
		temperature: 0.1,
	})

	let parsed
	try {
		parsed = JSON.parse(content)
	} catch {
		return null
	}
	return parsed
}

/**
 * @param {object} raw
 * @param {{ scope: string, detailedUserIds: import('mongoose').Types.ObjectId[] }} dataScope
 * @param {import('mongoose').Document} requestingUser
 */
function clampOffer(raw, dataScope, requestingUser) {
	if (!raw || !raw.wantsExport || !raw.reportType) return null
	const allowedTypes = ['leaves', 'workdays', 'tasks', 'combined']
	if (!allowedTypes.includes(raw.reportType)) return null

	let scopeTarget = ['team', 'department', 'self'].includes(raw.scopeTarget) ? raw.scopeTarget : 'self'

	if (dataScope.scope === 'self') {
		scopeTarget = 'self'
	}

	let leaveStatuses = Array.isArray(raw.leaveStatuses) ? raw.leaveStatuses.filter(s => LEAVE_STATUSES.includes(s)) : []
	if ((raw.reportType === 'leaves' || raw.reportType === 'combined') && leaveStatuses.length === 0) {
		leaveStatuses = [...LEAVE_STATUSES]
	}

	let departmentHint =
		typeof raw.departmentHint === 'string' ? raw.departmentHint.trim().slice(0, 120) : ''
	if (scopeTarget !== 'department') {
		departmentHint = ''
	}

	return {
		reportType: raw.reportType,
		leaveStatuses,
		scopeTarget,
		departmentHint: departmentHint || null,
	}
}

/**
 * After AI reply: if last user message asks for export, return a safe offer for the client (re-validated on download).
 */
exports.buildExportOfferAfterChat = async function buildExportOfferAfterChat({
	userId,
	lastUserMessage,
	locale,
	periodPreset,
	dateFrom,
	dateTo,
}) {
	if (!lastUserMessage || !prefilterExportQuestion(lastUserMessage)) {
		return null
	}

	const requestingUser = await User.findById(userId)
	if (!requestingUser || requestingUser.isActive === false) return null

	let raw
	try {
		raw = await extractExportIntentJson(lastUserMessage, locale)
	} catch (e) {
		console.error('aiExportIntentService.extractExportIntentJson:', e.message)
		raw = null
	}

	if (!raw) {
		raw = buildFallbackExportIntent(lastUserMessage)
	} else if (raw.wantsExport === false) {
		// Klasyfikator często zwraca false dla podsumowań okresu bez słów „pdf/excel”.
		if (messageSuggestsDatabaseExport(lastUserMessage)) {
			raw = buildFallbackExportIntent(lastUserMessage)
		} else {
			return null
		}
	} else {
		if (!raw.reportType) {
			raw.reportType = buildFallbackExportIntent(lastUserMessage).reportType
		}
		raw.wantsExport = true
	}

	const dataScope = await resolveDetailedDataScope(requestingUser)
	let offer = clampOffer(raw, dataScope, requestingUser)
	if (!offer) return null

	if (offer.reportType === 'workdays' && shouldPreferCombinedReport(lastUserMessage)) {
		offer = clampOffer(
			{
				...raw,
				wantsExport: true,
				reportType: 'combined',
				leaveStatuses: [],
			},
			dataScope,
			requestingUser
		)
	}

	const eff = resolveAssistantRangeWithMessage({
		periodPreset: periodPreset || 'month',
		dateFrom,
		dateTo,
		lastUserMessage,
	})
	if (eff.monthFromMessageKey || eff.yearMessageOverride) {
		offer = {
			...offer,
			dateFrom: formatLocalYmd(eff.range.start),
			dateTo: formatLocalYmd(eff.range.end),
		}
	}

	return offer
}

/**
 * Validates body from client and returns execution context for DB queries (authoritative).
 */
exports.resolveExportExecutionContext = async function resolveExportExecutionContext(userId, params) {
	const {
		periodPreset,
		dateFrom,
		dateTo,
		locale = 'pl',
		reportType,
		leaveStatuses = [],
		scopeTarget = 'self',
		departmentHint = null,
	} = params || {}

	const allowedTypes = ['leaves', 'workdays', 'tasks', 'combined']
	if (!allowedTypes.includes(reportType)) {
		const err = new Error('Invalid report type')
		err.code = 'VALIDATION'
		throw err
	}

	const requestingUser = await User.findById(userId)
	if (!requestingUser || requestingUser.isActive === false) {
		const err = new Error('User not found or inactive')
		err.code = 'USER_INVALID'
		throw err
	}

	const dataScope = await resolveDetailedDataScope(requestingUser)
	const preset = periodPreset || 'month'
	const range = resolveAssistantDateRange(
		preset,
		preset === 'custom' ? dateFrom : undefined,
		preset === 'custom' ? dateTo : undefined
	)

	let st = ['team', 'department', 'self'].includes(scopeTarget) ? scopeTarget : 'self'
	if (dataScope.scope === 'self') {
		st = 'self'
	}

	let statuses = Array.isArray(leaveStatuses) ? leaveStatuses.filter(s => LEAVE_STATUSES.includes(s)) : []
	if ((reportType === 'leaves' || reportType === 'combined') && statuses.length === 0) {
		statuses = [...LEAVE_STATUSES]
	}

	let dept = typeof departmentHint === 'string' ? departmentHint.trim().slice(0, 120) : ''
	if (st !== 'department') dept = ''

	const allowedIds = await resolveAllowedUserIdsForExport(requestingUser, dataScope, st, dept)

	return {
		requestingUser,
		range,
		locale: locale === 'en' ? 'en' : 'pl',
		reportType,
		leaveStatuses: statuses,
		scopeTarget: st,
		departmentHint: dept || null,
		allowedUserIds: allowedIds,
		dataScope,
	}
}

exports.prefilterExportQuestion = prefilterExportQuestion

/**
 * @param {import('mongoose').Document} requestingUser
 * @param {{ scope: string, detailedUserIds: import('mongoose').Types.ObjectId[] }} dataScope
 */
async function resolveAllowedUserIdsForExport(requestingUser, dataScope, scopeTarget, departmentHint) {
	const ids = dataScope.detailedUserIds
	const selfId = requestingUser._id

	if (scopeTarget === 'self') {
		return ids.filter(id => id.toString() === selfId.toString())
	}

	const users = await User.find({ _id: { $in: ids } })
		.select('department')
		.lean()

	if (scopeTarget === 'department' && departmentHint) {
		const h = departmentHint.toLowerCase()
		const matched = users.filter(u => {
			const depts = Array.isArray(u.department) ? u.department : u.department ? [u.department] : []
			return depts.some(d => String(d).toLowerCase().includes(h) || h.includes(String(d).toLowerCase()))
		})
		return matched.map(u => u._id)
	}

	return ids
}

exports.LEAVE_STATUSES = LEAVE_STATUSES
