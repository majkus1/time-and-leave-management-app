const { handlePrzelewy24Notification } = require('../services/przelewy24/p24WebhookService')

/**
 * Notyfikacja asynchroniczna P24 (JSON). Brak CSRF — weryfikacja `sign` + transaction/verify.
 */
exports.postPrzelewy24 = async (req, res) => {
	try {
		const result = await handlePrzelewy24Notification(req.body)
		return res.status(200).json({ ok: true, ...result })
	} catch (e) {
		if (e.code === 'P24_SIGN' || e.code === 'P24_PAYLOAD' || e.code === 'AMOUNT_MISMATCH') {
			return res.status(400).json({ ok: false, code: e.code })
		}
		if (e.code === 'SESSION_NOT_FOUND') {
			return res.status(404).json({ ok: false, code: e.code })
		}
		if (e.code === 'SESSION_STATE') {
			return res.status(409).json({ ok: false, code: e.code })
		}
		console.error('p24WebhookController.postPrzelewy24:', e)
		return res.status(500).json({ ok: false })
	}
}
