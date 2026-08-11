const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { isHoliday } = require('../utils/holidays')
const { NON_HOURLY_LEAVE_QUERY } = require('../utils/leaveSettlement')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
}

const toDateKey = (dateValue) => {
	const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue)
	if (Number.isNaN(date.getTime())) return null
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const isWeekendDate = (dateValue) => {
	const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
	const day = date.getDay()
	return day === 0 || day === 6
}

/**
 * Notes z auto-generacji są kopiowane na KAŻDY nowy wpis grafiku.
 * Nie wolno tu umieszczać wyjaśnień wykluczeń „X nie może w dniu Y” — tylko krótką etykietę (np. Auto-plan).
 */
function sanitizeAutoEntryNotes(notes) {
	const n = typeof notes === 'string' ? notes.trim() : ''
	if (!n) return 'Auto-plan'
	const lower = n.toLowerCase()
	if (
		/nie może|nie może pracować|cannot work|can't work|wyklucz|unavailable|does not work|niedostępn|nie pracuje|off work|absent|unavailable for|niedostępny|niedostępna/i.test(
			lower
		)
	) {
		return 'Auto-plan'
	}
	if (/\d{4}-\d{2}-\d{2}/.test(n)) return 'Auto-plan'
	if (
		/\d{1,2}\s*(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/i.test(
			n
		)
	) {
		return 'Auto-plan'
	}
	if (
		/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i.test(
			n
		)
	) {
		return 'Auto-plan'
	}
	if (
		/\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
			n
		)
	) {
		return 'Auto-plan'
	}
	if (/\d{1,2}\.\d{1,2}(\.\d{2,4})?/.test(n)) return 'Auto-plan'
	if (n.length > 120) return 'Auto-plan'
	return n.slice(0, 500)
}

const getMonthBounds = ({ year, month }) => {
	const monthIndex = month - 1
	const start = new Date(year, monthIndex, 1)
	start.setHours(0, 0, 0, 0)
	const end = new Date(year, monthIndex + 1, 0)
	end.setHours(23, 59, 59, 999)
	return { start, end }
}

const buildMonthDays = ({ year, month }) => {
	const monthIndex = month - 1
	const cursor = new Date(year, monthIndex, 1)
	const days = []
	while (cursor.getMonth() === monthIndex) {
		days.push(new Date(cursor))
		cursor.setDate(cursor.getDate() + 1)
	}
	return days
}

const getScheduleUsers = async (schedule) => {
	if (schedule.type === 'team') {
		return User.find({
			teamId: schedule.teamId,
			...ACTIVE_USER_FILTER
		}).select('_id firstName lastName username department')
	}

	if (schedule.type === 'department') {
		const teamUsers = await User.find({
			teamId: schedule.teamId,
			...ACTIVE_USER_FILTER
		}).select('_id firstName lastName username department')

		return teamUsers.filter((user) => {
			const departments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
			return departments.includes(schedule.departmentName)
		})
	}

	if (schedule.type === 'custom') {
		return User.find({
			_id: { $in: schedule.members || [] },
			...ACTIVE_USER_FILTER
		}).select('_id firstName lastName username department')
	}

	return []
}

const buildLeaveConflictsMap = async ({ users, monthStart, monthEnd }) => {
	const userIds = users.map((user) => user._id)
	if (userIds.length === 0) return new Map()

	// Wnioski godzinowe pomijamy — pracownik jest tego dnia dostępny do planowania.
	const leaveRequests = await LeaveRequest.find({
		userId: { $in: userIds },
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $lte: monthEnd },
		endDate: { $gte: monthStart },
		...NON_HOURLY_LEAVE_QUERY
	}).select('userId startDate endDate')

	const conflictsByUser = new Map()

	for (const request of leaveRequests) {
		const userId = request.userId.toString()
		if (!conflictsByUser.has(userId)) {
			conflictsByUser.set(userId, new Set())
		}
		const userConflictSet = conflictsByUser.get(userId)
		const start = new Date(Math.max(new Date(request.startDate).getTime(), monthStart.getTime()))
		const end = new Date(Math.min(new Date(request.endDate).getTime(), monthEnd.getTime()))
		start.setHours(0, 0, 0, 0)
		end.setHours(0, 0, 0, 0)
		const cursor = new Date(start)
		while (cursor <= end) {
			const key = toDateKey(cursor)
			if (key) userConflictSet.add(key)
			cursor.setDate(cursor.getDate() + 1)
		}
	}

	return conflictsByUser
}

const pickCandidate = (candidates, assignmentCountMap) => {
	if (candidates.length === 0) return null
	let minCount = Number.POSITIVE_INFINITY
	for (const candidate of candidates) {
		const count = assignmentCountMap.get(candidate._id.toString()) || 0
		if (count < minCount) minCount = count
	}
	const best = candidates.filter((candidate) => (assignmentCountMap.get(candidate._id.toString()) || 0) === minCount)
	return best[Math.floor(Math.random() * best.length)] || null
}

const normalizeTime = (timeValue) => {
	if (!timeValue) return null
	const [hours, minutes] = String(timeValue).split(':').map(Number)
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const normalizeShift = (shift, fallbackId = null) => {
	const normalizedTimeFrom = normalizeTime(shift?.timeFrom)
	const normalizedTimeTo = normalizeTime(shift?.timeTo)
	const minEmployees = Number(shift?.minEmployees)
	if (!normalizedTimeFrom || !normalizedTimeTo || Number.isNaN(minEmployees) || minEmployees < 1) {
		return null
	}
	const weekdays = Array.isArray(shift?.weekdays)
		? shift.weekdays.map(Number).filter((day) => day >= 0 && day <= 6)
		: [0, 1, 2, 3, 4, 5, 6]

	return {
		id: shift?.id || fallbackId || `${normalizedTimeFrom}-${normalizedTimeTo}`,
		timeFrom: normalizedTimeFrom,
		timeTo: normalizedTimeTo,
		minEmployees,
		weekdays: weekdays.length > 0 ? [...new Set(weekdays)] : [0, 1, 2, 3, 4, 5, 6]
	}
}

const normalizeShiftsConfig = ({ shifts, timeFrom, timeTo, minEmployeesPerDay }) => {
	if (Array.isArray(shifts) && shifts.length > 0) {
		const normalizedShifts = shifts
			.map((shift, index) => normalizeShift(shift, `shift-${index + 1}`))
			.filter(Boolean)
		if (normalizedShifts.length > 0) {
			return normalizedShifts
		}
	}

	const legacyShift = normalizeShift({
		id: 'default',
		timeFrom,
		timeTo,
		minEmployees: minEmployeesPerDay,
		weekdays: [0, 1, 2, 3, 4, 5, 6]
	}, 'default')
	return legacyShift ? [legacyShift] : []
}

const normalizeDayOverrides = (dayOverrides = []) => {
	if (!Array.isArray(dayOverrides)) return new Map()
	const map = new Map()

	for (const override of dayOverrides) {
		if (!override?.date) continue
		const dayKey = toDateKey(override.date)
		if (!dayKey) continue

		const overrideShiftsInput = Array.isArray(override?.shifts)
			? override.shifts
			: [override]

		const normalizedShifts = overrideShiftsInput
			.map((shift, index) => normalizeShift(shift, `${dayKey}-override-${index + 1}`))
			.filter(Boolean)

		if (normalizedShifts.length > 0) {
			map.set(dayKey, normalizedShifts)
		}
	}

	return map
}

const toMinutes = (timeValue) => {
	const normalized = normalizeTime(timeValue)
	if (!normalized) return null
	const [hours, minutes] = normalized.split(':').map(Number)
	return hours * 60 + minutes
}

const buildManualExclusionsMap = ({ manualExclusions = [], validUserIds = new Set() }) => {
	const map = new Map()
	if (!Array.isArray(manualExclusions)) return map

	for (const exclusion of manualExclusions) {
		const userId = exclusion?.userId ? String(exclusion.userId) : null
		const dayKey = exclusion?.date ? toDateKey(exclusion.date) : null
		if (!userId || !dayKey) continue
		if (validUserIds.size > 0 && !validUserIds.has(userId)) continue

		const fromMinutes = exclusion.timeFrom ? toMinutes(exclusion.timeFrom) : null
		const toMinutesValue = exclusion.timeTo ? toMinutes(exclusion.timeTo) : null
		const hasWindow = fromMinutes !== null && toMinutesValue !== null && fromMinutes < toMinutesValue

		if (!map.has(dayKey)) {
			map.set(dayKey, [])
		}
		map.get(dayKey).push({
			userId,
			fromMinutes: hasWindow ? fromMinutes : null,
			toMinutes: hasWindow ? toMinutesValue : null,
		})
	}

	return map
}

const isUserExcludedForShift = ({ manualExclusionsMap, dayKey, userId, shift }) => {
	const dayExclusions = manualExclusionsMap.get(dayKey)
	if (!Array.isArray(dayExclusions) || dayExclusions.length === 0) return false

	const shiftFrom = toMinutes(shift.timeFrom)
	const shiftTo = toMinutes(shift.timeTo)
	if (shiftFrom === null || shiftTo === null || shiftFrom >= shiftTo) return false

	return dayExclusions.some((exclusion) => {
		if (exclusion.userId !== userId) return false
		// No time range means full-day exclusion
		if (exclusion.fromMinutes === null || exclusion.toMinutes === null) return true
		// Time overlap check
		return exclusion.fromMinutes < shiftTo && exclusion.toMinutes > shiftFrom
	})
}

const buildAvailabilityByUserMap = (dayAvailabilities = []) => {
	const map = new Map()
	for (const availability of Array.isArray(dayAvailabilities) ? dayAvailabilities : []) {
		const userId = availability?.employeeId?.toString()
		if (!userId) continue
		const windows = Array.isArray(availability?.timeWindows)
			? availability.timeWindows
				.map((window) => ({
					from: toMinutes(window?.timeFrom),
					to: toMinutes(window?.timeTo),
				}))
				.filter((window) => window.from !== null && window.to !== null && window.from < window.to)
			: []
		map.set(userId, windows)
	}
	return map
}

const isUserAvailableForShift = ({ availabilityByUserMap, userId, shift }) => {
	if (!availabilityByUserMap.has(userId)) return false
	const windows = availabilityByUserMap.get(userId) || []
	// No windows means full-day availability
	if (windows.length === 0) return true

	const shiftFrom = toMinutes(shift.timeFrom)
	const shiftTo = toMinutes(shift.timeTo)
	if (shiftFrom === null || shiftTo === null || shiftFrom >= shiftTo) return false

	// User is available if at least one declared window covers full shift
	return windows.some((window) => window.from <= shiftFrom && window.to >= shiftTo)
}

const getShiftsForDay = ({ dayDate, defaultShifts, dayOverridesMap }) => {
	const dayKey = toDateKey(dayDate)
	if (!dayKey) return []
	const override = dayOverridesMap.get(dayKey)
	if (override && override.length > 0) return override
	const weekday = dayDate.getDay()
	return defaultShifts.filter((shift) => shift.weekdays.includes(weekday))
}

const autoGenerateScheduleMonth = async ({
	schedule,
	currentUserId,
	year,
	month,
	timeFrom,
	timeTo,
	minEmployeesPerDay,
	shifts,
	dayOverrides,
	manualExclusions,
	allowMultipleShiftsPerDay,
	notes,
	preferAvailability,
	strictAvailability,
	workOnWeekends,
	teamSettings
}) => {
	const normalizedShifts = normalizeShiftsConfig({
		shifts,
		timeFrom,
		timeTo,
		minEmployeesPerDay
	})
	if (normalizedShifts.length === 0) {
		throw new Error('Invalid shift configuration')
	}
	const normalizedDayOverrides = normalizeDayOverrides(dayOverrides)

	const users = await getScheduleUsers(schedule)
	const validUserIds = new Set(users.map((user) => user._id.toString()))
	const monthDays = buildMonthDays({ year, month })
	const { start: monthStart, end: monthEnd } = getMonthBounds({ year, month })
	const leaveConflictsByUser = await buildLeaveConflictsMap({ users, monthStart, monthEnd })
	const manualExclusionsMap = buildManualExclusionsMap({ manualExclusions, validUserIds })
	const assignmentCount = new Map(users.map((user) => [user._id.toString(), 0]))

	for (const day of schedule.days || []) {
		const dayKey = toDateKey(day.date)
		if (!dayKey || !dayKey.startsWith(`${year}-${String(month).padStart(2, '0')}`)) continue
		for (const entry of day.entries || []) {
			const employeeId = entry.employeeId?.toString()
			if (!employeeId) continue
			assignmentCount.set(employeeId, (assignmentCount.get(employeeId) || 0) + 1)
		}
	}

	let generatedEntries = 0
	let skippedWeekendDays = 0
	let skippedHolidayDays = 0
	let skippedNoCandidates = 0
	const processedDays = []
	let processedShifts = 0

	const trackTeamHolidays =
		teamSettings && (teamSettings.includePolishHolidays || teamSettings.includeCustomHolidays)

	for (const dayDate of monthDays) {
		if (!workOnWeekends && isWeekendDate(dayDate)) {
			skippedWeekendDays += 1
			continue
		}

		if (trackTeamHolidays && isHoliday(dayDate, teamSettings)) {
			skippedHolidayDays += 1
			continue
		}

		const dayKey = toDateKey(dayDate)
		if (!dayKey) continue

		let dayIndex = schedule.days.findIndex((day) => toDateKey(day.date) === dayKey)
		if (dayIndex === -1) {
			schedule.days.push({
				date: new Date(dayDate),
				availabilities: [],
				entries: []
			})
			dayIndex = schedule.days.length - 1
		}

		const day = schedule.days[dayIndex]
		const existingEntries = Array.isArray(day.entries) ? day.entries : []
		const shiftsForDay = getShiftsForDay({
			dayDate,
			defaultShifts: normalizedShifts,
			dayOverridesMap: normalizedDayOverrides
		})
		const assignedAnyShiftIds = new Set(existingEntries.map((entry) => entry.employeeId?.toString()).filter(Boolean))
		let addedTodayTotal = 0

		if (shiftsForDay.length === 0) {
			processedDays.push({ dayKey, added: 0, shifts: 0 })
			continue
		}

		const availabilityByUserMap = buildAvailabilityByUserMap(day.availabilities)

		const baseCandidates = users.filter((user) => {
			const userId = user._id.toString()
			if (!allowMultipleShiftsPerDay && assignedAnyShiftIds.has(userId)) return false
			const leaveDates = leaveConflictsByUser.get(userId)
			if (leaveDates && leaveDates.has(dayKey)) return false
			return true
		})

		for (const shift of shiftsForDay) {
			processedShifts += 1
			const existingInShift = existingEntries.filter(
				(entry) => entry.timeFrom === shift.timeFrom && entry.timeTo === shift.timeTo
			)
			const missingSlots = Math.max(0, shift.minEmployees - existingInShift.length)
			if (missingSlots === 0) continue

			const existingShiftIds = new Set(existingInShift.map((entry) => entry.employeeId?.toString()).filter(Boolean))
			const shiftBaseCandidates = baseCandidates.filter((user) => {
				const userId = user._id.toString()
				if (existingShiftIds.has(userId)) return false
				if (!allowMultipleShiftsPerDay && assignedAnyShiftIds.has(userId)) return false
				if (isUserExcludedForShift({ manualExclusionsMap, dayKey, userId, shift })) return false
				return true
			})

			let preferredCandidates = shiftBaseCandidates
			let fallbackCandidates = []
			const shouldUseAvailability = schedule.availabilityEnabled && preferAvailability
			if (shouldUseAvailability) {
				preferredCandidates = shiftBaseCandidates.filter((user) =>
					isUserAvailableForShift({
						availabilityByUserMap,
						userId: user._id.toString(),
						shift
					})
				)
				// Important: when a user declared availability for a day, treat it as a hard constraint.
				// Fallback may use only users with NO declaration for that day (or strict mode = none).
				fallbackCandidates = strictAvailability
					? []
					: shiftBaseCandidates.filter((user) =>
						!availabilityByUserMap.has(user._id.toString())
					)
			}

			let addedForShift = 0
			while (addedForShift < missingSlots) {
				const pool = preferredCandidates.length > 0 ? preferredCandidates : fallbackCandidates
				if (!pool || pool.length === 0) break

				const selected = pickCandidate(pool, assignmentCount)
				if (!selected) break

				const selectedId = selected._id.toString()
				const selectedName = `${selected.firstName || ''} ${selected.lastName || ''}`.trim() || selected.username || 'Pracownik'

				day.entries.push({
					employeeId: selected._id,
					employeeName: selectedName,
					timeFrom: shift.timeFrom,
					timeTo: shift.timeTo,
					createdBy: currentUserId,
					notes: sanitizeAutoEntryNotes(notes),
					isPublished: false,
					autoGenerated: true
				})

				assignmentCount.set(selectedId, (assignmentCount.get(selectedId) || 0) + 1)
				generatedEntries += 1
				addedForShift += 1
				addedTodayTotal += 1
				assignedAnyShiftIds.add(selectedId)
				existingShiftIds.add(selectedId)

				preferredCandidates = preferredCandidates.filter((candidate) => candidate._id.toString() !== selectedId)
				fallbackCandidates = fallbackCandidates.filter((candidate) => candidate._id.toString() !== selectedId)
			}

			if (addedForShift < missingSlots) {
				skippedNoCandidates += 1
			}
		}

		processedDays.push({ dayKey, added: addedTodayTotal, shifts: shiftsForDay.length })
	}

	return {
		generatedEntries,
		processedDays: processedDays.length,
		processedShifts,
		skippedWeekendDays,
		skippedHolidayDays,
		skippedNoCandidates,
		totalUsersConsidered: users.length
	}
}

module.exports = {
	autoGenerateScheduleMonth,
	getScheduleUsers,
	normalizeShiftsConfig,
	sanitizeAutoEntryNotes,
}

