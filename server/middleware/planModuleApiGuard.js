const jwt = require('jsonwebtoken')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const freemiumApiPolicyService = require('../services/freemiumApiPolicyService')
const { corePaidPathAllowed } = require('../services/planModuleAccessPolicy')
const { isCorePlanKey, normalizePaidPlanKey } = require('../constants/planCatalog')

function apiPath(req) {
	return freemiumApiPolicyService.normalizeApiPath(req)
}

function moduleForbiddenPayload() {
	return {
		code: 'PLAN_MODULE_DISABLED',
		message:
			'Ten moduł nie jest włączony w Twoim planie CORE. Rozszerz subskrypcję o moduł lub przejdź na pakiet PRO lub wyższy w Pakietach i rozliczeniach.',
		messageEn:
			'This module is not included in your CORE plan. Add the module or upgrade to PRO (or higher) under Packages & billing.',
	}
}

async function planModuleApiGuardAsync(req, res, next) {
	const path = apiPath(req)
	if (!path.startsWith('/api')) return next()

	if (
		path.startsWith('/api/public') ||
		path.startsWith('/api/billing/webhooks') ||
		path.startsWith('/api/billing/internal')
	) {
		return next()
	}

	if (path === '/api/users/login' && req.method === 'POST') return next()
	if (path === '/api/users/refresh-token' && req.method === 'POST') return next()
	if (path === '/api/teams/register' && req.method === 'POST') return next()

	const token = req.cookies?.token
	if (!token) return next()

	let decoded
	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET)
	} catch {
		return next()
	}

	try {
		if (freemiumApiPolicyService.isPlatformSuperAdminActivityAllowed(path, decoded)) {
			return next()
		}

		const team = await Team.findById(decoded.teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt billingHadPaidPlan maxUsers isActive'
		)
		if (!team || team.isActive === false) return next()

		if (entitlementsService.isFreemiumTierTeam(team)) return next()

		if (entitlementsService.isLegacyPreBillingTeam(team)) return next()

		if (entitlementsService.isSpecialNamedTeam(team)) return next()

		if (entitlementsService.isTrialActive(team)) return next()

		if (!entitlementsService.isPaidSubscriptionActive(team)) return next()

		const nk = normalizePaidPlanKey(team.billingPlanKey)
		if (!isCorePlanKey(nk)) return next()

		const effectiveKeys = entitlementsService.effectiveBillingModuleKeys(team)
		if (corePaidPathAllowed(path, effectiveKeys)) return next()

		return res.status(403).json(moduleForbiddenPayload())
	} catch (err) {
		console.error('[planModuleApiGuard]', err)
		return next(err)
	}
}

function planModuleApiGuard(req, res, next) {
	Promise.resolve(planModuleApiGuardAsync(req, res, next)).catch(next)
}

module.exports = planModuleApiGuard
