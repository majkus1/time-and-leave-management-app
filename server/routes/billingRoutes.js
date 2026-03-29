const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const requireBillingStaffRole = require('../middleware/requireBillingStaffRole')
const billingController = require('../controllers/billingController')
const { billingPurchaseRequestLimiter, billingP24CheckoutLimiter } = require('../utils/rateLimiters')

router.get('/catalog', authenticateToken, billingController.getCatalog)
router.get('/entitlements', authenticateToken, billingController.getEntitlements)
router.patch('/team-invoice', authenticateToken, requireBillingStaffRole, billingController.patchTeamInvoice)
router.get('/super/paid-plan-teams', authenticateToken, billingController.getSuperPaidPlanTeams)
router.post('/super/thank-purchase-email', authenticateToken, billingController.postSuperThankPurchaseEmail)
router.get('/p24/status', authenticateToken, billingController.getP24Status)
router.post(
	'/purchase-request',
	authenticateToken,
	requireBillingStaffRole,
	billingPurchaseRequestLimiter,
	billingController.postPurchaseRequest
)
router.post(
	'/p24/checkout',
	authenticateToken,
	requireBillingStaffRole,
	billingP24CheckoutLimiter,
	billingController.postP24Checkout
)

module.exports = router
