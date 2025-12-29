const { firmDb } = require('../db/db')
const TaskComment = require('../models/TaskComment')(firmDb)
const Task = require('../models/Task')(firmDb)
const Board = require('../models/Board')(firmDb)
const path = require('path')
const fs = require('fs').promises

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

		const board = await Board.findById(task.boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		const isMember = board.members.some(m => m.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const comments = await TaskComment.find({ 
			taskId, 
			isActive: true 
		})
		.populate('createdBy', 'username firstName lastName')
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

		const board = await Board.findById(task.boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		const isMember = board.members.some(m => m.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const newComment = new TaskComment({
			taskId,
			content: content.trim(),
			createdBy: userId
		})

		await newComment.save()
		const populatedComment = await TaskComment.findById(newComment._id)
			.populate('createdBy', 'username firstName lastName')

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

		// Check if user is creator
		if (comment.createdBy.toString() !== userId) {
			return res.status(403).json({ message: 'Only comment creator can update comment' })
		}

		comment.content = content.trim()
		await comment.save()

		const populatedComment = await TaskComment.findById(comment._id)
			.populate('createdBy', 'username firstName lastName')

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

		// Check if user is creator or Admin
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
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
			.populate('createdBy', 'username firstName lastName')

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
			.populate('createdBy', 'username firstName lastName')

		res.json(populatedComment)
	} catch (error) {
		console.error('Error deleting comment attachment:', error)
		res.status(500).json({ message: 'Error deleting attachment' })
	}
}



