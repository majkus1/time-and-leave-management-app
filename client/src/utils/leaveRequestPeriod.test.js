import { describe, expect, it } from 'vitest'
import {
	createDefaultLeaveRequestStatusFilters,
	filterLeaveRequestsByPeriod,
	filterLeaveRequestsByStatuses,
	getLeaveRequestDurationStats,
	getLeaveRequestLimitUsageStats,
	getLeaveRequestStatusStats,
	getLeaveRequestTypeStats,
	getLeaveRequestYears,
} from './leaveRequestPeriod'

const request = (startDate, endDate) => ({ startDate, endDate })

describe('leave request period filters', () => {
	it('includes requests that overlap the selected month', () => {
		const requests = [
			request('2025-12-29T00:00:00.000Z', '2026-01-03T00:00:00.000Z'),
			request('2026-02-01T00:00:00.000Z', '2026-02-02T00:00:00.000Z'),
		]

		expect(filterLeaveRequestsByPeriod(requests, 2026, 0)).toEqual([requests[0]])
	})

	it('includes requests that overlap the selected year', () => {
		const requests = [
			request('2025-12-29T00:00:00.000Z', '2026-01-03T00:00:00.000Z'),
			request('2024-06-01T00:00:00.000Z', '2024-06-02T00:00:00.000Z'),
		]

		expect(filterLeaveRequestsByPeriod(requests, 2026)).toEqual([requests[0]])
	})

	it('returns all requests for the full history option', () => {
		const requests = [request('2024-06-01', '2024-06-02')]
		expect(filterLeaveRequestsByPeriod(requests, 'all', 'all')).toBe(requests)
	})

	it('lists every year touched by a request and the current year', () => {
		const requests = [request('2024-12-30', '2026-01-02')]
		expect(getLeaveRequestYears(requests, 2027)).toEqual([2027, 2026, 2025, 2024])
	})

	it('filters requests by normalized statuses', () => {
		const requests = [
			{ ...request('2026-01-01', '2026-01-02'), status: 'status.accepted' },
			{ ...request('2026-02-01', '2026-02-02'), status: 'pending' },
		]
		const filters = { ...createDefaultLeaveRequestStatusFilters(), accepted: false }
		expect(filterLeaveRequestsByStatuses(requests, filters)).toEqual([requests[1]])
	})

	it('calculates status statistics for the selected period', () => {
		const requests = [
			{ status: 'status.accepted' },
			{ status: 'accepted' },
			{ status: 'status.pending' },
			{ status: 'status.rejected' },
		]
		expect(getLeaveRequestStatusStats(requests)).toEqual({
			total: 4,
			accepted: 2,
			pending: 1,
			rejected: 1,
			sent: 0,
		})
	})

	it('calculates only working days that fall inside the selected month', () => {
		const requests = [{
			...request('2026-01-29T00:00:00.000Z', '2026-02-03T00:00:00.000Z'),
			status: 'status.accepted',
			daysRequested: 4,
		}]
		const stats = getLeaveRequestDurationStats(requests, 2026, 1, { workOnWeekends: false })

		expect(stats.accepted).toBe(2)
		expect(stats.total).toBe(2)
	})

	it('converts selected-period days to hours in hours mode', () => {
		const requests = [{
			...request('2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z'),
			status: 'status.pending',
			daysRequested: 2,
		}]
		const stats = getLeaveRequestDurationStats(requests, 2026, 2, {
			workOnWeekends: false,
			leaveCalculationMode: 'hours',
			leaveHoursPerDay: 7.5,
		})

		expect(stats.pending).toBe(15)
	})

	it('groups selected-period duration by leave request type', () => {
		const requests = [
			{
				...request('2026-04-01T00:00:00.000Z', '2026-04-03T00:00:00.000Z'),
				status: 'status.accepted',
				type: 'vacation',
				daysRequested: 3,
			},
			{
				...request('2026-04-06T00:00:00.000Z', '2026-04-06T00:00:00.000Z'),
				status: 'status.pending',
				type: 'care',
				daysRequested: 1,
			},
			{
				...request('2026-04-07T00:00:00.000Z', '2026-04-07T00:00:00.000Z'),
				status: 'status.rejected',
				type: 'vacation',
				daysRequested: 1,
			},
		]

		const stats = getLeaveRequestTypeStats(requests, 2026, 3, { workOnWeekends: false })

		expect(stats).toEqual([
			expect.objectContaining({ type: 'vacation', requests: 2, duration: 4, accepted: 3, rejected: 1 }),
			expect.objectContaining({ type: 'care', requests: 1, duration: 1, pending: 1 }),
		])
	})

	it('calculates leave type limit usage from accepted and sent requests with pending risk', () => {
		const requests = [
			{
				...request('2026-05-04T00:00:00.000Z', '2026-05-08T00:00:00.000Z'),
				status: 'status.accepted',
				type: 'vacation',
				daysRequested: 5,
			},
			{
				...request('2026-05-11T00:00:00.000Z', '2026-05-12T00:00:00.000Z'),
				status: 'status.sent',
				type: 'vacation',
				daysRequested: 2,
			},
			{
				...request('2026-05-13T00:00:00.000Z', '2026-05-15T00:00:00.000Z'),
				status: 'status.pending',
				type: 'vacation',
				daysRequested: 3,
			},
			{
				...request('2026-05-18T00:00:00.000Z', '2026-05-18T00:00:00.000Z'),
				status: 'status.rejected',
				type: 'vacation',
				daysRequested: 1,
			},
		]
		const settings = {
			workOnWeekends: false,
			leaveRequestTypes: [
				{ id: 'vacation', allowDaysLimit: true },
				{ id: 'care', allowDaysLimit: true },
				{ id: 'remote', allowDaysLimit: false },
			],
		}

		const stats = getLeaveRequestLimitUsageStats(requests, 2026, 4, settings, { vacation: 8, care: 2 })

		expect(stats).toEqual([
			expect.objectContaining({
				type: 'vacation',
				limit: 8,
				used: 7,
				pending: 3,
				remaining: 1,
				usagePercent: 87.5,
				isAtRisk: true,
				isExceeded: false,
			}),
			expect.objectContaining({
				type: 'care',
				limit: 2,
				used: 0,
				pending: 0,
				remaining: 2,
				usagePercent: 0,
			}),
		])
	})
})
