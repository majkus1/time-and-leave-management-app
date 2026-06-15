import { describe, expect, it } from 'vitest'
import {
	buildFilteredRealTimeForCalendar,
	getFilteredCalendarHours,
	workdayMatchesCalendarFilters,
} from './workCalendarFilters'

describe('workCalendarFilters combined activity + task filters', () => {
	const activityDay = {
		date: '2026-06-16',
		hoursWorked: 4.5,
		realTimeDayWorked: '03:00-07:30',
		manualActivityBlocks: [{
			activityId: 'activity-ttt',
			hours: 4.5,
		}],
	}

	const taskDay = {
		date: '2026-06-15',
		hoursWorked: 1,
		realTimeDayWorked: '21:36-22:36',
		manualTaskBlocks: [{
			taskId: 'task-espresso',
			hours: 1,
		}],
	}

	it('shows days matching either filter (OR), not only both on the same day', () => {
		const selectedActivityIds = ['activity-ttt']
		const selectedTaskIds = ['task-espresso']

		expect(workdayMatchesCalendarFilters(activityDay, selectedActivityIds, selectedTaskIds)).toBe(true)
		expect(workdayMatchesCalendarFilters(taskDay, selectedActivityIds, selectedTaskIds)).toBe(true)
		expect(workdayMatchesCalendarFilters({ date: '2026-06-01', hoursWorked: 8 }, selectedActivityIds, selectedTaskIds)).toBe(false)
	})

	it('sums hours only from the matching filter type on each day', () => {
		expect(getFilteredCalendarHours(activityDay, ['activity-ttt'], ['task-espresso'])).toBe(4.5)
		expect(getFilteredCalendarHours(taskDay, ['activity-ttt'], ['task-espresso'])).toBe(1)
	})

	it('keeps time ranges for the matching filter type on each day', () => {
		expect(buildFilteredRealTimeForCalendar(activityDay, ['activity-ttt'], ['task-espresso'])).toBe('03:00-07:30')
		expect(buildFilteredRealTimeForCalendar(taskDay, ['activity-ttt'], ['task-espresso'])).toBe('21:36-22:36')
	})
})
