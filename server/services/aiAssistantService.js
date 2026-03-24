/**
 * Orchestrates AI assistant: date range, context build, OpenAI call.
 */
const fs = require('fs')
const path = require('path')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { buildTeamDataContext } = require('./aiContextBuilderService')
const { createChatCompletion, createChatCompletionStream, isOpenAIConfigured } = require('./openaiService')
const {
	formatPolishHolidaysForAssistant,
	shouldAttachPolishCalendarHint,
	extractYearsFromText,
} = require('../utils/polishPublicHolidays')

/**
 * If the user clearly asks about a calendar year (e.g. "w 2025 roku"), use that full year
 * for DATA CONTEXT even when the UI preset is "month" / "week".
 */
function tryCalendarYearOverrideFromMessage(lastUserText, baseRange) {
	if (!lastUserText || typeof lastUserText !== 'string') {
		return { range: baseRange, overrideYear: null }
	}
	const t = lastUserText
	const workish =
		/prac|godzin|godz|dni|ewidenc|urlop|nadgodzin|czas|kalendarz|podsumow|przeprac|byłem|byłam|\bbył\b|rok|roku|miesiąc|tygod|year|work|hours|days|time|leave|overtime|dane|statyst|filtr|okres|raport|sesji/i.test(
			t
		)
	if (!workish) {
		return { range: baseRange, overrideYear: null }
	}

	let y = null
	const m1 = t.match(/\b(?:w|we|za|z|od)\s+(?:roku\s+)?(20\d{2}|19\d{2})\b/i)
	const m2 = t.match(/\b(20\d{2}|19\d{2})\s+roku\b/i)
	const m3 = t.match(/\broku\s+(20\d{2}|19\d{2})\b/i)
	const m4 = t.match(/\bza\s+rok\s+(20\d{2}|19\d{2})\b/i)
	const m5 = t.match(/\bin\s+(20\d{2}|19\d{2})\b/i)
	const m6 = t.match(/\byear\s+(20\d{2}|19\d{2})\b/i)
	if (m1) y = parseInt(m1[1], 10)
	else if (m2) y = parseInt(m2[1], 10)
	else if (m3) y = parseInt(m3[1], 10)
	else if (m4) y = parseInt(m4[1], 10)
	else if (m5) y = parseInt(m5[1], 10)
	else if (m6) y = parseInt(m6[1], 10)
	else {
		const years = extractYearsFromText(t)
		if (years.length === 1) y = years[0]
		else return { range: baseRange, overrideYear: null }
	}

	if (y < 1990 || y > 2100) return { range: baseRange, overrideYear: null }

	const start = new Date(y, 0, 1, 0, 0, 0, 0)
	const end = new Date(y, 11, 31, 23, 59, 59, 999)
	return { range: { start, end }, overrideYear: y }
}

const MAX_USER_MESSAGES = 24
const MAX_MESSAGE_LENGTH = 8000
const DOC_PATH = path.join(__dirname, '../../docs/AI_ASSISTANT_CONTEXT.md')

function loadDomainInstructions() {
	try {
		return fs.readFileSync(DOC_PATH, 'utf8')
	} catch {
		return 'Planopia: HR and time tracking app. Use only the provided DATA CONTEXT. Answer in the user language.'
	}
}

function resolveDateRange(preset, dateFrom, dateTo) {
	const now = new Date()
	const end = new Date(now)
	end.setHours(23, 59, 59, 999)

	let start
	switch (preset) {
		case 'all': {
			start = new Date(2000, 0, 1)
			start.setHours(0, 0, 0, 0)
			break
		}
		case 'week': {
			start = new Date(now)
			start.setDate(start.getDate() - 7)
			start.setHours(0, 0, 0, 0)
			break
		}
		case 'month': {
			start = new Date(now.getFullYear(), now.getMonth(), 1)
			start.setHours(0, 0, 0, 0)
			break
		}
		case 'year': {
			start = new Date(now.getFullYear(), 0, 1)
			start.setHours(0, 0, 0, 0)
			break
		}
		case 'custom': {
			if (dateFrom && dateTo) {
				start = new Date(dateFrom)
				const e = new Date(dateTo)
				e.setHours(23, 59, 59, 999)
				return { start, end: e }
			}
			// fallthrough
		}
		default: {
			start = new Date(now)
			start.setDate(start.getDate() - 30)
			start.setHours(0, 0, 0, 0)
		}
	}
	return { start, end }
}

function normalizeMessages(messages) {
	if (!Array.isArray(messages)) return []
	const out = messages
		.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
		.map(m => ({
			role: m.role,
			content: m.content.slice(0, MAX_MESSAGE_LENGTH).trim(),
		}))
		.filter(m => m.content.length > 0)

	return out.slice(-MAX_USER_MESSAGES)
}

/**
 * Validates user/messages, builds team context and OpenAI message list (system + history).
 * @param {object} input
 * @param {string} input.userId
 * @param {Array} input.messages
 * @param {string} [input.periodPreset]
 * @param {string} [input.dateFrom]
 * @param {string} [input.dateTo]
 * @param {string} [input.locale]
 * @returns {Promise<{ openaiMessages: Array, meta: object }>}
 */
async function prepareAssistantTurn(input) {
	if (!isOpenAIConfigured()) {
		const err = new Error('AI assistant is not configured (missing OPENAI_API_KEY).')
		err.code = 'OPENAI_NOT_CONFIGURED'
		throw err
	}

	const requestingUser = await User.findById(input.userId)
	if (!requestingUser || requestingUser.isActive === false) {
		const err = new Error('User not found or inactive')
		err.code = 'USER_INVALID'
		throw err
	}

	const messages = normalizeMessages(input.messages)
	if (messages.length === 0) {
		const err = new Error('No valid messages')
		err.code = 'VALIDATION'
		throw err
	}

	const baseRange = resolveDateRange(input.periodPreset, input.dateFrom, input.dateTo)
	const lastUserForRange = [...messages].reverse().find(m => m.role === 'user')
	const { range, overrideYear } = tryCalendarYearOverrideFromMessage(lastUserForRange?.content || '', baseRange)
	const locale = input.locale === 'en' ? 'en' : 'pl'
	const isAllTime = input.periodPreset === 'all' && !overrideYear

	const { contextText, meta } = await buildTeamDataContext({
		requestingUser,
		range,
		locale,
		isAllTime,
		yearMessageOverride: overrideYear,
	})

	const domainDoc = loadDomainInstructions()

	const lastUserText = lastUserForRange?.content || ''
	let polishCalendarBlock = ''
	if (shouldAttachPolishCalendarHint(lastUserText)) {
		const yearSet = new Set()
		yearSet.add(new Date().getFullYear())
		yearSet.add(new Date().getFullYear() + 1)
		yearSet.add(range.start.getFullYear())
		yearSet.add(range.end.getFullYear())
		for (const y of extractYearsFromText(lastUserText)) yearSet.add(y)
		const years = [...yearSet].filter(y => y >= 1990 && y <= 2100).sort((a, b) => a - b).slice(0, 4)
		polishCalendarBlock = formatPolishHolidaysForAssistant(years, locale)
	}

	const exportInstructions =
		locale === 'en'
			? 'Export / Excel / PDF: Do NOT say you cannot generate files or only offer to help wording a formal "request". When the user wants Excel/PDF, say briefly that **below this assistant reply** (under the chat bubble) there are the real buttons **"Download Excel (from database)"** and **"Download PDF (from database)"** — only those start the download. Do **NOT** put markdown links `[label](url)`, bare URLs, or standalone phrases like "Download from database" as if they were clickable — they do nothing in this chat. Point users to the buttons instead. Explain what the export contains using DATA CONTEXT; the file matches the same team scope and selected period as your tables, not the chat text alone.'
			: 'Eksport / Excel / PDF: Nie twierdz, że nie możesz pliku wygenerować i nie ograniczaj się do „pomocy w sformułowaniu prośby”. Gdy użytkownik chce Excel/PDF, napisz krótko, że **poniżej tej odpowiedzi asystenta** (pod dymkiem w czacie) są prawdziwe przyciski **„Pobierz Excel (z bazy)”** i **„Pobierz PDF (z bazy)”** — tylko one uruchamiają pobranie. **Nie wstawiaj** linków markdown `[etykieta](adres)`, gołych URL ani osobnej linii typu „Download from database” jakby była klikalna — w treści wiadomości to nic nie robi. Skieruj użytkownika na przyciski poniżej. Opisz zawartość z DATA CONTEXT; plik = ten sam zakres zespołu i okres co tabele, nie sam tekst czatu.'

	const productVsDataRule =
		locale === 'en'
			? '**Two sources:** (1) **DOMAIN DOCUMENT** — official Planopia feature guide: use it for "Does Planopia have…?", "Where is…?", how menus work (dashboard, schedules, leave, boards, chat, AI). Say you do not know only if the feature is not described there. (2) **DATA CONTEXT** — live team data: use it ONLY for numbers, names, leave statuses, hours, tasks, and settings snapshots. For those, never invent facts; if missing, say so.'
			: '**Dwa źródła:** (1) **DOMAIN DOCUMENT** — przewodnik po funkcjach Planopii: stosuj przy pytaniach „czy jest…?”, „gdzie znajdę…?”, jak działa menu (czas pracy, grafiki, urlopy, tablice, czat, AI). Nie mów „nie mam informacji o aplikacji”, jeśli jest to opisane poniżej. (2) **DATA CONTEXT** — dane zespołu z bazy: TYLKO do liczb, imion, statusów urlopów, godzin, zadań. Tu nie zmyślaj; jak brak danych — przyznaj się.'

	const verifiedStatsRule =
		locale === 'en'
			? '**VERIFIED STATS (JSON in DATA CONTEXT):** Ground truth for numeric answers. For anything about **this user** (I/me/my/how much did I work): use **only** `workStatsForRequestingUser`. For **team size / active accounts**: use **only** `teamRoster`. For **total hours of everyone in scope** (whole team): use `teamWorkAggregateForUsersInAiScope`. Do **not** manually sum `perUserTotals` / all users in the raw workday JSON when the question is about one person. If any other line in DATA CONTEXT disagrees with VERIFIED STATS, **VERIFIED STATS wins**.'
			: '**VERIFIED STATS (JSON w DATA CONTEXT):** Obowiązujące liczby. Pytania o **Ciebie** (ja/mnie/ile przepracowałem): wyłącznie `workStatsForRequestingUser`. Pytania o **liczbę osób w zespole / konta aktywne**: wyłącznie `teamRoster`. Pytania o **sumę całej grupy w zakresie**: `teamWorkAggregateForUsersInAiScope`. Nie sumuj ręcznie `perUserTotals` po wszystkich użytkownikach, gdy pytanie dotyczy jednej osoby. Gdy coś innego w kontekście się nie zgadza z VERIFIED STATS — **obowiązuje VERIFIED STATS**.'

	const systemParts = [
		'You are AI Asystent — a helpful, precise analyst for team/work data in Planopia.',
		`Reply in ${locale === 'en' ? 'English' : 'Polish'} unless the user clearly uses another language.`,
		productVsDataRule,
		verifiedStatsRule,
		'Do not invent employees, hours, or leave requests when answering from DATA CONTEXT.',
		'Polish calendar / public holidays: NEVER invent dates, weekdays, or Easter from memory. In Poland Labour Day (Święto Pracy) is **1 May** (1 maja), not 1 April. Easter and Corpus Christi are movable — only use dates from the POLISH PUBLIC HOLIDAYS block when it is present below. When that block lists **24 December (Christmas Eve / Wigilia)**, treat it as a non-working day in Planopia’s Polish-holiday calendar — do not advise taking annual leave on 24 Dec solely “to get the day off” unless DATA CONTEXT shows Polish holidays are disabled for the team.',
		'Format answers with GitHub-flavored Markdown: use ##/### headings, **bold**, bullet lists, and tables when they improve clarity.',
		'Map leave type ids (e.g. leaveform.option1) to human names from the LEAVE TYPE IDS section when explaining to users.',
		exportInstructions,
		'Workday "notes" in answers: combine day notes (uwagi) and timer session descriptions (opisy sesji) when both exist in DATA CONTEXT, same as in exports.',
		'Tasks (Kanban): Task lines may include dueDate (deadline), workPeriod (start→end), and placement: calendar-only (task calendar / quick tasks) vs kanban (board). Use these when the user asks about deadlines, work periods, or calendar-only items.',
		'Write for end users in plain language. Do NOT mention internal field names (e.g. workOnWeekends), JSON keys, database keys, or raw booleans like "false"/"true". Explain settings in everyday words (e.g. "W ustawieniach zespołu weekendy nie są traktowane jako zwykłe dni pracy przy ewidencji" instead of quoting technical identifiers).',
		'--- DOMAIN DOCUMENT ---',
		domainDoc,
		...(polishCalendarBlock ? ['--- POLISH PUBLIC HOLIDAYS (computed reference) ---', polishCalendarBlock] : []),
		'--- DATA CONTEXT ---',
		contextText,
	]

	const openaiMessages = [{ role: 'system', content: systemParts.join('\n\n') }, ...messages]

	return { openaiMessages, meta }
}

/**
 * @param {object} input
 */
exports.runAssistantTurn = async function runAssistantTurn(input) {
	const { openaiMessages, meta } = await prepareAssistantTurn(input)

	const { content, model, usage } = await createChatCompletion({
		messages: openaiMessages,
		temperature: 0.35,
		maxTokens: 4096,
	})

	return {
		reply: content,
		model,
		usage,
		meta,
	}
}

/**
 * Async generator: first yields { type: 'meta', meta }, then OpenAI deltas, then { type: 'end', model }.
 * @param {object} input — same shape as runAssistantTurn
 */
exports.iterateAssistantTurnStream = async function* iterateAssistantTurnStream(input) {
	const { openaiMessages, meta } = await prepareAssistantTurn(input)
	yield { type: 'meta', meta }

	for await (const ev of createChatCompletionStream({
		messages: openaiMessages,
		temperature: 0.2,
		maxTokens: 4096,
	})) {
		if (ev.type === 'delta') {
			yield { type: 'delta', text: ev.text }
		} else if (ev.type === 'done') {
			yield { type: 'end', model: ev.model }
		}
	}

	const norm = normalizeMessages(input.messages)
	const lastUser = [...norm].reverse().find(m => m.role === 'user')
	const locale = input.locale === 'en' ? 'en' : 'pl'
	if (lastUser && isOpenAIConfigured()) {
		try {
			const { buildExportOfferAfterChat } = require('./aiExportIntentService')
			const offer = await buildExportOfferAfterChat({
				userId: input.userId,
				lastUserMessage: lastUser.content,
				locale,
			})
			if (offer) {
				yield { type: 'exportOffer', offer }
			}
		} catch (e) {
			console.error('iterateAssistantTurnStream exportOffer:', e.message)
		}
	}
}

exports.isOpenAIConfigured = isOpenAIConfigured
/** Date range for AI chat and export (shared rules). */
exports.resolveAssistantDateRange = resolveDateRange
