/** Zaokrąglenie godzin do 2 miejsc po przecinku (timer, filtry). */
export function roundHours(value) {
	if (!Number.isFinite(value)) return 0
	return Math.round(value * 100) / 100
}

/** Jedna reguła minut timera w całej aplikacji (zgodna z serwerem: Math.round). */
export function getDurationMinutes(startTime, endTime) {
	if (!startTime || !endTime) return 0
	const start = new Date(startTime)
	const end = new Date(endTime)
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
	const minutes = Math.round((end - start) / (1000 * 60))
	return minutes > 0 ? minutes : 0
}

/** Godziny z zaokrąglonych minut — spójne z listą sesji i podsumowaniami. */
export function hoursFromDurationMinutes(minutes) {
	if (!minutes || minutes <= 0) return 0
	return roundHours(minutes / 60)
}

/** Etykieta w rozbiciu czynności/zadań na kafelku kalendarza. */
export function formatBreakdownHours(hours) {
	if (!Number.isFinite(hours) || hours <= 0) return ''
	if (hours < 1) return formatMinutesAsClock(Math.round(hours * 60))
	return `${formatHoursDecimal(hours)} h`
}

/** Zaokrąglenie do pół godziny — tylko wyświetlanie ręcznej ewidencji bez filtra. */
export function roundToHalfHour(hours) {
	if (hours === null || hours === undefined) return null
	const numHours = typeof hours === 'number' ? hours : parseFloat(hours)
	if (isNaN(numHours)) return null
	return Math.round(numHours * 2) / 2
}

/** Format dziesiętny: 8, 8.5, 0.1 — jak dotychczas w ewidencji ręcznej. */
export function formatHoursDecimal(hours) {
	if (hours === null || hours === undefined) return ''
	const numHours = typeof hours === 'number' ? hours : parseFloat(hours)
	if (isNaN(numHours)) return ''
	if (numHours % 1 === 0) return numHours.toString()
	return numHours.toFixed(1).replace(/\.0$/, '')
}

/** Format H:MM z pełnych minut (bez błędów zaokrągleń float). */
export function formatMinutesAsClock(totalMinutes) {
	const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0))
	if (minutes <= 0) return '0:00'
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return `${h}:${String(m).padStart(2, '0')}`
}

/** Format H:MM — spójny z listą sesji timera. */
export function formatHoursClock(hours) {
	const num = parseFloat(hours)
	if (isNaN(num) || num <= 0) return '0:00'
	return formatMinutesAsClock(Math.round(num * 60))
}

/**
 * @param {number|string|null|undefined} hours
 * @param {{ preferClockUnderHour?: boolean }} [options]
 *   preferClockUnderHour — poniżej 1 h pokaż 0:08 zamiast 0.1 (filtry, timer)
 */
export function formatWorkDuration(hours, { preferClockUnderHour = false } = {}) {
	if (hours === null || hours === undefined || hours === '') return ''
	const num = typeof hours === 'number' ? hours : parseFloat(hours)
	if (isNaN(num)) return ''
	if (preferClockUnderHour && num > 0 && num < 1) {
		return formatHoursClock(num)
	}
	return formatHoursDecimal(num)
}
