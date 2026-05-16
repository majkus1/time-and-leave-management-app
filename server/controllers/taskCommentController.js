const { firmDb } = require('../db/db')
const TaskComment = require('../models/TaskComment')(firmDb)
const Task = require('../models/Task')(firmDb)
const Board = require('../models/Board')(firmDb)
const User = require('../models/user')(firmDb)
const path = require('path')
const fs = require('fs').promises
const { sendTaskCommentNotification } = require('../services/pushNotificationService')
const { sendTaskCommentEmailNotification } = require('../services/emailService')
const { isAdminUser, canUserAccessTask, getTaskNotificationRecipients, normalizeObjectIdString } = require('../utils/taskAccess')
const { resolveBoardAccessForUser } = require('../utils/boardAccess')

async function loadBoardForTask(req, res, task) {
	if (!task) {
		res.status(404).json({ message: 'Task not found' })
		return null
	}
	const access = await resolveBoardAccessForUser({ boardId: task.boardId, reqUser: req.user })
	if (access.error) {
		res.status(access.error.status).json({ message: access.error.message })
		return null
	}
	return access.board
}

const emitTaskCommentRealtimeUpdate = async ({
	req,
	task,
	board,
	actorUserId,
	action,
	commentId,
}) => {
	try {
		const io = req.app?.io
		if (!io || !task || !board) return

		const recipients = new Set(
			(await getTaskNotificationRecipients(task, board))
				.map((id) => normalizeObjectIdString(id))
				.filter(Boolean)
		)

		// Ensure commenter receives instant update in every open tab/device.
		const normalizedActorId = normalizeObjectIdString(actorUserId)
		if (normalizedActorId) {
			recipients.add(normalizedActorId)
		}

		// Admin can see every task, so include active admins from the same team.
		const adminUsers = await User.find({
			teamId: board.teamId,
			roles: { $in: ['Admin'] },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id')
		adminUsers.forEach((admin) => {
			const adminId = normalizeObjectIdString(admin?._id)
			if (adminId) recipients.add(adminId)
		})

		const payload = {
			taskId: normalizeObjectIdString(task._id),
			boardId: normalizeObjectIdString(board._id),
			commentId: normalizeObjectIdString(commentId),
			action,
		}

		recipients.forEach((recipientId) => {
			io.to(`user:${recipientId}`).emit('task-comment-updated', payload)
			io.to(`user:${recipientId}`).emit('task-notification-updated', payload)
		})
	} catch (error) {
		console.error('Error emitting task comment realtime update:', error)
	}
}

// Get comments for a task
exports.getTaskComments = async (req, res) => {
	try {
		const { taskId } = req.params
		const userId = req.user.userId

		// Check task access
		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		const board = await loadBoardForTask(req, res, task)
		if (!board) return

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const comments = await TaskComment.find({ 
			taskId, 
			isActive: true 
		})
		.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})
		.sort({ createdAt: 1 })

		res.json(comments)
	} catch (error) {
		console.error('Error getting task comments:', error)
		res.status(500).json({ message: 'Error getting comments' })
	}
}

// Create comment
exports.createComment = async (req, res) => {
	try {
		const { taskId } = req.params
		const { content } = req.body
		const userId = req.user.userId

		if (!content || !content.trim()) {
			return res.status(400).json({ message: 'Comment content is required' })
		}

		// Check task access
		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		const board = await loadBoardForTask(req, res, task)
		if (!board) return

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const newComment = new TaskComment({
			taskId,
			content: content.trim(),
			createdBy: userId
		})

		await newComment.save()
		const populatedComment = await TaskComment.findById(newComment._id)
			.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})

		// Notify users assigned to this task (excluding comment author).
		try {
			const recipientUserIds = (await getTaskNotificationRecipients(task, board))
				.map((id) => id.toString())
				.filter((id) => id !== userId.toString())

			if (recipientUserIds.length > 0) {
				const commenterName = populatedComment?.createdBy?.firstName && populatedComment?.createdBy?.lastName
					? `${populatedComment.createdBy.firstName} ${populatedComment.createdBy.lastName}`
					: (populatedComment?.createdBy?.username || 'Someone')
				const t = req.t
				sendTaskCommentNotification({
					task,
					board,
					commenterName,
					recipientUserIds,
					t,
				}).catch((pushError) => {
					console.error('Error sending task comment push notification:', pushError)
				})
				sendTaskCommentEmailNotification({
					task,
					board,
					commenterName,
					commentContent: newComment.content,
					recipientUserIds,
					t,
				}).catch((emailError) => {
					console.error('Error sending task comment email notification:', emailError)
				})
			}
		} catch (notificationError) {
			console.error('Error preparing task comment push notification:', notificationError)
		}

		await emitTaskCommentRealtimeUpdate({
			req,
			task,
			board,
			actorUserId: userId,
			action: 'created',
			commentId: populatedComment?._id || newComment._id,
		})

		res.status(201).json(populatedComment)
	} catch (error) {
		console.error('Error creating comment:', error)
		res.status(500).json({ message: 'Error creating comment' })
	}
}

// Update comment
exports.updateComment = async (req, res) => {
	try {
		const { commentId } = req.params
		const { content } = req.body
		const userId = req.user.userId

		if (!content || !content.trim()) {
			return res.status(400).json({ message: 'Comment content is required' })
		}

		const comment = await TaskComment.findById(commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}
		const task = await Task.findById(comment.taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}
		const board = await loadBoardForTask(req, res, task)
		if (!board) return

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Check if user is creator
		if (comment.createdBy.toString() !== userId) {
			return res.status(403).json({ message: 'Only comment creator can update comment' })
		}

		comment.content = content.trim()
		await comment.save()

		const populatedComment = await TaskComment.findById(comment._id)
			.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})

		await emitTaskCommentRealtimeUpdate({
			req,
			task,
			board,
			actorUserId: userId,
			action: 'updated',
			commentId: populatedComment?._id || comment._id,
		})

		res.json(populatedComment)
	} catch (error) {
		console.error('Error updating comment:', error)
		res.status(500).json({ message: 'Error updating comment' })
	}
}

// Delete comment
exports.deleteComment = async (req, res) => {
	try {
		const { commentId } = req.params
		const userId = req.user.userId

		const comment = await TaskComment.findById(commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}
		const task = await Task.findById(comment.taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}
		const board = await loadBoardForTask(req, res, task)
		if (!board) return

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Check if user is creator or Admin
		const isCreator = comment.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or comment creator can delete comment' })
		}

		// Soft delete
		comment.isActive = false
		await comment.save()

		// Delete attachments
		if (comment.attachments && comment.attachments.length > 0) {
			for (const attachment of comment.attachments) {
				try {
					const filePath = path.join(__dirname, '..', 'uploads', attachment.path)
					await fs.unlink(filePath)
				} catch (error) {
					console.error('Error deleting attachment:', error)
				}
			}
		}

		await emitTaskCommentRealtimeUpdate({
			req,
			task,
			board,
			actorUserId: userId,
			action: 'deleted',
			commentId: comment._id,
		})

		res.json({ message: 'Comment deleted successfully' })
	} catch (error) {
		console.error('Error deleting comment:', error)
		res.status(500).json({ message: 'Error deleting comment' })
	}
}

// Upload comment attachment
exports.uploadCommentAttachment = async (req, res) => {
	try {
		const { commentId } = req.params
		const userId = req.user.userId

		if (!req.file) {
			return res.status(400).json({ message: 'No file uploaded' })
		}

		const comment = await TaskComment.findById(commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}
		const task = await Task.findById(comment.taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}
		const board = await loadBoardForTask(req, res, task)
		if (!board) return

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Check if user is creator
		if (comment.createdBy.toString() !== userId) {
			return res.status(403).json({ message: 'Only comment creator can upload attachments' })
		}

		comment.attachments.push({
			filename: req.file.originalname,
			path: req.file.filename,
			uploadedAt: new Date()
		})

		await comment.save()
		const populatedComment = await TaskComment.findById(comment._id)
			.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})

		await emitTaskCommentRealtimeUpdate({
			req,
			task,
			board,
			actorUserId: userId,
			action: 'attachment-uploaded',
			commentId: populatedComment?._id || comment._id,
		})

		res.json(populatedComment)
	} catch (error) {
		console.error('Error uploading comment attachment:', error)
		res.status(500).json({ message: 'Error uploading attachment' })
	}
}

// Delete comment attachment
exports.deleteCommentAttachment = async (req, res) => {
	try {
		const { commentId, attachmentIndex } = req.params
		const userId = req.user.userId

		const comment = await TaskComment.findById(commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		// Check if user is creator
		if (comment.createdBy.toString() !== userId) {
			return res.status(403).json({ message: 'Only comment creator can delete attachments' })
		}

		const attachmentIndexNum = parseInt(attachmentIndex)
		if (isNaN(attachmentIndexNum) || attachmentIndexNum < 0 || attachmentIndexNum >= comment.attachments.length) {
			return res.status(400).json({ message: 'Invalid attachment index' })
		}

		const attachment = comment.attachments[attachmentIndexNum]
		
		// Delete file
		try {
			const filePath = path.join(__dirname, '..', 'uploads', attachment.path)
			await fs.unlink(filePath)
		} catch (error) {
			console.error('Error deleting attachment file:', error)
		}

		// Remove from array
		comment.attachments.splice(attachmentIndexNum, 1)
		await comment.save()

		const populatedComment = await TaskComment.findById(comment._id)
			.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})

		const task = await Task.findById(comment.taskId)
		const board = task ? await loadBoardForTask(req, res, task) : null
		if (task && board) {
			await emitTaskCommentRealtimeUpdate({
				req,
				task,
				board,
				actorUserId: userId,
				action: 'attachment-deleted',
				commentId: populatedComment?._id || comment._id,
			})
		}

		res.json(populatedComment)
	} catch (error) {
		console.error('Error deleting comment attachment:', error)
		res.status(500).json({ message: 'Error deleting attachment' })
	}
}




















