const express = require('express')
const router = express.Router()
const timeEntryController = require('../controllers/timeEntryController')
const { authenticateToken } = require('../middleware/authMiddleware')

router.post('/register', authenticateToken, timeEntryController.registerTimeEntry)
router.get('/today', authenticateToken, timeEntryController.getTodayTimeEntries)

module.exports = router
