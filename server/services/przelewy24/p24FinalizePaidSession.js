const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const Team = require('../../models/Team')(firmDb)
const billingActivationService = require('../billingActivationService')
const { renewalFinalizeDecision } = require('../../utils/billingPlanChange')
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
		let periodStart = paymentNow
		// Przedłużenie przed końcem okresu: od daty zapisanej w sesji, nie od płatności (wcześniejsza płatność niczego
		// nie zabiera) i nie od bieżącego końca (ponowiona finalizacja nie może dołożyć drugiego okresu)
		if (session.renewFromPeriodEnd) {
			const team = await Team.findById(session.teamId).select('billingPlanKey billingModuleKeys billingPeriodEnd').lean()
			const otherRenewalPaid = await BillingPaymentSession.exists({
				teamId: session.teamId,
				_id: { $ne: session._id },
				status: 'paid',
				renewFromPeriodEnd: session.renewFromPeriodEnd,
			})
			const decision = renewalFinalizeDecision({
				team,
				planKey: session.planKey,
				moduleKeys: session.moduleKeys,
				renewFrom: session.renewFromPeriodEnd,
				otherRenewalPaid: Boolean(otherRenewalPaid),
				periodEndFrom: start => subscriptionPeriodEnd(start, session.billingCycle),
			})
			if (decision.action === 'skip') {
				// Pieniądze są, ale zespołu nie zmieniamy (plan zmieniony w międzyczasie albo okres już dłuższy) — rozliczenie ręczne
				console.error(
					`[p24] przedłużenie zaksięgowane bez zmiany zespołu (${decision.reason}) — rozlicz ręcznie: team=${session.teamId} order=${orderId} session=${session.sessionId}`
				)
				session.status = 'paid'
				session.p24OrderId = String(orderId)
				session.settlementNote = decision.reason
				await session.save()
				return { ok: true, orderId: String(orderId), settlement: decision.reason }
			}
			periodStart = decision.start
		}
		const periodEnd = subscriptionPeriodEnd(periodStart, session.billingCycle)
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
