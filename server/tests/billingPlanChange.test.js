const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { planChangeNeedsRequest } = require('../utils/billingPlanChange')

describe('planChangeNeedsRequest — zmiana planu tylko zgłoszeniem, gdy plan jest opłacony', () => {
	it('opłacony plan (także z góry przez P24) — zgłoszenie', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: true }), true)
	})

	it('subskrypcja kartą w trakcie ponawiania płatności (karencja) — zgłoszenie, bo Stripe dalej pobiera', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'past_due' }), true)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'unpaid' }), true)
	})

	it('anulowana albo wygasła subskrypcja kartą — można kupić nowy plan', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'canceled' }), false)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'incomplete_expired' }), false)
	})

	it('okres próbny, plan darmowy albo wygasły plan — zwykły zakup', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false }), false)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: null, stripeSubscriptionStatus: 'active' }), false)
		assert.equal(planChangeNeedsRequest(null), false)
	})
})
