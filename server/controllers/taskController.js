const { firmDb } = require('../db/db')
const Task = require('../models/Task')(firmDb)
const Board = require('../models/Board')(firmDb)
const User = require('../models/user')(firmDb)
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs').promises
const { sendTaskNotification } = require('../services/emailService')
const { sendTaskNotification: sendTaskPushNotification } = require('../services/pushNotificationService')
const {
	isAdminUser,
	getBoardAssignableUsers,
	buildTaskAssignment,
	getTaskNotificationRecipients,
	canUserAccessTask,
	normalizeObjectIdString,
} = require('../utils/taskAccess')

/** @param {unknown} val */
function parseOptionalDateInput(val) {
	if (val === undefined || val === null || val === '') return null
	if (val instanceof Date && !isNaN(val.getTime())) return val
	const s = String(val).trim()
	if (!s) return null
	const d = s.length === 10 ? new Date(`${s}T12:00:00`) : new Date(s)
	return isNaN(d.getTime()) ? null : d
}

/**
 * Deadline albo okres — wzajemnie wykluczają się przy zapisie (jak kalendarz).
 * @param {import('mongoose').Document} task
 */
function normalizeTaskScheduleFields(task) {
	if (task.workPeriodStart && task.workPeriodEnd) {
		task.dueDate = null
	} else if (task.dueDate) {
		task.workPeriodStart = null
		task.workPeriodEnd = null
	}
}

async function getAccessibleBoardIdsForUser(userId) {
	const user = await User.findById(userId).lean()
	if (!user?.teamId) return []
	const teamId = user.teamId
	const isAdmin = user.roles && user.roles.includes('Admin')
	if (isAdmin) {
		const bs = await Board.find({ teamId, isActive: true }).select('_id').lean()
		return bs.map(b => b._id)
	}
	const userDepartments = Array.isArray(user.department) ? user.department : user.department ? [user.department] : []
	const orConditions = [{ members: userId }, { isTeamBoard: true }]
	if (userDepartments.length > 0) {
		orConditions.push({ type: 'department', departmentName: { $in: userDepartments } })
	}
	const bs = await Board.find({ teamId, isActive: true, $or: orConditions }).select('_id').lean()
	return bs.map(b => b._id)
}

const emitTaskNotificationRealtimeUpdate = async ({ req, task, board, actorUserId, action }) => {
	try {
		const io = req.app?.io
		if (!io || !task || !board) return

		const recipients = new Set(
			(await getTaskNotificationRecipients(task, board))
				.map((id) => normalizeObjectIdString(id))
				.filter(Boolean)
		)

		const adminUsers = await User.find({
			teamId: board.teamId,
			roles: { $in: ['Admin'] },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id')
		adminUsers.forEach((admin) => {
			const adminId = normalizeObjectIdString(admin?._id)
			if (adminId) recipients.add(adminId)
		})

		// Keep all opened sessions for actor in sync too.
		const normalizedActorId = normalizeObjectIdString(actorUserId)
		if (normalizedActorId) recipients.add(normalizedActorId)

		const payload = {
			taskId: normalizeObjectIdString(task._id),
			boardId: normalizeObjectIdString(board._id),
			action,
		}
		recipients.forEach((recipientId) => {
			io.to(`user:${recipientId}`).emit('task-notification-updated', payload)
		})
	} catch (error) {
		console.error('Error emitting task notification realtime update:', error)
	}
}

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

		const isAdmin = isAdminUser(req.user)
		const taskVisibilityFilter = isAdmin
			? {}
			: {
				$or: [
					{ assignedScope: 'all-members' },
					{ assignedTo: userId },
				]
			}

		// Wszystkie aktywne zadania tablicy (w tym „szybkie” z kalendarza — też na Kanbanie)
		const tasks = await Task.find({
			boardId,
			isActive: true,
			...taskVisibilityFilter,
		})
		.populate({
			path: 'createdBy',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})
		.populate({
			path: 'assignedTo',
			select: 'username firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})
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
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
		
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
		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		res.json(task)
	} catch (error) {
		console.error('Error getting task:', error)
		res.status(500).json({ message: 'Error getting task' })
	}
}

// Calendar: tasks with dates for current user (all boards or one board)
exports.getCalendarTasks = async (req, res) => {
	try {
		const userId = req.user.userId
		const year = parseInt(req.query.year, 10)
		const month = parseInt(req.query.month, 10)
		const boardIdFilter = req.query.boardId

		if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
			return res.status(400).json({ message: 'Invalid year/month' })
		}

		const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
		const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

		let boardIds = await getAccessibleBoardIdsForUser(userId)
		if (boardIdFilter) {
			if (!mongoose.Types.ObjectId.isValid(boardIdFilter)) {
				return res.status(400).json({ message: 'Invalid boardId' })
			}
			const ok = boardIds.some(id => id.toString() === String(boardIdFilter))
			if (!ok) {
				return res.status(403).json({ message: 'Access denied' })
			}
			boardIds = [new mongoose.Types.ObjectId(boardIdFilter)]
		}

		if (boardIds.length === 0) {
			return res.json({ tasks: [] })
		}

		const dateOverlap = {
			$or: [
				{ dueDate: { $gte: monthStart, $lte: monthEnd } },
				{
					$and: [
						{ workPeriodStart: { $lte: monthEnd } },
						{ workPeriodEnd: { $gte: monthStart } },
					],
				},
			],
		}

		// Kalendarz pokazuje zadania przypisane do bieżącego użytkownika (jak widok „moje”)
		const query = {
			boardId: { $in: boardIds },
			isActive: true,
			$and: [
				{ $or: [{ assignedScope: 'all-members' }, { assignedTo: userId }] },
				dateOverlap,
			],
		}

		const tasks = await Task.find(query)
			.select('title boardId dueDate workPeriodStart workPeriodEnd calendarOnly status priority')
			.sort({ dueDate: 1, workPeriodStart: 1 })
			.limit(3000)
			.lean()

		const bIds = [...new Set(tasks.map(t => t.boardId.toString()))]
		const boards = await Board.find({ _id: { $in: bIds } })
			.select('name')
			.lean()
		const boardNameById = Object.fromEntries(boards.map(b => [b._id.toString(), b.name || '']))

		const out = tasks.map(t => ({
			_id: t._id,
			title: t.title,
			boardId: t.boardId,
			boardName: boardNameById[t.boardId.toString()] || '',
			dueDate: t.dueDate,
			workPeriodStart: t.workPeriodStart,
			workPeriodEnd: t.workPeriodEnd,
			calendarOnly: !!t.calendarOnly,
			status: t.status,
			priority: t.priority,
		}))

		res.json({ tasks: out })
	} catch (error) {
		console.error('Error getCalendarTasks:', error)
		res.status(500).json({ message: 'Error loading calendar tasks' })
	}
}

// Create task
exports.createTask = async (req, res) => {
	try {
		const { boardId } = req.params
		const {
			title,
			description,
			status,
			assignedTo,
			assignToAllMembers,
			priority,
			dueDate,
			workPeriodStart,
			workPeriodEnd,
			calendarOnly,
		} = req.body
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

		const boardUsers = await getBoardAssignableUsers(board)
		const assignment = buildTaskAssignment({ assignedTo, assignToAllMembers, boardUsers })
		if (assignment.assignedScope === 'specific' && assignment.assignedTo.length === 0) {
			return res.status(400).json({ message: 'At least one assignee is required or select assign to all members' })
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
			priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
			assignedScope: assignment.assignedScope,
			assignedTo: assignment.assignedTo,
			createdBy: userId,
			order: maxOrderTask ? maxOrderTask.order + 1 : 0,
			dueDate: parseOptionalDateInput(dueDate),
			workPeriodStart: parseOptionalDateInput(workPeriodStart),
			workPeriodEnd: parseOptionalDateInput(workPeriodEnd),
			calendarOnly: calendarOnly === true,
		})

		normalizeTaskScheduleFields(newTask)
		if (newTask.workPeriodStart && newTask.workPeriodEnd && newTask.workPeriodStart > newTask.workPeriodEnd) {
			return res.status(400).json({ message: 'Invalid work period (start after end)' })
		}

		await newTask.save()
		const populatedTask = await Task.findById(newTask._id)
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

		// Send email and push notifications to board members
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
				
				// Send email notification
				let recipientUserIds = await getTaskNotificationRecipients(populatedTask, board)
				recipientUserIds = recipientUserIds.filter(id => id !== userId.toString())
				await sendTaskNotification(populatedTask, board, recipientUserIds, createdByUser, t, false)
				
				// Send push notifications (non-blocking)
				if (recipientUserIds.length > 0) {
					sendTaskPushNotification(populatedTask, board, createdByUser, recipientUserIds, false, t)
						.catch(error => {
							console.error('Error sending task push notifications:', error)
							// Don't fail the request if push fails
						})
				}
			}
		} catch (error) {
			console.error('Error sending task creation notification:', error)
			// Don't fail the request if notification fails
		}

		await emitTaskNotificationRealtimeUpdate({
			req,
			task: populatedTask,
			board,
			actorUserId: userId,
			action: 'task-created',
		})

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
		const {
			title,
			description,
			status,
			assignedTo,
			assignToAllMembers,
			priority,
			order,
			dueDate,
			workPeriodStart,
			workPeriodEnd,
			calendarOnly,
		} = req.body
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
		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
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
			// assignment is applied below in a single branch together with assignToAllMembers
		}
		const shouldUpdateAssignment = assignedTo !== undefined || assignToAllMembers !== undefined
		if (shouldUpdateAssignment) {
			const boardUsers = await getBoardAssignableUsers(board)
			const assignment = buildTaskAssignment({ assignedTo, assignToAllMembers, boardUsers })
			if (assignment.assignedScope === 'specific' && assignment.assignedTo.length === 0) {
				return res.status(400).json({ message: 'At least one assignee is required or select assign to all members' })
			}
			task.assignedScope = assignment.assignedScope
			task.assignedTo = assignment.assignedTo
		}
		if (priority !== undefined && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
			task.priority = priority
		}
		if (order !== undefined) {
			task.order = order
		}
		if (dueDate !== undefined) {
			task.dueDate = parseOptionalDateInput(dueDate)
		}
		if (workPeriodStart !== undefined) {
			task.workPeriodStart = parseOptionalDateInput(workPeriodStart)
		}
		if (workPeriodEnd !== undefined) {
			task.workPeriodEnd = parseOptionalDateInput(workPeriodEnd)
		}
		if (calendarOnly !== undefined) {
			task.calendarOnly = calendarOnly === true
		}
		normalizeTaskScheduleFields(task)
		if (task.workPeriodStart && task.workPeriodEnd && task.workPeriodStart > task.workPeriodEnd) {
			return res.status(400).json({ message: 'Invalid work period (start after end)' })
		}

		await task.save()
		const populatedTask = await Task.findById(task._id)
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

		await emitTaskNotificationRealtimeUpdate({
			req,
			task: populatedTask,
			board,
			actorUserId: userId,
			action: 'task-updated',
		})

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
		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const oldStatus = task.status
		task.status = status
		if (order !== undefined) {
			task.order = order
		}

		await task.save()
		const populatedTask = await Task.findById(task._id)
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

		// Send email and push notifications if status changed
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
					
					let recipientUserIds = await getTaskNotificationRecipients(populatedTask, board)
					recipientUserIds = recipientUserIds.filter(id => id !== userId.toString())

					// Send email notification
					await sendTaskNotification(populatedTask, board, recipientUserIds, updatedByUser, t, true)
					
					// Send push notifications (non-blocking)
					if (recipientUserIds.length > 0) {
						sendTaskPushNotification(populatedTask, board, updatedByUser, recipientUserIds, true, t)
							.catch(error => {
								console.error('Error sending task status change push notifications:', error)
								// Don't fail the request if push fails
							})
					}
				}
			} catch (error) {
				console.error('Error sending task status change notification:', error)
				// Don't fail the request if notification fails
			}
		}

		await emitTaskNotificationRealtimeUpdate({
			req,
			task: populatedTask,
			board,
			actorUserId: userId,
			action: 'task-status-updated',
		})

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
		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Check if user is creator or Admin
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

		await emitTaskNotificationRealtimeUpdate({
			req,
			task,
			board,
			actorUserId: userId,
			action: 'task-deleted',
		})

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
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

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
			.populate({
				path: 'createdBy',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'assignedTo',
				select: 'username firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

		res.json(populatedTask)
	} catch (error) {
		console.error('Error deleting task attachment:', error)
		res.status(500).json({ message: 'Error deleting attachment' })
	}
}

