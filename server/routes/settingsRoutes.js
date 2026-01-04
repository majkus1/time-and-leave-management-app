const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Trasy dla ustawień aplikacji
router.get('/', authenticateToken, settingsController.getSettings) // GET /api/settings
router.put('/', authenticateToken, settingsController.updateSettings) // PUT /api/settings

module.exports = router

