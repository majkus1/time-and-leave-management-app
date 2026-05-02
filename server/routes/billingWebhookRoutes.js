const express = require('express')
const router = express.Router()
const p24WebhookController = require('../controllers/p24WebhookController')
const stripeWebhookController = require('../controllers/stripeWebhookController')

/**
 * Przelewy24: notyfikacja JSON na urlStatus — weryfikacja sign, PUT verify, aktywacja subskrypcji / pakietu.
 * Zarejestrowane przed CSRF w index.js.
 */
router.post('/przelewy24', p24WebhookController.postPrzelewy24)
router.post('/stripe', stripeWebhookController.postStripe)

module.exports = router
