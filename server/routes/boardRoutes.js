const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const boardController = require('../controllers/boardController')
const taskController = require('../controllers/taskController')
const taskCommentController = require('../controllers/taskCommentController')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname)
		const filename = crypto.randomBytes(16).toString('hex') + ext
		cb(null, filename)
	}
})

const upload = multer({ 
	storage,
	limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Board routes
router.get('/', authenticateToken, boardController.getUserBoards)
router.get('/:boardId', authenticateToken, boardController.getBoard)
router.post('/', authenticateToken, boardController.createBoard)
router.put('/:boardId', authenticateToken, boardController.updateBoard)
router.delete('/:boardId', authenticateToken, boardController.deleteBoard)

// Task routes
router.get('/:boardId/tasks', authenticateToken, taskController.getBoardTasks)
router.get('/tasks/:taskId', authenticateToken, taskController.getTask)
router.post('/:boardId/tasks', authenticateToken, taskController.createTask)
router.put('/tasks/:taskId', authenticateToken, taskController.updateTask)
router.patch('/tasks/:taskId/status', authenticateToken, taskController.updateTaskStatus)
router.delete('/tasks/:taskId', authenticateToken, taskController.deleteTask)
router.post('/tasks/:taskId/attachments', authenticateToken, upload.single('file'), taskController.uploadTaskAttachment)
router.delete('/tasks/:taskId/attachments/:attachmentIndex', authenticateToken, taskController.deleteTaskAttachment)

// Comment routes
router.get('/tasks/:taskId/comments', authenticateToken, taskCommentController.getTaskComments)
router.post('/tasks/:taskId/comments', authenticateToken, taskCommentController.createComment)
router.put('/comments/:commentId', authenticateToken, taskCommentController.updateComment)
router.delete('/comments/:commentId', authenticateToken, taskCommentController.deleteComment)
router.post('/comments/:commentId/attachments', authenticateToken, upload.single('file'), taskCommentController.uploadCommentAttachment)
router.delete('/comments/:commentId/attachments/:attachmentIndex', authenticateToken, taskCommentController.deleteCommentAttachment)

module.exports = router



