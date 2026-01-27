const express = require('express')
const router = express.Router()
const workdayController = require('../controllers/workdayController')
const { authenticateToken } = require('../middleware/authMiddleware')
// router.post('/workdays', authenticateToken, workdayController.addWorkday)
// router.get('/workdays', authenticateToken, workdayController.getWorkdays)
// router.delete('/workdays/:id', authenticateToken, workdayController.deleteWorkday)
// router.get('/workdays/:userId', authenticateToken, workdayController.getUserWorkdays)

// Trasy dla ewidencji czasu pracy
router.post('/', authenticateToken, workdayController.addWorkday) // POST /api/workdays
router.get('/', authenticateToken, workdayController.getWorkdays) // GET /api/workdays (własne)
router.put('/:id', authenticateToken, workdayController.updateWorkday) // PUT /api/workdays/:id
router.delete('/:id', authenticateToken, workdayController.deleteWorkday) // DELETE /api/workdays/:id
router.get('/user/:userId', authenticateToken, workdayController.getUserWorkdays) // GET /api/workdays/user/:userId
router.get('/team', authenticateToken, workdayController.getAllTeamWorkdays) // GET /api/workdays/team

// Timer routes
router.post('/timer/start', authenticateToken, workdayController.startTimer)
router.post('/timer/pause', authenticateToken, workdayController.pauseTimer)
router.post('/timer/stop', authenticateToken, workdayController.stopTimer)
router.put('/timer/update', authenticateToken, workdayController.updateActiveTimer)
router.get('/timer/active', authenticateToken, workdayController.getActiveTimer)
router.get('/timer/sessions', authenticateToken, workdayController.getTodaySessions)
router.delete('/timer/sessions/:workdayId/:sessionId', authenticateToken, workdayController.deleteSession)

module.exports = router
