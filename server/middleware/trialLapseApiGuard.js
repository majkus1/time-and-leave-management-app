const jwt = require('jsonwebtoken')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')

function apiPath(req) {
	return (req.originalUrl || req.url || '').split('?')[0]
}

/**
 * Blokuje większość API przy wygasłym trialu bez opłacenia lub po dacie przejściowej dla kont sprzed billing.
 * Wyjątki: logowanie, billing, dokumenty prawne, CSRF, /users/me, logout, refresh, GET własnego zespołu.
 */
async function trialLapseApiGuardAsync(req, res, next) {
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
			'name billingPlanKey billingStatus trialEndsAt billingHadPaidPlan maxUsers isActive'
		)
		if (!team || team.isActive === false) return next()

		if (!entitlementsService.requiresFullAppSubscriptionWall(team)) return next()

		if (req.method === 'GET' && path === '/api/csrf-token') return next()
		if (path.startsWith('/api/billing')) return next()
		if (path.startsWith('/api/legal')) return next()
		if (path === '/api/users/me' && req.method === 'GET') return next()
		if (path === '/api/users/logout' && req.method === 'POST') return next()
		if (path === '/api/users/refresh-token' && req.method === 'POST') return next()

		const teamOwnGet = /^\/api\/teams\/([a-f\d]{24})$/i.exec(path)
		if (
			req.method === 'GET' &&
			teamOwnGet &&
			teamOwnGet[1].toLowerCase() === String(decoded.teamId).toLowerCase()
		) {
			return next()
		}

		return res.status(403).json({
			code: 'TRIAL_LAPSED',
			message:
				'Okres próbny zakończył się. Wybierz plan w sekcji Pakiety i rozliczenia lub wyślij zgłoszenie zakupu.',
			messageEn:
				'Your trial has ended. Choose a plan under Packages & billing or send a purchase request.',
		})
	} catch (err) {
		console.error('[trialLapseApiGuard]', err)
		return next(err)
	}
}

function trialLapseApiGuard(req, res, next) {
	Promise.resolve(trialLapseApiGuardAsync(req, res, next)).catch(next)
}

module.exports = trialLapseApiGuard
