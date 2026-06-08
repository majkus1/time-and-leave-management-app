import { describe, expect, it } from 'vitest'
import {
	aggregateActivityHours,
	flattenWorkdayActivityRows,
} from './workActivityAggregation'

describe('workActivityAggregation', () => {
	it('uses stored activity snapshot and calculates quantity efficiency', () => {
		const workdays = [{
			userId: { _id: 'user-1', firstName: 'Jan', lastName: 'Kowalski' },
			date: '2026-06-01T00:00:00.000Z',
			manualActivityBlocks: [{
				activityId: 'activity-1',
				activityName: 'Układanie kostki',
				activityNameEn: 'Paving',
				hours: 5,
				quantity: 40,
				unit: 'm²',
			}],
		}]

		const rows = flattenWorkdayActivityRows(workdays, [], null, 'pl')
		const summary = aggregateActivityHours(rows)

		expect(rows[0]).toEqual(expect.objectContaining({
			activityName: 'Układanie kostki',
			quantity: 40,
			unit: 'm²',
		}))
		expect(summary[0]).toEqual(expect.objectContaining({
			hours: 5,
			quantity: 40,
			unit: 'm²',
			efficiency: 8,
		}))
	})

	it('includes timer session quantity in activity productivity summary', () => {
		const workdays = [{
			userId: 'user-1',
			date: '2026-06-02T00:00:00.000Z',
			timeEntries: [{
				activityId: 'activity-1',
				activityName: 'Montaż',
				startTime: '2026-06-02T08:00:00.000Z',
				endTime: '2026-06-02T10:00:00.000Z',
				quantity: 12,
				unit: 'szt.',
				isBreak: false,
			}],
		}]

		const rows = flattenWorkdayActivityRows(workdays, [], null, 'pl')
		const summary = aggregateActivityHours(rows)

		expect(rows[0]).toEqual(expect.objectContaining({
			activityName: 'Montaż',
			hours: 2,
			quantity: 12,
			unit: 'szt.',
		}))
		expect(summary[0]).toEqual(expect.objectContaining({
			hours: 2,
			quantity: 12,
			unit: 'szt.',
			efficiency: 6,
		}))
	})

	it('keeps quantity from very short timer sessions even when rounded duration is zero', () => {
		const workdays = [{
			userId: 'user-1',
			date: '2026-06-06T00:00:00.000Z',
			manualActivityBlocks: [{
				activityId: 'activity-1',
				activityName: 'paczki',
				hours: 9,
				quantity: 45,
				unit: 'szt',
			}],
			timeEntries: [{
				activityId: 'activity-1',
				activityName: 'paczki',
				startTime: '2026-06-06T10:06:00.000Z',
				endTime: '2026-06-06T10:06:10.000Z',
				quantity: 25,
				unit: 'szt',
				isBreak: false,
			}],
		}]

		const summary = aggregateActivityHours(flattenWorkdayActivityRows(workdays, [], null, 'pl'))

		expect(summary[0]).toEqual(expect.objectContaining({
			activityName: 'paczki',
			hours: 9,
			quantity: 70,
			unit: 'szt',
			efficiency: 7.78,
		}))
	})
})
