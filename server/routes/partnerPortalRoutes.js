const express = require('express')
const router = express.Router()
const controller = require('../controllers/partnerPortalController')

// Montowane pod /api/partner z authenticateToken (server/index.js); tylko GET
router.get('/me', controller.me)
router.get('/overview', controller.overview)
router.get('/entries', controller.entries)

module.exports = router
