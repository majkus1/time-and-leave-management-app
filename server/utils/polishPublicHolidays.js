/**
 * Polish public holidays for the assistant — dates computed in local calendar (aligned with Planopia UI).
 * Includes **24 Dec (Wigilia)** like `client/src/utils/holidays.js` when Polish holidays are used in the app.
 * Movable feasts: Easter (Gregorian computus), Corpus Christi = Easter Sunday + 60 days.
 * Core statutory list follows ustawa o dniach wolnych od pracy; Wigilia matches product calendar behaviour.
 */

'use strict'

/** @param {number} y */
function easterSunday(y) {
	const a = y % 19
	const b = Math.floor(y / 100)
	const c = y % 100
	const d = Math.floor(b / 4)
	const e = b % 4
	const f = Math.floor((b + 8) / 25)
	const g = Math.floor((b - f + 1) / 3)
	const h = (19 * a + b - d - g + 15) % 30
	const i = Math.floor(c / 4)
	const k = c % 4
	const l = (32 + 2 * e + 2 * i - h - k) % 7
	const m = Math.floor((a + 11 * h + 22 * l) / 451)
	const month = Math.floor((h + l - 7 * m + 114) / 31)
	const day = ((h + l - 7 * m + 114) % 31) + 1
	return new Date(y, month - 1, day)
}

/** @param {Date} d @param {number} n */
function addDays(d, n) {
	const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
	x.setDate(x.getDate() + n)
	return x
}

const WD_PL = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * @param {number} year
 * @returns {Array<{ date: Date, key: string, namePl: string, nameEn: string }>}
 */
function getPolishPublicHolidays(year) {
	const easter = easterSunday(year)
	const easterMon = addDays(easter, 1)
	const corpus = addDays(easter, 60)

	const items = [
		{ date: new Date(year, 0, 1), key: 'new_year', namePl: 'Nowy Rok', nameEn: "New Year's Day" },
		{ date: new Date(year, 0, 6), key: 'epiphany', namePl: 'Święto Trzech Króli', nameEn: 'Epiphany' },
		{ date: easter, key: 'easter_sun', namePl: 'Niedziela Wielkanocna', nameEn: 'Easter Sunday' },
		{ date: easterMon, key: 'easter_mon', namePl: 'Poniedziałek Wielkanocny', nameEn: 'Easter Monday' },
		{ date: new Date(year, 4, 1), key: 'labour', namePl: 'Święto Pracy', nameEn: 'Labour Day' },
		{ date: new Date(year, 4, 3), key: 'constitution', namePl: 'Święto Narodowe Trzeciego Maja', nameEn: 'Constitution Day (3 May)' },
		{ date: corpus, key: 'corpus', namePl: 'Boże Ciało', nameEn: 'Corpus Christi' },
		{ date: new Date(year, 7, 15), key: 'assumption', namePl: 'Wniebowzięcie Najświętszej Marii Panny', nameEn: 'Assumption of Mary' },
		{ date: new Date(year, 10, 1), key: 'all_saints', namePl: 'Wszystkich Świętych', nameEn: 'All Saints’ Day' },
		{ date: new Date(year, 10, 11), key: 'independence', namePl: 'Narodowe Święto Niepodległości', nameEn: 'Independence Day' },
		// Zgodnie z kalendarzem Planopii (getPolishHolidaysForYear) — przy włączonych polskich świętach Wigilia jest dniem wolnym w UI.
		{ date: new Date(year, 11, 24), key: 'xmas_eve', namePl: 'Wigilia Bożego Narodzenia', nameEn: 'Christmas Eve' },
		{ date: new Date(year, 11, 25), key: 'xmas1', namePl: 'Boże Narodzenie (pierwszy dzień)', nameEn: 'Christmas Day' },
		{ date: new Date(year, 11, 26), key: 'xmas2', namePl: 'Boże Narodzenie (drugi dzień)', nameEn: 'Second Day of Christmas' },
	]

	items.sort((a, b) => a.date.getTime() - b.date.getTime())
	return items
}

/**
 * @param {number[]} years
 * @param {'pl'|'en'} locale
 */
function formatPolishHolidaysForAssistant(years, locale) {
	const uniq = [...new Set(years)]
		.filter(y => Number.isFinite(y) && y >= 1990 && y <= 2100)
		.sort((a, b) => a - b)
	if (uniq.length === 0) return ''

	const lines = []
	const isPl = locale !== 'en'
	lines.push(isPl ? '### POLSKIE ŚWIĘTA (referencja obliczeniowa — użyj TYLKO tych dat i dni tygodnia)' : '### POLISH PUBLIC HOLIDAYS (computed reference — use ONLY these dates/weekdays)')
	lines.push(
		isPl
			? 'Święto Pracy w Polsce to zawsze **1 maja**, nigdy 1 kwietnia. Wielkanoc i Boże Ciało są ruchome — nie zgaduj ich „z pamięci”. **W Planopii** (przy włączonych polskich świętach w zespole) **24 grudnia (Wigilia)** jest w kalendarzu traktowana jak dzień wolny — tak samo jak poniżej; nie sugeruj brania urlopu na Wigilię „żeby mieć wolne”, jeśli użytkownik ma włączone święta w aplikacji (sprawdź też DATA CONTEXT → ustawienia).'
			: 'Labour Day in Poland is always **1 May**, never 1 April. Easter and Corpus Christi move — do not guess from memory. In **Planopia** (when Polish holidays are enabled for the team), **24 December (Christmas Eve)** is treated as a non-working holiday in the calendar like below — do not tell users they must take leave on Christmas Eve to be off if Polish holidays are on (also check DATA CONTEXT → settings).',
	)
	for (const y of uniq) {
		lines.push('')
		lines.push(`**${y}**`)
		for (const h of getPolishPublicHolidays(y)) {
			const wd = isPl ? WD_PL[h.date.getDay()] : WD_EN[h.date.getDay()]
			const name = isPl ? h.namePl : h.nameEn
			const ds = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`
			lines.push(`- ${ds} (${wd}) — ${name}`)
		}
	}
	return lines.join('\n')
}

/**
 * User asks about holidays / time off / calendar — attach computed list.
 * @param {string} text
 */
function shouldAttachPolishCalendarHint(text) {
	if (!text || typeof text !== 'string') return false
	const t = text.toLowerCase()
	const pl =
		/święt|wielkanoc|wolny|wolne|urlop|kalendarz|majów|nie\s*pracuj|dni\s*wolne|ustawow|niepodległo|boże\s*ciało|trzech\s*króli|święto\s*pracy|konstytucj|wszystkich\s*święty|narodowe|wielkanocn|świąteczn|wigili|boże\s*narodzeni|długi\s*weekend|kwietni|styczni|lut(y|ego)|marc|maja|czerwc|lipc|sierpni|wrześni|październik|listopad|grudni/i
	const en = /public holiday|easter|calendar|time off|vacation|day off|poland|polish|long weekend|national holiday/i
	return pl.test(t) || en.test(t)
}

/**
 * @param {string} text
 * @returns {number[]}
 */
function extractYearsFromText(text) {
	if (!text || typeof text !== 'string') return []
	const m = text.match(/\b(19\d{2}|20\d{2})\b/g)
	if (!m) return []
	return [...new Set(m.map(Number))].filter(y => y >= 1990 && y <= 2100)
}

module.exports = {
	easterSunday,
	getPolishPublicHolidays,
	formatPolishHolidaysForAssistant,
	shouldAttachPolishCalendarHint,
	extractYearsFromText,
}
