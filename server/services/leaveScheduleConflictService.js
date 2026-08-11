const { firmDb } = require('../db/db')
const Schedule = require('../models/Schedule')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { NON_HOURLY_LEAVE_QUERY, isHourlyLeaveRequest } = require('../utils/leaveSettlement')

function toDateKey(value) {
	if (!value) return null
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return null
	const year = date.getUTCFullYear()
	const month = String(date.getUTCMonth() + 1).padStart(2, '0')
	const day = String(date.getUTCDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function compareDateKeys(a, b) {
	if (!a || !b) return 0
	return a.localeCompare(b)
}

/**
 * Published schedule entries for one employee, keyed by YYYY-MM-DD.
 * @returns {Promise<Map<string, Array<{ scheduleName: string, timeFrom: string, timeTo: string }>>>}
 */
async function loadUserPublishedScheduleEntriesByDate({ teamId, userId, rangeStart, rangeEnd }) {
	const map = new Map()
	if (!teamId || !userId || !rangeStart || !rangeEnd) return map

	const userIdStr = userId.toString()
	const schedules = await Schedule.find({
		teamId,
		isActive: { $ne: false },
	})
		.select('name days')
		.lean()

	for (const schedule of schedules) {
		for (const day of schedule.days || []) {
			const dayKey = toDateKey(day.date)
			if (!dayKey || dayKey < rangeStart || dayKey > rangeEnd) continue

			for (const entry of day.entries || []) {
				if (!entry?.employeeId || entry.employeeId.toString() !== userIdStr) continue
				if (entry.isPublished === false) continue

				if (!map.has(dayKey)) map.set(dayKey, [])
				map.get(dayKey).push({
					scheduleName: schedule.name,
					timeFrom: entry.timeFrom,
					timeTo: entry.timeTo,
				})
			}
		}
	}

	return map
}

function findConflictsInLeaveRange(startDate, endDate, scheduleEntriesByDate) {
	if (!startDate || !endDate || !scheduleEntriesByDate) return []

	const startKey = toDateKey(startDate)
	const endKey = toDateKey(endDate)
	if (!startKey || !endKey || endKey < startKey) return []

	const conflicts = []
	const cursor = new Date(`${startKey}T12:00:00.000Z`)
	const end = new Date(`${endKey}T12:00:00.000Z`)

	while (cursor <= end) {
		const dayKey = toDateKey(cursor)
		const entries = scheduleEntriesByDate.get(dayKey)
		if (entries?.length) {
			for (const entry of entries) {
				conflicts.push({
					date: dayKey,
					scheduleName: entry.scheduleName,
					timeFrom: entry.timeFrom,
					timeTo: entry.timeTo,
				})
			}
		}
		cursor.setUTCDate(cursor.getUTCDate() + 1)
	}

	conflicts.sort((a, b) => {
		const byDate = compareDateKeys(a.date, b.date)
		if (byDate !== 0) return byDate
		return String(a.scheduleName || '').localeCompare(String(b.scheduleName || ''))
	})

	return conflicts
}

function getLeaveRequestsDateBounds(leaveRequests) {
	let rangeStart = null
	let rangeEnd = null

	for (const request of leaveRequests) {
		const startKey = toDateKey(request.startDate)
		const endKey = toDateKey(request.endDate)
		if (!startKey || !endKey) continue
		if (!rangeStart || startKey < rangeStart) rangeStart = startKey
		if (!rangeEnd || endKey > rangeEnd) rangeEnd = endKey
	}

	return { rangeStart, rangeEnd }
}

async function findScheduleConflictsForLeaveRange({ teamId, userId, startDate, endDate }) {
	const rangeStart = toDateKey(startDate)
	const rangeEnd = toDateKey(endDate)
	if (!rangeStart || !rangeEnd) {
		return []
	}

	const scheduleEntriesByDate = await loadUserPublishedScheduleEntriesByDate({
		teamId,
		userId,
		rangeStart,
		rangeEnd,
	})

	return findConflictsInLeaveRange(startDate, endDate, scheduleEntriesByDate)
}

const APPROVED_LEAVE_STATUSES = ['status.accepted', 'status.sent']

async function userHasApprovedLeaveOnDate({ userId, date }) {
	const dayKey = toDateKey(date)
	if (!userId || !dayKey) return false

	const dayStart = new Date(`${dayKey}T00:00:00.000Z`)
	const dayEnd = new Date(`${dayKey}T23:59:59.999Z`)

	// Wnioski godzinowe pomijamy — nie blokują wpisu do grafiku ani planowania.
	const request = await LeaveRequest.findOne({
		userId,
		status: { $in: APPROVED_LEAVE_STATUSES },
		startDate: { $lte: dayEnd },
		endDate: { $gte: dayStart },
		...NON_HOURLY_LEAVE_QUERY,
	})
		.select('_id')
		.lean()

	return Boolean(request)
}

function scheduleLeaveBlockMessage(locale) {
	const isEn = String(locale || '').toLowerCase().startsWith('en')
	if (isEn) {
		return 'Cannot add a schedule entry on a day with approved leave for this employee.'
	}
	return 'Nie można dodać wpisu do grafiku w dniu z zaakceptowanym urlopem tego pracownika.'
}

async function assertScheduleEntryAllowedForEmployee({ userId, date, locale }) {
	const blocked = await userHasApprovedLeaveOnDate({ userId, date })
	if (!blocked) {
		return { ok: true }
	}
	return {
		ok: false,
		code: 'SCHEDULE_LEAVE_BLOCK',
		message: scheduleLeaveBlockMessage(locale),
	}
}

async function attachScheduleConflictsToLeaveRequests({ teamId, userId, leaveRequests }) {
	if (!Array.isArray(leaveRequests) || leaveRequests.length === 0) {
		return []
	}

	const { rangeStart, rangeEnd } = getLeaveRequestsDateBounds(leaveRequests)
	if (!rangeStart || !rangeEnd) {
		return leaveRequests.map((request) => serializeLeaveRequestWithConflict(request, []))
	}

	const scheduleEntriesByDate = await loadUserPublishedScheduleEntriesByDate({
		teamId,
		userId,
		rangeStart,
		rangeEnd,
	})

	return leaveRequests.map((request) => {
		// Wniosek godzinowy nie koliduje z opublikowanym grafikiem — pracownik i tak pracuje tego dnia.
		if (isHourlyLeaveRequest(request)) {
			return serializeLeaveRequestWithConflict(request, [])
		}
		const conflicts = findConflictsInLeaveRange(request.startDate, request.endDate, scheduleEntriesByDate)
		return serializeLeaveRequestWithConflict(request, conflicts)
	})
}

function serializeLeaveRequestWithConflict(request, conflicts) {
	const plain = typeof request.toObject === 'function' ? request.toObject() : { ...request }
	const days = Array.isArray(conflicts) ? conflicts : []
	return {
		...plain,
		scheduleConflict: {
			hasConflict: days.length > 0,
			days,
		},
	}
}

module.exports = {
	toDateKey,
	loadUserPublishedScheduleEntriesByDate,
	findConflictsInLeaveRange,
	getLeaveRequestsDateBounds,
	findScheduleConflictsForLeaveRange,
	attachScheduleConflictsToLeaveRequests,
	userHasApprovedLeaveOnDate,
	assertScheduleEntryAllowedForEmployee,
	scheduleLeaveBlockMessage,
}
