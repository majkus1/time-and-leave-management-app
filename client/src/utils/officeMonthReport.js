import { computeTeamTotalsForMonth, aggregateYearTeamTotals } from './teamWorkCalendarSummary'
import { workingDatesInRange } from './calendarDay'

/** Typ urlopu, którego saldo pokazuje panel biura (urlop wypoczynkowy) */
export const MAIN_LEAVE_TYPE = 'leaveform.option1'

/**
 * Miesiąc firmy w panelu biura rachunkowego: wiersz na pracownika z sumami liczonymi tak samo jak w liście ewidencji
 * (computeTeamTotalsForMonth). Ten sam wynik dla tabeli na ekranie i dla eksportu — oba wołają tę funkcję na swojej
 * odpowiedzi serwera, więc plik zawsze zgadza się sam ze sobą.
 * @param {{ year: number, month: number, settings: object, users: object[], workdays: object[], leaves: object[] }} data
 */
export function buildOfficeMonthRows(data, { t, i18n }) {
	if (!data) return { rows: [], sum: null, confirmedCount: 0 }
	const settings = data.settings
	const generateDateRangeForCalendar = (start, end) => workingDatesInRange(start, end, settings)
	const rows = data.users.map(user => ({
		user,
		totals: computeTeamTotalsForMonth({
			workdays: data.workdays.filter(w => w.userId === user.id),
			acceptedLeaveRequests: data.leaves.filter(l => l.userId === user.id),
			month: data.month,
			year: data.year,
			settings,
			t,
			i18n,
			generateDateRangeForCalendar,
		}),
		mainLeave: (user.leaveLimits || []).find(l => l.typeId === MAIN_LEAVE_TYPE) || null,
	}))
	return {
		rows,
		sum: rows.length ? aggregateYearTeamTotals(rows.map(r => r.totals)) : null,
		confirmedCount: rows.filter(r => r.user.confirmed).length,
	}
}

/** Dni pracy z danego miesiąca (czas lokalny przeglądarki — ten sam podział co w sumach) */
export function workdaysInMonth(workdays, year, month) {
	return (workdays || []).filter(w => {
		const d = new Date(w.date)
		return d.getMonth() === month && d.getFullYear() === year
	})
}

/**
 * Wnioski nachodzące na miesiąc (czas lokalny przeglądarki, jak w computeTeamTotalsForMonth). Serwer pobiera je
 * z dniem zapasu z każdej strony, więc bez tego w eksporcie pojawiałby się urlop kończący się 30.09 albo od 1.11.
 */
export function leavesInMonth(leaves, year, month) {
	const monthStart = new Date(year, month, 1)
	const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
	return (leaves || []).filter(l => new Date(l.startDate) <= monthEnd && new Date(l.endDate) >= monthStart)
}
