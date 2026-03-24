const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const {
	SPECIAL_TEAM_NAMES,
	SPECIAL_UNLIMITED_AI_TEAM_NAMES,
	SPECIAL_MANUAL_BILLING_TEAM_NAMES,
} = require('../constants/specialTeams')
const { TRIAL, PAID_PLANS, LEGACY_PRE_BILLING_GRACE_UNTIL } = require('../constants/planCatalog')

const MAX_CONSUME_RETRIES = 10

function currentMonthKey(d = new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isSpecialNamedTeam(team) {
	return team && SPECIAL_TEAM_NAMES.includes(team.name)
}

function hasManualBillingPeriodHidden(team) {
	return team && SPECIAL_MANUAL_BILLING_TEAM_NAMES.includes(team.name)
}

/**
 * Dokument Team bez pól billing (przed cennikiem). Nie obejmuje zespołów specjalnych (np. OficjalnyAdminowy).
 */
function isStructuralLegacyPreBillingTeam(team) {
	if (!team || isSpecialNamedTeam(team)) return false
	if (team.billingPlanKey) return false
	if (team.billingStatus) return false
	if (team.trialEndsAt) return false
	return true
}

/** Po tej dacie structural legacy podlega temu samemu „murze” co wygasły trial bez płatności. */
function isLegacyPreBillingGraceExpired(team, now = new Date()) {
	return isStructuralLegacyPreBillingTeam(team) && now >= LEGACY_PRE_BILLING_GRACE_UNTIL
}

/**
 * Trwa okres przejściowy dla kont sprzed billing — pełna apka bez subskrypcji; AI nadal po wykupieniu planu.
 */
function isLegacyPreBillingTeam(team, now = new Date()) {
	return isStructuralLegacyPreBillingTeam(team) && now < LEGACY_PRE_BILLING_GRACE_UNTIL
}

/** Mur API / socket: wygasły trial bez opłacenia, wygaśnięty opłacony okres, albo minął okres przejściowy legacy. */
function requiresFullAppSubscriptionWall(team, now = new Date()) {
	if (!team || team.isActive === false) return false
	if (isSpecialNamedTeam(team)) return false
	if (isTrialExpiredUnpaid(team, now)) return true
	if (isPaidPlanPeriodLapsed(team, now)) return true
	if (isLegacyPreBillingGraceExpired(team, now)) return true
	return false
}

/** Tylko wybrane nazwy (np. OficjalnyAdminowy) — AI bez limitu licznika. Halo Rental System: Starter z limitem jak w PAID_PLANS. */
function hasUnrestrictedAi(team) {
	return team && SPECIAL_UNLIMITED_AI_TEAM_NAMES.includes(team.name)
}

function canSpendPackBalance(team) {
	return team.billingHadPaidPlan === true
}

function isTrialActive(team, now = new Date()) {
	return team.billingPlanKey === 'trial' && team.trialEndsAt && new Date(team.trialEndsAt) > now
}

function isTrialExpiredUnpaid(team, now = new Date()) {
	if (team.billingPlanKey !== 'trial') return false
	if (!team.trialEndsAt) return false
	return new Date(team.trialEndsAt) <= now && team.billingStatus !== 'active'
}

function isPaidSubscriptionActive(team, now = new Date()) {
	if (team.billingStatus !== 'active') return false
	if (!team.billingPlanKey || team.billingPlanKey === 'trial') return false
	if (!PAID_PLANS[team.billingPlanKey]) return false
	if (team.billingPeriodEnd && new Date(team.billingPeriodEnd) < now) return false
	return true
}

/**
 * Minął ustawiony koniec opłaconego okresu dla płatnego tieru — odnowienie jak po trialu.
 * Brak billingPeriodEnd (np. Halo, rozliczenia ręczne) = nie ten stan.
 */
function isPaidPlanPeriodLapsed(team, now = new Date()) {
	if (!team?.billingPlanKey || team.billingPlanKey === 'trial') return false
	if (!PAID_PLANS[team.billingPlanKey]) return false
	if (!team.billingPeriodEnd) return false
	return new Date(team.billingPeriodEnd) < now
}

function ensureMonthRolloverInMemory(team) {
	const key = currentMonthKey()
	if (team.aiUsageMonthKey !== key) {
		team.aiUsageMonthKey = key
		team.aiMessagesUsedInMonth = 0
	}
}

function effectiveMaxUsers(team, now = new Date()) {
	if (isSpecialNamedTeam(team)) return team.maxUsers
	if (isPaidSubscriptionActive(team, now) && PAID_PLANS[team.billingPlanKey]) {
		return PAID_PLANS[team.billingPlanKey].maxUsers
	}
	if (isTrialActive(team, now)) return TRIAL.maxUsers
	if (isTrialExpiredUnpaid(team, now)) return Math.min(team.maxUsers, TRIAL.maxUsers)
	if (isPaidPlanPeriodLapsed(team, now)) return Math.min(team.maxUsers, TRIAL.maxUsers)
	if (isLegacyPreBillingGraceExpired(team, now)) return Math.min(team.maxUsers, TRIAL.maxUsers)
	if (isLegacyPreBillingTeam(team, now)) return team.maxUsers
	return team.maxUsers
}

/**
 * @returns {{ totalRemaining: number, trialRemaining: number, monthlyRemaining: number, packRemaining: number, hasAiAccess: boolean, metered: boolean, denyReason?: 'no_subscription'|'quota' }}
 */
function computeAiBuckets(team, now = new Date()) {
	if (hasUnrestrictedAi(team)) {
		return {
			totalRemaining: Number.POSITIVE_INFINITY,
			trialRemaining: Number.POSITIVE_INFINITY,
			monthlyRemaining: Number.POSITIVE_INFINITY,
			packRemaining: Number.POSITIVE_INFINITY,
			hasAiAccess: true,
			metered: false,
		}
	}

	if (isLegacyPreBillingTeam(team, now)) {
		return {
			totalRemaining: 0,
			trialRemaining: 0,
			monthlyRemaining: 0,
			packRemaining: 0,
			hasAiAccess: false,
			metered: true,
			denyReason: 'no_subscription',
		}
	}

	ensureMonthRolloverInMemory(team)

	const packBal = team.aiPackBalance || 0
	const packOk = canSpendPackBalance(team) && packBal > 0

	if (
		isTrialExpiredUnpaid(team, now) ||
		isPaidPlanPeriodLapsed(team, now) ||
		isLegacyPreBillingGraceExpired(team, now)
	) {
		return {
			totalRemaining: packOk ? packBal : 0,
			trialRemaining: 0,
			monthlyRemaining: 0,
			packRemaining: packBal,
			hasAiAccess: packOk,
			metered: true,
			denyReason: packOk ? undefined : 'quota',
		}
	}

	if (isTrialActive(team, now)) {
		const cap = TRIAL.aiTrialOneOffTotal
		const used = team.trialAiMessagesUsed || 0
		const trialRemaining = Math.max(0, cap - used)
		const total = trialRemaining + (packOk ? packBal : 0)
		return {
			totalRemaining: total,
			trialRemaining,
			monthlyRemaining: 0,
			packRemaining: packBal,
			hasAiAccess: total > 0,
			metered: true,
			denyReason: total > 0 ? undefined : 'quota',
		}
	}

	if (isPaidSubscriptionActive(team, now)) {
		const plan = PAID_PLANS[team.billingPlanKey]
		const included = plan.aiMessagesPerMonth
		const usedMonth = team.aiMessagesUsedInMonth || 0
		const monthlyRemaining = Math.max(0, included - usedMonth)
		const total = monthlyRemaining + (packOk ? packBal : 0)
		return {
			totalRemaining: total,
			trialRemaining: 0,
			monthlyRemaining,
			packRemaining: packBal,
			hasAiAccess: total > 0,
			metered: true,
			denyReason: total > 0 ? undefined : 'quota',
		}
	}

	// np. wygasła subskrypcja — zostaje tylko saldo z pakietów (jeśli był wcześniej płatny plan)
	const totalLeft = packOk ? packBal : 0
	return {
		totalRemaining: totalLeft,
		trialRemaining: 0,
		monthlyRemaining: 0,
		packRemaining: packBal,
		hasAiAccess: totalLeft > 0,
		metered: true,
		denyReason: totalLeft > 0 ? undefined : 'quota',
	}
}

function pickConsumeBucket(team, now = new Date()) {
	if (hasUnrestrictedAi(team)) return null
	if (isLegacyPreBillingTeam(team, now)) return null

	ensureMonthRolloverInMemory(team)

	if (isTrialActive(team, now)) {
		const cap = TRIAL.aiTrialOneOffTotal
		const used = team.trialAiMessagesUsed || 0
		if (used < cap) return 'trial'
		if (canSpendPackBalance(team) && (team.aiPackBalance || 0) > 0) return 'pack'
		return null
	}

	if (isPaidSubscriptionActive(team, now)) {
		const plan = PAID_PLANS[team.billingPlanKey]
		const usedMonth = team.aiMessagesUsedInMonth || 0
		if (usedMonth < plan.aiMessagesPerMonth) return 'monthly'
		if (canSpendPackBalance(team) && (team.aiPackBalance || 0) > 0) return 'pack'
		return null
	}

	if (canSpendPackBalance(team) && (team.aiPackBalance || 0) > 0) return 'pack'
	return null
}

function buildClientEntitlements(team) {
	const now = new Date()
	const structuralLegacy = isStructuralLegacyPreBillingTeam(team)
	const legacyGrandfatheredActive = isLegacyPreBillingTeam(team, now)
	const unrestricted = hasUnrestrictedAi(team)
	const buckets = computeAiBuckets(team, now)
	const maxUsers = effectiveMaxUsers(team, now)

	return {
		legacy: structuralLegacy,
		legacyGrandfatheredActive,
		legacyGrandfatheredAccessEndsAt: structuralLegacy
			? LEGACY_PRE_BILLING_GRACE_UNTIL.toISOString()
			: null,
		billingHadPaidPlan: team.billingHadPaidPlan === true,
		hideBillingPeriodEnd: hasManualBillingPeriodHidden(team),
		planKey: team.billingPlanKey || null,
		billingStatus: team.billingStatus || null,
		billingCycle: team.billingCycle || null,
		trialEndsAt: team.trialEndsAt || null,
		billingPeriodEnd: team.billingPeriodEnd || null,
		maxUsers,
		storedMaxUsers: team.maxUsers,
		ai: {
			unrestricted,
			/** Wspólny licznik: czat AI + AI grafiku + drafty w asystencie */
			sharedPoolAppliesTo: ['ai_assistant', 'schedule_ai'],
			metered: buckets.metered,
			hasAccess: buckets.hasAiAccess,
			needsSubscription: structuralLegacy,
			remainingApprox: buckets.metered ? buckets.totalRemaining : null,
			denyReason: buckets.denyReason || null,
			canPurchaseAddon: team.billingHadPaidPlan === true,
			trialUsed: team.trialAiMessagesUsed || 0,
			trialCap: isTrialActive(team, now) ? TRIAL.aiTrialOneOffTotal : null,
			usedInMonth: team.aiMessagesUsedInMonth || 0,
			monthlyIncluded: isPaidSubscriptionActive(team, now)
				? PAID_PLANS[team.billingPlanKey].aiMessagesPerMonth
				: null,
			packBalance: team.aiPackBalance || 0,
			usageMonthKey: team.aiUsageMonthKey || currentMonthKey(now),
		},
	}
}

async function assertAiMessageAllowed(teamId) {
	const team = await Team.findById(teamId)
	if (!team || team.isActive === false) {
		const err = new Error('Team not found')
		err.code = 'TEAM_INVALID'
		throw err
	}
	const buckets = computeAiBuckets(team)
	if (!buckets.hasAiAccess || buckets.totalRemaining <= 0) {
		const noSub = buckets.denyReason === 'no_subscription'
		const err = new Error(
			noSub
				? 'Asystent AI jest dostępny po wykupieniu planu. Wybierz pakiet w sekcji Pakiety i rozliczenia.'
				: 'Limit wiadomości Asystenta AI został wykorzany (łącznie z AI w grafiku). Możesz dokupić pakiet lub zmienić plan w zakładce Pakiety.'
		)
		err.code = noSub ? 'AI_DISABLED_NO_SUBSCRIPTION' : 'AI_QUOTA_EXCEEDED'
		throw err
	}
}

async function consumeAiMessage(teamId) {
	for (let attempt = 0; attempt < MAX_CONSUME_RETRIES; attempt++) {
		const team = await Team.findById(teamId)
		if (!team) {
			const err = new Error('Team not found')
			err.code = 'TEAM_INVALID'
			throw err
		}
		if (hasUnrestrictedAi(team)) return
		const now = new Date()
		if (isLegacyPreBillingTeam(team, now)) {
			const err = new Error('AI not available')
			err.code = 'AI_DISABLED_NO_SUBSCRIPTION'
			throw err
		}

		ensureMonthRolloverInMemory(team)
		const bucket = pickConsumeBucket(team, now)
		if (!bucket) {
			const err = new Error('AI quota exceeded')
			err.code = 'AI_QUOTA_EXCEEDED'
			throw err
		}

		const prevVersion = team.aiBillingLockVersion || 0
		const setDoc = {
			aiUsageMonthKey: team.aiUsageMonthKey,
			aiMessagesUsedInMonth: team.aiMessagesUsedInMonth,
			trialAiMessagesUsed: team.trialAiMessagesUsed || 0,
			aiPackBalance: team.aiPackBalance || 0,
			aiBillingLockVersion: prevVersion + 1,
		}

		if (bucket === 'trial') setDoc.trialAiMessagesUsed = setDoc.trialAiMessagesUsed + 1
		else if (bucket === 'monthly') setDoc.aiMessagesUsedInMonth = setDoc.aiMessagesUsedInMonth + 1
		else setDoc.aiPackBalance = Math.max(0, setDoc.aiPackBalance - 1)

		const res = await Team.updateOne(
			{ _id: teamId, aiBillingLockVersion: prevVersion },
			{ $set: setDoc }
		)
		if (res.modifiedCount === 1) return
	}

	const err = new Error('Could not record AI usage — please retry')
	err.code = 'AI_CONSUME_RACE'
	throw err
}

async function assertAiMessageAllowedForUser(userId) {
	const User = require('../models/user')(firmDb)
	const user = await User.findById(userId).select('teamId')
	if (!user?.teamId) {
		const err = new Error('User not found')
		err.code = 'USER_INVALID'
		throw err
	}
	await assertAiMessageAllowed(user.teamId)
}

async function consumeAiMessageForUser(userId) {
	const User = require('../models/user')(firmDb)
	const user = await User.findById(userId).select('teamId')
	if (!user?.teamId) {
		const err = new Error('User not found')
		err.code = 'USER_INVALID'
		throw err
	}
	await consumeAiMessage(user.teamId)
}

/** @deprecated use isStructuralLegacyPreBillingTeam */
function isLegacyUnmeteredTeam(team) {
	return isStructuralLegacyPreBillingTeam(team)
}

module.exports = {
	currentMonthKey,
	isSpecialNamedTeam,
	hasManualBillingPeriodHidden,
	isStructuralLegacyPreBillingTeam,
	isLegacyPreBillingGraceExpired,
	isLegacyPreBillingTeam,
	requiresFullAppSubscriptionWall,
	isLegacyUnmeteredTeam,
	hasUnrestrictedAi,
	isTrialActive,
	isTrialExpiredUnpaid,
	isPaidPlanPeriodLapsed,
	isPaidSubscriptionActive,
	effectiveMaxUsers,
	computeAiBuckets,
	buildClientEntitlements,
	assertAiMessageAllowed,
	consumeAiMessage,
	assertAiMessageAllowedForUser,
	consumeAiMessageForUser,
	getTeamById: async teamId => Team.findById(teamId),
	ensureMonthRolloverInMemory,
}
