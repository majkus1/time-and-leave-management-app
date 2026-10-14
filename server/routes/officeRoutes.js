const express = require('express')
const router = express.Router()
const controller = require('../controllers/officeController')
const { officeInviteLimiter } = require('../utils/rateLimiters')

// Montowane pod /api/biuro z authenticateToken (server/index.js). Dane firm wyłącznie GET; zapisy dotyczą
// tylko zaproszeń i powiązań samego biura.
router.get('/me', controller.officeMe)
router.get('/clients', controller.clients)
router.get('/clients/:clientTeamId/month', controller.clientMonth)
router.post('/invites', officeInviteLimiter, controller.invite)
router.post('/links/:id/end', controller.officeEnd)

module.exports = router
