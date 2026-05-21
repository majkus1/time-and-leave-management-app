const express = require('express')
const router = express.Router()
const workdayController = require('../controllers/workdayController')
const { authenticateToken } = require('../middleware/authMiddleware')
const { freemiumWorkdayTimerGuard } = require('../middleware/freemiumWorkdayTimerGuard')
// router.post('/workdays', authenticateToken, workdayController.addWorkday)
// router.get('/workdays', authenticateToken, workdayController.getWorkdays)
// router.delete('/workdays/:id', authenticateToken, workdayController.deleteWorkday)
// router.get('/workdays/:userId', authenticateToken, workdayController.getUserWorkdays)

// Trasy dla ewidencji czasu pracy
router.post('/', authenticateToken, workdayController.addWorkday) // POST /api/workdays
router.post('/user/:userId', authenticateToken, workdayController.addWorkdayForUser)
router.get('/', authenticateToken, workdayController.getWorkdays) // GET /api/workdays (własne)
router.patch('/user/:userId/:id/review', authenticateToken, workdayController.reviewWorkdayForUser)
router.put('/user/:userId/:id', authenticateToken, workdayController.updateWorkdayForUser)
router.put('/:id', authenticateToken, workdayController.updateWorkday) // PUT /api/workdays/:id
router.delete('/user/:userId/:id', authenticateToken, workdayController.deleteWorkdayForUser)
router.delete('/:id', authenticateToken, workdayController.deleteWorkday) // DELETE /api/workdays/:id
router.get('/user/:userId', authenticateToken, workdayController.getUserWorkdays) // GET /api/workdays/user/:userId
router.get('/team', authenticateToken, workdayController.getAllTeamWorkdays) // GET /api/workdays/team

// Timer routes (wyłączone w freemium — guard + polityka w freemiumApiPolicyService)
router.post('/timer/start', authenticateToken, freemiumWorkdayTimerGuard, workdayController.startTimer)
router.post('/timer/pause', authenticateToken, freemiumWorkdayTimerGuard, workdayController.pauseTimer)
router.post('/timer/stop', authenticateToken, freemiumWorkdayTimerGuard, workdayController.stopTimer)
router.put('/timer/update', authenticateToken, freemiumWorkdayTimerGuard, workdayController.updateActiveTimer)
router.post('/timer/split', authenticateToken, freemiumWorkdayTimerGuard, workdayController.splitSession)
router.get('/timer/active', authenticateToken, freemiumWorkdayTimerGuard, workdayController.getActiveTimer)
router.get('/timer/sessions', authenticateToken, freemiumWorkdayTimerGuard, workdayController.getTodaySessions)
router.get('/timer/sessions/user/:userId', authenticateToken, freemiumWorkdayTimerGuard, workdayController.getUserSessions)
router.delete(
	'/timer/sessions/:workdayId/:sessionId',
	authenticateToken,
	freemiumWorkdayTimerGuard,
	workdayController.deleteSession
)

module.exports = router
