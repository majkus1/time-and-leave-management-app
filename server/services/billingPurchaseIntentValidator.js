const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const { isPaidPlanKey, isAddonId } = require('../constants/planCatalog')
const entitlementsService = require('./entitlementsService')
const { assertPaidPlanSeatLimit } = require('./billingPlanSeatLimitService')

/**
 * Shared rules for email purchase requests and Przelewy24 checkout.
 * @returns {Promise<{ team: import('mongoose').Document, requester: import('mongoose').Document }>}
 */
async function validateBillingPurchaseIntent(params) {
	const { teamId, requestingUserId, kind, planKey, addonId, billingCycle } = params

	const team = await Team.findById(teamId).select(
		'name adminEmail billingPlanKey billingHadPaidPlan billingStatus billingPeriodEnd trialEndsAt'
	)
	if (!team) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}

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
		if (entitlementsService.isPaidSubscriptionActive(team) && team.billingPlanKey === planKey) {
			const err = new Error(
				'Ten pakiet jest już aktywny dla zespołu. Napisz do nas, jeśli chcesz zmienić rozliczenie (np. na roczne) lub przejść na wyższy plan.'
			)
			err.code = 'VALIDATION'
			throw err
		}
	} else if (kind === 'addon') {
		if (!isAddonId(addonId)) {
			const err = new Error('Invalid addon')
			err.code = 'VALIDATION'
			throw err
		}
		if (!team.billingHadPaidPlan) {
			const err = new Error(
				'Pakietów wiadomości AI można dokupić dopiero po pierwszej aktywacji płatnego planu dla zespołu.'
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

module.exports = { validateBillingPurchaseIntent }
