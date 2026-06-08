import {
	workdayMatchesActivityFilter,
	getFilteredActivityHours,
	getFilteredManualActivityHours,
	getFilteredTimerActivityHours,
	buildFilteredRealTimeFromEntries,
	formatActivityBreakdown,
} from './workActivityAggregation'
import {
	workdayMatchesTaskFilter,
	getFilteredTaskHours,
	getFilteredManualTaskHours,
	getFilteredTimerTaskHours,
	buildFilteredRealTimeFromTaskEntries,
	formatTaskBreakdown,
} from './workTaskAggregation'
import { roundHours } from './formatWorkDuration'

export function isCalendarFilterActive(selectedActivityIds = [], selectedTaskIds = []) {
	return selectedActivityIds.length > 0 || selectedTaskIds.length > 0
}

export function workdayMatchesCalendarFilters(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (selectedActivityIds.length && !workdayMatchesActivityFilter(workday, selectedActivityIds)) return false
	if (selectedTaskIds.length && !workdayMatchesTaskFilter(workday, selectedTaskIds)) return false
	return true
}

export function getFilteredCalendarHours(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) {
		return workday?.hoursWorked || 0
	}
	if (!workdayMatchesCalendarFilters(workday, selectedActivityIds, selectedTaskIds)) return 0

	let total = 0
	if (selectedActivityIds.length) {
		total += getFilteredManualActivityHours(workday, selectedActivityIds)
		total += getFilteredTimerActivityHours(workday, selectedActivityIds)
	}
	if (selectedTaskIds.length) {
		total += getFilteredManualTaskHours(workday, selectedTaskIds)
		total += getFilteredTimerTaskHours(workday, selectedTaskIds)
	}
	return roundHours(total)
}

/** Manual ewidencja hours for blue calendar events (excludes timer-only days). */
export function getFilteredManualCalendarHours(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) {
		return workday?.hoursWorked || 0
	}
	let total = 0
	if (selectedActivityIds.length) total += getFilteredManualActivityHours(workday, selectedActivityIds)
	if (selectedTaskIds.length) total += getFilteredManualTaskHours(workday, selectedTaskIds)
	return roundHours(total)
}

export function buildFilteredRealTimeForCalendar(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) return ''

	const activityPart = selectedActivityIds.length
		? buildFilteredRealTimeFromEntries(workday, selectedActivityIds)
		: ''
	const taskPart = selectedTaskIds.length
		? buildFilteredRealTimeFromTaskEntries(workday, selectedTaskIds)
		: ''

	if (selectedActivityIds.length && selectedTaskIds.length) {
		const entries = Array.isArray(workday?.timeEntries) ? workday.timeEntries : []
		const ranges = entries
			.filter(entry => !entry?.isBreak && entry?.startTime && entry?.endTime)
			.filter(entry => {
				const activityOk = !entry?.activityId || selectedActivityIds.includes(entry.activityId)
				const taskId = entry?.taskId ? String(entry.taskId._id || entry.taskId) : ''
				const taskOk = !taskId || selectedTaskIds.includes(taskId)
				const hasActivity = entry?.activityId && selectedActivityIds.includes(entry.activityId)
				const hasTask = taskId && selectedTaskIds.includes(taskId)
				return hasActivity && hasTask && activityOk && taskOk
			})
			.map(entry => {
				const start = new Date(entry.startTime)
				const end = new Date(entry.endTime)
				if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
				const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
				return `${fmt(start)}-${fmt(end)}`
			})
			.filter(Boolean)
		return [...new Set(ranges)].join(', ')
	}

	return [activityPart, taskPart].filter(Boolean).join(', ')
}

export function formatCalendarBreakdown(workday, {
	workActivities = [],
	taskTitlesById = {},
	locale = 'pl',
	selectedActivityIds = [],
	selectedTaskIds = [],
} = {}) {
	const parts = []
	if (selectedActivityIds.length) {
		const label = formatActivityBreakdown(workday, workActivities, locale, selectedActivityIds)
		if (label) parts.push(label)
	} else if (!selectedTaskIds.length) {
		const label = formatActivityBreakdown(workday, workActivities, locale, [])
		if (label) parts.push(label)
	}
	if (selectedTaskIds.length) {
		const label = formatTaskBreakdown(workday, taskTitlesById, selectedTaskIds)
		if (label) parts.push(label)
	}
	return parts.join(' · ')
}
