import test from 'node:test'
import assert from 'node:assert/strict'
import {
	buildScheduleConflictConfirmMessage,
	getScheduleConflictSummary,
	groupScheduleConflictsByDate,
	employeeHasApprovedLeaveOnDate,
} from './leaveScheduleConflict.js'

test('groupScheduleConflictsByDate groups by date', () => {
	const grouped = groupScheduleConflictsByDate([
		{ date: '2026-07-07', scheduleName: 'A', timeFrom: '08:00', timeTo: '16:00' },
		{ date: '2026-07-07', scheduleName: 'B', timeFrom: '10:00', timeTo: '14:00' },
	])
	assert.equal(grouped.length, 1)
	assert.equal(grouped[0][1].length, 2)
})

test('buildScheduleConflictConfirmMessage includes schedule lines', () => {
	const t = (key, opts) => {
		const map = {
			'leaveScheduleConflict.confirmIntroSelf': 'Intro self',
			'leaveScheduleConflict.confirmQuestion': 'Sure?',
			'leaveScheduleConflict.confirmManagerNote': 'Manager note',
		}
		return map[key] || key
	}
	const message = buildScheduleConflictConfirmMessage({
		t,
		locale: 'en-GB',
		conflicts: [{ date: '2026-07-07', scheduleName: 'Team', timeFrom: '08:00', timeTo: '16:00' }],
	})
	assert.match(message, /Intro self/)
	assert.match(message, /Team/)
	assert.match(message, /Sure\?/)
})

test('getScheduleConflictSummary handles plural', () => {
	const t = (key, opts) => (opts?.count ? `days:${opts.count}` : 'one')
	assert.equal(getScheduleConflictSummary(t, [{ date: '2026-07-07' }]), 'one')
	assert.equal(
		getScheduleConflictSummary(t, [{ date: '2026-07-07' }, { date: '2026-07-08' }]),
		'days:2'
	)
})

test('employeeHasApprovedLeaveOnDate detects overlap', () => {
	const requests = [
		{
			status: 'status.accepted',
			userId: 'user-1',
			startDate: '2026-07-05',
			endDate: '2026-07-10',
		},
	]
	assert.equal(
		employeeHasApprovedLeaveOnDate({
			leaveRequests: requests,
			employeeId: 'user-1',
			dateKey: '2026-07-07',
		}),
		true
	)
	assert.equal(
		employeeHasApprovedLeaveOnDate({
			leaveRequests: requests,
			employeeId: 'user-1',
			dateKey: '2026-07-12',
		}),
		false
	)
})
