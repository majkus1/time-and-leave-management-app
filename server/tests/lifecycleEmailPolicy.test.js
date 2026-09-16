const test = require('node:test')
const assert = require('node:assert/strict')

const { dueLifecycleKind, dueBillingKind, ownerLeadDue, LIFECYCLE_KINDS } = require('../utils/lifecycleEmailPolicy')

const bill = (daysToEnd, extra = {}) =>
	dueBillingKind({ daysToEnd, hasStripeSubscription: false, active: true, lapsed: false, periodEndKey: '2026-10-01', sentKinds: [], ...extra })

test('pakiet P24: przypomnienie 7 dni i 1 dzien przed koncem, z data okresu w rodzaju', () => {
	assert.equal(bill(7), 'paid_renewal_7d:2026-10-01')
	assert.equal(bill(5), 'paid_renewal_7d:2026-10-01')
	assert.equal(bill(1), 'paid_renewal_1d:2026-10-01')
	assert.equal(bill(0), 'paid_renewal_1d:2026-10-01')
	assert.equal(bill(3), null)
	assert.equal(bill(20), null)
	assert.equal(bill(7, { sentKinds: ['paid_renewal_7d:2026-10-01'] }), null)
	// kolejny okres = nowy klucz, wiec nowe przypomnienie
	assert.equal(bill(7, { periodEndKey: '2026-11-01', sentKinds: ['paid_renewal_7d:2026-10-01'] }), 'paid_renewal_7d:2026-11-01')
})

test('subskrypcja Stripe nie dostaje przypomnien przed koncem (odnawia sie sama)', () => {
	assert.equal(bill(7, { hasStripeSubscription: true }), null)
	assert.equal(bill(1, { hasStripeSubscription: true }), null)
})

test('wygasniecie: mail 1-7 dni po koncu, niezaleznie od dostawcy, raz na okres', () => {
	assert.equal(bill(-1, { active: false, lapsed: true }), 'paid_lapsed:2026-10-01')
	assert.equal(bill(-7, { active: false, lapsed: true, hasStripeSubscription: true }), 'paid_lapsed:2026-10-01')
	assert.equal(bill(-8, { active: false, lapsed: true }), null)
	assert.equal(bill(-3, { active: false, lapsed: true, sentKinds: ['paid_lapsed:2026-10-01'] }), null)
	assert.equal(bill(-3, { active: true, lapsed: false }), null)
})

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

test('koniec trialu liczony z faktycznej daty, gdy jest znana — przedluzony trial nie dostaje maila w 23. dniu', () => {
	// trial przedluzony recznie: 25 dni od rejestracji, ale do konca jeszcze 20 dni
	assert.equal(due(25, { trialDaysLeft: 20 }), null)
	assert.equal(due(25, { trialDaysLeft: 7 }), 'trial_ending')
	assert.equal(due(10, { trialDaysLeft: 5 }), 'trial_ending')
	assert.equal(due(31, { trialDaysLeft: 0 }), 'trial_ended')
	assert.equal(due(33, { trialDaysLeft: -3 }), 'trial_ended')
	// w oknie win-back (40+ dni) wygrywa pozniejszy krok cyklu — jeden mail, nie dwa
	assert.equal(due(40, { trialDaysLeft: -3 }), 'winback')
	assert.equal(due(31, { trialDaysLeft: 10 }), null)
	// bez daty konca — okna od rejestracji jak dotad
	assert.equal(due(25, { trialDaysLeft: null }), 'trial_ending')
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
