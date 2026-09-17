const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const aiHelpController = require('../controllers/aiHelpController')
const { aiHelpChatLimiter, aiHelpDailyLimiter, aiHelpTeamDailyLimiter } = require('../utils/rateLimiters')

/**
 * Tryb „Jak działa Planopia” — osobny prefiks (nie /api/ai-assistant, bo ten jest modułem planu),
 * dostępny także w planie darmowym i na CORE bez modułu AI; bez limitu wiadomości AI, tylko rate limit.
 */
router.get('/modules', authenticateToken, aiHelpController.getModules)
router.post('/chat', authenticateToken, aiHelpChatLimiter, aiHelpDailyLimiter, aiHelpTeamDailyLimiter, aiHelpController.chat)
router.post('/chat/stream', authenticateToken, aiHelpChatLimiter, aiHelpDailyLimiter, aiHelpTeamDailyLimiter, aiHelpController.chatStream)

module.exports = router
