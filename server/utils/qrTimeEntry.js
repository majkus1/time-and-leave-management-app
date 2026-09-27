/**
 * Decyzje dla wpisów wejścia/wyjścia QR (TimeEntry) — czyste funkcje, bez bazy (reguła 9).
 *
 * Godziny liczy wyłącznie sesja licznika (Workday.timeEntries). TimeEntry to ślad skanu: wyjście skanem ma sens
 * tylko wtedy, gdy działa licznik uruchomiony tym kodem. Otwarte wejście bez takiego licznika to pozostałość
 * (licznik zatrzymany przyciskiem Stop, skan przy działającym ręcznym liczniku) — zamykamy je bez doliczania godzin,
 * a skan traktujemy jako nowe wejście. Wcześniej taki skan dopisywał czas drugi raz.
 */

/** Czy skan zamyka wejście (wyjście), czy zaczyna nowe */
function isQrExit({ openEntry, hasActiveTimerFromThisCode }) {
	return Boolean(openEntry && hasActiveTimerFromThisCode)
}

/**
 * Czas zamknięcia pozostawionego wejścia: koniec sesji licznika, która zaczęła się tym wejściem (Stop przyciskiem),
 * a gdy takiej nie ma (wejście nigdy nie uruchomiło licznika) — chwila wejścia, czyli wpis zerowej długości.
 * @param {Date} entryTime
 * @param {Array<{ startTime: Date, endTime?: Date|null }>} sessions
 * @returns {Date}
 */
function staleEntryExitTime(entryTime, sessions = []) {
	const start = new Date(entryTime).getTime()
	const match = sessions.find(s => s?.startTime && new Date(s.startTime).getTime() === start && s.endTime)
	return match ? new Date(match.endTime) : new Date(start)
}

module.exports = { isQrExit, staleEntryExitTime }
