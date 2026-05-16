const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const billingActivationService = require('../billingActivationService')
const { getP24Config } = require('./p24Config')
const { signVerify } = require('./p24Sign')
const { p24Request, assertP24Ok } = require('./p24HttpClient')
const { subscriptionPeriodEnd } = require('./p24Period')
/** status=1 w GET /transaction/by/sessionId — opłacona (sandbox/prod). */
function isP24TransactionPaidStatus(status) {
	return status === 1 || status === '1' || status === 'success'
}

/**
 * PUT verify + aktywacja (wspólne dla webhook i confirm-return).
 */
async function finalizeP24PaidSession(session, orderId) {
	const cfg = getP24Config()
	const verifyBody = {
		merchantId: cfg.merchantId,
		posId: cfg.posId,
		sessionId: session.sessionId,
		amount: session.amountGrosze,
		currency: 'PLN',
		orderId,
		sign: signVerify({
			sessionId: session.sessionId,
			orderId,
			amount: session.amountGrosze,
			currency: 'PLN',
			crc: cfg.crc,
		}),
	}

	const { json } = await p24Request('PUT', '/transaction/verify', verifyBody)
	assertP24Ok(json, 'transaction/verify')
	if (json?.data?.status !== 'success') {
		const err = new Error('P24 verify: status not success')
		err.code = 'P24_VERIFY'
		throw err
	}

	const idempotencyKey = `p24:order:${orderId}`
	const paymentNow = new Date()

	if (session.kind === 'plan') {
		const periodEnd = subscriptionPeriodEnd(paymentNow, session.billingCycle)
		const mk =
			Array.isArray(session.moduleKeys) && session.moduleKeys.length > 0 ? session.moduleKeys : undefined
		await billingActivationService.activatePaidPlan({
			teamId: session.teamId,
			planKey: session.planKey,
			billingCycle: session.billingCycle,
			periodEnd: periodEnd.toISOString(),
			idempotencyKey,
			actorLabel: 'p24',
			moduleKeys: mk,
		})
	} else {
		await billingActivationService.applyAiAddonPack({
			teamId: session.teamId,
			addonId: session.addonId,
			idempotencyKey,
			actorLabel: 'p24',
		})
	}

	session.status = 'paid'
	session.p24OrderId = String(orderId)
	await session.save()

	return { ok: true, orderId: String(orderId) }
}

module.exports = { finalizeP24PaidSession, isP24TransactionPaidStatus }
