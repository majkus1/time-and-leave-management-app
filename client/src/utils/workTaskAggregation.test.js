import { describe, expect, it } from 'vitest'
import {
	aggregateTaskHours,
	flattenWorkdayTaskRows,
	formatTaskBreakdown,
	getFilteredTimerTaskHours,
} from './workTaskAggregation'

describe('workTaskAggregation', () => {
	it('keeps sub-hour timer task hours in summaries (no half-hour rounding)', () => {
		const workday = {
			_id: 'wd-1',
			date: '2026-06-08T00:00:00.000Z',
			timeEntries: [{
				taskId: 'task-1',
				task: { title: 'test' },
				startTime: '2026-06-08T19:40:00.000Z',
				endTime: '2026-06-08T19:47:00.000Z',
				isBreak: false,
			}],
		}

		expect(getFilteredTimerTaskHours(workday, ['task-1'])).toBe(0.12)

		const rows = flattenWorkdayTaskRows([workday], {}, null, ['task-1'])
		const summary = aggregateTaskHours(rows)

		expect(summary[0]).toEqual(expect.objectContaining({
			taskName: 'test',
			hours: 0.12,
		}))
	})

	it('formats task breakdown on calendar tile with clock under 1h', () => {
		const workday = {
			timeEntries: [{
				taskId: 'task-1',
				startTime: '2026-06-08T19:40:00.000Z',
				endTime: '2026-06-08T19:47:00.000Z',
				isBreak: false,
			}],
		}
		expect(formatTaskBreakdown(workday, { 'task-1': 'test' }, ['task-1'])).toBe('test 0:07')
	})
})
