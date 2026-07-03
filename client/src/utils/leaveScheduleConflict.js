export function formatScheduleConflictDate(dateKey, locale) {
	if (!dateKey) return ''
	const date = new Date(`${dateKey}T12:00:00.000Z`)
	if (Number.isNaN(date.getTime())) return dateKey
	return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function groupScheduleConflictsByDate(conflicts = []) {
	const map = new Map()
	for (const item of conflicts) {
		if (!item?.date) continue
		if (!map.has(item.date)) map.set(item.date, [])
		map.get(item.date).push(item)
	}
	return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function buildScheduleConflictConfirmMessage({
	t,
	locale,
	conflicts,
	employeeName = '',
	isForOtherEmployee = false,
}) {
	const grouped = groupScheduleConflictsByDate(conflicts)
	const lines = grouped.flatMap(([date, entries]) =>
		entries.map(
			(entry) =>
				`• ${formatScheduleConflictDate(date, locale)} — ${entry.scheduleName} (${entry.timeFrom}–${entry.timeTo})`
		)
	)

	const intro = isForOtherEmployee
		? t('leaveScheduleConflict.confirmIntroOther', { name: employeeName })
		: t('leaveScheduleConflict.confirmIntroSelf')

	return `${intro}\n\n${lines.join('\n')}\n\n${t('leaveScheduleConflict.confirmQuestion')}\n${t('leaveScheduleConflict.confirmManagerNote')}`
}

export function getScheduleConflictSummary(t, conflicts = []) {
	const uniqueDates = new Set(conflicts.map((item) => item.date).filter(Boolean))
	const count = uniqueDates.size
	if (count === 0) return ''
	if (count === 1) return t('leaveScheduleConflict.badgeSummaryOne')
	return t('leaveScheduleConflict.badgeSummaryMany', { count })
}

const APPROVED_LEAVE_STATUSES = new Set([
	'status.accepted',
	'accepted',
	'status.sent',
	'sent',
])

function toIsoDateKey(value) {
	if (!value) return null
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return null
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function extractLeaveRequestUserId(request) {
	if (!request?.userId) return null
	if (typeof request.userId === 'string') return request.userId
	if (request.userId?._id) return request.userId._id.toString()
	if (typeof request.userId?.toString === 'function') return request.userId.toString()
	return null
}

export function employeeHasApprovedLeaveOnDate({ leaveRequests = [], employeeId, dateKey }) {
	if (!employeeId || !dateKey) return false
	const employeeIdStr = String(employeeId)
	return leaveRequests.some((request) => {
		if (!APPROVED_LEAVE_STATUSES.has(request?.status)) return false
		if (extractLeaveRequestUserId(request) !== employeeIdStr) return false
		const start = toIsoDateKey(request.startDate)
		const end = toIsoDateKey(request.endDate)
		if (!start || !end) return false
		return dateKey >= start && dateKey <= end
	})
}
