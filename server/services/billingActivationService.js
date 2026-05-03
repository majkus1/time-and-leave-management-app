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

/**
 * Idempotent paid plan activation (manual ops today; same entrypoint for future Przelewy24 webhooks).
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
}) {
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
	team.maxUsers = limits.maxUsers
	team.billingHadPaidPlan = true
	if (limits.tierType === 'bundle') {
		team.billingModuleKeys = effectiveIncludedModulesForPlan(nk)
	} else {
		const mods = Array.isArray(moduleKeys) ? moduleKeys.filter(isModuleKey) : []
		team.billingModuleKeys = [...new Set(mods)]
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
		},
	})

	const logUserId = await resolveLogUserId(team._id)
	if (logUserId) {
		await createLog(
			logUserId,
			'BILLING_SUBSCRIPTION_ACTIVATED',
			`team=${team._id} plan=${nk} cycle=${billingCycle} until=${end.toISOString()} by=${actorLabel}`,
			logUserId
		)
	}

	return { ok: true, duplicate: false, teamId: team._id.toString() }
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
	applyAiAddonPack,
}
