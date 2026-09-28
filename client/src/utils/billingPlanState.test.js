import { describe, expect, it } from 'vitest'
import { paidPlanIdsFromCatalog, paidSubscriptionActive, planChangeByRequest, renewalOffer } from './billingPlanState'

// Bliźniaczy zestaw do server/tests/billingPlanChange.test.js — ta sama reguła po obu stronach.
const catalog = { tiers: ['base_5', 'base_s', 'base_m', 'base_50', 'base_l', 'pro_15', 'pro', 'pro_50', 'business', 'enterprise'].map(id => ({ id })) }
const ids = paidPlanIdsFromCatalog(catalog)
const now = new Date('2026-09-28T10:00:00Z')
const future = '2026-10-28T10:00:00Z'
const past = '2026-09-01T10:00:00Z'

describe('paidPlanIdsFromCatalog', () => {
	it('zna nowe progi i stary klucz starter', () => {
		expect(ids.has('base_5')).toBe(true)
		expect(ids.has('pro_50')).toBe(true)
		expect(ids.has('starter')).toBe(true)
		expect(ids.has('trial')).toBe(false)
	})
})

describe('paidSubscriptionActive', () => {
	it('opłacony plan z nowym kluczem', () => {
		expect(paidSubscriptionActive({ planKey: 'base_5', billingStatus: 'active', billingPeriodEnd: future }, ids, now)).toBe(true)
	})

	it('wygasły okres albo okres próbny to nie opłacony plan', () => {
		expect(paidSubscriptionActive({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: past }, ids, now)).toBe(false)
		expect(paidSubscriptionActive({ planKey: 'trial', billingStatus: 'active' }, ids, now)).toBe(false)
	})
})

describe('planChangeByRequest', () => {
	it('opłacony plan — zmiana tylko prośbą', () => {
		expect(planChangeByRequest({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: future }, ids, now)).toBe(true)
	})

	it('ponawianie płatności kartą (karencja) — nadal prośbą, bo Stripe dalej pobiera', () => {
		const ent = { planKey: 'base_m', billingStatus: 'inactive', billingPeriodEnd: past, stripe: { subscriptionId: 'sub_1', subscriptionStatus: 'past_due' } }
		expect(planChangeByRequest(ent, ids, now)).toBe(true)
	})

	it('anulowana subskrypcja po końcu okresu, okres próbny, plan darmowy — zwykły zakup', () => {
		expect(planChangeByRequest({ planKey: 'base_m', billingStatus: 'inactive', billingPeriodEnd: past, stripe: { subscriptionId: 'sub_1', subscriptionStatus: 'canceled' } }, ids, now)).toBe(false)
		expect(planChangeByRequest({ planKey: 'trial', billingStatus: 'active' }, ids, now)).toBe(false)
		expect(planChangeByRequest(null, ids, now)).toBe(false)
	})
})

describe('renewalOffer — „Przedłuż plan” BLIK / przelewem', () => {
	const saleCatalog = {
		coreTiers: ['base_5', 'base_s', 'base_m', 'base_50', 'base_l'].map(id => ({ id })),
		bundles: ['pro_15', 'pro', 'pro_50', 'business'].map(id => ({ id })),
	}

	it('opłacony plan BLIK / przelewem przed końcem — przedłużenie od końca obecnego okresu', () => {
		const offer = renewalOffer({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: future }, saleCatalog, now)
		expect(offer).toEqual({ planKey: 'base_s', periodEnd: new Date(future), active: true })
	})

	it('po wygaśnięciu — nadal można przedłużyć, okres liczy się od płatności', () => {
		expect(renewalOffer({ planKey: 'pro', billingStatus: 'active', billingPeriodEnd: past }, saleCatalog, now)?.active).toBe(false)
	})

	it('subskrypcja kartą odnawia się sama — bez przedłużenia BLIK, także przy ponawianiu płatności', () => {
		for (const subscriptionStatus of ['active', 'past_due']) {
			const ent = { planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: future, stripe: { subscriptionId: 'sub_1', subscriptionStatus } }
			expect(renewalOffer(ent, saleCatalog, now)).toBe(null)
		}
		// Anulowana karta — BLIK wolno
		const canceled = { planKey: 'base_s', billingStatus: 'inactive', billingPeriodEnd: past, stripe: { subscriptionId: 'sub_1', subscriptionStatus: 'canceled' } }
		expect(renewalOffer(canceled, saleCatalog, now)?.planKey).toBe('base_s')
	})

	it('rozliczenie osobne (bez daty albo ukryta data), okres próbny i Enterprise — bez przedłużenia online', () => {
		expect(renewalOffer({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: null }, saleCatalog, now)).toBe(null)
		expect(renewalOffer({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: future, hideBillingPeriodEnd: true }, saleCatalog, now)).toBe(null)
		expect(renewalOffer({ planKey: 'trial', billingStatus: 'active', billingPeriodEnd: future }, saleCatalog, now)).toBe(null)
		expect(renewalOffer({ planKey: 'enterprise', billingStatus: 'active', billingPeriodEnd: future }, saleCatalog, now)).toBe(null)
	})
})
