export function calculateHoursFromRange(timeFrom, timeTo) {
	if (!timeFrom || !timeTo) return null
	const [fromH, fromM] = timeFrom.split(':').map(Number)
	const [toH, toM] = timeTo.split(':').map(Number)
	if ([fromH, fromM, toH, toM].some(Number.isNaN)) return null
	let minutes = toH * 60 + toM - (fromH * 60 + fromM)
	if (minutes < 0) minutes += 24 * 60
	if (minutes <= 0) return null
	const hours = minutes / 60
	return Math.round(hours * 2) / 2
}
