const express = require('express')
const router = express.Router()
const controller = require('../controllers/superPartnerController')

// Montowane pod /api/super/partners z authenticateToken + requireSuperAdmin (server/index.js)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/teams/search', controller.searchTeams)
router.put('/teams/:teamId/partner', controller.assignTeam)
router.patch('/:id', controller.update)
router.get('/:id/teams', controller.referredTeams)

module.exports = router
