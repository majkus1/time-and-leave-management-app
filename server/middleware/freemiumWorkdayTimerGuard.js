const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')

/**
 * Obrona w głąb: timery ewidencji wyłączone dla całego tieru freemium (niezależnie od liczby miejsc).
 */
async function freemiumWorkdayTimerGuard(req, res, next) {
	try {
		const team = await Team.findById(req.user.teamId).select(
			'name billingPlanKey billingStatus trialEndsAt billingPeriodEnd maxUsers isActive'
		)
		if (!team || team.isActive === false) return next()
		if (!entitlementsService.isFreemiumTierTeam(team)) return next()

		return res.status(403).json({
			code: 'FREEMIUM_MODULE_DISABLED',
			message:
				'Timer ewidencji czasu nie jest dostępny w trybie darmowym. Wprowadzaj czas ręcznie lub skorzystaj z planu płatnego.',
			messageEn:
				'The work time timer is not available on the free tier. Enter time manually or upgrade your plan.',
		})
	} catch (e) {
		console.error('[freemiumWorkdayTimerGuard]', e)
		return res.status(500).json({ success: false, message: 'Server error' })
	}
}

module.exports = { freemiumWorkdayTimerGuard }
