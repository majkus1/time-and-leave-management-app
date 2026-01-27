const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateToken } = require('../middleware/authMiddleware')
const { loginLimiter, resetPasswordLimiter } = require('../utils/rateLimiters')


router.post('/login', loginLimiter, userController.login)
router.post('/refresh-token', userController.refreshToken)


router.get('/me', authenticateToken, userController.getMe)
router.post('/logout', authenticateToken, userController.logout)
router.post('/change-password', authenticateToken, userController.changePassword)
router.post('/register', authenticateToken, userController.register)
router.put('/update-position', authenticateToken, userController.updatePosition)
router.put('/update-name', authenticateToken, userController.updateName)
router.get('/profile', authenticateToken, userController.getUserProfile)
router.get('/users', authenticateToken, userController.getAllUsers)
router.get('/all-users', authenticateToken, userController.getAllVisibleUsers)
router.get('/alluserplans', authenticateToken, userController.getAllUserPlans)
router.get('/my-tasks', authenticateToken, userController.getMyTasks)
router.get('/:userId', authenticateToken, userController.getUserById)
router.patch('/:userId/roles', authenticateToken, userController.updateUserRoles)
router.delete('/:userId', authenticateToken, userController.deleteUser)
router.post('/:userId/resend-password-link', authenticateToken, userController.resendPasswordLink)
router.post('/:userId/send-apology-email', authenticateToken, userController.sendApologyEmail)
router.get('/deleted/list', authenticateToken, userController.getDeletedUsers)
router.post('/:userId/restore', authenticateToken, userController.restoreUser)
router.delete('/:userId/permanent', authenticateToken, userController.permanentlyDeleteUser)

module.exports = router
