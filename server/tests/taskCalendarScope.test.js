const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveCalendarScope, calendarAssigneeMatch, canUseBoardScope } = require('../utils/taskCalendarScope')

test('resolveCalendarScope: domyślnie assigned, nieznane wartości też', () => {
	assert.equal(resolveCalendarScope(undefined, ['Pracownik (Worker)']), 'assigned')
	assert.equal(resolveCalendarScope('cokolwiek', ['Admin']), 'assigned')
	assert.equal(resolveCalendarScope('assigned', ['Admin']), 'assigned')
	assert.equal(resolveCalendarScope('mine', ['Pracownik (Worker)']), 'mine')
})

test('resolveCalendarScope: board tylko dla Admin/HR/Przełożonego, pracownik spada do mine', () => {
	assert.equal(resolveCalendarScope('board', ['Admin']), 'board')
	assert.equal(resolveCalendarScope('board', ['HR']), 'board')
	assert.equal(resolveCalendarScope('board', ['Przełożony (Supervisor)']), 'board')
	assert.equal(resolveCalendarScope('board', ['Pracownik (Worker)']), 'mine')
	assert.equal(resolveCalendarScope('board', []), 'mine')
	assert.equal(canUseBoardScope(undefined), false)
})

test('calendarAssigneeMatch: assigned bez createdBy, mine z createdBy, board bez filtra', () => {
	const uid = 'u1'
	assert.deepEqual(calendarAssigneeMatch('assigned', uid), { $or: [{ assignedScope: 'all-members' }, { assignedTo: uid }] })
	assert.deepEqual(calendarAssigneeMatch('mine', uid), {
		$or: [{ assignedScope: 'all-members' }, { assignedTo: uid }, { createdBy: uid }],
	})
	assert.equal(calendarAssigneeMatch('board', uid), null)
})
