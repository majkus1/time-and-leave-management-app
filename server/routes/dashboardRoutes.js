const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const dashboardController = require('../controllers/dashboardController')

router.get('/summary', authenticateToken, dashboardController.getSummary)
router.get('/team-insights', authenticateToken, dashboardController.getTeamInsights)

module.exports = router
