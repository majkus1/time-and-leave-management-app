const { handlePrzelewy24Notification } = require('../services/przelewy24/p24WebhookService')

/**
 * Notyfikacja asynchroniczna P24 (JSON). Brak CSRF — weryfikacja `sign` + transaction/verify.
 */
exports.postPrzelewy24 = async (req, res) => {
	const body = req.body || {}

	try {
		const result = await handlePrzelewy24Notification(body)
		return res.status(200).json({ ok: true, ...result })
	} catch (e) {
		console.error('p24WebhookController.postPrzelewy24', e.code, e.message, body.sessionId, body.orderId)
		if (e.code === 'P24_SIGN' || e.code === 'P24_PAYLOAD' || e.code === 'AMOUNT_MISMATCH') {
			return res.status(400).json({ ok: false, code: e.code, message: e.message })
		}
		if (e.code === 'SESSION_NOT_FOUND') {
			return res.status(404).json({ ok: false, code: e.code, message: e.message })
		}
		if (e.code === 'SESSION_STATE') {
			return res.status(409).json({ ok: false, code: e.code, message: e.message })
		}
		if (e.code === 'P24_VERIFY' || e.code === 'P24_API' || e.code === 'P24_PARSE') {
			return res.status(502).json({ ok: false, code: e.code, message: e.message })
		}
		return res.status(500).json({ ok: false, code: e.code || 'SERVER_ERROR' })
	}
}
