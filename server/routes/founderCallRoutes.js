const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const { founderCallBookLimiter, founderCallPublicLimiter } = require('../utils/rateLimiters')
const founderCallController = require('../controllers/founderCallController')

// Rozmowa wdrożeniowa z założycielem — strona /umow-rozmowe (po zalogowaniu, bez pozycji w menu; link w mailu i banerze)
// Landing (formularz kontaktowy) — bez logowania; same wolne terminy
router.get('/public/slots', founderCallPublicLimiter, founderCallController.getPublicSlots)
router.get('/availability', authenticateToken, founderCallController.getAvailability)
router.post('/book', authenticateToken, founderCallBookLimiter, founderCallController.book)
router.post('/cancel', authenticateToken, founderCallBookLimiter, founderCallController.cancel)

module.exports = router
