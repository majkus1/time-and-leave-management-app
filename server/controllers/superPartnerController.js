const partnerService = require('../services/partnerService')
const commissionService = require('../services/commissionService')
const Stripe = require('stripe')
const { getStripeConfig } = require('../services/stripe/stripeConfig')

/** Klient Stripe tylko do odczytu faktury przy doliczaniu prowizji; null, gdy brak klucza */
function stripeClientOrNull() {
	const cfg = getStripeConfig()
	return cfg.credsOk ? new Stripe(cfg.secretKey) : null
}

// Panel admina programu partnerskiego (tylko właściciel platformy — requireSuperAdmin w index.js)
function handle(fn) {
	return async (req, res) => {
		try {
			res.json({ success: true, ...(await fn(req)) })
		} catch (error) {
			if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code || null })
			console.error('[superPartner]', error)
			res.status(500).json({ success: false, message: 'Błąd serwera' })
		}
	}
}

exports.list = handle(async () => ({ partners: await partnerService.listPartners() }))
exports.create = handle(async req => ({ partner: await partnerService.createPartner(req.body) }))
exports.update = handle(async req => ({ partner: await partnerService.updatePartner(req.params.id, req.body) }))
exports.referredTeams = handle(async req => ({ teams: await partnerService.listReferredTeams(req.params.id) }))
exports.searchTeams = handle(async req => ({ teams: await partnerService.searchTeams(req.query.q) }))
exports.assignTeam = handle(async req => partnerService.assignTeamToPartner(req.params.teamId, req.body?.partnerId ?? null))

// Prowizje (etap 2)
exports.commissionReport = handle(async req => ({ report: await commissionService.monthReport(req.query.month) }))
exports.commissionEntries = handle(async req => commissionService.listEntries({ partnerId: req.query.partnerId, month: req.query.month }))
exports.closeMonth = handle(async req => commissionService.closeMonth(req.body?.month))
exports.markPaid = handle(async req => commissionService.markPaid({ partnerId: req.params.id, paidAt: req.body?.paidAt, note: req.body?.note }))
exports.reverseEntry = handle(async req =>
	commissionService.reverseManually({ entryId: req.params.entryId, refundedNetGrosze: req.body?.refundedNetGrosze, nonce: req.body?.nonce, note: req.body?.note, userId: req.user.userId })
)
exports.retryAccrual = handle(async req =>
	commissionService.retryAccrual({
		sourceType: req.body?.sourceType,
		sourceId: req.body?.sourceId,
		stripe: req.body?.sourceType === 'stripe_invoice' ? stripeClientOrNull() : null,
	})
)
exports.manualInvoices = handle(async () => ({ invoices: await commissionService.listManualInvoices() }))
exports.recordManualInvoice = handle(async req =>
	commissionService.recordManualInvoice({
		teamId: req.body?.teamId,
		invoiceNumber: req.body?.invoiceNumber,
		netGrosze: req.body?.netGrosze,
		paidAt: req.body?.paidAt,
		note: req.body?.note,
		userId: req.user.userId,
	})
)
