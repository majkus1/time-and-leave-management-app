const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const workActivityController = require('../controllers/workActivityController')

router.get('/', authenticateToken, workActivityController.getWorkActivities)
router.put('/', authenticateToken, workActivityController.updateWorkActivities)
router.post('/', authenticateToken, workActivityController.addWorkActivity)
router.delete('/:id', authenticateToken, workActivityController.deleteWorkActivity)

module.exports = router
