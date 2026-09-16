const express = require('express')
const router = express.Router()
const onboardingController = require('../controllers/onboardingController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Lista „pierwsze kroki” po założeniu zespołu (Admin / HR)
router.get('/status', authenticateToken, onboardingController.getStatus) // GET /api/onboarding/status
router.post('/dismiss', authenticateToken, onboardingController.dismiss) // POST /api/onboarding/dismiss

module.exports = router
