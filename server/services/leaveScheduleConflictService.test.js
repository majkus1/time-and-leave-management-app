const test = require('node:test')
const assert = require('node:assert/strict')
const {
	toDateKey,
	findConflictsInLeaveRange,
	getLeaveRequestsDateBounds,
	scheduleLeaveBlockMessage,
} = require('./leaveScheduleConflictService')

test('toDateKey normalizes UTC date', () => {
	assert.equal(toDateKey('2026-07-07'), '2026-07-07')
	assert.equal(toDateKey(new Date('2026-07-07T22:00:00.000Z')), '2026-07-07')
})

test('findConflictsInLeaveRange returns overlapping published days only', () => {
	const map = new Map([
		[
			'2026-07-07',
			[{ scheduleName: 'Grafik A', timeFrom: '08:00', timeTo: '16:00' }],
		],
	])
	const conflicts = findConflictsInLeaveRange('2026-07-05', '2026-07-10', map)
	assert.equal(conflicts.length, 1)
	assert.equal(conflicts[0].date, '2026-07-07')
	assert.equal(conflicts[0].scheduleName, 'Grafik A')
})

test('findConflictsInLeaveRange empty when no schedule entries', () => {
	const conflicts = findConflictsInLeaveRange('2026-07-07', '2026-07-07', new Map())
	assert.equal(conflicts.length, 0)
})

test('getLeaveRequestsDateBounds spans min and max', () => {
	const bounds = getLeaveRequestsDateBounds([
		{ startDate: '2026-07-10', endDate: '2026-07-12' },
		{ startDate: '2026-06-02', endDate: '2026-06-03' },
	])
	assert.equal(bounds.rangeStart, '2026-06-02')
	assert.equal(bounds.rangeEnd, '2026-07-12')
})

test('scheduleLeaveBlockMessage is localized', () => {
	assert.match(scheduleLeaveBlockMessage('pl'), /Nie można dodać/)
	assert.match(scheduleLeaveBlockMessage('en'), /Cannot add/)
})
