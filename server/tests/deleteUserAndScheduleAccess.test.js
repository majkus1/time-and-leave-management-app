const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveDeleteUserDecision } = require('../utils/deleteUserPolicy')
const { canAccessSchedule, teamScheduleFilter } = require('../utils/scheduleAccess')

const TEAM_A = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const TEAM_B = 'bbbbbbbbbbbbbbbbbbbbbbbb'

test('deleteUser: admin z innego zespołu — odmowa (przed jakimkolwiek zapisem)', () => {
	const d = resolveDeleteUserDecision({ requesterId: 'x', requesterTeamId: TEAM_B, requesterRoles: ['Admin'], targetId: 'founder', targetTeamId: TEAM_A })
	assert.equal(d.allowed, false)
	assert.equal(d.status, 403)
})

test('deleteUser: pracownik tego samego zespołu — odmowa', () => {
	const d = resolveDeleteUserDecision({ requesterId: 'w', requesterTeamId: TEAM_A, requesterRoles: ['Pracownik (Worker)'], targetId: 'founder', targetTeamId: TEAM_A })
	assert.equal(d.allowed, false)
})

test('deleteUser: HR i przełożony nie usuwają użytkowników', () => {
	for (const role of ['HR', 'Przełożony (Supervisor)']) {
		const d = resolveDeleteUserDecision({ requesterId: 'h', requesterTeamId: TEAM_A, requesterRoles: [role], targetId: 'u', targetTeamId: TEAM_A })
		assert.equal(d.allowed, false, role)
	}
})

test('deleteUser: usunięcie siebie — odmowa, nawet dla admina', () => {
	const d = resolveDeleteUserDecision({ requesterId: 'a', requesterTeamId: TEAM_A, requesterRoles: ['Admin'], targetId: 'a', targetTeamId: TEAM_A })
	assert.equal(d.allowed, false)
})

test('deleteUser: admin tego samego zespołu — dozwolone', () => {
	const d = resolveDeleteUserDecision({ requesterId: 'a', requesterTeamId: TEAM_A, requesterRoles: ['Admin'], targetId: 'u', targetTeamId: TEAM_A })
	assert.equal(d.allowed, true)
})

const custom = { teamId: TEAM_A, type: 'custom', members: ['m1', 'm2'] }
const dept = { teamId: TEAM_A, type: 'department', departmentName: 'IT' }
const team = { teamId: TEAM_A, type: 'team' }

test('grafik: użytkownik innego zespołu nie ma dostępu do żadnego typu, także admin', () => {
	for (const schedule of [custom, dept, team]) {
		assert.equal(canAccessSchedule(schedule, { _id: 'm1', teamId: TEAM_B, roles: ['Admin'], department: ['IT'] }), false, schedule.type)
	}
})

test('grafik działowy: ta sama nazwa działu w innym zespole nie daje dostępu', () => {
	assert.equal(canAccessSchedule(dept, { _id: 'x', teamId: TEAM_B, roles: ['Pracownik (Worker)'], department: ['IT'] }), false)
	assert.equal(canAccessSchedule(dept, { _id: 'x', teamId: TEAM_A, roles: ['Pracownik (Worker)'], department: ['IT'] }), true)
	assert.equal(canAccessSchedule(dept, { _id: 'x', teamId: TEAM_A, roles: ['Pracownik (Worker)'], department: ['HR-dział'] }), false)
})

test('grafik niestandardowy: tylko członkowie oraz Admin/HR zespołu', () => {
	assert.equal(canAccessSchedule(custom, { _id: 'm1', teamId: TEAM_A, roles: ['Pracownik (Worker)'] }), true)
	assert.equal(canAccessSchedule(custom, { _id: 'obcy', teamId: TEAM_A, roles: ['Pracownik (Worker)'] }), false)
	assert.equal(canAccessSchedule(custom, { _id: 'obcy', teamId: TEAM_A, roles: ['Przełożony (Supervisor)'] }), false)
	assert.equal(canAccessSchedule(custom, { _id: 'obcy', teamId: TEAM_A, roles: ['HR'] }), true)
})

test('teamScheduleFilter: zawsze z teamId wołającego', () => {
	assert.deepEqual(teamScheduleFilter('s1', TEAM_A), { _id: 's1', teamId: TEAM_A })
})
