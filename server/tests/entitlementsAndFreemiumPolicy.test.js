'use strict'

/**
 * Testy jednostkowe: polityka freemium API (bez Mongo) + entitlementsService (ładuje Mongo tylko przy DB_URI).
 * Uruchom z katalogu głównego repo: npm run test:server
 *
 * Stałe daty ISO — regresje trial / paid lapse / legacy grace / FORCE_*.
 */

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const { LEGACY_PRE_BILLING_GRACE_UNTIL, TRIAL } = require('../constants/planCatalog')

// --- Część 1: zero zależności od bazy ---
const policy = require('../services/freemiumApiPolicyService')

describe('freemiumApiPolicyService', () => {
	it('freemiumMaxAppSeats zgadza się z TRIAL.maxUsers', () => {
		assert.equal(policy.freemiumMaxAppSeats(), TRIAL.maxUsers)
	})

	it('timer API jest zablokowany w freemium (wąski tier)', () => {
		assert.equal(policy.isFreemiumTimerPath('/api/workdays/timer/start'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/workdays/timer/foo', 'POST'), false)
	})

	it('freemium active tier: workdays (bez timera), calendar, settings', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/workdays', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/workdays/123', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/calendar/foo', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/settings/team', 'GET'), true)
	})

	it('freemium active tier: billing i users są dostępne', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/billing/entitlements', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/users/me', 'GET'), true)
	})

	it('freemium active tier: typowy moduł premium bez prefiksu — blok', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/schedules', 'GET'), false)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/boards', 'GET'), false)
	})

	it('seat overcapacity: POST /api/users/register zablokowany', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(
			policy.isFreemiumSeatOverageAllowed('/api/users/register', 'POST', teamId),
			false
		)
	})

	it('seat overcapacity: GET team users dla własnego teamId dozwolone', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(
			policy.isFreemiumSeatOverageAllowed(`/api/teams/${teamId}/users`, 'GET', teamId),
			true
		)
	})

	it('normalizeApiPath obcina query string', () => {
		const req = { originalUrl: '/api/workdays?x=1', url: '/other' }
		assert.equal(policy.normalizeApiPath(req), '/api/workdays')
	})
})

// --- Część 2: entitlements (wymaga DB_URI — inaczej mongoose rzuci przy imporcie db) ---
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const HAS_DB_URI = typeof process.env.DB_URI === 'string' && process.env.DB_URI.length > 0

const entitlementsDescribe = HAS_DB_URI ? describe : describe.skip

entitlementsDescribe('entitlementsService (stałe daty)', () => {
	const e = require('../services/entitlementsService')

	const T_2026 = new Date('2026-06-15T12:00:00.000Z')
	const T_2027_AFTER_GRACE = new Date('2027-01-03T12:00:00.000Z')
	const T_TRIAL_OK = new Date('2026-03-01T12:00:00.000Z')
	const T_TRIAL_ENDED = new Date('2026-05-01T12:00:00.000Z')
	const T_PAID_OK = new Date('2026-04-15T12:00:00.000Z')
	const T_PAID_LAPSED = new Date('2026-08-01T12:00:00.000Z')

	it('LEGACY_PRE_BILLING_GRACE_UNTIL jest zgodny z planCatalog (2.01.2027 Europe/Warsaw)', () => {
		assert.equal(LEGACY_PRE_BILLING_GRACE_UNTIL.toISOString(), '2027-01-01T23:00:00.000Z')
	})

	it('trial aktywny: nie freemium, subskrypcja płatna nieaktywna', () => {
		const team = {
			name: 'NormalnyZespol',
			isActive: true,
			maxUsers: 5,
			billingPlanKey: 'trial',
			billingStatus: 'trialing',
			trialEndsAt: new Date('2026-12-31T23:59:59.000Z'),
		}
		assert.equal(e.isTrialActive(team, T_TRIAL_OK), true)
		assert.equal(e.isFreemiumTierTeam(team, T_TRIAL_OK), false)
		assert.equal(e.isPaidSubscriptionActive(team, T_TRIAL_OK), false)
	})

	it('trial wygasł, nie opłacony: freemium', () => {
		const team = {
			name: 'NormalnyZespol',
			isActive: true,
			maxUsers: 20,
			billingPlanKey: 'trial',
			billingStatus: 'expired',
			trialEndsAt: new Date('2026-04-01T00:00:00.000Z'),
		}
		assert.equal(e.isTrialExpiredUnpaid(team, T_TRIAL_ENDED), true)
		assert.equal(e.isFreemiumTierTeam(team, T_TRIAL_ENDED), true)
	})

	it('starter opłacony w okresie: pełna subskrypcja, nie freemium', () => {
		const team = {
			name: 'NormalnyZespol',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd: new Date('2026-12-31T23:59:59.000Z'),
		}
		assert.equal(e.isPaidSubscriptionActive(team, T_PAID_OK), true)
		assert.equal(e.isFreemiumTierTeam(team, T_PAID_OK), false)
		assert.equal(e.isPaidPlanPeriodLapsed(team, T_PAID_OK), false)
	})

	it('starter — koniec okresu: wygasły plan → freemium', () => {
		const team = {
			name: 'NormalnyZespol',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
		}
		assert.equal(e.isPaidSubscriptionActive(team, T_PAID_LAPSED), false)
		assert.equal(e.isPaidPlanPeriodLapsed(team, T_PAID_LAPSED), true)
		assert.equal(e.isFreemiumTierTeam(team, T_PAID_LAPSED), true)
	})

	it('pre-billing legacy (brak pól billing): przed 2027 — grandfathered, nie freemium', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 50,
		}
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_2026), true)
		assert.equal(e.isLegacyPreBillingTeam(team, T_2026), true)
		assert.equal(e.isFreemiumTierTeam(team, T_2026), false)
	})

	it('pre-billing legacy: po dacie grace — freemium (legacy grace expired)', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 50,
		}
		assert.equal(e.isLegacyPreBillingGraceExpired(team, T_2027_AFTER_GRACE), true)
		assert.equal(e.isFreemiumTierTeam(team, T_2027_AFTER_GRACE), true)
	})

	it('po pierwszym zakupie (billingPlanKey) + wygasły okres: nie structural legacy, freemium przez lapse', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 100,
			billingPlanKey: 'business',
			billingStatus: 'active',
			billingPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
		}
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_PAID_LAPSED), false)
		assert.equal(e.isLegacyPreBillingTeam(team, T_PAID_LAPSED), false)
		assert.equal(e.isPaidPlanPeriodLapsed(team, T_PAID_LAPSED), true)
		assert.equal(e.isFreemiumTierTeam(team, T_PAID_LAPSED), true)
	})

	it('FORCE_LEGACY nazwa + brak aktywnej subskrypcji + przed 2027: z powrotem grandfathered', () => {
		const team = {
			name: 'legacy',
			isActive: true,
			maxUsers: 20,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
		}
		assert.equal(e.isPaidSubscriptionActive(team, T_PAID_LAPSED), false)
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_PAID_LAPSED), true)
		assert.equal(e.isLegacyPreBillingTeam(team, T_PAID_LAPSED), true)
		assert.equal(e.isFreemiumTierTeam(team, T_PAID_LAPSED), false)
	})

	it('testleeegacy bez płatności: freemium test (nie grandfathered)', () => {
		const team = {
			name: 'testleeegacy',
			isActive: true,
			maxUsers: 11,
			billingPlanKey: 'trial',
			billingStatus: 'expired',
			trialEndsAt: new Date('2020-01-01T00:00:00.000Z'),
		}
		assert.equal(e.isFreemiumTierTeam(team, T_2026), true)
	})

	it('testleeegacy ze aktywnym starterem: nie freemium', () => {
		const team = {
			name: 'testleeegacy',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd: new Date('2027-06-01T00:00:00.000Z'),
		}
		assert.equal(e.isFreemiumTierTeam(team, T_2026), false)
	})

	it('OficjalnyAdminowy (special): nigdy freemium tier w tym module', () => {
		const team = {
			name: 'OficjalnyAdminowy',
			isActive: true,
			maxUsers: 11,
			billingPlanKey: 'trial',
			billingStatus: 'expired',
			trialEndsAt: new Date('2020-01-01T00:00:00.000Z'),
		}
		assert.equal(e.isFreemiumTierTeam(team, T_TRIAL_ENDED), false)
	})

	it('effectiveMaxUsers: wygasły trial → cap TRIAL.maxUsers', () => {
		const team = {
			name: 'X',
			isActive: true,
			maxUsers: 100,
			billingPlanKey: 'trial',
			billingStatus: 'expired',
			trialEndsAt: new Date('2026-04-01T00:00:00.000Z'),
		}
		assert.equal(e.effectiveMaxUsers(team, T_TRIAL_ENDED), TRIAL.maxUsers)
	})

	it('buildClientEntitlements: freemium + 50 miejsc → freemiumSeatBlocked (okres w przeszłości względem „teraz”)', () => {
		// buildClientEntitlements() używa wewnątrz new Date(), nie parametru — koniec planu musi być w przeszłości realnego czasu testu.
		const billingPeriodEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		const team = {
			name: 'X',
			isActive: true,
			maxUsers: 100,
			billingPlanKey: 'business',
			billingStatus: 'active',
			billingPeriodEnd,
		}
		const ent = e.buildClientEntitlements(team, { activeSeatCount: 50 })
		assert.equal(ent.freemiumTier, true)
		assert.equal(ent.freemiumSeatBlocked, true)
		assert.equal(ent.freemiumMaxSeats, TRIAL.maxUsers)
	})

	it('buildClientEntitlements: freemium w limicie 5 miejsc → seat not blocked', () => {
		const billingPeriodEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		const team = {
			name: 'X',
			isActive: true,
			maxUsers: 100,
			billingPlanKey: 'business',
			billingStatus: 'active',
			billingPeriodEnd,
		}
		const ent = e.buildClientEntitlements(team, { activeSeatCount: 5 })
		assert.equal(ent.freemiumTier, true)
		assert.equal(ent.freemiumSeatBlocked, false)
	})
})
