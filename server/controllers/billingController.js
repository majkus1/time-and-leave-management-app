const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { buildPublicCatalog } = require('../services/billingCatalogService')
const billingRequestService = require('../services/billingRequestService')
const billingActivationService = require('../services/billingActivationService')
const { getP24Config } = require('../services/przelewy24/p24Config')
const { createCheckoutSessionAndRegister } = require('../services/przelewy24/p24CheckoutService')
const { countTeamSeats } = require('../services/teamSeatCountService')

function billingClientErrorPayload(err) {
	const payload = { success: false, message: err.message, code: err.code }
	if (err.meta && typeof err.meta === 'object') {
		payload.meta = err.meta
	}
	return payload
}

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
		const teamMemberCount = await countTeamSeats(req.user.teamId)
		res.json({
			success: true,
			entitlements: {
				...entitlementsService.buildClientEntitlements(team, { activeSeatCount: teamMemberCount }),
				teamMemberCount,
			},
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
		if (
			e.code === 'VALIDATION' ||
			e.code === 'NOT_FOUND' ||
			e.code === 'ADDON_REQUIRES_PAID_PLAN' ||
			e.code === 'PLAN_SEAT_LIMIT_EXCEEDED'
		) {
			return res.status(400).json(billingClientErrorPayload(e))
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
		if (e.code === 'VALIDATION' || e.code === 'NOT_FOUND' || e.code === 'PLAN_SEAT_LIMIT_EXCEEDED') {
			return res.status(400).json(billingClientErrorPayload(e))
		}
		console.error('billingController.postInternalActivateSubscription:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.getP24Status = async (req, res) => {
	try {
		const cfg = getP24Config()
		res.json({
			success: true,
			p24: {
				configured: cfg.credsOk,
				webhookConfigured: cfg.webhookOk,
				ready: cfg.ready,
				sandbox: cfg.sandbox,
			},
		})
	} catch (e) {
		console.error('billingController.getP24Status:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.postP24Checkout = async (req, res) => {
	try {
		const { kind, planKey, addonId, billingCycle, note } = req.body || {}
		const result = await createCheckoutSessionAndRegister({
			teamId: req.user.teamId,
			userId: req.user.userId,
			kind,
			planKey,
			addonId,
			billingCycle,
			note,
		})
		res.json({ success: true, ...result })
	} catch (e) {
		if (
			e.code === 'VALIDATION' ||
			e.code === 'NOT_FOUND' ||
			e.code === 'ADDON_REQUIRES_PAID_PLAN' ||
			e.code === 'PLAN_SEAT_LIMIT_EXCEEDED' ||
			e.code === 'P24_NOT_CONFIGURED'
		) {
			return res.status(400).json(billingClientErrorPayload(e))
		}
		if (e.code === 'P24_API' || e.code === 'P24_PARSE') {
			return res.status(502).json({
				success: false,
				message: e.message || 'Błąd komunikacji z Przelewy24',
				code: e.code,
			})
		}
		console.error('billingController.postP24Checkout:', e)
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
