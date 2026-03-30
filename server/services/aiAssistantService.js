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

/** User message sounds like work / summary / period question — safe to apply date overrides from text. */
function isAssistantRangeIntentText(t) {
	if (!t || typeof t !== 'string') return false
	return /prac|godzin|godz|dni|ewidenc|urlop|nadgodzin|czas|kalendarz|podsumu|podsumow|przeprac|byłem|byłam|\bbył\b|rok|roku|miesiąc|miesiąca|miesiącu|tygod|year|work|hours|days|time|leave|overtime|dane|statyst|filtr|okres|raport|sesji|summar|timer|schedule/i.test(
		t
	)
}

const PL_MONTH_NAMES = [
	'styczeń',
	'luty',
	'marzec',
	'kwiecień',
	'maj',
	'czerwiec',
	'lipiec',
	'sierpień',
	'wrzesień',
	'październik',
	'listopad',
	'grudzień',
]
const EN_MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

/** Polish / English month word groups for regex (inflected PL + EN full + abbrev). */
const MONTH_NAME_REGEX_ALTS = [
	'(?:styczeń|stycznia|styczniu|stycz\\.?|january|jan\\.?)',
	'(?:luty|lutego|lutym|february|feb\\.?)',
	'(?:marzec|marca|marcu|march|mar\\.?)',
	'(?:kwiecień|kwietnia|kwietniu|april|apr\\.?)',
	'(?:maj|maja|maju|may)',
	'(?:czerwiec|czerwca|czerwcu|june|jun\\.?)',
	'(?:lipiec|lipca|lipcu|july|jul\\.?)',
	'(?:sierpień|sierpnia|sierpniu|august|aug\\.?)',
	'(?:wrzesień|września|wrześniu|wrzesnia|wrzesniu|september|sep\\.?|sept\\.?)',
	'(?:październik|października|październiku|pazdziernik|pazdziernika|pazdzierniku|october|oct\\.?)',
	'(?:listopad|listopada|listopadu|november|nov\\.?)',
	'(?:grudzień|grudnia|grudniu|grudzien|december|dec\\.?)',
]

function monthCalendarRange(year, monthIndex) {
	const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
	const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
	return { start, end }
}

function monthLabelKey(year, monthIndex) {
	return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/**
 * If the message names a calendar month (PL/EN), optional year, or "last/this month",
 * use that full calendar month for DATA CONTEXT (overrides UI period chip).
 * @returns {null | { range: {start:Date,end:Date}, label: string, captionPl: string, captionEn: string }}
 */
function tryCalendarMonthOverrideFromMessage(lastUserText, now = new Date()) {
	if (!lastUserText || typeof lastUserText !== 'string' || !isAssistantRangeIntentText(lastUserText)) {
		return null
	}
	const t = lastUserText

	const relPrev =
		/(?:^|[^\p{L}])(?:wcześniejszy|wczesniejszy|poprzedni|zeszły|zeszly|ubiegły|ubiegly|ostatni)[^\s]*\s+miesi[aąęćłńóśźż]*|(?:^|\s)(?:previous|last)\s+month(?:\s|$|[,.!?])/iu.test(
			t
		)
	const relThis =
		/(?:^|[^\p{L}])(?:ten|bieżący|biezacy|aktualny|obecny)[^\s]*\s+miesi[aąęćłńóśźż]*|(?:^|\s)(?:this|current)\s+month(?:\s|$|[,.!?])/iu.test(t)

	if (relPrev) {
		const anchor = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const y = anchor.getFullYear()
		const mi = anchor.getMonth()
		const { start, end } = monthCalendarRange(y, mi)
		return {
			range: { start, end },
			label: monthLabelKey(y, mi),
			captionPl: `${PL_MONTH_NAMES[mi]} ${y}`,
			captionEn: `${EN_MONTH_NAMES[mi]} ${y}`,
		}
	}
	if (relThis) {
		const y = now.getFullYear()
		const mi = now.getMonth()
		const { start, end } = monthCalendarRange(y, mi)
		return {
			range: { start, end },
			label: monthLabelKey(y, mi),
			captionPl: `${PL_MONTH_NAMES[mi]} ${y}`,
			captionEn: `${EN_MONTH_NAMES[mi]} ${y}`,
		}
	}

	const numMY = t.match(/\b(0?[1-9]|1[0-2])[./](19\d{2}|20\d{2})\b/)
	if (numMY) {
		const mi = parseInt(numMY[1], 10) - 1
		const y = parseInt(numMY[2], 10)
		if (y >= 1990 && y <= 2100 && mi >= 0 && mi <= 11) {
			const { start, end } = monthCalendarRange(y, mi)
			return {
				range: { start, end },
				label: monthLabelKey(y, mi),
				captionPl: `${PL_MONTH_NAMES[mi]} ${y}`,
				captionEn: `${EN_MONTH_NAMES[mi]} ${y}`,
			}
		}
	}
	const numYM = t.match(/\b(19\d{2}|20\d{2})[./-](0?[1-9]|1[0-2])\b/)
	if (numYM) {
		const y = parseInt(numYM[1], 10)
		const mi = parseInt(numYM[2], 10) - 1
		if (y >= 1990 && y <= 2100 && mi >= 0 && mi <= 11) {
			const { start, end } = monthCalendarRange(y, mi)
			return {
				range: { start, end },
				label: monthLabelKey(y, mi),
				captionPl: `${PL_MONTH_NAMES[mi]} ${y}`,
				captionEn: `${EN_MONTH_NAMES[mi]} ${y}`,
			}
		}
	}

	for (let mi = 0; mi < 12; mi++) {
		const alt = MONTH_NAME_REGEX_ALTS[mi]
		const reAfter = new RegExp(`\\b(?:${alt})\\s+((?:19|20)\\d{2})\\b`, 'iu')
		const reBefore = new RegExp(`\\b((?:19|20)\\d{2})\\s+(?:${alt})\\b`, 'iu')
		let m = t.match(reAfter) || t.match(reBefore)
		if (m) {
			const y = parseInt(m[1], 10)
			if (y >= 1990 && y <= 2100) {
				const { start, end } = monthCalendarRange(y, mi)
				return {
					range: { start, end },
					label: monthLabelKey(y, mi),
					captionPl: `${PL_MONTH_NAMES[mi]} ${y}`,
					captionEn: `${EN_MONTH_NAMES[mi]} ${y}`,
				}
			}
		}
	}

	let foundMi = -1
	let foundPos = Infinity
	for (let mi = 0; mi < 12; mi++) {
		const re = new RegExp(`\\b(?:${MONTH_NAME_REGEX_ALTS[mi]})\\b`, 'iu')
		const m = t.match(re)
		if (m && m.index !== undefined && m.index < foundPos) {
			foundPos = m.index
			foundMi = mi
		}
	}
	if (foundMi >= 0) {
		const nowM = now.getMonth()
		const nowY = now.getFullYear()
		// Month name without year: prefer same calendar year. If the month is *later* in the year than today,
		// treat it as upcoming months in nowY when within ~half a year (e.g. March → April same year);
		// otherwise assume previous calendar year (e.g. January → December).
		let y
		if (foundMi > nowM) {
			const gap = foundMi - nowM
			y = gap <= 6 ? nowY : nowY - 1
		} else {
			y = nowY
		}
		const { start, end } = monthCalendarRange(y, foundMi)
		return {
			range: { start, end },
			label: monthLabelKey(y, foundMi),
			captionPl: `${PL_MONTH_NAMES[foundMi]} ${y}`,
			captionEn: `${EN_MONTH_NAMES[foundMi]} ${y}`,
		}
	}

	return null
}

/**
 * Effective date range for assistant context + exports: UI preset, then explicit calendar month in message, then calendar year in message.
 */
function resolveAssistantRangeWithMessage({ periodPreset, dateFrom, dateTo, lastUserMessage }) {
	const baseRange = resolveDateRange(periodPreset, dateFrom, dateTo)
	const text = (lastUserMessage && String(lastUserMessage).trim()) || ''
	if (!text) {
		return {
			range: baseRange,
			yearMessageOverride: null,
			monthFromMessageKey: null,
			monthFromMessageCaptionPl: null,
			monthFromMessageCaptionEn: null,
		}
	}
	const monthRes = tryCalendarMonthOverrideFromMessage(text, new Date())
	if (monthRes) {
		return {
			range: monthRes.range,
			yearMessageOverride: null,
			monthFromMessageKey: monthRes.label,
			monthFromMessageCaptionPl: monthRes.captionPl,
			monthFromMessageCaptionEn: monthRes.captionEn,
		}
	}
	const yRes = tryCalendarYearOverrideFromMessage(text, baseRange)
	return {
		range: yRes.range,
		yearMessageOverride: yRes.overrideYear,
		monthFromMessageKey: null,
		monthFromMessageCaptionPl: null,
		monthFromMessageCaptionEn: null,
	}
}

function formatLocalYmd(d) {
	const x = new Date(d)
	const y = x.getFullYear()
	const mo = String(x.getMonth() + 1).padStart(2, '0')
	const day = String(x.getDate()).padStart(2, '0')
	return `${y}-${mo}-${day}`
}

/**
 * If the user clearly asks about a calendar year (e.g. "w 2025 roku"), use that full year
 * for DATA CONTEXT even when the UI preset is "month" / "week".
 */
function tryCalendarYearOverrideFromMessage(lastUserText, baseRange) {
	if (!lastUserText || typeof lastUserText !== 'string') {
		return { range: baseRange, overrideYear: null }
	}
	const t = lastUserText
	if (!isAssistantRangeIntentText(t)) {
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

	const lastUserForRange = [...messages].reverse().find(m => m.role === 'user')
	const locale = input.locale === 'en' ? 'en' : 'pl'
	const eff = resolveAssistantRangeWithMessage({
		periodPreset: input.periodPreset,
		dateFrom: input.dateFrom,
		dateTo: input.dateTo,
		lastUserMessage: lastUserForRange?.content || '',
	})
	const { range, yearMessageOverride, monthFromMessageKey, monthFromMessageCaptionPl, monthFromMessageCaptionEn } = eff
	const isAllTime = input.periodPreset === 'all' && !yearMessageOverride && !monthFromMessageKey
	const monthFromMessageCaption = monthFromMessageKey
		? locale === 'en'
			? monthFromMessageCaptionEn
			: monthFromMessageCaptionPl
		: null

	const { contextText, meta } = await buildTeamDataContext({
		requestingUser,
		range,
		locale,
		isAllTime,
		yearMessageOverride,
		monthFromMessageCaption,
		monthFromMessageKey,
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

	const periodFromMessageRule =
		locale === 'en'
			? '**Period from the user’s wording:** If JSON Meta includes `monthFromMessageKey` (YYYY-MM) or numeric `yearMessageOverride`, the DATA CONTEXT range already matches the calendar month/year named in the question — trust `Meta.periodFrom` / `Meta.periodTo`; ignore a mismatch with the period selector above the chat.'
			: '**Okres z treści pytania:** Gdy w JSON Meta jest `monthFromMessageKey` (YYYY-MM) lub liczbowy `yearMessageOverride`, zakres DATA CONTEXT jest już ustawiony na ten miesiąc lub rok — ufaj `Meta.periodFrom` / `Meta.periodTo`; nie „poprawiaj” pod przełącznik okresu nad czatem.'

	const systemParts = [
		'You are AI Asystent — a helpful, precise analyst for team/work data in Planopia.',
		`Reply in ${locale === 'en' ? 'English' : 'Polish'} unless the user clearly uses another language.`,
		productVsDataRule,
		verifiedStatsRule,
		periodFromMessageRule,
		'Do not invent employees, hours, or leave requests when answering from DATA CONTEXT.',
		locale === 'en'
			? '**Leave requests:** The DATA CONTEXT section “Leave requests (in period, whole active team…)” includes **all active team members** (same broad visibility as the in-app leave planner), regardless of Meta.scope. Never tell the user you have “no access to team leave data” when that section is present. If it shows only `(none)`, it means **no requests overlap** Meta.periodFrom–Meta.periodTo — not missing permissions. Use those rows for “who is off / collisions” questions.'
			: '**Wnioski urlopowe:** Sekcja DATA CONTEXT „Leave requests (in period, whole active team…)” obejmuje **wszystkich aktywnych członków zespołu** (tak szeroki widok jak w planerze urlopów w aplikacji), niezależnie od Meta.scope. Nie mów użytkownikowi, że „nie masz dostępu do urlopów zespołu”, skoro ta sekcja jest w kontekście. Jeśli jest tylko `(none)`, znaczy to **brak wniosków nakładających się** na Meta.periodFrom–Meta.periodTo — a nie brak uprawnień. Pytania „kto ma urlop / kolizje” rozstrzygaj wyłącznie na podstawie tych wierszy.',
		'Polish calendar / public holidays: NEVER invent dates, weekdays, or Easter from memory. In Poland Labour Day (Święto Pracy) is **1 May** (1 maja), not 1 April. Easter and Corpus Christi are movable — only use dates from the POLISH PUBLIC HOLIDAYS block when it is present below. When that block lists **24 December (Christmas Eve / Wigilia)**, treat it as a non-working day in Planopia’s Polish-holiday calendar — do not advise taking annual leave on 24 Dec solely “to get the day off” unless DATA CONTEXT shows Polish holidays are disabled for the team.',
		'Format answers with GitHub-flavored Markdown: use ##/### headings, **bold**, bullet lists, and tables when they improve clarity.',
		'Map leave type ids (e.g. leaveform.option1) to human names from the LEAVE TYPE IDS section when explaining to users.',
		locale === 'en'
			? 'Leave requests: each row’s status is already plain language in DATA CONTEXT — use that exact wording in tables (e.g. “Pending approval”). Do not answer with bare `pending` / `status.pending`.'
			: 'Wnioski urlopowe: w DATA CONTEXT pole status jest już po polsku (np. „Oczekuje na akceptację”) — w tabelach powtarzaj ten tekst; nie odpowiadaj samym `pending` ani kodem `status.pending`.',
		exportInstructions,
		'Workday "notes" in answers: combine day notes (uwagi) and timer session descriptions (opisy sesji) when both exist in DATA CONTEXT, same as in exports.',
		locale === 'en'
			? '**Time clock breakdown** (DATA CONTEXT): right under “Time clock: read plain-text…” there is a **plain-text block** with “•” lines — copy those into a **per-person table** (Description | Hours | %). Do **not** collapse to one total row per person when several “•” lines exist. JSON below is supplementary. Same rules for `percentOfUserTimer` and the “day book hours not covered…” row. **Authoritative total hours** — **VERIFIED STATS**. If `hitDocLimit` is true, warn the split may be incomplete.'
			: '**Praca wg licznika** (DATA CONTEXT): zaraz pod nagłówkiem „Licznik czasu: najpierw podział tekstowy…” jest **blok tekstowy** z liniami „•” — przenieś je do **tabeli per osoba** (Opis | Godziny | %). **Nie** zamieniaj na jeden wiersz sumy na osobę, gdy jest kilka linii „•”. JSON poniżej jest uzupełnieniem. Wiersz o ewidencji bez zamkniętych sesji **nie** znaczy „nie było timera”. **Sumy godzin** — **VERIFIED STATS**. Gdy `hitDocLimit` — uprzedź o niepełności.',
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
				periodPreset: input.periodPreset,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
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
exports.resolveAssistantRangeWithMessage = resolveAssistantRangeWithMessage
exports.formatLocalYmd = formatLocalYmd
