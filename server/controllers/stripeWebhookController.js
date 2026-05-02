const { handleStripeWebhookEvent } = require('../services/stripe/billingStripeService')

exports.postStripe = async (req, res) => {
	try {
		const signature = req.headers['stripe-signature']
		const result = await handleStripeWebhookEvent(req.rawBody || req.body, signature)
		return res.status(200).json({ ok: true, ...result })
	} catch (e) {
		if (e.code === 'STRIPE_SIGN' || e.code === 'STRIPE_PAYLOAD') {
			return res.status(400).json({ ok: false, code: e.code })
		}
		if (e.code === 'STRIPE_NOT_CONFIGURED' || e.code === 'STRIPE_CONFIG') {
			return res.status(503).json({ ok: false, code: e.code })
		}
		console.error('stripeWebhookController.postStripe:', e)
		return res.status(500).json({ ok: false })
	}
}
