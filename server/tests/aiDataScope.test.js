const test = require('node:test')
const assert = require('node:assert/strict')
const { splitSupervisorAiScopes } = require('../utils/aiDataScope')

test('AI: zakres ewidencji i urlopów przełożonego to osobne zbiory, nie suma', () => {
	const { timesheetUserIds, leaveUserIds } = splitSupervisorAiScopes(
		[
			{ id: 'onlyLeave', timesheet: false, leave: true },
			{ id: 'onlyTs', timesheet: true, leave: false },
			{ id: 'both', timesheet: true, leave: true },
			{ id: 'none', timesheet: false, leave: false },
		],
		'sup'
	)
	assert.deepEqual(timesheetUserIds, ['onlyTs', 'both', 'sup'])
	assert.deepEqual(leaveUserIds, ['onlyLeave', 'both', 'sup'])
	assert.ok(!timesheetUserIds.includes('onlyLeave'), 'godziny osoby spoza zakresu ewidencji nie trafiają do AI')
})

test('AI: własne konto zawsze w obu zbiorach, bez duplikatów', () => {
	const r = splitSupervisorAiScopes([{ id: 'sup', timesheet: false, leave: false }], 'sup')
	assert.deepEqual(r.timesheetUserIds, ['sup'])
	assert.deepEqual(r.leaveUserIds, ['sup'])
	const empty = splitSupervisorAiScopes([], 'sup')
	assert.deepEqual(empty.timesheetUserIds, ['sup'])
})
