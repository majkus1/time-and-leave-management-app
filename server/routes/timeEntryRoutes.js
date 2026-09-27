const express = require('express')
const router = express.Router()
const timeEntryController = require('../controllers/timeEntryController')
const { authenticateToken } = require('../middleware/authMiddleware')
const { timeEntryRegisterLimiter } = require('../utils/rateLimiters')

router.post('/register', authenticateToken, timeEntryRegisterLimiter, timeEntryController.registerTimeEntry)
router.get('/today', authenticateToken, timeEntryController.getTodayTimeEntries)

module.exports = router
