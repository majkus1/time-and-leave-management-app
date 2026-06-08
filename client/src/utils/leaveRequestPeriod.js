import { isHolidayDate } from './holidays'

const toValidDate = (value) => {
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

const getPeriodBounds = (selectedYear, selectedMonth = 'all') => {
	if (selectedYear === 'all') return null

	const year = Number(selectedYear)
	if (!Number.isInteger(year)) return null

	const month = selectedMonth === 'all' ? null : Number(selectedMonth)
	return {
		start: month === null
			? new Date(Date.UTC(year, 0, 1))
			: new Date(Date.UTC(year, month, 1)),
		end: month === null
			? new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
			: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
	}
}

export const getLeaveRequestYears = (requests = [], currentYear = new Date().getFullYear()) => {
	const years = new Set([currentYear])

	for (const request of requests) {
		const start = toValidDate(request?.startDate)
		const end = toValidDate(request?.endDate)
		if (!start || !end) continue

		const firstYear = Math.min(start.getUTCFullYear(), end.getUTCFullYear())
		const lastYear = Math.max(start.getUTCFullYear(), end.getUTCFullYear())
		for (let year = firstYear; year <= lastYear; year += 1) {
			years.add(year)
		}
	}

	return [...years].sort((a, b) => b - a)
}

export const filterLeaveRequestsByPeriod = (requests = [], selectedYear, selectedMonth = 'all') => {
	if (selectedYear === 'all') return requests

	const bounds = getPeriodBounds(selectedYear, selectedMonth)
	if (!bounds) return requests

	return requests.filter((request) => {
		const start = toValidDate(request?.startDate)
		const end = toValidDate(request?.endDate)
		if (!start || !end) return false

		return start <= bounds.end && end >= bounds.start
	})
}

export const LEAVE_REQUEST_STATUS_KEYS = ['accepted', 'pending', 'rejected', 'sent']

export const createDefaultLeaveRequestStatusFilters = () => ({
	accepted: true,
	pending: true,
	rejected: true,
	sent: true,
})

export const normalizeLeaveRequestStatus = (status) => {
	const normalized = String(status || '').replace('status.', '')
	return LEAVE_REQUEST_STATUS_KEYS.includes(normalized) ? normalized : null
}

export const filterLeaveRequestsByStatuses = (requests = [], statusFilters = {}) => (
	requests.filter((request) => {
		const status = normalizeLeaveRequestStatus(request?.status)
		return status ? statusFilters[status] !== false : false
	})
)

export const getLeaveRequestStatusStats = (requests = []) => {
	const stats = {
		total: requests.length,
		accepted: 0,
		pending: 0,
		rejected: 0,
		sent: 0,
	}

	for (const request of requests) {
		const status = normalizeLeaveRequestStatus(request?.status)
		if (status) stats[status] += 1
	}

	return stats
}

const toUtcYmd = (date) => (
	`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
)

export const countLeaveRequestDaysInPeriod = (request, selectedYear, selectedMonth, settings) => {
	const requestedDays = Number(request?.daysRequested)
	const bounds = getPeriodBounds(selectedYear, selectedMonth)
	if (!bounds) return Number.isFinite(requestedDays) ? requestedDays : 0

	const requestStart = toValidDate(request?.startDate)
	const requestEnd = toValidDate(request?.endDate)
	if (!requestStart || !requestEnd) return 0

	const start = new Date(Math.max(requestStart.getTime(), bounds.start.getTime()))
	const end = new Date(Math.min(requestEnd.getTime(), bounds.end.getTime()))
	if (start > end) return 0

	let days = 0
	const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
	const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
	const workOnWeekends = settings?.workOnWeekends !== false

	while (current <= lastDay) {
		const dayOfWeek = current.getUTCDay()
		const weekend = dayOfWeek === 0 || dayOfWeek === 6
		const holiday = settings ? isHolidayDate(toUtcYmd(current), settings) !== null : false
		if ((workOnWeekends || !weekend) && !holiday) days += 1
		current.setUTCDate(current.getUTCDate() + 1)
	}

	return days
}

export const getLeaveRequestDurationStats = (
	requests = [],
	selectedYear,
	selectedMonth = 'all',
	settings = {}
) => {
	const days = {
		total: 0,
		accepted: 0,
		pending: 0,
		rejected: 0,
		sent: 0,
	}

	for (const request of requests) {
		const status = normalizeLeaveRequestStatus(request?.status)
		if (!status) continue
		const requestDays = countLeaveRequestDaysInPeriod(request, selectedYear, selectedMonth, settings)
		days[status] += requestDays
		days.total += requestDays
	}

	const multiplier = settings?.leaveCalculationMode === 'hours'
		? Number(settings?.leaveHoursPerDay) || 8
		: 1

	return Object.fromEntries(Object.entries(days).map(([key, value]) => [key, value * multiplier]))
}

export const getLeaveRequestTypeStats = (
	requests = [],
	selectedYear,
	selectedMonth = 'all',
	settings = {}
) => {
	const stats = new Map()
	const multiplier = settings?.leaveCalculationMode === 'hours'
		? Number(settings?.leaveHoursPerDay) || 8
		: 1

	for (const request of requests) {
		const type = request?.type || 'unknown'
		const duration = countLeaveRequestDaysInPeriod(request, selectedYear, selectedMonth, settings) * multiplier
		if (!duration) continue

		const current = stats.get(type) || {
			type,
			requests: 0,
			duration: 0,
			accepted: 0,
			pending: 0,
			rejected: 0,
			sent: 0,
		}
		const status = normalizeLeaveRequestStatus(request?.status)
		current.requests += 1
		current.duration += duration
		if (status) current[status] += duration
		stats.set(type, current)
	}

	return [...stats.values()].sort((a, b) => b.duration - a.duration)
}

export const getLeaveRequestLimitUsageStats = (
	requests = [],
	selectedYear,
	selectedMonth = 'all',
	settings = {},
	leaveTypeDays = {}
) => {
	const leaveTypes = Array.isArray(settings?.leaveRequestTypes) ? settings.leaveRequestTypes : []
	return leaveTypes
		.filter(type => type?.allowDaysLimit && leaveTypeDays[type.id] !== undefined && leaveTypeDays[type.id] !== null)
		.map((type) => {
			const limit = Number(leaveTypeDays[type.id]) || 0
			let used = 0
			let pending = 0

			for (const request of requests) {
				if (request?.type !== type.id) continue
				const status = normalizeLeaveRequestStatus(request?.status)
				const days = countLeaveRequestDaysInPeriod(request, selectedYear, selectedMonth, settings)
				if (status === 'accepted' || status === 'sent') used += days
				if (status === 'pending') pending += days
			}

			const remaining = limit - used
			const usagePercent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0

			return {
				type: type.id,
				limit,
				used,
				pending,
				remaining,
				usagePercent,
				isExceeded: limit > 0 && used > limit,
				isAtRisk: limit > 0 && used <= limit && used + pending > limit,
			}
		})
}
