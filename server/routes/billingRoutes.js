const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const requireAppAdminRole = require('../middleware/requireAppAdminRole')
const billingController = require('../controllers/billingController')
const { billingPurchaseRequestLimiter } = require('../utils/rateLimiters')

router.get('/catalog', authenticateToken, billingController.getCatalog)
router.get('/entitlements', authenticateToken, billingController.getEntitlements)
router.post(
	'/purchase-request',
	authenticateToken,
	requireAppAdminRole,
	billingPurchaseRequestLimiter,
	billingController.postPurchaseRequest
)

module.exports = router
