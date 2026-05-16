const { handleStripeWebhookEvent } = require('../services/stripe/billingStripeService')

exports.postStripe = async (req, res) => {
	try {
		const signature = req.headers['stripe-signature']
		const result = await handleStripeWebhookEvent(req.rawBody || req.body, signature)
		console.log('[stripe webhook] ok', {
			eventType: result?.eventType,
			handled: result?.handled,
			skipped: result?.skipped,
			duplicate: result?.duplicate,
		})
		return res.status(200).json({ ok: true, ...result })
	} catch (e) {
		console.error('[stripe webhook] failed', e.code || e.message)
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
