const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const requireBillingStaffRole = require('../middleware/requireBillingStaffRole')
const { billingStripeCheckoutLimiter } = require('../utils/rateLimiters')
const billingController = require('../controllers/billingController')

router.post(
	'/checkout',
	authenticateToken,
	requireBillingStaffRole,
	billingStripeCheckoutLimiter,
	billingController.postStripeCheckout
)
router.post(
	'/subscription/cancel',
	authenticateToken,
	requireBillingStaffRole,
	billingController.postStripeCancelSubscription
)
router.get(
	'/card-summary',
	authenticateToken,
	requireBillingStaffRole,
	billingController.getStripeCardSummary
)
router.post(
	'/billing-portal',
	authenticateToken,
	requireBillingStaffRole,
	billingStripeCheckoutLimiter,
	billingController.postStripeBillingPortal
)

module.exports = router
