const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingLedgerEntry = require('../models/BillingLedgerEntry')(firmDb)
const { createLog } = require('./logService')
const {
	PAID_PLANS,
	AI_ADDON_PACKS,
	isPaidPlanKey,
	isAddonId,
	normalizePaidPlanKey,
	effectiveIncludedModulesForPlan,
	isModuleKey,
} = require('../constants/planCatalog')
const entitlementsService = require('./entitlementsService')
const { assertPaidPlanSeatLimit } = require('./billingPlanSeatLimitService')
const {
	LIVE_STRIPE_SUBSCRIPTION_STATUSES,
	manualActivationModuleKeys,
	manualActivationConflicts,
} = require('../utils/billingPlanChange')
const User = require('../models/user')(firmDb)

async function resolveLogUserId(teamId) {
	const adminUser = await User.findOne({ teamId, roles: { $in: ['Admin'] } })
		.select('_id')
		.sort({ _id: 1 })
	if (adminUser) return adminUser._id
	const any = await User.findOne({ teamId }).select('_id').sort({ _id: 1 })
	return any ? any._id : null
}

function mapPlanToSubscriptionType(planKey) {
	if (planKey === 'enterprise') return 'enterprise'
	return 'premium'
}

/** Walidacja wejścia aktywacji — wspólna dla webhooków i ręcznej obsługi (także na sucho) */
function parseActivationInput({ teamId, planKey, billingCycle, periodEnd, idempotencyKey }) {
	if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length > 200) {
		const err = new Error('Invalid idempotencyKey')
		err.code = 'VALIDATION'
		throw err
	}
	const nk = normalizePaidPlanKey(planKey)
	if (!isPaidPlanKey(nk)) {
		const err = new Error('Unknown plan')
		err.code = 'VALIDATION'
		throw err
	}
	if (!mongoose.Types.ObjectId.isValid(teamId)) {
		const err = new Error('Invalid teamId')
		err.code = 'VALIDATION'
		throw err
	}
	if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
		const err = new Error('billingCycle must be monthly or annual')
		err.code = 'VALIDATION'
		throw err
	}
	const end = periodEnd ? new Date(periodEnd) : null
	if (!end || Number.isNaN(end.getTime())) {
		const err = new Error('Invalid periodEnd')
		err.code = 'VALIDATION'
		throw err
	}
	return { nk, end }
}

/**
 * Idempotent paid plan activation (manual ops today; same entrypoint for future Przelewy24 webhooks).
 * detachEndedStripeSubscription — tylko ręczna aktywacja: odpina zakończoną subskrypcję Stripe (zespół przechodzi
 * na rozliczenie ręczne), inaczej zostaje jej ID: brak przypomnień o końcu okresu i przycisk anulowania z błędem.
 */
async function activatePaidPlan({
	teamId,
	planKey,
	billingCycle,
	periodEnd,
	idempotencyKey,
	actorLabel = 'billing',
	enforceSeatLimit = true,
	moduleKeys,
	detachEndedStripeSubscription = false,
}) {
	const { nk, end } = parseActivationInput({ teamId, planKey, billingCycle, periodEnd, idempotencyKey })

	const existing = await BillingLedgerEntry.findOne({ idempotencyKey })
	if (existing) {
		return { ok: true, duplicate: true, teamId: existing.teamId.toString(), action: existing.action }
	}

	const limits = PAID_PLANS[nk]
	const team = await Team.findById(teamId)
	if (!team || team.isActive === false) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}

	if (enforceSeatLimit) {
		await assertPaidPlanSeatLimit(teamId, nk)
	}

	team.billingPlanKey = nk
	team.billingStatus = 'active'
	team.billingCycle = billingCycle
	team.billingPeriodEnd = end
	const isFirstPaidActivation = team.billingHadPaidPlan !== true
	team.maxUsers = limits.maxUsers
	team.billingHadPaidPlan = true
	if (limits.tierType === 'bundle') {
		team.billingModuleKeys = effectiveIncludedModulesForPlan(nk)
	} else {
		const mods = Array.isArray(moduleKeys) ? moduleKeys.filter(isModuleKey) : []
		team.billingModuleKeys = [...new Set(mods)]
	}
	let detachedStripeSubscriptionId = null
	if (
		detachEndedStripeSubscription &&
		team.stripeSubscriptionId &&
		!LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(team.stripeSubscriptionStatus)
	) {
		detachedStripeSubscriptionId = String(team.stripeSubscriptionId)
		team.stripeSubscriptionId = null
		team.stripeCancelAtPeriodEnd = false
	}
	team.subscriptionType = mapPlanToSubscriptionType(nk)
	entitlementsService.ensureMonthRolloverInMemory(team)
	await team.save()
	await entitlementsService.syncTimerEnabledSettingForTeam(team._id)

	await BillingLedgerEntry.create({
		idempotencyKey,
		teamId: team._id,
		action: 'subscription_activated',
		payload: {
			planKey: nk,
			billingCycle,
			moduleKeys: team.billingModuleKeys,
			periodEnd: end.toISOString(),
			actorLabel,
			...(detachedStripeSubscriptionId ? { detachedStripeSubscriptionId } : {}),
		},
	})

	// Potwierdzenie dla klienta tylko po realnej platnosci (P24 / Stripe) — nie po recznej aktywacji.
	// Blad maila nie moze cofnac aktywacji; dublowanie webhooka trzyma klucz idempotencji.
	if (['p24', 'stripe', 'stripe-recovery'].includes(String(actorLabel))) {
		try {
			const lifecycleEmailService = require('./lifecycleEmailService')
			void lifecycleEmailService
				.sendPaymentConfirmationForTeam(team, {
					planKey: nk,
					billingCycle,
					periodEnd: end,
					isFirst: isFirstPaidActivation,
					idempotencyKey,
				})
				.catch(err => console.error('[lifecycleEmails] potwierdzenie platnosci:', err.message))
		} catch (err) {
			console.error('[lifecycleEmails] potwierdzenie platnosci:', err.message)
		}
	}

	const logUserId = await resolveLogUserId(team._id)
	if (logUserId) {
		await createLog(
			logUserId,
			'BILLING_SUBSCRIPTION_ACTIVATED',
			`team=${team._id} plan=${nk} cycle=${billingCycle} until=${end.toISOString()} by=${actorLabel}`,
			logUserId
		)
	}

	return {
		ok: true,
		duplicate: false,
		teamId: team._id.toString(),
		...(detachedStripeSubscriptionId ? { detachedStripeSubscriptionId } : {}),
	}
}

function manualActivationError(code, message, meta) {
	const err = new Error(message)
	err.code = code
	if (meta) err.meta = meta
	return err
}

/** Powtórzony klucz — przy ręcznej obsłudze błąd zamiast cichego „duplicate”, żeby poprawka nie przepadła */
function duplicateKeyError(entry) {
	const at = entry?.createdAt ? new Date(entry.createdAt).toISOString() : null
	return manualActivationError(
		'DUPLICATE_IDEMPOTENCY_KEY',
		`Ten idempotencyKey był już użyty${at ? ` (${at})` : ''} — nic nie zmieniono. Przy poprawce albo kolejnej zmianie użyj nowego klucza.`,
		{
			appliedAt: at,
			planKey: entry?.payload?.planKey || null,
			moduleKeys: entry?.payload?.moduleKeys || null,
			periodEnd: entry?.payload?.periodEnd || null,
		}
	)
}

/**
 * Ręczna aktywacja (endpoint internal, obsługa zgłoszeń mailem). Ponad activatePaidPlan: moduły Core jawnie,
 * strażnicy daty i działającej subskrypcji Stripe (manualActivationConflicts), powtórzony klucz jako błąd,
 * tryb na sucho (dryRun) do sprawdzenia przed anulowaniem w Stripe, a po aktywacji odpięcie zakończonej subskrypcji.
 * force: true świadomie pomija strażników daty i Stripe (np. naprawa po nieudanym webhooku) — limitu miejsc nie.
 */
async function activatePaidPlanManually({
	teamId,
	planKey,
	billingCycle,
	periodEnd,
	idempotencyKey,
	moduleKeys,
	force = false,
	dryRun = false,
	now = new Date(),
}) {
	const { nk, end } = parseActivationInput({ teamId, planKey, billingCycle, periodEnd, idempotencyKey })
	const mods = manualActivationModuleKeys(nk, moduleKeys)

	const existing = await BillingLedgerEntry.findOne({ idempotencyKey })
	if (existing) throw duplicateKeyError(existing)

	// Pola jawnie — przy .lean() brak pola to undefined, strażnicy to obsługują
	const team = await Team.findById(teamId)
		.select('isActive billingPeriodEnd stripeSubscriptionId stripeSubscriptionStatus')
		.lean()
	if (!team || team.isActive === false) {
		throw manualActivationError('NOT_FOUND', 'Team not found')
	}

	const { conflicts, stripeCancelRequired } = manualActivationConflicts({ team, periodEnd: end, now, dryRun })
	if (conflicts.length > 0 && !force) {
		throw manualActivationError('MANUAL_ACTIVATION_CONFLICT', conflicts.map(c => c.message).join(' '), {
			conflicts: conflicts.map(c => c.code),
			forceAllowed: true,
		})
	}
	const forcedConflicts = conflicts.map(c => c.code)

	if (dryRun) {
		await assertPaidPlanSeatLimit(teamId, nk)
		return {
			ok: true,
			dryRun: true,
			stripeCancelRequired,
			forcedConflicts,
			wouldApply: {
				planKey: nk,
				billingCycle,
				moduleKeys: PAID_PLANS[nk].tierType === 'bundle' ? effectiveIncludedModulesForPlan(nk) : mods,
				periodEnd: end.toISOString(),
				maxUsers: PAID_PLANS[nk].maxUsers,
			},
		}
	}

	const result = await activatePaidPlan({
		teamId,
		planKey: nk,
		billingCycle,
		periodEnd: end,
		idempotencyKey,
		moduleKeys: mods,
		actorLabel: 'internal_api',
		detachEndedStripeSubscription: true,
	})
	// Wyścig dwóch identycznych wywołań — drugie też ma usłyszeć, że nic nie zmieniło
	if (result.duplicate) throw duplicateKeyError(await BillingLedgerEntry.findOne({ idempotencyKey }).lean())
	return { ...result, forcedConflicts }
}

/**
 * Idempotent AI pack credit (top-up balance).
 */
async function applyAiAddonPack({ teamId, addonId, idempotencyKey, actorLabel = 'billing' }) {
	if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length > 200) {
		const err = new Error('Invalid idempotencyKey')
		err.code = 'VALIDATION'
		throw err
	}
	if (!isAddonId(addonId)) {
		const err = new Error('Unknown addon')
		err.code = 'VALIDATION'
		throw err
	}
	if (!mongoose.Types.ObjectId.isValid(teamId)) {
		const err = new Error('Invalid teamId')
		err.code = 'VALIDATION'
		throw err
	}

	const existing = await BillingLedgerEntry.findOne({ idempotencyKey })
	if (existing) {
		return { ok: true, duplicate: true, teamId: existing.teamId.toString() }
	}

	const pack = AI_ADDON_PACKS[addonId]
	const team = await Team.findById(teamId)
	if (!team || team.isActive === false) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}
	if (!entitlementsService.isPaidSubscriptionActive(team)) {
		const err = new Error(
			'Pakietów AI można nadać tylko gdy zespół ma aktywną płatną subskrypcję (wygasły plan — odmowa).'
		)
		err.code = 'VALIDATION'
		throw err
	}

	team.aiPackBalance = (team.aiPackBalance || 0) + pack.messages
	await team.save()

	await BillingLedgerEntry.create({
		idempotencyKey,
		teamId: team._id,
		action: 'ai_pack_applied',
		payload: { addonId, messages: pack.messages, actorLabel },
	})

	const logUserId = await resolveLogUserId(team._id)
	if (logUserId) {
		await createLog(
			logUserId,
			'BILLING_AI_PACK_APPLIED',
			`team=${team._id} addon=${addonId} +${pack.messages} by=${actorLabel}`,
			logUserId
		)
	}

	return { ok: true, duplicate: false, teamId: team._id.toString(), added: pack.messages }
}

module.exports = {
	activatePaidPlan,
	activatePaidPlanManually,
	applyAiAddonPack,
}
