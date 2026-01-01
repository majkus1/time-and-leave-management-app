const express = require('express')
const router = express.Router()
const supervisorController = require('../controllers/supervisorController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Pobierz konfigurację przełożonego
router.get('/:supervisorId/config', authenticateToken, supervisorController.getSupervisorConfig)

// Zaktualizuj konfigurację przełożonego
router.put('/:supervisorId/config', authenticateToken, supervisorController.updateSupervisorConfig)

// Pobierz listę podwładnych przełożonego
router.get('/:supervisorId/subordinates', authenticateToken, supervisorController.getSupervisorSubordinates)

// Zaktualizuj listę podwładnych przełożonego
router.put('/:supervisorId/subordinates', authenticateToken, supervisorController.updateSupervisorSubordinates)

module.exports = router

