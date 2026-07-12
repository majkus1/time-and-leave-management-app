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

	it('freemium active tier: workdays (bez timera), calendar, settings — bez dashboardu KPI', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/dashboard/summary', 'GET'), false)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/dashboard/team-insights', 'GET'), false)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/workdays', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/workdays/123', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/work-activities', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/work-activities', 'POST'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/calendar/foo', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/settings/team', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/email-notifications/preferences', 'GET'), true)
	})

	it('freemium active tier: billing i users są dostępne', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/billing/entitlements', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/users/me', 'GET'), true)
	})

	it('freemium active tier: centrum pomocy (tickets API)', () => {
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/tickets/my-tickets', 'GET'), true)
		assert.equal(policy.isFreemiumActiveTierAllowed('/api/tickets/create', 'POST'), true)
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

	it('seat overcapacity: work-activities dozwolone (ewidencja / konfiguracja czynności), dashboard zablokowany', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/dashboard/summary', 'GET', teamId), false)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/work-activities', 'GET', teamId), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/work-activities', 'POST', teamId), true)
	})

	it('seat overcapacity: notifications, push i userlogs dozwolone (panel admina)', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/notifications', 'GET', teamId), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/push/preferences', 'GET', teamId), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/userlogs/abc', 'GET', teamId), true)
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

	it('LEGACY_PRE_BILLING_GRACE_UNTIL jest zgodny z planCatalog (2.08.2026 00:00 Europe/Warsaw)', () => {
		assert.equal(LEGACY_PRE_BILLING_GRACE_UNTIL.toISOString(), '2026-08-01T22:00:00.000Z')
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

	it('pre-billing legacy (brak pól billing): przed końcem grace — grandfathered, nie freemium', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 50,
		}
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_2026), true)
		assert.equal(e.isLegacyPreBillingTeam(team, T_2026), true)
		assert.equal(e.isFreemiumTierTeam(team, T_2026), false)
	})

	it('pre-billing legacy: 10 wiadomości AI jednorazowo na okres (bez resetu miesięcznego)', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 50,
			legacyOneOffAiMessagesUsed: 0,
		}
		const b = e.computeAiBuckets(team, T_2026)
		assert.equal(b.hasAiAccess, true)
		assert.equal(b.totalRemaining, 10)
		const teamUsed = { ...team, legacyOneOffAiMessagesUsed: 10 }
		const b2 = e.computeAiBuckets(teamUsed, T_2026)
		assert.equal(b2.hasAiAccess, false)
		assert.equal(b2.denyReason, 'quota')
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

	it('FORCE_LEGACY nazwa + brak aktywnej subskrypcji + przed końcem grace: z powrotem grandfathered', () => {
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
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_2026), false)
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

	const T_LIP420_INSIDE = new Date('2026-07-15T12:00:00.000Z')
	const T_LIP420_AFTER_GRACE = new Date('2026-08-05T12:00:00.000Z')

	it('lip420: legacy grandfathered do 1.08.2026, potem freemium', () => {
		const team = { name: 'lip420', isActive: true, maxUsers: 10 }
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_LIP420_INSIDE), true)
		assert.equal(e.isLegacyPreBillingTeam(team, T_LIP420_INSIDE), true)
		assert.equal(e.isFreemiumTierTeam(team, T_LIP420_INSIDE), false)
		assert.equal(e.isLegacyPreBillingGraceExpired(team, T_LIP420_AFTER_GRACE), true)
		assert.equal(e.isFreemiumTierTeam(team, T_LIP420_AFTER_GRACE), true)
	})

	it('lip420: 10 wiadomości AI na cały okres legacy (wspólna pula)', () => {
		const teamFresh = {
			name: 'lip420',
			isActive: true,
			maxUsers: 10,
			legacyOneOffAiMessagesUsed: 0,
		}
		const b1 = e.computeAiBuckets(teamFresh, T_LIP420_INSIDE)
		assert.equal(b1.hasAiAccess, true)
		assert.equal(b1.totalRemaining, 10)

		const teamUsed = { ...teamFresh, legacyOneOffAiMessagesUsed: 10 }
		const b2 = e.computeAiBuckets(teamUsed, T_LIP420_INSIDE)
		assert.equal(b2.hasAiAccess, false)
		assert.equal(b2.denyReason, 'quota')
	})

	it('lip420 ze Starterem aktywnym: nie legacy — limity jak pakiet', () => {
		const team = {
			name: 'lip420',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingModuleKeys: ['ai_assistant'],
			billingStatus: 'active',
			billingPeriodEnd: new Date('2027-06-01T00:00:00.000Z'),
			aiMessagesUsedInMonth: 0,
			aiUsageMonthKey: '2026-07',
		}
		assert.equal(e.isStructuralLegacyPreBillingTeam(team, T_LIP420_INSIDE), false)
		const b = e.computeAiBuckets(team, T_LIP420_INSIDE)
		assert.equal(b.hasAiAccess, true)
		assert.equal(b.monthlyRemaining, 50)
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

	it('buildClientEntitlements: wygasły plan + billingHadPaidPlan — dokup AI zablokowany (canPurchaseAddon false)', () => {
		const billingPeriodEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		const team = {
			name: 'X',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd,
			billingHadPaidPlan: true,
			aiPackBalance: 50,
		}
		const ent = e.buildClientEntitlements(team, {})
		assert.equal(ent.billingHadPaidPlan, true)
		assert.equal(ent.freemiumTier, true)
		assert.equal(ent.ai.canPurchaseAddon, false)
	})

	it('buildClientEntitlements: aktywny starter — dokup AI dozwolony', () => {
		const billingPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
		const team = {
			name: 'X',
			isActive: true,
			maxUsers: 10,
			billingPlanKey: 'starter',
			billingStatus: 'active',
			billingPeriodEnd,
			billingHadPaidPlan: true,
		}
		const ent = e.buildClientEntitlements(team, {})
		assert.equal(ent.ai.canPurchaseAddon, true)
		assert.equal(ent.freemiumTier, false)
	})
})
