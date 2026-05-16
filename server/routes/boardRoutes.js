const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const boardController = require('../controllers/boardController')
const taskController = require('../controllers/taskController')
const taskCommentController = require('../controllers/taskCommentController')
const taskNotificationController = require('../controllers/taskNotificationController')
const { singleAttachmentUpload } = require('../utils/attachmentUpload')
const uploadTaskAttachment = singleAttachmentUpload('file')
const uploadCommentAttachment = singleAttachmentUpload('file')

// Board routes
router.get('/', authenticateToken, boardController.getUserBoards)
router.get('/unread-summary', authenticateToken, taskNotificationController.getBoardsUnreadSummary)
router.get('/calendar/tasks', authenticateToken, taskController.getCalendarTasks)
router.get('/:boardId/unread-summary', authenticateToken, taskNotificationController.getBoardUnreadSummary)
router.post('/:boardId/mark-viewed', authenticateToken, taskNotificationController.markBoardViewed)
router.post('/tasks/:taskId/mark-viewed', authenticateToken, taskNotificationController.markTaskViewed)
router.get('/:boardId', authenticateToken, boardController.getBoard)
router.get('/:boardId/users', authenticateToken, boardController.getBoardUsers)
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
router.post('/tasks/:taskId/attachments', authenticateToken, uploadTaskAttachment, taskController.uploadTaskAttachment)
router.delete('/tasks/:taskId/attachments/:attachmentIndex', authenticateToken, taskController.deleteTaskAttachment)

// Comment routes
router.get('/tasks/:taskId/comments', authenticateToken, taskCommentController.getTaskComments)
router.post('/tasks/:taskId/comments', authenticateToken, taskCommentController.createComment)
router.put('/comments/:commentId', authenticateToken, taskCommentController.updateComment)
router.delete('/comments/:commentId', authenticateToken, taskCommentController.deleteComment)
router.post('/comments/:commentId/attachments', authenticateToken, uploadCommentAttachment, taskCommentController.uploadCommentAttachment)
router.delete('/comments/:commentId/attachments/:attachmentIndex', authenticateToken, taskCommentController.deleteCommentAttachment)

module.exports = router



