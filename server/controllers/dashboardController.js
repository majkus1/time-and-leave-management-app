const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { buildDashboardSummary, buildTeamInsights } = require('../services/dashboardSummaryService')

async function assertDashboardAllowed(req) {
	const team = await Team.findById(req.user.teamId).select(
		'name billingPlanKey billingStatus trialEndsAt billingPeriodEnd billingHadPaidPlan maxUsers isActive'
	)
	if (!team || team.isActive === false) {
		const err = new Error('Team not found')
		err.status = 404
		throw err
	}
	if (entitlementsService.isFreemiumTierTeam(team)) {
		const err = new Error('Dashboard is not available on the free tier')
		err.status = 403
		err.code = 'FREEMIUM_MODULE_DISABLED'
		throw err
	}
	const settings = await Settings.getSettings(req.user.teamId)
	if (settings.dashboardEnabled !== true) {
		const err = new Error('Dashboard is disabled for this team')
		err.status = 403
		err.code = 'DASHBOARD_DISABLED'
		throw err
	}
}

exports.getSummary = async (req, res) => {
	try {
		await assertDashboardAllowed(req)
		const summary = await buildDashboardSummary(req.user.userId)
		return res.json({ summary })
	} catch (error) {
		console.error('Error building dashboard summary:', error)
		return res.status(error.status || 500).json({
			code: error.code,
			message: error.status === 404 ? error.message : error.status === 403 ? error.message : 'Failed to load dashboard summary',
		})
	}
}

exports.getTeamInsights = async (req, res) => {
	try {
		await assertDashboardAllowed(req)
		const insights = await buildTeamInsights(req.user.userId, {
			period: req.query.period,
			startDate: req.query.startDate || null,
			endDate: req.query.endDate || null,
			userId: req.query.userId || null,
			department: req.query.department || null,
		})
		return res.json({ insights })
	} catch (error) {
		console.error('Error building dashboard team insights:', error)
		return res.status(error.status || 500).json({
			code: error.code,
			message: error.status === 403
				? error.message
				: error.status === 404
					? error.message
					: 'Failed to load team insights',
		})
	}
}
