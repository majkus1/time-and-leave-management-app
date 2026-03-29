const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const billingActivationService = require('../billingActivationService')
const { getP24Config } = require('./p24Config')
const { signVerify, signNotification, timingSafeEqualHex } = require('./p24Sign')
const { p24Request, assertP24Ok } = require('./p24HttpClient')
const { subscriptionPeriodEnd } = require('./p24Period')

function num(v, field) {
	const n = Number(v)
	if (!Number.isFinite(n)) {
		const err = new Error(`Invalid P24 field: ${field}`)
		err.code = 'P24_PAYLOAD'
		throw err
	}
	return n
}

/**
 * Obsługa notyfikacji JSON z P24 (urlStatus): weryfikacja sign → transaction/verify → aktywacja planu / pakietu.
 * Idempotentnie względem BillingLedgerEntry (klucz p24:order:{orderId}).
 */
async function handlePrzelewy24Notification(body) {
	if (!body || typeof body !== 'object') {
		const err = new Error('Empty body')
		err.code = 'P24_PAYLOAD'
		throw err
	}

	const cfg = getP24Config()
	if (!cfg.credsOk) {
		const err = new Error('P24 not configured')
		err.code = 'CONFIG'
		throw err
	}

	const merchantId = num(body.merchantId, 'merchantId')
	const posId = num(body.posId, 'posId')
	const sessionId = String(body.sessionId || '')
	const amount = num(body.amount, 'amount')
	const currency = String(body.currency || 'PLN')
	const orderId = num(body.orderId, 'orderId')
	const methodId =
		body.methodId != null && body.methodId !== '' ? num(body.methodId, 'methodId') : 0
	const originAmountRaw =
		body.originAmount != null && body.originAmount !== '' ? body.originAmount : body.amount
	const originAmount = num(originAmountRaw, 'originAmount')
	const statement = body.statement == null ? '' : String(body.statement)
	const receivedSign = body.sign

	if (!sessionId || typeof receivedSign !== 'string') {
		const err = new Error('Missing sessionId or sign')
		err.code = 'P24_PAYLOAD'
		throw err
	}

	if (merchantId !== cfg.merchantId || posId !== cfg.posId) {
		const err = new Error('merchantId/posId mismatch')
		err.code = 'P24_PAYLOAD'
		throw err
	}

	const computedSign = signNotification({
		merchantId,
		posId,
		sessionId,
		amount,
		originAmount,
		currency,
		orderId,
		methodId,
		statement,
		crc: cfg.crc,
	})

	if (!timingSafeEqualHex(receivedSign, computedSign)) {
		const err = new Error('Invalid P24 notification signature')
		err.code = 'P24_SIGN'
		throw err
	}

	const session = await BillingPaymentSession.findOne({ sessionId })
	if (!session) {
		const err = new Error('Unknown payment session')
		err.code = 'SESSION_NOT_FOUND'
		throw err
	}

	if (session.status === 'paid') {
		return { ok: true, duplicate: true }
	}

	if (session.status !== 'pending') {
		const err = new Error(`Session not pending: ${session.status}`)
		err.code = 'SESSION_STATE'
		throw err
	}

	if (amount !== session.amountGrosze) {
		const err = new Error('Amount mismatch')
		err.code = 'AMOUNT_MISMATCH'
		throw err
	}

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
	const actorLabel = 'p24'
	const paymentNow = new Date()

	if (session.kind === 'plan') {
		const periodEnd = subscriptionPeriodEnd(paymentNow, session.billingCycle)
		await billingActivationService.activatePaidPlan({
			teamId: session.teamId,
			planKey: session.planKey,
			billingCycle: session.billingCycle,
			periodEnd: periodEnd.toISOString(),
			idempotencyKey,
			actorLabel,
		})
	} else {
		await billingActivationService.applyAiAddonPack({
			teamId: session.teamId,
			addonId: session.addonId,
			idempotencyKey,
			actorLabel,
		})
	}

	session.status = 'paid'
	session.p24OrderId = String(orderId)
	await session.save()

	return { ok: true, duplicate: false }
}

module.exports = { handlePrzelewy24Notification }
