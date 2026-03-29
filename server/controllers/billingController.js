const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingPaymentSession = require('../models/BillingPaymentSession')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { sendBillingPurchaseThankYouEmail } = require('../services/emailService')
const { buildPublicCatalog } = require('../services/billingCatalogService')
const billingRequestService = require('../services/billingRequestService')
const billingActivationService = require('../services/billingActivationService')
const { getP24Config } = require('../services/przelewy24/p24Config')
const { createCheckoutSessionAndRegister } = require('../services/przelewy24/p24CheckoutService')
const { countTeamSeats } = require('../services/teamSeatCountService')

const BILLING_SUPER_ADMIN_EMAIL = 'michalipka1@gmail.com'

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

function normInvoiceField(v, maxLen) {
	if (v == null) return ''
	const s = String(v).trim()
	return s.slice(0, maxLen)
}

exports.patchTeamInvoice = async (req, res) => {
	try {
		const { companyName, address, nip } = req.body || {}
		const team = await Team.findById(req.user.teamId)
		if (!team) {
			return res.status(404).json({ success: false, message: 'Team not found' })
		}
		team.billingInvoiceCompanyName = normInvoiceField(companyName, 200)
		team.billingInvoiceAddress = normInvoiceField(address, 500)
		team.billingInvoiceNip = normInvoiceField(nip, 32)
		await team.save()
		const teamMemberCount = await countTeamSeats(req.user.teamId)
		res.json({
			success: true,
			entitlements: {
				...entitlementsService.buildClientEntitlements(team, { activeSeatCount: teamMemberCount }),
				teamMemberCount,
			},
		})
	} catch (e) {
		console.error('billingController.patchTeamInvoice:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.getSuperPaidPlanTeams = async (req, res) => {
	try {
		if (req.user?.username !== BILLING_SUPER_ADMIN_EMAIL) {
			return res.status(403).json({ success: false, message: 'Forbidden' })
		}
		const sessions = await BillingPaymentSession.find({ status: 'paid', kind: 'plan' })
			.sort({ updatedAt: -1 })
			.lean()
		const latestByTeam = new Map()
		for (const s of sessions) {
			const tid = String(s.teamId)
			if (!latestByTeam.has(tid)) latestByTeam.set(tid, s)
		}
		const teamIds = [...latestByTeam.keys()]
		if (teamIds.length === 0) {
			return res.json({ success: true, rows: [] })
		}
		const teams = await Team.find({ _id: { $in: teamIds } })
			.select('name adminEmail')
			.lean()
		const teamById = new Map(teams.map(t => [String(t._id), t]))
		const rows = teamIds.map(tid => {
			const s = latestByTeam.get(tid)
			const t = teamById.get(tid)
			return {
				teamId: tid,
				teamName: t?.name ?? '—',
				teamAdminEmail: t?.adminEmail ?? null,
				payerEmail: s.customerEmail || null,
				planKey: s.planKey || null,
				billingCycle: s.billingCycle || null,
				paidAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
			}
		})
		rows.sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
		res.json({ success: true, rows })
	} catch (e) {
		console.error('billingController.getSuperPaidPlanTeams:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}

exports.postSuperThankPurchaseEmail = async (req, res) => {
	try {
		if (req.user?.username !== BILLING_SUPER_ADMIN_EMAIL) {
			return res.status(403).json({ success: false, message: 'Forbidden' })
		}
		const { toEmail, teamName } = req.body || {}
		const to = normInvoiceField(toEmail, 320)
		if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
			return res.status(400).json({ success: false, message: 'Invalid email', code: 'VALIDATION' })
		}
		await sendBillingPurchaseThankYouEmail(to, normInvoiceField(teamName, 200) || undefined)
		res.json({ success: true, message: 'Sent' })
	} catch (e) {
		console.error('billingController.postSuperThankPurchaseEmail:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}
