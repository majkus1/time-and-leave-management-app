const express = require('express')
const router = express.Router()
const p24WebhookController = require('../controllers/p24WebhookController')
const stripeWebhookController = require('../controllers/stripeWebhookController')

router.all('/przelewy24', (req, res, next) => {
	if (req.method === 'GET' || req.method === 'HEAD') {
		return res.status(200).json({
			ok: false,
			message: 'Webhook P24: oczekiwany POST od Przelewy24, nie GET w przeglądarce.',
		})
	}
	next()
})

/**
 * Przelewy24: notyfikacja JSON na urlStatus — weryfikacja sign, PUT verify, aktywacja subskrypcji / pakietu.
 * Zarejestrowane przed CSRF w index.js.
 */
router.post('/przelewy24', p24WebhookController.postPrzelewy24)
router.post('/stripe', stripeWebhookController.postStripe)

module.exports = router
