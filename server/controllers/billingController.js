const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { buildPublicCatalog } = require('../services/billingCatalogService')
const billingRequestService = require('../services/billingRequestService')
const billingActivationService = require('../services/billingActivationService')

exports.getCatalog = async (req, res) => {
	try {
		res.json({ success: true, catalog: buildPublicCatalog() })
	} catch (e) {
		console.error('billingController.getCatalog:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.getEntitlements = async (req, res) => {
	try {
		const team = await Team.findById(req.user.teamId)
		if (!team) {
			return res.status(404).json({ success: false, message: 'Team not found' })
		}
		res.json({
			success: true,
			entitlements: entitlementsService.buildClientEntitlements(team),
		})
	} catch (e) {
		console.error('billingController.getEntitlements:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.postPurchaseRequest = async (req, res) => {
	try {
		const { kind, planKey, addonId, billingCycle, note } = req.body || {}

		await billingRequestService.createPurchaseMailRequest({
			teamId: req.user.teamId,
			requestingUserId: req.user.userId,
			kind,
			planKey,
			addonId,
			billingCycle,
			note,
		})

		res.json({ success: true, message: 'Request sent' })
	} catch (e) {
		if (e.code === 'VALIDATION' || e.code === 'NOT_FOUND' || e.code === 'ADDON_REQUIRES_PAID_PLAN') {
			return res.status(400).json({ success: false, message: e.message, code: e.code })
		}
		if (e.code === 'CONFIG') {
			return res.status(503).json({ success: false, message: e.message, code: e.code })
		}
		console.error('billingController.postPurchaseRequest:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.postInternalActivateSubscription = async (req, res) => {
	try {
		const { teamId, planKey, billingCycle, periodEnd, idempotencyKey } = req.body || {}
		const result = await billingActivationService.activatePaidPlan({
			teamId,
			planKey,
			billingCycle,
			periodEnd,
			idempotencyKey,
			actorLabel: 'internal_api',
		})
		res.json({ success: true, ...result })
	} catch (e) {
		if (e.code === 'VALIDATION' || e.code === 'NOT_FOUND') {
			return res.status(400).json({ success: false, message: e.message, code: e.code })
		}
		console.error('billingController.postInternalActivateSubscription:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.postInternalApplyAddon = async (req, res) => {
	try {
		const { teamId, addonId, idempotencyKey } = req.body || {}
		const result = await billingActivationService.applyAiAddonPack({
			teamId,
			addonId,
			idempotencyKey,
			actorLabel: 'internal_api',
		})
		res.json({ success: true, ...result })
	} catch (e) {
		if (e.code === 'VALIDATION' || e.code === 'NOT_FOUND') {
			return res.status(400).json({ success: false, message: e.message, code: e.code })
		}
		console.error('billingController.postInternalApplyAddon:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}
