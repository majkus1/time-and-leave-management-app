const express = require('express')
const router = express.Router()
const workdayController = require('../controllers/workdayController')
const { authenticateToken } = require('../middleware/authMiddleware')
// router.post('/workdays', authenticateToken, workdayController.addWorkday)
// router.get('/workdays', authenticateToken, workdayController.getWorkdays)
// router.delete('/workdays/:id', authenticateToken, workdayController.deleteWorkday)
// router.get('/workdays/:userId', authenticateToken, workdayController.getUserWorkdays)

// Trasy dla ewidencji czasu pracy
router.post('/', authenticateToken, workdayController.addWorkday) // POST /api/users/workdays
router.get('/', authenticateToken, workdayController.getWorkdays) // GET /api/users/workdays (własne)
router.put('/:id', authenticateToken, workdayController.updateWorkday) // PUT /api/users/workdays/:id
router.delete('/:id', authenticateToken, workdayController.deleteWorkday) // DELETE /api/users/workdays/:id
router.get('/user/:userId', authenticateToken, workdayController.getUserWorkdays) // GET /api/users/workdays/user/:userId

module.exports = router
