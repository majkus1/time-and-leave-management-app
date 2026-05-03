const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const requireBillingStaffRole = require('../middleware/requireBillingStaffRole')
const billingController = require('../controllers/billingController')
const { billingPurchaseRequestLimiter, billingP24CheckoutLimiter } = require('../utils/rateLimiters')

/** Publiczny katalog cen (jak `/packages` — bez logowania; dla landingu / integracji). */
router.get('/public-catalog', billingController.getCatalog)
router.get('/catalog', authenticateToken, billingController.getCatalog)
router.get('/entitlements', authenticateToken, billingController.getEntitlements)
router.patch('/team-invoice', authenticateToken, requireBillingStaffRole, billingController.patchTeamInvoice)
router.get('/super/paid-plan-teams', authenticateToken, billingController.getSuperPaidPlanTeams)
router.post('/super/thank-purchase-email', authenticateToken, billingController.postSuperThankPurchaseEmail)
router.post('/super/legacy-announcement', authenticateToken, billingController.postSuperLegacyAnnouncement)
router.get('/p24/status', authenticateToken, billingController.getP24Status)
router.get('/stripe/status', authenticateToken, billingController.getStripeStatus)
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
