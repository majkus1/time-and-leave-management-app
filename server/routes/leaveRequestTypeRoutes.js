const express = require('express')
const router = express.Router()
const leaveRequestTypeController = require('../controllers/leaveRequestTypeController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Trasy dla zarządzania typami wniosków urlopowych
router.get('/', authenticateToken, leaveRequestTypeController.getLeaveRequestTypes) // GET /api/leave-request-types
router.put('/', authenticateToken, leaveRequestTypeController.updateLeaveRequestTypes) // PUT /api/leave-request-types
router.post('/', authenticateToken, leaveRequestTypeController.addCustomLeaveRequestType) // POST /api/leave-request-types
router.delete('/:id', authenticateToken, leaveRequestTypeController.deleteCustomLeaveRequestType) // DELETE /api/leave-request-types/:id

module.exports = router
