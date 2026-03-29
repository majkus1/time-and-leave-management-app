const jwt = require('jsonwebtoken')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { countTeamSeats } = require('../services/teamSeatCountService')
const freemiumApiPolicyService = require('../services/freemiumApiPolicyService')

function apiPath(req) {
	return freemiumApiPolicyService.normalizeApiPath(req)
}

function freemiumForbiddenPayload(seatOverCapacity) {
	if (seatOverCapacity) {
		return {
			code: 'FREEMIUM_SEAT_OVER_CAPACITY',
			message:
				'W trybie darmowym może korzystać maksymalnie 5 użytkowników. Usuń nadmiarowe konta w Zarządzaniu zespołem (tylko administrator), aby odblokować aplikację.',
			messageEn:
				'The free tier allows up to 5 users. Remove extra accounts in Team management (admin only) to unlock the app.',
		}
	}
	return {
		code: 'FREEMIUM_MODULE_DISABLED',
		message:
			'Ta funkcja nie jest dostępna w trybie darmowym. Rozszerz plan w sekcji Pakiety i rozliczenia.',
		messageEn: 'This feature is not available on the free tier. Upgrade under Packages & billing.',
	}
}

async function freemiumApiGuardAsync(req, res, next) {
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
		const team = await Team.findById(decoded.teamId).select(
			'name billingPlanKey billingStatus trialEndsAt billingPeriodEnd billingHadPaidPlan maxUsers isActive'
		)
		if (!team || team.isActive === false) return next()

		if (!entitlementsService.isFreemiumTierTeam(team)) return next()

		const seatCount = await countTeamSeats(decoded.teamId)
		const maxSeats = freemiumApiPolicyService.freemiumMaxAppSeats()
		const seatOverCapacity = seatCount > maxSeats

		const allowed = seatOverCapacity
			? freemiumApiPolicyService.isFreemiumSeatOverageAllowed(path, req.method, decoded.teamId)
			: freemiumApiPolicyService.isFreemiumActiveTierAllowed(path, req.method)

		if (allowed) return next()

		const payload = freemiumForbiddenPayload(seatOverCapacity)
		return res.status(403).json(payload)
	} catch (err) {
		console.error('[freemiumApiGuard]', err)
		return next(err)
	}
}

function freemiumApiGuard(req, res, next) {
	Promise.resolve(freemiumApiGuardAsync(req, res, next)).catch(next)
}

module.exports = freemiumApiGuard
