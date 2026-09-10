const test = require('node:test')
const assert = require('node:assert/strict')

const policy = require('../services/freemiumApiPolicyService')

const TEAM = '507f1f77bcf86cd799439011'
const ADMIN = ['Admin']
const HR = ['HR']
const WORKER = ['Pracownik (Worker)']
const SUPERVISOR = ['Przełożony (Supervisor)']

const overage = (path, method, roles) => policy.isFreemiumSeatOverageAllowed(path, method, TEAM, roles)
const active = (path, method) => policy.isFreemiumActiveTierAllowed(path, method)

test('ponad limit: pracownik i przełożony nie dostają nic poza wylogowaniem i uprawnieniami', () => {
	for (const roles of [WORKER, SUPERVISOR, []]) {
		assert.equal(overage('/api/workdays', 'GET', roles), false)
		assert.equal(overage('/api/calendar/x', 'GET', roles), false)
		assert.equal(overage('/api/settings', 'GET', roles), false)
		assert.equal(overage('/api/users/all-users', 'GET', roles), false)
		assert.equal(overage(`/api/teams/${TEAM}`, 'GET', roles), false)
		// zawsze: sesja, uprawnienia, dokumenty prawne
		assert.equal(overage('/api/billing/entitlements', 'GET', roles), true)
		assert.equal(overage('/api/users/me', 'GET', roles), true)
		assert.equal(overage('/api/users/logout', 'POST', roles), true)
		assert.equal(overage('/api/legal/current', 'GET', roles), true)
	}
})

test('ponad limit: HR ma pakiety i rozliczenia oraz odczyty potrzebne sidebarowi, bez zarządzania zespołem', () => {
	assert.equal(overage('/api/billing/purchase-request', 'POST', HR), true)
	assert.equal(overage(`/api/teams/${TEAM}`, 'GET', HR), true)
	assert.equal(overage('/api/settings', 'GET', HR), true)
	assert.equal(overage('/api/settings', 'PUT', HR), false)
	assert.equal(overage('/api/notifications', 'GET', HR), true)
	assert.equal(overage('/api/tickets/create', 'POST', HR), true)
	assert.equal(overage('/api/users/all-users', 'GET', HR), false)
	assert.equal(overage('/api/users/abc', 'DELETE', HR), false)
	assert.equal(overage(`/api/teams/${TEAM}/users`, 'GET', HR), false)
	assert.equal(overage('/api/workdays', 'GET', HR), false)
})

test('ponad limit: Admin przycina zespół, ale nie może dodawać ani przywracać kont', () => {
	assert.equal(overage('/api/users/all-users', 'GET', ADMIN), true)
	assert.equal(overage('/api/users/abc', 'DELETE', ADMIN), true)
	assert.equal(overage('/api/users/deleted/list', 'GET', ADMIN), true)
	assert.equal(overage(`/api/teams/${TEAM}/users`, 'GET', ADMIN), true)
	assert.equal(overage(`/api/teams/${TEAM}/check-limit`, 'POST', ADMIN), true)
	assert.equal(overage('/api/departments', 'GET', ADMIN), true)
	assert.equal(overage('/api/userlogs/abc', 'GET', ADMIN), true)
	assert.equal(overage('/api/supervisors/abc/config', 'PUT', ADMIN), true)
	assert.equal(overage(`/api/teams/${TEAM}`, 'DELETE', ADMIN), true)
	assert.equal(overage(`/api/teams/${TEAM}/permanent`, 'DELETE', ADMIN), true)
	assert.equal(overage(`/api/teams/${TEAM}`, 'PUT', ADMIN), false)
	assert.equal(overage('/api/users/register', 'POST', ADMIN), false)
	assert.equal(overage('/api/users/abc/restore', 'POST', ADMIN), false)
	assert.equal(overage('/api/supervisors/abc/config', 'GET', HR), false)
})

test('ponad limit: Admin nie ma ewidencji, kalendarzy ani urlopów — ma zejść do limitu albo kupić pakiet', () => {
	assert.equal(overage('/api/workdays', 'GET', ADMIN), false)
	assert.equal(overage('/api/calendar/x', 'GET', ADMIN), false)
	assert.equal(overage('/api/leaveworks/accepted-leave-requests', 'GET', ADMIN), false)
	assert.equal(overage('/api/work-activities', 'GET', ADMIN), false)
	assert.equal(overage('/api/qr/team-codes', 'GET', ADMIN), false)
	assert.equal(overage('/api/schedules', 'GET', ADMIN), false)
})

test('ponad limit: cudzy zespół w ścieżce /api/teams jest odrzucany nawet dla Admina', () => {
	assert.equal(overage('/api/teams/aaaaaaaaaaaaaaaaaaaaaaaa/users', 'GET', ADMIN), false)
	assert.equal(overage('/api/teams/aaaaaaaaaaaaaaaaaaaaaaaa', 'GET', ADMIN), false)
})

test('w limicie: ewidencja i kalendarz działają, QR i licznik nie', () => {
	assert.equal(active('/api/workdays', 'GET'), true)
	assert.equal(active('/api/workdays/123', 'PUT'), true)
	assert.equal(active('/api/calendar/x', 'GET'), true)
	assert.equal(active('/api/work-activities', 'POST'), true)
	assert.equal(active('/api/workdays/timer/start', 'POST'), false)
	assert.equal(active('/api/qr/verify/abc', 'GET'), false)
	assert.equal(active('/api/qr/generate', 'POST'), false)
	assert.equal(active('/api/time-entry/register', 'POST'), false)
	assert.equal(active('/api/time-entry/today', 'GET'), true)
})

test('w limicie: urlopy tylko do odczytu (listy do kalendarzy), składanie wniosku zablokowane', () => {
	assert.equal(active('/api/leaveworks/accepted-leave-requests', 'GET'), true)
	assert.equal(active('/api/leaveworks/leave-request', 'POST'), false)
	assert.equal(active('/api/leaveworks/leave-requests/abc', 'PUT'), false)
})

test('w limicie: moduły płatne pozostają zablokowane', () => {
	for (const p of ['/api/schedules', '/api/boards', '/api/chat/channels', '/api/ai-assistant/ask', '/api/announcements', '/api/dashboard/summary']) {
		assert.equal(active(p, 'GET'), false, p)
	}
})

test('w limicie: zarządzanie zespołem i rozliczenia dostępne', () => {
	assert.equal(active('/api/users/register', 'POST'), true)
	assert.equal(active(`/api/teams/${TEAM}/check-limit`, 'POST'), true)
	assert.equal(active('/api/billing/entitlements', 'GET'), true)
	assert.equal(active('/api/tickets/create', 'POST'), true)
})

test('normalizeApiPath: wielkość liter, końcowy i zdublowany ukośnik nie omijają polityki', () => {
	const norm = url => policy.normalizeApiPath({ originalUrl: url })
	assert.equal(norm('/API/schedules'), '/api/schedules')
	assert.equal(norm('/Api/Users/Register/'), '/api/users/register')
	assert.equal(norm('/api//workdays/'), '/api/workdays')
	assert.equal(norm('/api/qr/verify/ABC?x=1'), '/api/qr/verify/abc')
	assert.equal(norm('/'), '/')
	// to, co wcześniej przechodziło przez strażnika jako „inna" ścieżka
	assert.equal(overage(norm('/api/users/register/'), 'POST', ADMIN), false)
	assert.equal(overage(norm('/api/users/abc/restore/'), 'POST', ADMIN), false)
	assert.equal(active(norm('/API/schedules/'), 'GET'), false)
	assert.equal(active(norm('/API/leaveworks/leave-request'), 'POST'), false)
})

test('isBillingStaffRoles: Admin i HR, nikt inny', () => {
	assert.equal(policy.isBillingStaffRoles(ADMIN), true)
	assert.equal(policy.isBillingStaffRoles(HR), true)
	assert.equal(policy.isBillingStaffRoles(WORKER), false)
	assert.equal(policy.isBillingStaffRoles(SUPERVISOR), false)
	assert.equal(policy.isBillingStaffRoles(undefined), false)
})
