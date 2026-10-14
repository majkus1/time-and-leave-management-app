import { isHolidayDate } from './holidays'

/**
 * Następny dzień kalendarzowy dla dat zapisanych jako północ UTC (tak trzymamy daty wniosków urlopowych).
 * Krok w czasie lokalnym (setDate) przesuwał się przy zmianie czasu: jesienią kalendarze gubiły ostatni dzień
 * zakresu (urlop 19–30.10 kończył się 29.10), wiosną przesuwały dni o jeden wstecz.
 */
export function stepToNextUtcDay(date) {
	date.setUTCDate(date.getUTCDate() + 1)
	return date
}

/**
 * Dni robocze zakresu wniosku jako 'YYYY-MM-DD' — bez świąt zespołu, bez weekendów gdy workOnWeekends === false.
 * Wspólne dla listy ewidencji (AdminUserList) i panelu biura rachunkowego (computeTeamTotalsForMonth).
 */
export function workingDatesInRange(startDate, endDate, settings) {
	const dates = []
	const current = new Date(startDate)
	const end = new Date(endDate)
	const workOnWeekends = settings?.workOnWeekends !== false
	while (current <= end) {
		const day = current.getDay()
		const isWeekendDay = day === 0 || day === 6
		const isHolidayDay = isHolidayDate(current, settings) !== null
		if (!isHolidayDay && (workOnWeekends || !isWeekendDay)) {
			dates.push(current.toISOString().split('T')[0])
		}
		stepToNextUtcDay(current)
	}
	return dates
}
