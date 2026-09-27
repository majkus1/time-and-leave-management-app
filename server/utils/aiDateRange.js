const { warsawDayStart } = require('./workdayEntryValidation')

/**
 * Zakres dat kontekstu asystenta AI dla presetu z UI — czysta funkcja (bez bazy, reguła 9).
 *
 * „Dziś” to dzień kalendarzowy w Warszawie (warsawDayStart), zapisany w konwencji dokumentów Workday — północ
 * w strefie serwera. Produkcja działa w UTC: przy `new Date() + setHours` o 00:30 czasu PL „dziś” było wczorajszym
 * dniem, a preset „miesiąc” 1. dnia miesiąca wskazywał poprzedni miesiąc (np. 1.10 o 00:30 → wrzesień).
 *
 * @param {'all'|'week'|'month'|'year'|'custom'|string} preset
 * @param {string} [dateFrom] — tylko dla 'custom'
 * @param {string} [dateTo] — tylko dla 'custom'
 * @param {Date} [now]
 * @returns {{ start: Date, end: Date }}
 */
function resolveAssistantPresetRange(preset, dateFrom, dateTo, now = new Date()) {
	const today = warsawDayStart(now)
	const end = new Date(today)
	end.setHours(23, 59, 59, 999)

	let start
	switch (preset) {
		case 'all': {
			start = new Date(2000, 0, 1)
			start.setHours(0, 0, 0, 0)
			break
		}
		case 'week': {
			start = new Date(today)
			start.setDate(start.getDate() - 7)
			break
		}
		case 'month': {
			start = new Date(today.getFullYear(), today.getMonth(), 1)
			const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
			return { start, end: monthEnd }
		}
		case 'year': {
			start = new Date(today.getFullYear(), 0, 1)
			break
		}
		case 'custom': {
			if (dateFrom && dateTo) {
				start = new Date(dateFrom)
				const e = new Date(dateTo)
				e.setHours(23, 59, 59, 999)
				return { start, end: e }
			}
			// bez obu dat — jak domyślne 30 dni
		}
		// falls through
		default: {
			start = new Date(today)
			start.setDate(start.getDate() - 30)
		}
	}
	return { start, end }
}

module.exports = { resolveAssistantPresetRange }
