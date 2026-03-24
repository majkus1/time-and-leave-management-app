/**
 * Shared date helpers for leave requests (aligned with leaveController logic).
 */
const { isHoliday } = require('./holidays')

function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6
}

/**
 * @param {import('mongoose').Model} Settings - Settings model (bound to firm DB)
 */
function makeTrimAndRange(Settings) {
	async function trimWeekendsFromDateRange(startDate, endDate, teamId) {
		const settings = await Settings.getSettings(teamId)
		const workOnWeekends = settings.workOnWeekends !== false

		if (workOnWeekends) {
			return { trimmedStartDate: startDate, trimmedEndDate: endDate }
		}

		const start = new Date(startDate)
		const end = new Date(endDate)

		let trimmedStart = new Date(start)
		while (trimmedStart <= end && (isWeekend(trimmedStart) || isHoliday(trimmedStart, settings))) {
			trimmedStart.setDate(trimmedStart.getDate() + 1)
		}

		let trimmedEnd = new Date(end)
		while (trimmedEnd >= start && (isWeekend(trimmedEnd) || isHoliday(trimmedEnd, settings))) {
			trimmedEnd.setDate(trimmedEnd.getDate() - 1)
		}

		if (trimmedStart > trimmedEnd) {
			return { trimmedStartDate: null, trimmedEndDate: null }
		}

		const trimmedStartDate = trimmedStart.toISOString().split('T')[0]
		const trimmedEndDate = trimmedEnd.toISOString().split('T')[0]
		return { trimmedStartDate, trimmedEndDate }
	}

	async function generateDateRange(startDate, endDate, teamId) {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		const current = new Date(start)

		const settings = await Settings.getSettings(teamId)
		const workOnWeekends = settings.workOnWeekends !== false

		while (current <= end) {
			const currentDateStr = new Date(current).toISOString().split('T')[0]
			const isWeekendDay = isWeekend(current)
			const holidayInfo = isHoliday(current, settings)
			const isHolidayDay = holidayInfo !== null

			if (workOnWeekends) {
				if (!isHolidayDay) {
					dates.push(currentDateStr)
				}
			} else {
				if (!isWeekendDay && !isHolidayDay) {
					dates.push(currentDateStr)
				}
			}
			current.setDate(current.getDate() + 1)
		}

		return dates
	}

	return { trimWeekendsFromDateRange, generateDateRange }
}

module.exports = {
	makeTrimAndRange,
	isWeekend,
}
