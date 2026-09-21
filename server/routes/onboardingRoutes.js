const express = require('express')
const router = express.Router()
const onboardingController = require('../controllers/onboardingController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Lista „pierwsze kroki” po założeniu zespołu (Admin / HR)
router.get('/status', authenticateToken, onboardingController.getStatus) // GET /api/onboarding/status
router.post('/dismiss', authenticateToken, onboardingController.dismiss) // POST /api/onboarding/dismiss
// Dane demonstracyjne zespołu (Admin / HR): pracownicy demo, ewidencja, urlopy, grafik, zadania, QR, komunikat
router.post('/demo-data', authenticateToken, onboardingController.createDemoData) // POST /api/onboarding/demo-data
router.delete('/demo-data', authenticateToken, onboardingController.removeDemoData) // DELETE /api/onboarding/demo-data

module.exports = router
