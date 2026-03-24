const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const { aiAssistantChatLimiter } = require('../utils/rateLimiters')
const scheduleController = require('../controllers/scheduleController')

// Schedule routes
router.get('/', authenticateToken, scheduleController.getUserSchedules)
router.post('/', authenticateToken, scheduleController.createSchedule)
router.get('/:scheduleId', authenticateToken, scheduleController.getSchedule)
router.put('/:scheduleId', authenticateToken, scheduleController.updateSchedule)
router.delete('/:scheduleId', authenticateToken, scheduleController.deleteSchedule)
router.get('/:scheduleId/users', authenticateToken, scheduleController.getScheduleUsers)
router.get('/:scheduleId/entries', authenticateToken, scheduleController.getScheduleEntries)
router.post('/:scheduleId/entries', authenticateToken, scheduleController.upsertScheduleEntry)
router.post('/:scheduleId/entries/auto-generate', authenticateToken, scheduleController.autoGenerateMonthEntries)
router.post(
	'/:scheduleId/entries/ai-auto-draft',
	authenticateToken,
	aiAssistantChatLimiter,
	scheduleController.aiScheduleAutoDraft
)
router.post('/:scheduleId/entries/publish-month', authenticateToken, scheduleController.publishMonthDraftEntries)
router.post('/:scheduleId/entries/clear-month', authenticateToken, scheduleController.clearMonthEntries)
router.delete('/:scheduleId/entries/:entryId', authenticateToken, scheduleController.deleteScheduleEntry)
router.post('/:scheduleId/availability', authenticateToken, scheduleController.upsertAvailability)
router.delete('/:scheduleId/availability', authenticateToken, scheduleController.deleteAvailability)

module.exports = router

