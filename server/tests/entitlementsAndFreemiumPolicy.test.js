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

const { LEGACY_PRE_BILLING_GRACE_UNTIL, TRIAL, AI_FAIR_USE } = require('../constants/planCatalog')

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

	it('seat overcapacity: GET team users dla własnego teamId dozwolone tylko Adminowi', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(
			policy.isFreemiumSeatOverageAllowed(`/api/teams/${teamId}/users`, 'GET', teamId, ['Admin']),
			true
		)
		assert.equal(
			policy.isFreemiumSeatOverageAllowed(`/api/teams/${teamId}/users`, 'GET', teamId, ['Pracownik (Worker)']),
			false
		)
	})

	it('seat overcapacity: ewidencja i dashboard zablokowane — zespół ma zejść do limitu albo kupić pakiet', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/dashboard/summary', 'GET', teamId, ['Admin']), false)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/work-activities', 'GET', teamId, ['Admin']), false)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/workdays', 'GET', teamId, ['Pracownik (Worker)']), false)
	})

	it('seat overcapacity: notifications, push (Admin / HR) i userlogs (Admin) dozwolone; pracownik nie', () => {
		const teamId = '507f1f77bcf86cd799439011'
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/notifications', 'GET', teamId, ['HR']), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/push/preferences', 'GET', teamId, ['Admin']), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/userlogs/abc', 'GET', teamId, ['Admin']), true)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/userlogs/abc', 'GET', teamId, ['HR']), false)
		assert.equal(policy.isFreemiumSeatOverageAllowed('/api/notifications', 'GET', teamId, ['Pracownik (Worker)']), false)
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

	it('karencja past_due (Stripe): do billingPeriodEnd pełny plan, moduły Core wg wykupionych, potem freemium', () => {
		const team = {
			name: 'NormalnyZespol',
			isActive: true,
			maxUsers: 15,
			billingPlanKey: 'base_s',
			billingStatus: 'inactive',
			billingCycle: 'monthly',
			billingModuleKeys: ['timer_qr'],
			stripeCustomerId: 'cus_x',
			stripeSubscriptionId: 'sub_x',
			stripeSubscriptionStatus: 'past_due',
			billingPeriodEnd: new Date('2026-06-22T00:00:00.000Z'), // koniec opłaconego okresu + 7 dni
		}
		const inGrace = new Date('2026-06-18T12:00:00.000Z')
		const afterGrace = new Date('2026-06-23T12:00:00.000Z')
		assert.equal(e.isPaidGracePeriod(team, inGrace), true)
		assert.equal(e.isPaidSubscriptionActive(team, inGrace), true)
		assert.equal(e.isFreemiumTierTeam(team, inGrace), false)
		// Core: wykupiony moduł + asystent AI w cenie Core (od 10.2026)
		assert.deepEqual(e.effectiveBillingModuleKeys(team, inGrace), ['timer_qr', 'ai_assistant'])
		assert.equal(e.isPaidGracePeriod(team, afterGrace), false)
		assert.equal(e.isPaidSubscriptionActive(team, afterGrace), false)
		assert.equal(e.isFreemiumTierTeam(team, afterGrace), true)
		// bez subskrypcji Stripe (np. P24) status past_due nie ma znaczenia
		assert.equal(e.isPaidGracePeriod({ ...team, stripeSubscriptionId: null }, inGrace), false)
		// baner/„Zmień kartę” — flagi klienta w karencji
		const ent = e.buildClientEntitlements(team, { activeSeatCount: 10 })
		assert.equal(ent.stripe.paymentPastDue, true)
		assert.equal(ent.stripe.canManagePaymentMethod, true)
		assert.equal(ent.stripe.canCancelSubscription, false)
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

	it('pre-billing legacy: AI bez widocznego limitu, ukryty bezpiecznik jak w okresie próbnym', () => {
		const team = {
			name: 'FirmaZMongoLegacy',
			isActive: true,
			maxUsers: 50,
			legacyOneOffAiMessagesUsed: 10,
			aiUsageMonthKey: e.currentMonthKey(),
			aiMessagesUsedInMonth: 0,
		}
		const b = e.computeAiBuckets(team, T_2026)
		assert.equal(b.hasAiAccess, true)
		assert.equal(b.metered, false)
		assert.equal(b.fairUse, true)
		const teamUsed = { ...team, aiMessagesUsedInMonth: AI_FAIR_USE.trialMonthlyMessages }
		const b2 = e.computeAiBuckets(teamUsed, T_2026)
		assert.equal(b2.hasAiAccess, false)
		assert.equal(b2.denyReason, 'fair_use')
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

	it('lip420: stara pula 10 wiadomości legacy już nie blokuje — AI w rozsądnym użyciu', () => {
		const teamUsedOldPool = {
			name: 'lip420',
			isActive: true,
			maxUsers: 10,
			legacyOneOffAiMessagesUsed: 10,
		}
		const b = e.computeAiBuckets(teamUsedOldPool, T_LIP420_INSIDE)
		assert.equal(b.hasAiAccess, true)
		assert.equal(b.fairUse, true)
		assert.equal(b.denyReason, undefined)
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
		assert.equal(b.metered, false)
		assert.equal(b.fairUse, true)
		assert.equal(b.monthlyRemaining, AI_FAIR_USE.paidMonthlyMessages)
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

	it('maxUsersOverride: aktywny Core bez daty końca (jak Halo) — limit 20 zamiast 15, tylko w górę', () => {
		const halo = { name: 'Halo Rental System', isActive: true, maxUsers: 15, billingPlanKey: 'starter', billingStatus: 'active', billingPeriodEnd: null }
		assert.equal(e.effectiveMaxUsers(halo), 15)
		assert.equal(e.effectiveMaxUsers({ ...halo, maxUsersOverride: 20 }), 20)
		// Nadpisanie nie obniża limitu planu i ignoruje śmieci
		assert.equal(e.effectiveMaxUsers({ ...halo, maxUsersOverride: 10 }), 15)
		assert.equal(e.effectiveMaxUsers({ ...halo, maxUsersOverride: '20' }), 20)
		assert.equal(e.effectiveMaxUsers({ ...halo, maxUsersOverride: 19.5 }), 15)
		// Przekroczenie miejsc liczone od tego samego limitu; plan, moduły i AI bez zmian
		const ent = e.buildClientEntitlements({ ...halo, maxUsersOverride: 20 }, { activeSeatCount: 16 })
		assert.equal(ent.maxUsers, 20)
		assert.equal(ent.paidPlanSeatLimitExceeded ?? false, false)
		assert.equal(ent.planKey, 'base_s')
		assert.deepEqual(ent.modules.effectiveKeys, e.buildClientEntitlements(halo, { activeSeatCount: 15 }).modules.effectiveKeys)
	})

	it('maxUsersOverride: nie działa bez aktywnego płatnego planu (trial, plan darmowy)', () => {
		const trialEnded = { name: 'X', isActive: true, maxUsers: 5, maxUsersOverride: 20, billingPlanKey: 'trial', billingStatus: 'expired', trialEndsAt: new Date('2026-04-01T00:00:00.000Z') }
		assert.equal(e.effectiveMaxUsers(trialEnded, T_TRIAL_ENDED), TRIAL.maxUsers)
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

	it('buildClientEntitlements: aktywny starter — pakiety AI wycofane (canPurchaseAddon false)', () => {
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
		assert.equal(ent.ai.canPurchaseAddon, false)
		assert.equal(ent.freemiumTier, false)
	})

	it('AI bez limitu: okres próbny — bez licznika w UI, stara pula 10 nie blokuje, bezpiecznik miesięczny', () => {
		const team = {
			name: 'Nowy zespół',
			isActive: true,
			maxUsers: 5,
			billingPlanKey: 'trial',
			trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
			trialAiMessagesUsed: 10,
			aiUsageMonthKey: e.currentMonthKey(),
			aiMessagesUsedInMonth: 0,
		}
		const ent = e.buildClientEntitlements(team, {})
		assert.equal(ent.ai.hasAccess, true)
		assert.equal(ent.ai.metered, false)
		assert.equal(ent.ai.fairUse, true)
		assert.equal(ent.ai.remainingApprox, null)
		assert.equal(ent.ai.trialCap, null)
		const capped = { ...team, aiMessagesUsedInMonth: AI_FAIR_USE.trialMonthlyMessages }
		assert.equal(e.computeAiBuckets(capped).denyReason, 'fair_use')
	})

	it('AI bez limitu: pakiet Pro i każdy Core — bezpiecznik płatny (asystent AI w cenie Core)', () => {
		const base = {
			name: 'Firma',
			isActive: true,
			maxUsers: 30,
			billingStatus: 'active',
			billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			billingHadPaidPlan: true,
			aiUsageMonthKey: e.currentMonthKey(),
			aiMessagesUsedInMonth: 400,
		}
		const pro = e.computeAiBuckets({ ...base, billingPlanKey: 'pro' })
		assert.equal(pro.hasAiAccess, true)
		assert.equal(pro.fairUse, true)
		assert.equal(pro.monthlyRemaining, AI_FAIR_USE.paidMonthlyMessages - 400)
		const coreAi = e.computeAiBuckets({ ...base, billingPlanKey: 'base_s', billingModuleKeys: ['schedules_ai'] })
		assert.equal(coreAi.hasAiAccess, true)
		assert.equal(coreAi.fairUse, true)
		const coreTimerOnly = e.computeAiBuckets({ ...base, billingPlanKey: 'base_s', billingModuleKeys: ['timer_qr'] })
		assert.equal(coreTimerOnly.hasAiAccess, true)
		assert.equal(coreTimerOnly.fairUse, true)
		const proCapped = e.computeAiBuckets({ ...base, billingPlanKey: 'pro', aiMessagesUsedInMonth: AI_FAIR_USE.paidMonthlyMessages })
		assert.equal(proCapped.hasAiAccess, false)
		assert.equal(proCapped.denyReason, 'fair_use')
	})

	it('AI bez limitu: bezpiecznik nadpisywalny zmienną środowiskową', () => {
		const prev = process.env.AI_FAIR_USE_MONTHLY
		process.env.AI_FAIR_USE_MONTHLY = '5'
		try {
			const team = {
				name: 'Firma',
				isActive: true,
				billingPlanKey: 'pro',
				billingStatus: 'active',
				billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				aiUsageMonthKey: e.currentMonthKey(),
				aiMessagesUsedInMonth: 5,
			}
			assert.equal(e.computeAiBuckets(team).denyReason, 'fair_use')
		} finally {
			if (prev === undefined) delete process.env.AI_FAIR_USE_MONTHLY
			else process.env.AI_FAIR_USE_MONTHLY = prev
		}
	})

	it('AI bez limitu: bez AI — wygasły okres próbny, wygasły plan, zespół wymuszony w tryb darmowy', () => {
		const monthKey = e.currentMonthKey()
		const expiredTrial = {
			name: 'Po próbie',
			isActive: true,
			billingPlanKey: 'trial',
			trialEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
			aiUsageMonthKey: monthKey,
			aiMessagesUsedInMonth: 0,
		}
		const lapsedPlan = {
			name: 'Wygasły Pro',
			isActive: true,
			billingPlanKey: 'pro',
			billingStatus: 'active',
			billingPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
			billingHadPaidPlan: true,
			aiUsageMonthKey: monthKey,
			aiMessagesUsedInMonth: 0,
		}
		// testleeegacy jest w FORCE_FREEMIUM_TEST_TEAM_NAMES — zapisany trial nie może dać AI
		const forcedFree = {
			name: 'testleeegacy',
			isActive: true,
			billingPlanKey: 'trial',
			trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
			aiUsageMonthKey: monthKey,
			aiMessagesUsedInMonth: 0,
		}
		for (const team of [expiredTrial, lapsedPlan, forcedFree]) {
			const b = e.computeAiBuckets(team)
			assert.equal(b.hasAiAccess, false, team.name)
			assert.equal(b.fairUse, undefined, team.name)
			assert.equal(e.buildClientEntitlements(team, {}).ai.fairUse, false, team.name)
		}
	})

	it('AI bez limitu: AI_FAIR_USE_MONTHLY=0 awaryjnie wyłącza AI w planach płatnych', () => {
		const prev = process.env.AI_FAIR_USE_MONTHLY
		process.env.AI_FAIR_USE_MONTHLY = '0'
		try {
			const team = {
				name: 'Firma',
				isActive: true,
				billingPlanKey: 'pro',
				billingStatus: 'active',
				billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				aiUsageMonthKey: e.currentMonthKey(),
				aiMessagesUsedInMonth: 0,
			}
			const b = e.computeAiBuckets(team)
			assert.equal(b.hasAiAccess, false)
			assert.equal(b.denyReason, 'fair_use')
		} finally {
			if (prev === undefined) delete process.env.AI_FAIR_USE_MONTHLY
			else process.env.AI_FAIR_USE_MONTHLY = prev
		}
	})

	it('nowy cennik — kto co widzi: obecnym zespołom nic nie znika, Core dostaje asystenta AI', () => {
		const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
		const paid = { isActive: true, billingStatus: 'active', billingPeriodEnd: future, billingHadPaidPlan: true }
		const all = ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant']
		const cases = [
			// [opis, zespół, funkcje przed zmianą, funkcje po zmianie]
			['BZ: Core do 15 bez modułów', { name: 'BZ', ...paid, billingPlanKey: 'base_s', billingModuleKeys: [] }, [], ['ai_assistant']],
			['Halo: starter, ręczne rozliczenie bez końca okresu', { name: 'Halo Rental System', isActive: true, billingStatus: 'active', billingPlanKey: 'starter', billingModuleKeys: [] }, [], ['ai_assistant']],
			['Core z Timer i QR', { name: 'X', ...paid, billingPlanKey: 'base_m', billingModuleKeys: ['timer_qr'] }, ['timer_qr'], ['timer_qr', 'ai_assistant']],
			['Core z dawnym osobnym czatem', { name: 'X', ...paid, billingPlanKey: 'base_l', billingModuleKeys: ['chat'] }, ['chat'], ['chat', 'ai_assistant']],
			['Core z dawnym modułem Asystent AI', { name: 'X', ...paid, billingPlanKey: 'base_s', billingModuleKeys: ['ai_assistant'] }, ['ai_assistant'], ['ai_assistant']],
			['nowy Core do 5 z „Zadania i czat”', { name: 'X', ...paid, billingPlanKey: 'base_5', billingModuleKeys: ['tasks_chat'] }, null, ['tasks', 'chat', 'ai_assistant']],
			['IRONSKY / Smart Cube: PRO do 30', { name: 'X', ...paid, billingPlanKey: 'pro', billingModuleKeys: all }, all, all],
			['nowy PRO do 15', { name: 'X', ...paid, billingPlanKey: 'pro_15' }, null, all],
			['Business', { name: 'X', ...paid, billingPlanKey: 'business' }, all, all],
			['wygasły Core (plan darmowy)', { name: 'X', ...paid, billingPeriodEnd: past, billingPlanKey: 'base_s', billingModuleKeys: ['timer_qr'] }, [], []],
			['okres próbny (inne bramki: wszystko)', { name: 'X', isActive: true, billingPlanKey: 'trial', trialEndsAt: future }, [], []],
		]
		for (const [label, team, before, after] of cases) {
			const got = e.effectiveBillingModuleKeys(team)
			assert.deepEqual(got, after, label)
			// Nic, co zespół miał przed zmianą, nie znika
			if (before) for (const key of before) assert.ok(got.includes(key), label + ': zniknęło ' + key)
		}
	})
})
