const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const {
	isPaidPlanKey,
	isAddonId,
	isModuleKey,
	normalizePaidPlanKey,
	isBundlePlanKey,
	isCorePlanKey,
} = require('../constants/planCatalog')
const entitlementsService = require('./entitlementsService')
const { assertPaidPlanSeatLimit } = require('./billingPlanSeatLimitService')
const { assertTeamInvoiceComplete } = require('./billingInvoiceValidation')

/**
 * Shared rules for email purchase requests and Przelewy24 checkout.
 * @returns {Promise<{ team: import('mongoose').Document, requester: import('mongoose').Document }>}
 */
async function validateBillingPurchaseIntent(params) {
	const { teamId, requestingUserId, kind, planKey, addonId, billingCycle, moduleKeys } = params

	const team = await Team.findById(teamId).select(
		'name adminEmail billingPlanKey billingHadPaidPlan billingStatus billingPeriodEnd trialEndsAt billingInvoiceBuyerType billingInvoiceCompanyName billingInvoiceAddress billingInvoiceNip'
	)
	if (!team) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}

	assertTeamInvoiceComplete(team)

	const requester = await User.findById(requestingUserId).select('username firstName lastName')
	if (!requester) {
		const err = new Error('User not found')
		err.code = 'NOT_FOUND'
		throw err
	}

	if (kind === 'plan') {
		if (!isPaidPlanKey(planKey)) {
			const err = new Error('Invalid plan')
			err.code = 'VALIDATION'
			throw err
		}
		if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
			const err = new Error('Invalid billing cycle')
			err.code = 'VALIDATION'
			throw err
		}
		await assertPaidPlanSeatLimit(teamId, planKey)
		if (
			entitlementsService.isPaidSubscriptionActive(team) &&
			normalizePaidPlanKey(team.billingPlanKey) === normalizePaidPlanKey(planKey)
		) {
			const err = new Error(
				'Ten pakiet jest już aktywny dla zespołu. Napisz do nas, jeśli chcesz zmienić rozliczenie (np. na roczne) lub przejść na wyższy plan.'
			)
			err.code = 'VALIDATION'
			throw err
		}
		const nk = normalizePaidPlanKey(planKey)
		const rawMods = Array.isArray(moduleKeys) ? moduleKeys : []
		if (rawMods.length > 0) {
			if (isBundlePlanKey(nk)) {
				const err = new Error(
					'Pakiety PRO / BUSINESS / ENTERPRISE zawierają wszystkie moduły — nie dodawaj listy modułów.'
				)
				err.code = 'VALIDATION'
				throw err
			}
			if (!isCorePlanKey(nk)) {
				const err = new Error('Lista modułów dotyczy tylko planów CORE.')
				err.code = 'VALIDATION'
				throw err
			}
			const seen = new Set()
			for (const mk of rawMods) {
				if (!isModuleKey(mk)) {
					const err = new Error('Nieprawidłowy klucz modułu.')
					err.code = 'VALIDATION'
					throw err
				}
				if (seen.has(mk)) {
					const err = new Error('Zduplikowany moduł na liście.')
					err.code = 'VALIDATION'
					throw err
				}
				seen.add(mk)
			}
		}
	} else if (kind === 'addon') {
		if (!isAddonId(addonId)) {
			const err = new Error('Invalid addon')
			err.code = 'VALIDATION'
			throw err
		}
		if (!entitlementsService.isPaidSubscriptionActive(team)) {
			const err = new Error(
				'Pakietów wiadomości AI można dokupić tylko przy aktywnej płatnej subskrypcji zespołu (plan nie może być wygasły).'
			)
			err.code = 'ADDON_REQUIRES_PAID_PLAN'
			throw err
		}
	} else {
		const err = new Error('Invalid kind')
		err.code = 'VALIDATION'
		throw err
	}

	return { team, requester }
}

/**
 * Walidacja koszyka Stripe: 1× plan + opcjonalnie moduły CORE (ten sam billingCycle).
 * @param {{ teamId: string, requestingUserId: string, priceDefinitions: object[] }} params
 */
async function validateStripeSubscriptionCheckout(params) {
	const { teamId, requestingUserId, priceDefinitions } = params
	const defs = Array.isArray(priceDefinitions) ? priceDefinitions : []
	const planDefs = defs.filter(d => d.kind === 'plan')
	const moduleDefs = defs.filter(d => d.kind === 'module')

	if (planDefs.length !== 1) {
		const err = new Error('Subskrypcja wymaga dokładnie jednej pozycji planu.')
		err.code = 'VALIDATION'
		throw err
	}
	const planDef = planDefs[0]
	for (const m of moduleDefs) {
		if (m.billingCycle !== planDef.billingCycle) {
			const err = new Error('Moduły muszą mieć ten sam cykl co plan (miesięczny / roczny).')
			err.code = 'VALIDATION'
			throw err
		}
	}

	const { team, requester } = await validateBillingPurchaseIntent({
		teamId,
		requestingUserId,
		kind: 'plan',
		planKey: planDef.planKey,
		billingCycle: planDef.billingCycle,
	})

	const nk = normalizePaidPlanKey(planDef.planKey)
	if (isBundlePlanKey(nk) && moduleDefs.length > 0) {
		const err = new Error(
			'Pakiety PRO / BUSINESS / ENTERPRISE zawierają wszystkie moduły — usuń dodatkowe pozycje modułów z koszyka.'
		)
		err.code = 'VALIDATION'
		throw err
	}

	for (const m of moduleDefs) {
		if (!isModuleKey(m.moduleKey)) {
			const err = new Error('Nieznany klucz modułu w mapie Stripe.')
			err.code = 'VALIDATION'
			throw err
		}
	}

	return { team, requester, planDef, moduleDefs }
}

module.exports = { validateBillingPurchaseIntent, validateStripeSubscriptionCheckout }
