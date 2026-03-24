const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const aiAssistantController = require('../controllers/aiAssistantController')
const { aiAssistantChatLimiter, aiAssistantExportLimiter } = require('../utils/rateLimiters')

router.get('/status', authenticateToken, aiAssistantController.getStatus)
router.post('/chat', authenticateToken, aiAssistantChatLimiter, aiAssistantController.chat)
router.post('/chat/stream', authenticateToken, aiAssistantChatLimiter, aiAssistantController.chatStream)
router.post('/leave-draft', authenticateToken, aiAssistantChatLimiter, aiAssistantController.leaveDraft)
router.post('/workday-draft', authenticateToken, aiAssistantChatLimiter, aiAssistantController.workdayDraft)
router.post('/export/from-intent', authenticateToken, aiAssistantExportLimiter, aiAssistantController.exportFromIntent)

module.exports = router
