const crypto = require('crypto')
const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const Team = require('../../models/Team')(firmDb)
const { validateBillingPurchaseIntent } = require('../billingPurchaseIntentValidator')
const {
	p24CheckoutAmountGroszeForPlan,
	checkoutAmountGroszeForAddon,
	isModuleKey,
	isPaidPlanKey,
	isCorePlanKey,
	normalizePaidPlanKey,
	planLabel,
	moduleLabel,
} = require('../../constants/planCatalog')
const { getP24Config } = require('./p24Config')
const { signRegister } = require('./p24Sign')
const { p24Request, assertP24Ok } = require('./p24HttpClient')


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
 * @param {string[]} [params.moduleKeys] — tylko CORE (Przelewy24)
 * @param {string} [params.note]
 */
async function createCheckoutSessionAndRegister(params) {
	const cfg = getP24Config()
	if (!cfg.ready) {
		const detail = cfg.credsOk
			? 'missing public webhook URL (P24_WEBHOOK_URL or API_PUBLIC_URL)'
			: 'missing P24 credentials'
		console.error('[p24] checkout not ready:', detail)
		const err = new Error('Przelewy24 is not configured')
		err.code = 'P24_NOT_CONFIGURED'
		throw err
	}

	const { team, requester, renewal } = await validateBillingPurchaseIntent({
		teamId: params.teamId,
		requestingUserId: params.userId,
		kind: params.kind,
		planKey: params.planKey,
		addonId: params.addonId,
		billingCycle: params.billingCycle,
		moduleKeys: params.moduleKeys,
		// Ten sam plan przed końcem okresu przechodzi jako przedłużenie — okres liczy finalizeP24PaidSession od obecnego końca
		allowEarlyRenewal: true,
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
	const planModuleKeysClean =
		kind === 'plan' && Array.isArray(params.moduleKeys)
			? params.moduleKeys.filter(m => isModuleKey(m))
			: []

	if (kind === 'plan') {
		amountGrosze = p24CheckoutAmountGroszeForPlan(
			params.planKey,
			params.billingCycle,
			planModuleKeysClean
		)
		const label = planLabel(params.planKey, 'pl')
		const cycle = params.billingCycle === 'annual' ? 'roczny' : 'miesięczny'
		const modSuffix =
			planModuleKeysClean.length > 0 ? ` + moduły: ${planModuleKeysClean.map(k => moduleLabel(k, 'pl')).join(', ')}` : ''
		description = truncate(`Planopia ${label} (${cycle})${modSuffix} — ${team.name}`, 1024)
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
		moduleKeys:
			kind === 'plan' && planModuleKeysClean.length > 0 ? planModuleKeysClean : undefined,
		amountGrosze,
		customerEmail: email,
		note,
		status: 'pending',
		// Przedłużenie przed końcem okresu: finalizacja liczy nowy okres od tej daty (z sesji, nie z bieżącego stanu)
		renewFromPeriodEnd: kind === 'plan' && renewal ? team.billingPeriodEnd : undefined,
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
		console.error('[p24] checkout register failed:', sessionId, e.code, e.message, e.p24Response || '')
		sessionDoc.status = 'register_error'
		sessionDoc.registerError = (e && e.message) || String(e)
		await sessionDoc.save()
		throw e
	}
}

/**
 * „Przedłuż plan” w Pakietach (BLIK / przelew): plan i moduły bierzemy z zespołu, nie od klienta — przedłużenie
 * nie może po cichu stać się zmianą planu. Przed końcem okresu nowy okres zacznie się po obecnym, po wygaśnięciu —
 * od płatności (finalizeP24PaidSession).
 * @param {{ teamId: string, userId: string, billingCycle: 'monthly'|'annual' }} params
 */
async function createRenewalCheckoutSessionAndRegister({ teamId, userId, billingCycle }) {
	const team = await Team.findById(teamId).select('billingPlanKey billingModuleKeys').lean()
	if (!team) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}
	const planKey = normalizePaidPlanKey(team.billingPlanKey)
	if (!isPaidPlanKey(planKey)) {
		const err = new Error('Zespół nie ma planu do przedłużenia — wybierz plan w Pakietach.')
		err.code = 'VALIDATION'
		throw err
	}
	return createCheckoutSessionAndRegister({
		teamId,
		userId,
		kind: 'plan',
		planKey,
		billingCycle,
		// Pakiety mają wszystkie moduły w cenie — lista modułów tylko przy Core
		moduleKeys: isCorePlanKey(planKey) && Array.isArray(team.billingModuleKeys) ? team.billingModuleKeys : [],
	})
}

module.exports = { createCheckoutSessionAndRegister, createRenewalCheckoutSessionAndRegister }
