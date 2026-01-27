const express = require('express')
const router = express.Router()
const qrController = require('../controllers/qrController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Public route - no auth required
router.get('/verify/:code', qrController.verifyQRCode)

// Protected routes
router.post('/generate', authenticateToken, qrController.generateQRCode)
router.get('/team-codes', authenticateToken, qrController.getTeamQRCodes)
router.delete('/:id', authenticateToken, qrController.deleteQRCode)

module.exports = router
