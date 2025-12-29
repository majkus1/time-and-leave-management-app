const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const scheduleController = require('../controllers/scheduleController')

// Schedule routes
router.get('/', authenticateToken, scheduleController.getUserSchedules)
router.get('/:scheduleId', authenticateToken, scheduleController.getSchedule)
router.get('/:scheduleId/users', authenticateToken, scheduleController.getScheduleUsers)
router.get('/:scheduleId/entries', authenticateToken, scheduleController.getScheduleEntries)
router.post('/:scheduleId/entries', authenticateToken, scheduleController.upsertScheduleEntry)
router.delete('/:scheduleId/entries/:entryId', authenticateToken, scheduleController.deleteScheduleEntry)

module.exports = router

