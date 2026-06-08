import { findWorkActivityById, getWorkActivityName } from './workActivities'

function formatEntryTimeLocal(dateValue) {
	if (!dateValue) return ''
	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Time ranges from timer sessions, optionally only matching activity filter. */
export function buildFilteredRealTimeFromEntries(workday, selectedActivityIds = []) {
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	const ranges = entries
		.filter(entry => !entry?.isBreak && entry?.startTime && entry?.endTime)
		.filter(entry => {
			if (!selectedActivityIds?.length) return true
			return entry?.activityId && selectedActivityIds.includes(entry.activityId)
		})
		.map(entry => `${formatEntryTimeLocal(entry.startTime)}-${formatEntryTimeLocal(entry.endTime)}`)
		.filter(Boolean)
	return [...new Set(ranges)].join(', ')
}

export function filterGroupedSessionsByActivities(groupedSessions = [], selectedActivityIds = []) {
	if (!selectedActivityIds?.length) return groupedSessions

	const activityIdsByWorkday = new Map()
	for (const group of groupedSessions) {
		for (const session of group.sessions || []) {
			if (!session?.workdayId || !session?.activityId) continue
			const key = String(session.workdayId)
			if (!activityIdsByWorkday.has(key)) activityIdsByWorkday.set(key, new Set())
			activityIdsByWorkday.get(key).add(session.activityId)
		}
	}

	const sessionMatches = (session) => {
		if (!session?.activityId || !selectedActivityIds.includes(session.activityId)) return false
		if (selectedActivityIds.length === 1) return true
		const dayIds = activityIdsByWorkday.get(String(session.workdayId))
		return selectedActivityIds.every(id => dayIds?.has(id))
	}

	return groupedSessions
		.map(group => {
			const filteredSessions = (group.sessions || []).filter(sessionMatches)
			if (!filteredSessions.length) return null

			let groupMinutes = 0
			let quantity = 0
			let unit = group.unit || ''
			filteredSessions.forEach(session => {
				if (session.startTime && session.endTime) {
					groupMinutes += Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60))
				}
				if (Number(session.quantity) > 0) {
					quantity += Number(session.quantity)
					if (!unit && session.unit) unit = session.unit
				}
			})

			return {
				...group,
				sessions: filteredSessions,
				totalMinutes: groupMinutes,
				totalHours: (groupMinutes / 60).toFixed(2),
				quantity: Math.round(quantity * 100) / 100,
				unit,
				efficiency: quantity > 0 && groupMinutes > 0
					? Math.round((quantity / (groupMinutes / 60)) * 100) / 100
					: null,
			}
		})
		.filter(Boolean)
}

function isTimerWorkEntry(entry) {
	if (!entry || entry.isBreak || !entry.startTime || !entry.endTime) return false
	return new Date(entry.endTime) > new Date(entry.startTime)
}

function roundHours(value) {
	if (!Number.isFinite(value)) return 0
	return Math.round(value * 100) / 100
}

function getTimerEntryHours(entry) {
	if (!isTimerWorkEntry(entry) || !entry.activityId) return 0
	const minutes = Math.round((new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60))
	if (minutes <= 0) return 0
	return minutes / 60
}

function getSessionHours(entry) {
	return getTimerEntryHours(entry)
}

function collectManualActivityHoursMap(workday, selectedActivityIds = []) {
	const map = new Map()
	const blocks = Array.isArray(workday?.manualActivityBlocks) ? workday.manualActivityBlocks : []
	for (const block of blocks) {
		if (!block?.activityId || !(block.hours > 0)) continue
		if (selectedActivityIds.length && !selectedActivityIds.includes(block.activityId)) continue
		map.set(block.activityId, Math.round(((map.get(block.activityId) || 0) + block.hours) * 2) / 2)
	}
	return map
}

function getActivitySnapshotName(block, activity, locale, fallback) {
	if (locale === 'en' && block?.activityNameEn) return block.activityNameEn
	return block?.activityName || getWorkActivityName(activity, locale) || fallback
}

function collectTimerActivityHoursMap(workday, selectedActivityIds = []) {
	const map = new Map()
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	for (const entry of entries) {
		const hours = getTimerEntryHours(entry)
		if (!hours) continue
		if (selectedActivityIds.length && !selectedActivityIds.includes(entry.activityId)) continue
		map.set(entry.activityId, roundHours((map.get(entry.activityId) || 0) + hours))
	}
	return map
}

function getActiveActivityIdsOnWorkday(workday) {
	const ids = new Set()
	const blocks = Array.isArray(workday?.manualActivityBlocks) ? workday.manualActivityBlocks : []
	for (const block of blocks) {
		if (block?.activityId && block.hours > 0) ids.add(block.activityId)
	}
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	for (const entry of entries) {
		if (isTimerWorkEntry(entry) && entry.activityId) ids.add(entry.activityId)
	}
	return ids
}

function collectWorkdayActivityHoursMap(workday, selectedActivityIds = []) {
	const map = new Map()
	for (const [activityId, hours] of collectManualActivityHoursMap(workday, selectedActivityIds)) {
		map.set(activityId, hours)
	}
	for (const [activityId, hours] of collectTimerActivityHoursMap(workday, selectedActivityIds)) {
		map.set(activityId, roundHours((map.get(activityId) || 0) + hours))
	}
	return map
}

export function workdayMatchesActivityFilter(workday, selectedActivityIds) {
	if (!selectedActivityIds?.length) return true
	const activeIds = getActiveActivityIdsOnWorkday(workday)
	return selectedActivityIds.every(id => activeIds.has(id))
}

export function getWorkdayActivityHours(workday, activityId) {
	const map = collectWorkdayActivityHoursMap(workday, [])
	return map.get(activityId) || 0
}

/** Manual ewidencja hours for selected activities; without filter returns hoursWorked. */
export function getFilteredManualActivityHours(workday, selectedActivityIds) {
	if (!selectedActivityIds?.length) {
		return workday?.hoursWorked || 0
	}
	const map = collectManualActivityHoursMap(workday, selectedActivityIds)
	const total = [...map.values()].reduce((sum, hours) => sum + hours, 0)
	return Math.round(total * 2) / 2
}

/** Timer session hours for selected activities (minute precision). */
export function getFilteredTimerActivityHours(workday, selectedActivityIds) {
	if (!selectedActivityIds?.length) return 0
	const map = collectTimerActivityHoursMap(workday, selectedActivityIds)
	const total = [...map.values()].reduce((sum, hours) => sum + hours, 0)
	return roundHours(total)
}

/** Sum hours from blocks and timer sessions matching filter; without filter returns hoursWorked. */
export function getFilteredActivityHours(workday, selectedActivityIds) {
	if (!selectedActivityIds?.length) {
		return workday?.hoursWorked || 0
	}
	return roundHours(
		getFilteredManualActivityHours(workday, selectedActivityIds) +
		getFilteredTimerActivityHours(workday, selectedActivityIds)
	)
}

export function filterWorkdaysByActivities(workdays, selectedActivityIds) {
	if (!selectedActivityIds?.length) return workdays
	return workdays.filter(day => workdayMatchesActivityFilter(day, selectedActivityIds))
}

export function formatActivityBreakdown(workday, activities, locale = 'pl', selectedActivityIds = []) {
	const map = collectWorkdayActivityHoursMap(workday, selectedActivityIds)
	if (!map.size) return ''
	return [...map.entries()]
		.filter(([, hours]) => hours >= 1 / 60)
		.map(([activityId, hours]) => {
			const activity = findWorkActivityById(activities, activityId)
			const name = getWorkActivityName(activity, locale) || activityId
			return `${name} ${roundHours(hours)}h`
		})
		.join(', ')
}

export function getActivityFilterLabel(selectedIds, activities, locale, t) {
	if (!selectedIds?.length) return t('workcalendar.activities.filterAll')
	const names = selectedIds
		.map(id => getWorkActivityName(findWorkActivityById(activities, id), locale) || id)
		.filter(Boolean)
	if (names.length === 1) return names[0]
	return names.join(` ${t('workcalendar.activities.filterAnd')} `)
}

/**
 * Flatten workdays into activity rows for reports/Excel.
 */
export function flattenWorkdayActivityRows(
	workdays,
	activities,
	usersById,
	locale = 'pl',
	selectedActivityIds = [],
	{ deletedActivityLabel } = {}
) {
	const rows = []
	for (const workday of workdays) {
		if (!workdayMatchesActivityFilter(workday, selectedActivityIds)) continue

		const userId = typeof workday.userId === 'object' ? workday.userId?._id : workday.userId
		const user = usersById?.get?.(String(userId)) || (typeof workday.userId === 'object' ? workday.userId : null)
		const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
		const date = workday.date ? new Date(workday.date) : null
		const dateYmd = date ? date.toISOString().slice(0, 10) : ''

		const resolveName = (activity, activityId) =>
			getWorkActivityName(activity, locale) || deletedActivityLabel || activityId

		const blocks = Array.isArray(workday.manualActivityBlocks) ? workday.manualActivityBlocks : []
		for (const block of blocks) {
			if (!block?.activityId || !(block.hours > 0)) continue
			if (selectedActivityIds?.length && !selectedActivityIds.includes(block.activityId)) continue
			const activity = findWorkActivityById(activities, block.activityId)
			rows.push({
				date,
				dateYmd,
				userId: String(userId || ''),
				userName,
				activityId: block.activityId,
				activityName: getActivitySnapshotName(block, activity, locale, resolveName(activity, block.activityId)),
				hours: block.hours,
				timeFrom: block.timeFrom || '',
				timeTo: block.timeTo || '',
				quantity: Number.isFinite(Number(block.quantity)) ? Number(block.quantity) : null,
				unit: block.unit || activity?.unit || '',
			})
		}

		const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
		for (const entry of entries) {
			if (!entry?.activityId || entry.isBreak) continue
			if (selectedActivityIds?.length && !selectedActivityIds.includes(entry.activityId)) continue
			const hours = getSessionHours(entry)
			const quantity = Number.isFinite(Number(entry.quantity)) ? Number(entry.quantity) : null
			if (!hours && !(quantity > 0)) continue
			const activity = findWorkActivityById(activities, entry.activityId)
			const formatTime = (value) => {
				if (!value) return ''
				const d = new Date(value)
				if (Number.isNaN(d.getTime())) return ''
				return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
			}
			rows.push({
				date,
				dateYmd,
				userId: String(userId || ''),
				userName,
				activityId: entry.activityId,
				activityName: getActivitySnapshotName(entry, activity, locale, resolveName(activity, entry.activityId)),
				hours,
				timeFrom: formatTime(entry.startTime),
				timeTo: formatTime(entry.endTime),
				quantity,
				unit: entry.unit || activity?.unit || '',
			})
		}
	}
	return rows.sort((a, b) => {
		const dateCmp = (a.dateYmd || '').localeCompare(b.dateYmd || '')
		if (dateCmp !== 0) return dateCmp
		return (a.userName || '').localeCompare(b.userName || '')
	})
}

export function aggregateActivityHours(rows, { groupByUser = false } = {}) {
	const map = new Map()
	for (const row of rows) {
		const key = groupByUser ? `${row.activityId}::${row.userId}` : row.activityId
		if (!map.has(key)) {
			map.set(key, {
				activityId: row.activityId,
				activityName: row.activityName,
				userId: groupByUser ? row.userId : null,
				userName: groupByUser ? row.userName : null,
				hours: 0,
				quantity: 0,
				unit: row.unit || '',
			})
		}
		const entry = map.get(key)
		entry.hours = Math.round((entry.hours + row.hours) * 2) / 2
		if (Number.isFinite(Number(row.quantity))) {
			entry.quantity = Math.round((entry.quantity + Number(row.quantity)) * 100) / 100
			if (!entry.unit && row.unit) entry.unit = row.unit
		}
	}
	return [...map.values()].map(row => ({
		...row,
		efficiency: row.quantity > 0 && row.hours > 0
			? Math.round((row.quantity / row.hours) * 100) / 100
			: null,
	})).sort((a, b) => {
		if (b.hours !== a.hours) return b.hours - a.hours
		return (a.activityName || '').localeCompare(b.activityName || '')
	})
}
