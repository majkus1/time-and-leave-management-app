/**
 * Machine-to-machine activation (manual fulfilment today; Przelewy24 server later).
 * Header: X-Billing-Admin-Secret — must match BILLING_ADMIN_SECRET.
 */
module.exports = function billingAdminSecretMiddleware(req, res, next) {
	const expected = process.env.BILLING_ADMIN_SECRET
	if (!expected) {
		return res.status(503).json({
			success: false,
			code: 'BILLING_ADMIN_DISABLED',
			message: 'BILLING_ADMIN_SECRET is not configured',
		})
	}
	const provided = req.headers['x-billing-admin-secret']
	if (!provided || provided !== expected) {
		return res.status(403).json({ success: false, message: 'Forbidden' })
	}
	next()
}
