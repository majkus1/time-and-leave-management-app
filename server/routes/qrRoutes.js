const express = require('express')
const router = express.Router()
const qrController = require('../controllers/qrController')
const { authenticateToken } = require('../middleware/authMiddleware')
const { qrDisplayPublicLimiter, qrDisplayInvalidTokenLimiter } = require('../utils/rateLimiters')

// Public route - no auth required
router.get('/verify/:code', qrController.verifyQRCode)
// Wyświetlacz rotującego kodu (tablet) — bez logowania, dostęp przez token linku
router.get('/display/:displayToken', qrDisplayInvalidTokenLimiter, qrDisplayPublicLimiter, qrController.getDisplayData)

// Protected routes
router.post('/generate', authenticateToken, qrController.generateQRCode)
router.get('/team-codes', authenticateToken, qrController.getTeamQRCodes)
router.delete('/:id', authenticateToken, qrController.deleteQRCode)
router.patch('/:id/mode', authenticateToken, qrController.setQRCodeMode)
router.patch('/:id/geo', authenticateToken, qrController.setQRCodeGeo)
router.post('/:id/display-link', authenticateToken, qrController.rotateDisplayLink)

module.exports = router
