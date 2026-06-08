import { roundHours } from './formatWorkDuration'

function formatEntryTimeLocal(dateValue) {
	if (!dateValue) return ''
	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function taskIdStr(value) {
	if (!value) return ''
	return String(value._id || value)
}

function isTimerWorkEntry(entry) {
	if (!entry || entry.isBreak || !entry.startTime || !entry.endTime) return false
	return new Date(entry.endTime) > new Date(entry.startTime)
}

function getTimerEntryTaskHours(entry) {
	if (!isTimerWorkEntry(entry) || !entry.taskId) return 0
	const hours = (new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60 * 60)
	if (hours <= 0) return 0
	return roundHours(hours)
}

function collectManualTaskHoursMap(workday, selectedTaskIds = []) {
	const map = new Map()
	const blocks = Array.isArray(workday?.manualTaskBlocks) ? workday.manualTaskBlocks : []
	for (const block of blocks) {
		if (!block?.taskId || !(block.hours > 0)) continue
		const id = taskIdStr(block.taskId)
		if (selectedTaskIds.length && !selectedTaskIds.includes(id)) continue
		map.set(id, Math.round(((map.get(id) || 0) + block.hours) * 2) / 2)
	}
	return map
}

function collectTimerTaskHoursMap(workday, selectedTaskIds = []) {
	const map = new Map()
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	for (const entry of entries) {
		const hours = getTimerEntryTaskHours(entry)
		if (!hours) continue
		const id = taskIdStr(entry.taskId)
		if (!id) continue
		if (selectedTaskIds.length && !selectedTaskIds.includes(id)) continue
		map.set(id, roundHours((map.get(id) || 0) + hours))
	}
	return map
}

function getActiveTaskIdsOnWorkday(workday) {
	const ids = new Set()
	const blocks = Array.isArray(workday?.manualTaskBlocks) ? workday.manualTaskBlocks : []
	for (const block of blocks) {
		const id = taskIdStr(block?.taskId)
		if (id && block.hours > 0) ids.add(id)
	}
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	for (const entry of entries) {
		if (isTimerWorkEntry(entry) && entry.taskId) ids.add(taskIdStr(entry.taskId))
	}
	return ids
}

export function workdayMatchesTaskFilter(workday, selectedTaskIds) {
	if (!selectedTaskIds?.length) return true
	const activeIds = getActiveTaskIdsOnWorkday(workday)
	return selectedTaskIds.every(id => activeIds.has(String(id)))
}

export function getFilteredManualTaskHours(workday, selectedTaskIds) {
	if (!selectedTaskIds?.length) return 0
	const map = collectManualTaskHoursMap(workday, selectedTaskIds)
	const total = [...map.values()].reduce((sum, hours) => sum + hours, 0)
	return Math.round(total * 2) / 2
}

export function getFilteredTimerTaskHours(workday, selectedTaskIds) {
	if (!selectedTaskIds?.length) return 0
	const map = collectTimerTaskHoursMap(workday, selectedTaskIds)
	const total = [...map.values()].reduce((sum, hours) => sum + hours, 0)
	return roundHours(total)
}

export function getFilteredTaskHours(workday, selectedTaskIds) {
	if (!selectedTaskIds?.length) return 0
	return roundHours(
		getFilteredManualTaskHours(workday, selectedTaskIds) +
		getFilteredTimerTaskHours(workday, selectedTaskIds)
	)
}

export function buildFilteredRealTimeFromTaskEntries(workday, selectedTaskIds = []) {
	const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
	const ranges = entries
		.filter(entry => !entry?.isBreak && entry?.startTime && entry?.endTime)
		.filter(entry => {
			if (!selectedTaskIds?.length) return true
			const id = taskIdStr(entry.taskId)
			return id && selectedTaskIds.includes(id)
		})
		.map(entry => `${formatEntryTimeLocal(entry.startTime)}-${formatEntryTimeLocal(entry.endTime)}`)
		.filter(Boolean)
	return [...new Set(ranges)].join(', ')
}

export function formatTaskBreakdown(workday, taskTitlesById = {}, selectedTaskIds = []) {
	const map = new Map()
	for (const [taskId, hours] of collectManualTaskHoursMap(workday, selectedTaskIds)) {
		map.set(taskId, hours)
	}
	for (const [taskId, hours] of collectTimerTaskHoursMap(workday, selectedTaskIds)) {
		map.set(taskId, roundHours((map.get(taskId) || 0) + hours))
	}
	if (!map.size) return ''
	return [...map.entries()]
		.filter(([, hours]) => hours >= 1 / 60)
		.map(([taskId, hours]) => {
			const name = taskTitlesById[taskId] || taskId
			return `${name} ${roundHours(hours)}h`
		})
		.join(', ')
}

function resolveTaskTitle(id, storedTitle, titleLookup = {}, existingTitle = '') {
	const stored = storedTitle && String(storedTitle) !== String(id) ? storedTitle : ''
	const existing = existingTitle && String(existingTitle) !== String(id) ? existingTitle : ''
	return stored || titleLookup[id] || existing || id
}

export function collectTasksFromWorkdays(workdays = [], month = null, year = null, titleLookup = {}) {
	const map = new Map()
	for (const workday of workdays) {
		if (month != null && year != null) {
			const d = new Date(workday.date)
			if (d.getMonth() !== month || d.getFullYear() !== year) continue
		}
		for (const block of workday.manualTaskBlocks || []) {
			const id = taskIdStr(block?.taskId)
			if (!id) continue
			map.set(id, resolveTaskTitle(id, block.taskTitle, titleLookup, map.get(id)))
		}
		for (const entry of workday.timeEntries || []) {
			const id = taskIdStr(entry?.taskId)
			if (!id) continue
			const title = resolveTaskTitle(
				id,
				entry.task?.title || entry.workDescription,
				titleLookup,
				map.get(id)
			)
			map.set(id, title)
		}
	}
	return [...map.entries()]
		.map(([id, title]) => ({ id, title: resolveTaskTitle(id, title, titleLookup) }))
		.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
}

export function filterGroupedSessionsByTasks(groupedSessions = [], selectedTaskIds = []) {
	if (!selectedTaskIds?.length) return groupedSessions

	const taskIdsByWorkday = new Map()
	for (const group of groupedSessions) {
		for (const session of group.sessions || []) {
			if (!session?.workdayId || !session?.taskId) continue
			const key = String(session.workdayId)
			if (!taskIdsByWorkday.has(key)) taskIdsByWorkday.set(key, new Set())
			taskIdsByWorkday.get(key).add(taskIdStr(session.taskId))
		}
	}

	const sessionMatches = (session) => {
		const id = taskIdStr(session?.taskId)
		if (!id || !selectedTaskIds.includes(id)) return false
		if (selectedTaskIds.length === 1) return true
		const dayIds = taskIdsByWorkday.get(String(session.workdayId))
		return selectedTaskIds.every(taskId => dayIds?.has(String(taskId)))
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

export function resolveTaskDisplayName(
	{ taskId, taskTitle, task, workDescription },
	titleLookup = {},
	deletedTaskLabel = ''
) {
	const id = taskIdStr(taskId)
	if (!id) return deletedTaskLabel || ''
	const stored = taskTitle && String(taskTitle) !== id ? taskTitle : ''
	const fromTask = task?.title && String(task.title) !== id ? task.title : ''
	const fromDesc = workDescription && String(workDescription) !== id ? workDescription.trim() : ''
	const fromLookup = titleLookup[id] || ''
	return stored || fromTask || fromDesc || fromLookup || deletedTaskLabel || id
}

export function flattenWorkdayTaskRows(
	workdays,
	titleLookup = {},
	usersById,
	selectedTaskIds = [],
	{ deletedTaskLabel } = {}
) {
	const rows = []
	for (const workday of workdays) {
		if (!workdayMatchesTaskFilter(workday, selectedTaskIds)) continue

		const userId = typeof workday.userId === 'object' ? workday.userId?._id : workday.userId
		const user = usersById?.get?.(String(userId)) || (typeof workday.userId === 'object' ? workday.userId : null)
		const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
		const date = workday.date ? new Date(workday.date) : null
		const dateYmd = date ? date.toISOString().slice(0, 10) : ''

		const blocks = Array.isArray(workday.manualTaskBlocks) ? workday.manualTaskBlocks : []
		for (const block of blocks) {
			if (!block?.taskId || !(block.hours > 0)) continue
			const id = taskIdStr(block.taskId)
			if (selectedTaskIds?.length && !selectedTaskIds.includes(id)) continue
			rows.push({
				date,
				dateYmd,
				userId: String(userId || ''),
				userName,
				taskId: id,
				taskName: resolveTaskDisplayName(
					{ taskId: id, taskTitle: block.taskTitle },
					titleLookup,
					deletedTaskLabel
				),
				hours: block.hours,
				timeFrom: block.timeFrom || '',
				timeTo: block.timeTo || '',
			})
		}

		const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
		for (const entry of entries) {
			const hours = getTimerEntryTaskHours(entry)
			if (!hours) continue
			const id = taskIdStr(entry.taskId)
			if (!id) continue
			if (selectedTaskIds?.length && !selectedTaskIds.includes(id)) continue
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
				taskId: id,
				taskName: resolveTaskDisplayName(
					{
						taskId: id,
						task: entry.task,
						workDescription: entry.workDescription,
					},
					titleLookup,
					deletedTaskLabel
				),
				hours,
				timeFrom: formatTime(entry.startTime),
				timeTo: formatTime(entry.endTime),
			})
		}
	}
	return rows.sort((a, b) => {
		const dateCmp = (a.dateYmd || '').localeCompare(b.dateYmd || '')
		if (dateCmp !== 0) return dateCmp
		return (a.userName || '').localeCompare(b.userName || '')
	})
}

export function aggregateTaskHours(rows, { groupByUser = false } = {}) {
	const map = new Map()
	for (const row of rows) {
		const key = groupByUser ? `${row.taskId}::${row.userId}` : row.taskId
		if (!map.has(key)) {
			map.set(key, {
				taskId: row.taskId,
				taskName: row.taskName,
				userId: groupByUser ? row.userId : null,
				userName: groupByUser ? row.userName : null,
				hours: 0,
			})
		}
		const entry = map.get(key)
		entry.hours = roundHours(entry.hours + row.hours)
		if (!entry.taskName && row.taskName) entry.taskName = row.taskName
	}
	return [...map.values()].sort((a, b) => {
		if (b.hours !== a.hours) return b.hours - a.hours
		return (a.taskName || '').localeCompare(b.taskName || '')
	})
}

export function getTaskFilterLabel(selectedIds, tasks, t) {
	if (!selectedIds?.length) return t('workcalendar.tasks.filterAll')
	const titles = selectedIds
		.map(id => tasks.find(task => String(task.id) === String(id))?.title || id)
		.filter(Boolean)
	if (titles.length === 1) return titles[0]
	return titles.join(` ${t('workcalendar.tasks.filterAnd')} `)
}

export function buildTaskTitlesMap(tasks) {
	const map = {}
	for (const task of tasks || []) {
		const id = taskIdStr(task._id || task.id)
		const title = task.title || task.taskTitle
		if (id && title) map[id] = title
	}
	return map
}
