const { firmDb } = require('../db/db')
const Task = require('../models/Task')(firmDb)
const Board = require('../models/Board')(firmDb)
const User = require('../models/user')(firmDb)
const path = require('path')
const fs = require('fs').promises
const { sendTaskNotification } = require('../services/emailService')

// Get tasks for a board
exports.getBoardTasks = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId

		// Check board access
		const board = await Board.findById(boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		const isMember = board.members.some(m => m.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Get all tasks for this board
		const tasks = await Task.find({ 
			boardId, 
			isActive: true 
		})
		.populate('createdBy', 'username firstName lastName')
		.populate('assignedTo', 'username firstName lastName')
		.sort({ order: 1, createdAt: -1 })

		res.json(tasks)
	} catch (error) {
		console.error('Error getting board tasks:', error)
		res.status(500).json({ message: 'Error getting tasks' })
	}
}

// Get task by ID
exports.getTask = async (req, res) => {
	try {
		const { taskId } = req.params
		const userId = req.user.userId

		const task = await Task.findById(taskId)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')
		
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		res.json(task)
	} catch (error) {
		console.error('Error getting task:', error)
		res.status(500).json({ message: 'Error getting task' })
	}
}

// Create task
exports.createTask = async (req, res) => {
	try {
		const { boardId } = req.params
		const { title, description, status, assignedTo } = req.body
		const userId = req.user.userId

		if (!title || !title.trim()) {
			return res.status(400).json({ message: 'Task title is required' })
		}

		// Check board access
		const board = await Board.findById(boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		const isMember = board.members.some(m => m.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Get max order for this status
		const maxOrderTask = await Task.findOne({ 
			boardId, 
			status: status || 'todo',
			isActive: true 
		}).sort({ order: -1 })

		const newTask = new Task({
			title: title.trim(),
			description: description || '',
			boardId,
			status: status || 'todo',
			assignedTo: assignedTo && Array.isArray(assignedTo) ? assignedTo : [],
			createdBy: userId,
			order: maxOrderTask ? maxOrderTask.order + 1 : 0
		})

		await newTask.save()
		const populatedTask = await Task.findById(newTask._id)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')

		// Send email notification to board members
		try {
			const createdByUser = await User.findById(userId).select('firstName lastName')
			if (createdByUser) {
				// Get translation function
				let t = req.t
				if (!t) {
					const i18next = require('i18next')
					const Backend = require('i18next-fs-backend')
					const i18nInstance = i18next.createInstance()
					await i18nInstance.use(Backend).init({
						lng: 'pl',
						fallbackLng: 'pl',
						backend: {
							loadPath: __dirname + '/../locales/{{lng}}/translation.json',
						},
					})
					t = i18nInstance.t.bind(i18nInstance)
				}
				
				await sendTaskNotification(populatedTask, board, createdByUser, t, false)
			}
		} catch (error) {
			console.error('Error sending task creation notification:', error)
			// Don't fail the request if email fails
		}

		res.status(201).json(populatedTask)
	} catch (error) {
		console.error('Error creating task:', error)
		res.status(500).json({ message: 'Error creating task' })
	}
}

// Update task
exports.updateTask = async (req, res) => {
	try {
		const { taskId } = req.params
		const { title, description, status, assignedTo, order } = req.body
		const userId = req.user.userId

		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		if (title !== undefined) {
			task.title = title.trim()
		}
		if (description !== undefined) {
			task.description = description
		}
		if (status !== undefined) {
			task.status = status
		}
		if (assignedTo !== undefined && Array.isArray(assignedTo)) {
			task.assignedTo = assignedTo
		}
		if (order !== undefined) {
			task.order = order
		}

		await task.save()
		const populatedTask = await Task.findById(task._id)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')

		res.json(populatedTask)
	} catch (error) {
		console.error('Error updating task:', error)
		res.status(500).json({ message: 'Error updating task' })
	}
}

// Update task status (for drag and drop)
exports.updateTaskStatus = async (req, res) => {
	try {
		const { taskId } = req.params
		const { status, order } = req.body
		const userId = req.user.userId

		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		const oldStatus = task.status
		task.status = status
		if (order !== undefined) {
			task.order = order
		}

		await task.save()
		const populatedTask = await Task.findById(task._id)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')

		// Send email notification if status changed
		if (oldStatus !== status) {
			try {
				const updatedByUser = await User.findById(userId).select('firstName lastName')
				if (updatedByUser) {
					// Get translation function
					let t = req.t
					if (!t) {
						const i18next = require('i18next')
						const Backend = require('i18next-fs-backend')
						const i18nInstance = i18next.createInstance()
						await i18nInstance.use(Backend).init({
							lng: 'pl',
							fallbackLng: 'pl',
							backend: {
								loadPath: __dirname + '/../locales/{{lng}}/translation.json',
							},
						})
						t = i18nInstance.t.bind(i18nInstance)
					}
					
					await sendTaskNotification(populatedTask, board, updatedByUser, t, true)
				}
			} catch (error) {
				console.error('Error sending task status change notification:', error)
				// Don't fail the request if email fails
			}
		}

		res.json(populatedTask)
	} catch (error) {
		console.error('Error updating task status:', error)
		res.status(500).json({ message: 'Error updating task status' })
	}
}

// Delete task
exports.deleteTask = async (req, res) => {
	try {
		const { taskId } = req.params
		const userId = req.user.userId

		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		// Check if user is creator or Admin
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
		const isCreator = task.createdBy && task.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or task creator can delete task' })
		}

		// Soft delete
		task.isActive = false
		await task.save()

		// Delete attachments
		if (task.attachments && task.attachments.length > 0) {
			for (const attachment of task.attachments) {
				try {
					const filePath = path.join(__dirname, '..', 'uploads', attachment.path)
					await fs.unlink(filePath)
				} catch (error) {
					console.error('Error deleting attachment:', error)
				}
			}
		}

		res.json({ message: 'Task deleted successfully' })
	} catch (error) {
		console.error('Error deleting task:', error)
		res.status(500).json({ message: 'Error deleting task' })
	}
}

// Upload task attachment
exports.uploadTaskAttachment = async (req, res) => {
	try {
		const { taskId } = req.params
		const userId = req.user.userId

		if (!req.file) {
			return res.status(400).json({ message: 'No file uploaded' })
		}

		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		task.attachments.push({
			filename: req.file.originalname,
			path: req.file.filename,
			uploadedAt: new Date()
		})

		await task.save()
		const populatedTask = await Task.findById(task._id)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')

		res.json(populatedTask)
	} catch (error) {
		console.error('Error uploading task attachment:', error)
		res.status(500).json({ message: 'Error uploading attachment' })
	}
}

// Delete task attachment
exports.deleteTaskAttachment = async (req, res) => {
	try {
		const { taskId, attachmentIndex } = req.params
		const userId = req.user.userId

		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		// Check board access
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

		const attachmentIndexNum = parseInt(attachmentIndex)
		if (isNaN(attachmentIndexNum) || attachmentIndexNum < 0 || attachmentIndexNum >= task.attachments.length) {
			return res.status(400).json({ message: 'Invalid attachment index' })
		}

		const attachment = task.attachments[attachmentIndexNum]
		
		// Delete file
		try {
			const filePath = path.join(__dirname, '..', 'uploads', attachment.path)
			await fs.unlink(filePath)
		} catch (error) {
			console.error('Error deleting attachment file:', error)
		}

		// Remove from array
		task.attachments.splice(attachmentIndexNum, 1)
		await task.save()

		const populatedTask = await Task.findById(task._id)
			.populate('createdBy', 'username firstName lastName')
			.populate('assignedTo', 'username firstName lastName')

		res.json(populatedTask)
	} catch (error) {
		console.error('Error deleting task attachment:', error)
		res.status(500).json({ message: 'Error deleting attachment' })
	}
}

