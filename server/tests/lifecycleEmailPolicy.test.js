const test = require('node:test')
const assert = require('node:assert/strict')

const { dueLifecycleKind, ownerLeadDue, LIFECYCLE_KINDS } = require('../utils/lifecycleEmailPolicy')

const due = (ageDays, extra = {}) => dueLifecycleKind({ ageDays, usersCount: 1, paid: false, sentKinds: [], ...extra })

test('cykl: kazdy krok ma swoje okno, poza oknami nic', () => {
	assert.equal(due(0), 'welcome')
	assert.equal(due(1), 'welcome')
	assert.equal(due(2), 'add_team')
	assert.equal(due(8), 'leaves_tip')
	assert.equal(due(15), null)
	assert.equal(due(25), 'trial_ending')
	assert.equal(due(31), 'trial_ended')
	assert.equal(due(45), 'winback')
	assert.equal(due(70), null)
})

test('„dodaj zespol” tylko gdy w zespole jest jedno konto', () => {
	assert.equal(due(3, { usersCount: 1 }), 'add_team')
	assert.equal(due(3, { usersCount: 2 }), 'welcome')
	assert.equal(due(5, { usersCount: 2 }), null)
})

test('zespol, ktory zaplacil, nie dostaje maili sprzedazowych (poza powitaniem)', () => {
	assert.equal(due(1, { paid: true }), 'welcome')
	assert.equal(due(25, { paid: true }), null)
	assert.equal(due(45, { paid: true }), null)
})

test('jeden mail na przebieg: nadrabianie po przerwie wysyla tylko najpozniejszy', () => {
	assert.equal(due(8, { sentKinds: [] }), 'leaves_tip')
	assert.equal(due(8, { sentKinds: ['leaves_tip'] }), null)
})

test('wyslany pozniejszy krok zamyka wczesniejsze — nie cofamy sie w cyklu', () => {
	assert.equal(due(3, { sentKinds: ['leaves_tip'] }), null)
	assert.equal(due(25, { sentKinds: ['trial_ended'] }), null)
})

test('ten sam rodzaj nie wychodzi dwa razy', () => {
	assert.equal(due(25, { sentKinds: ['trial_ending'] }), null)
})

test('sygnal dla wlasciciela: 3 konta lub 3 dni logowan, raz, tylko niezaplacone', () => {
	assert.equal(ownerLeadDue({ usersCount: 3, sessionDays: 1, paid: false, alerted: false }), true)
	assert.equal(ownerLeadDue({ usersCount: 1, sessionDays: 3, paid: false, alerted: false }), true)
	assert.equal(ownerLeadDue({ usersCount: 2, sessionDays: 2, paid: false, alerted: false }), false)
	assert.equal(ownerLeadDue({ usersCount: 5, sessionDays: 9, paid: true, alerted: false }), false)
	assert.equal(ownerLeadDue({ usersCount: 5, sessionDays: 9, paid: false, alerted: true }), false)
})

test('kolejnosc cyklu jest jawna', () => {
	assert.deepEqual(LIFECYCLE_KINDS, ['welcome', 'add_team', 'leaves_tip', 'trial_ending', 'trial_ended', 'winback'])
})
