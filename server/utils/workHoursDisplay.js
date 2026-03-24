'use strict'

/**
 * Numeric basis for the same rules as client `MonthlyCalendar` `formatHours`:
 * whole hours as integers; fractional hours rounded to one decimal (e.g. 4.67 → 4.7).
 * @param {unknown} v
 * @returns {number|null} null if empty / invalid
 */
function roundWorkHoursForDisplay(v) {
	if (v === null || v === undefined || v === '') return null
	const n = Number(v)
	if (Number.isNaN(n)) return null
	if (n % 1 === 0) return Math.round(n)
	return Math.round(n * 10) / 10
}

module.exports = { roundWorkHoursForDisplay }
