const { firmDb } = require('../../db/db')
const BillingPaymentSession = require('../../models/BillingPaymentSession')(firmDb)
const { p24Request, assertP24Ok } = require('./p24HttpClient')
const { finalizeP24PaidSession, isP24TransactionPaidStatus } = require('./p24FinalizePaidSession')

/**
 * Po powrocie z P24 (urlReturn): jeśli webhook nie dotarł, odpytaj API o status i dokończ verify+aktywację.
 */
async function confirmP24ReturnForTeam({ sessionId, teamId }) {
	const sid = String(sessionId || '').trim()
	if (!sid) {
		const err = new Error('Missing sessionId')
		err.code = 'VALIDATION'
		throw err
	}

	const session = await BillingPaymentSession.findOne({ sessionId: sid })
	if (!session) {
		const err = new Error('Unknown payment session')
		err.code = 'SESSION_NOT_FOUND'
		throw err
	}
	if (String(session.teamId) !== String(teamId)) {
		const err = new Error('Session belongs to another team')
		err.code = 'FORBIDDEN'
		throw err
	}

	if (session.status === 'paid') {
		return { ok: true, alreadyPaid: true, sessionId: sid }
	}

	const { json } = await p24Request('GET', `/transaction/by/sessionId/${encodeURIComponent(sid)}`)
	assertP24Ok(json, 'transaction/by/sessionId')

	const data = json?.data
	if (!data || typeof data !== 'object') {
		const err = new Error('P24: brak danych transakcji')
		err.code = 'P24_API'
		throw err
	}

	const orderId = Number(data.orderId)
	const amount = Number(data.amount)
	const status = data.status

	if (!isP24TransactionPaidStatus(status)) {
		return {
			ok: false,
			pending: true,
			sessionId: sid,
			p24Status: status,
			message: 'Płatność w P24 jeszcze nie jest zaksięgowana — poczekaj chwilę lub sprawdź webhook.',
		}
	}

	if (!Number.isFinite(orderId) || orderId <= 0) {
		const err = new Error('P24: brak orderId')
		err.code = 'P24_API'
		throw err
	}

	if (amount !== session.amountGrosze) {
		const err = new Error('Amount mismatch with P24 transaction')
		err.code = 'AMOUNT_MISMATCH'
		throw err
	}

	if (session.status !== 'pending') {
		const err = new Error(`Session not pending: ${session.status}`)
		err.code = 'SESSION_STATE'
		throw err
	}

	await finalizeP24PaidSession(session, orderId)

	return { ok: true, activated: true, sessionId: sid, orderId: String(orderId) }
}

module.exports = { confirmP24ReturnForTeam }
