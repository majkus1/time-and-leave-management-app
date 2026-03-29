const crypto = require('crypto')
const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const { validateBillingPurchaseIntent } = require('../billingPurchaseIntentValidator')
const {
	checkoutAmountGroszeForPlan,
	checkoutAmountGroszeForAddon,
} = require('../../constants/planCatalog')
const { getP24Config } = require('./p24Config')
const { signRegister } = require('./p24Sign')
const { p24Request, assertP24Ok } = require('./p24HttpClient')

const PLAN_LABELS = {
	starter: 'Starter',
	pro: 'Pro',
	business: 'Business',
	enterprise: 'Enterprise',
}

function truncate(str, max) {
	if (!str || str.length <= max) return str
	return str.slice(0, max)
}

function pickPayerEmail(team, requester) {
	const admin = (team.adminEmail || '').trim()
	if (admin) return truncate(admin, 50)
	const u = (requester.username || '').trim()
	return truncate(u, 50)
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {string} params.userId
 * @param {'plan'|'addon'} params.kind
 * @param {string} [params.planKey]
 * @param {string} [params.addonId]
 * @param {'monthly'|'annual'} [params.billingCycle]
 * @param {string} [params.note]
 */
async function createCheckoutSessionAndRegister(params) {
	const cfg = getP24Config()
	if (!cfg.ready) {
		const err = new Error(
			cfg.credsOk
				? 'Brak publicznego adresu webhooka P24. Ustaw P24_WEBHOOK_URL lub API_PUBLIC_URL (HTTPS), np. tunel ngrok do lokalnego API.'
				: 'Przelewy24 nie jest skonfigurowane (P24_MERCHANT_ID, P24_POS_ID, P24_CRC, P24_API_KEY).'
		)
		err.code = 'P24_NOT_CONFIGURED'
		throw err
	}

	const { team, requester } = await validateBillingPurchaseIntent({
		teamId: params.teamId,
		requestingUserId: params.userId,
		kind: params.kind,
		planKey: params.planKey,
		addonId: params.addonId,
		billingCycle: params.billingCycle,
	})

	const email = pickPayerEmail(team, requester)
	if (!email || !email.includes('@')) {
		const err = new Error(
			'Brak poprawnego adresu e-mail do płatności. Uzupełnij e-mail administratora zespołu w ustawieniach.'
		)
		err.code = 'VALIDATION'
		throw err
	}

	const kind = params.kind
	let amountGrosze
	let description

	if (kind === 'plan') {
		amountGrosze = checkoutAmountGroszeForPlan(params.planKey, params.billingCycle)
		const label = PLAN_LABELS[params.planKey] || params.planKey
		const cycle = params.billingCycle === 'annual' ? 'roczny' : 'miesięczny'
		description = truncate(`Planopia ${label} (${cycle}) — ${team.name}`, 1024)
	} else {
		amountGrosze = checkoutAmountGroszeForAddon(params.addonId)
		description = truncate(`Planopia pakiet AI ${params.addonId} — ${team.name}`, 1024)
	}

	const sessionId = crypto.randomUUID()
	const urlReturn = truncate(
		`${cfg.appPublicUrl}/packages?p24=1&session=${encodeURIComponent(sessionId)}`,
		250
	)
	const urlStatus = truncate(cfg.webhookUrl, 250)

	const note = (params.note || '').trim().slice(0, 2000)

	const sessionDoc = await BillingPaymentSession.create({
		sessionId,
		teamId: team._id,
		createdByUserId: requester._id,
		kind,
		planKey: kind === 'plan' ? params.planKey : undefined,
		addonId: kind === 'addon' ? params.addonId : undefined,
		billingCycle: kind === 'plan' ? params.billingCycle : undefined,
		amountGrosze,
		customerEmail: email,
		note,
		status: 'pending',
	})

	const registerBody = {
		merchantId: cfg.merchantId,
		posId: cfg.posId,
		sessionId,
		amount: amountGrosze,
		currency: 'PLN',
		description,
		email,
		country: 'PL',
		language: 'pl',
		urlReturn,
		urlStatus,
		waitForResult: false,
		regulationAccept: false,
		channel: 16,
		sign: signRegister({
			sessionId,
			merchantId: cfg.merchantId,
			amount: amountGrosze,
			currency: 'PLN',
			crc: cfg.crc,
		}),
	}

	try {
		const { json } = await p24Request('POST', '/transaction/register', registerBody)
		assertP24Ok(json, 'transaction/register')
		const token = json?.data?.token
		if (!token || typeof token !== 'string') {
			const err = new Error('P24: brak tokena w odpowiedzi rejestracji transakcji')
			err.code = 'P24_API'
			throw err
		}
		const redirectUrl = `${cfg.trnHost}/trnRequest/${encodeURIComponent(token)}`
		return { redirectUrl, sessionId, sandbox: cfg.sandbox }
	} catch (e) {
		sessionDoc.status = 'register_error'
		sessionDoc.registerError = (e && e.message) || String(e)
		await sessionDoc.save()
		throw e
	}
}

module.exports = { createCheckoutSessionAndRegister }
