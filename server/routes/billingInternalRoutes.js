const express = require('express')
const router = express.Router()
const billingAdminSecretMiddleware = require('../middleware/billingAdminSecretMiddleware')
const billingController = require('../controllers/billingController')

router.post(
	'/activate-subscription',
	billingAdminSecretMiddleware,
	billingController.postInternalActivateSubscription
)
router.post('/apply-ai-addon', billingAdminSecretMiddleware, billingController.postInternalApplyAddon)

module.exports = router
