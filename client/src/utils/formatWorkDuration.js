/** Zaokrąglenie godzin do 2 miejsc po przecinku (timer, filtry). */
export function roundHours(value) {
	if (!Number.isFinite(value)) return 0
	return Math.round(value * 100) / 100
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

/** Format H:MM — spójny z listą sesji timera. */
export function formatHoursClock(hours) {
	const num = parseFloat(hours)
	if (isNaN(num) || num <= 0) return '0:00'
	let h = Math.floor(num)
	let m = Math.round((num - h) * 60)
	if (m >= 60) {
		h += 1
		m = 0
	}
	return `${h}:${String(m).padStart(2, '0')}`
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
