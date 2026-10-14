const express = require('express')
const router = express.Router()
const controller = require('../controllers/officeController')
const { officeConnectLimiter } = require('../utils/rateLimiters')

// Montowane pod /api/office-links z authenticateToken (server/index.js) — Admin firmy, sprawdza serwis
router.get('/', controller.companyLinks)
router.get('/audit', controller.companyAudit)
router.post('/connect', officeConnectLimiter, controller.connect)
router.post('/:id/accept', controller.accept)
router.post('/:id/end', controller.companyEnd)

module.exports = router
