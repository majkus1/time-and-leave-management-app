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

export function bothCalendarFilterTypesActive(selectedActivityIds = [], selectedTaskIds = []) {
	return selectedActivityIds.length > 0 && selectedTaskIds.length > 0
}

/** Day visible when it matches activity filter and/or task filter (OR across types, AND within one type). */
export function workdayMatchesCalendarFilters(workday, selectedActivityIds = [], selectedTaskIds = []) {
	const activityActive = selectedActivityIds.length > 0
	const taskActive = selectedTaskIds.length > 0
	if (!activityActive && !taskActive) return true

	const activityMatch = activityActive && workdayMatchesActivityFilter(workday, selectedActivityIds)
	const taskMatch = taskActive && workdayMatchesTaskFilter(workday, selectedTaskIds)

	if (activityActive && taskActive) return activityMatch || taskMatch
	if (activityActive) return activityMatch
	return taskMatch
}

export function getFilteredCalendarHours(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) {
		return workday?.hoursWorked || 0
	}
	if (!workdayMatchesCalendarFilters(workday, selectedActivityIds, selectedTaskIds)) return 0

	const activityMatch = !selectedActivityIds.length || workdayMatchesActivityFilter(workday, selectedActivityIds)
	const taskMatch = !selectedTaskIds.length || workdayMatchesTaskFilter(workday, selectedTaskIds)

	let total = 0
	if (selectedActivityIds.length && activityMatch) {
		total += getFilteredManualActivityHours(workday, selectedActivityIds)
		total += getFilteredTimerActivityHours(workday, selectedActivityIds)
	}
	if (selectedTaskIds.length && taskMatch) {
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
	if (!workdayMatchesCalendarFilters(workday, selectedActivityIds, selectedTaskIds)) return 0

	let total = 0
	const activityMatch = !selectedActivityIds.length || workdayMatchesActivityFilter(workday, selectedActivityIds)
	const taskMatch = !selectedTaskIds.length || workdayMatchesTaskFilter(workday, selectedTaskIds)
	if (selectedActivityIds.length && activityMatch) total += getFilteredManualActivityHours(workday, selectedActivityIds)
	if (selectedTaskIds.length && taskMatch) total += getFilteredManualTaskHours(workday, selectedTaskIds)
	return roundHours(total)
}

function splitTimeRanges(value = '') {
	return String(value || '')
		.split(',')
		.map(part => part.trim())
		.filter(Boolean)
}

export function buildFilteredRealTimeForCalendar(workday, selectedActivityIds = [], selectedTaskIds = []) {
	if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) return ''

	const ranges = []
	if (selectedActivityIds.length && workdayMatchesActivityFilter(workday, selectedActivityIds)) {
		ranges.push(...splitTimeRanges(buildFilteredRealTimeFromEntries(workday, selectedActivityIds)))
	}
	if (selectedTaskIds.length && workdayMatchesTaskFilter(workday, selectedTaskIds)) {
		ranges.push(...splitTimeRanges(buildFilteredRealTimeFromTaskEntries(workday, selectedTaskIds)))
	}
	return [...new Set(ranges)].join(', ')
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
		if (workdayMatchesActivityFilter(workday, selectedActivityIds)) {
			const label = formatActivityBreakdown(workday, workActivities, locale, selectedActivityIds)
			if (label) parts.push(label)
		}
	} else if (!selectedTaskIds.length) {
		const label = formatActivityBreakdown(workday, workActivities, locale, [])
		if (label) parts.push(label)
	}
	if (selectedTaskIds.length && workdayMatchesTaskFilter(workday, selectedTaskIds)) {
		const label = formatTaskBreakdown(workday, taskTitlesById, selectedTaskIds)
		if (label) parts.push(label)
	}
	return parts.join(' · ')
}
