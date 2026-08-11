import { getHolidaysInRange } from './holidays'
import { getLeaveRequestTypeName } from './leaveRequestTypes'
import { isHourlyLeaveRequest } from './leaveSettlement'

function getWorkdayUserKey(day) {
	if (!day?.userId) return 'unknown'
	if (typeof day.userId === 'object' && day.userId !== null && day.userId._id) {
		return day.userId._id.toString()
	}
	return String(day.userId)
}

/**
 * Agreguje podsumowanie ewidencji dla wielu pracowników w jednym miesiącu
 * (logika zgodna z MonthlyCalendar, z liczeniem dni pracy per pracownik+dzień).
 */
export function computeTeamTotalsForMonth({
	workdays = [],
	acceptedLeaveRequests = [],
	month,
	year,
	settings,
	t,
	i18n,
	generateDateRangeForCalendar,
}) {
	let hours = 0
	let leaveDays = 0
	let hourlyLeaveHours = 0
	const workDaysSet = new Set()
	let otherAbsences = 0
	let overtime = 0

	const filteredWorkdays = workdays.filter((day) => {
		const eventDate = new Date(day.date)
		return eventDate.getMonth() === month && eventDate.getFullYear() === year
	})

	filteredWorkdays.forEach((day) => {
		const userKey = getWorkdayUserKey(day)
		const dateKey = new Date(day.date).toDateString()
		if (day.hoursWorked) {
			hours += day.hoursWorked
			workDaysSet.add(`${userKey}|${dateKey}`)
		}
		if (day.additionalWorked) {
			overtime += day.additionalWorked
		}
		if (day.absenceType) {
			const absenceTypeLower = day.absenceType.toLowerCase()
			if (
				absenceTypeLower.includes('urlop') ||
				absenceTypeLower.includes('vacation') ||
				absenceTypeLower.includes('leave')
			) {
				leaveDays += 1
			} else {
				otherAbsences += 1
			}
		}
	})

	if (Array.isArray(acceptedLeaveRequests)) {
		acceptedLeaveRequests.forEach((request) => {
			if (!request.startDate || !request.endDate) return

			const startDate = new Date(request.startDate)
			const endDate = new Date(request.endDate)

			const requestStartMonth = startDate.getMonth()
			const requestStartYear = startDate.getFullYear()
			const requestEndMonth = endDate.getMonth()
			const requestEndYear = endDate.getFullYear()

			if (
				(requestStartYear === year && requestStartMonth === month) ||
				(requestEndYear === year && requestEndMonth === month) ||
				(requestStartYear < year && requestEndYear > year) ||
				(requestStartYear === year &&
					requestEndYear === year &&
					requestStartMonth <= month &&
					requestEndMonth >= month)
			) {
				// Wniosek godzinowy nie jest pełnym dniem nieobecności — nie wchodzi do liczników
				// dni, tylko dokłada swoje godziny do sumy godzin urlopowych (niżej).
				if (isHourlyLeaveRequest(request)) {
					hourlyLeaveHours += Number(request.hoursRequested) || 0
					return
				}

				const translatedType = getLeaveRequestTypeName(
					settings,
					request.type,
					t,
					i18n.resolvedLanguage
				).toLowerCase()
				const isVacation =
					translatedType.includes('urlop') ||
					translatedType.includes('vacation') ||
					translatedType.includes('leave')

				const formatDateLocal = (date) => {
					const y = date.getFullYear()
					const m = String(date.getMonth() + 1).padStart(2, '0')
					const d = String(date.getDate()).padStart(2, '0')
					return `${y}-${m}-${d}`
				}

				if (isVacation) {
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd

					if (overlapStart <= overlapEnd) {
						const dateRange = generateDateRangeForCalendar(
							formatDateLocal(overlapStart),
							formatDateLocal(overlapEnd)
						)
						const daysInMonth = dateRange.filter((dateStr) => {
							const date = new Date(dateStr)
							return date.getMonth() === month && date.getFullYear() === year
						})
						leaveDays += daysInMonth.length
					}
				} else {
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd

					if (overlapStart <= overlapEnd) {
						const dateRange = generateDateRangeForCalendar(
							formatDateLocal(overlapStart),
							formatDateLocal(overlapEnd)
						)
						const daysInMonth = dateRange.filter((dateStr) => {
							const date = new Date(dateStr)
							return date.getMonth() === month && date.getFullYear() === year
						})
						otherAbsences += daysInMonth.length
					}
				}
			}
		})
	}

	let holidaysCount = 0
	if (settings && (settings.includePolishHolidays || settings.includeCustomHolidays)) {
		const monthStart = new Date(year, month, 1)
		const monthEnd = new Date(year, month + 1, 0)
		const formatDateLocal = (date) => {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		}
		const holidaysInMonth = getHolidaysInRange(
			formatDateLocal(monthStart),
			formatDateLocal(monthEnd),
			settings
		)
		holidaysCount = holidaysInMonth.length
	}

	const leaveHoursPerDay = settings?.leaveHoursPerDay || 8

	return {
		totalWorkDays: workDaysSet.size,
		totalHours: hours,
		overtime,
		leaveDays,
		// leaveHours = pełne dni urlopu × długość dnia + godziny z wniosków godzinowych
		leaveHours: leaveDays * leaveHoursPerDay + hourlyLeaveHours,
		hourlyLeaveHours,
		otherAbsences,
		holidaysCount,
	}
}

export function aggregateYearTeamTotals(monthlyRows) {
	const init = {
		totalWorkDays: 0,
		totalHours: 0,
		overtime: 0,
		leaveDays: 0,
		leaveHours: 0,
		hourlyLeaveHours: 0,
		otherAbsences: 0,
		holidaysCount: 0,
	}
	return monthlyRows.reduce((acc, row) => {
		acc.totalWorkDays += row.totalWorkDays
		acc.totalHours += row.totalHours
		acc.overtime += row.overtime
		acc.leaveDays += row.leaveDays
		acc.leaveHours += row.leaveHours
		acc.hourlyLeaveHours += row.hourlyLeaveHours || 0
		acc.otherAbsences += row.otherAbsences
		acc.holidaysCount += row.holidaysCount
		return acc
	}, init)
}
