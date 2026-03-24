const express = require('express')
const router = express.Router()

/**
 * Placeholder for Przelewy24 (or other PSP) — verify signature here, then call billingActivationService.
 * Registered before CSRF middleware in index.js.
 */
router.post('/przelewy24', (req, res) => {
	res.status(501).json({
		success: false,
		code: 'WEBHOOK_NOT_IMPLEMENTED',
		message: 'Payment webhook will call the same activation services as manual fulfilment.',
	})
})

module.exports = router
