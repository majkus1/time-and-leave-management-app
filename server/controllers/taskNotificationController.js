const { firmDb } = require('../db/db')
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const TaskComment = require('../models/TaskComment')(firmDb)
const User = require('../models/user')(firmDb)
const BoardViewState = require('../models/BoardViewState')(firmDb)
const TaskViewState = require('../models/TaskViewState')(firmDb)
const { isAdminUser, canUserAccessTask, normalizeObjectIdString } = require('../utils/taskAccess')

const getUserDepartments = (user) => {
	if (!user) return []
	return Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
}

const buildAccessibleBoardQuery = ({ user, userId, isAdmin }) => {
	const boardQuery = {
		teamId: user.teamId,
		isActive: true,
	}

	if (isAdmin) {
		return boardQuery
	}

	const userDepartments = getUserDepartments(user)
	const orConditions = [
		{ members: userId },
		{ isTeamBoard: true },
	]

	if (userDepartments.length > 0) {
		orConditions.push({
			type: 'department',
			departmentName: { $in: userDepartments },
		})
	}

	boardQuery.$or = orConditions
	return boardQuery
}

const buildVisibleTaskQuery = ({ boardIds, userId, isAdmin }) => {
	const query = {
		boardId: { $in: boardIds },
		isActive: true,
	}

	if (!isAdmin) {
		query.$or = [
			{ assignedScope: 'all-members' },
			{ assignedTo: userId },
		]
	}

	return query
}

const buildLatestCommentMap = (comments) => {
	const latestCommentMap = new Map()
	comments.forEach((comment) => {
		const taskId = normalizeObjectIdString(comment.taskId)
		if (!taskId) return
		const createdAtTs = new Date(comment.createdAt).getTime()
		const previousTs = latestCommentMap.get(taskId) || 0
		if (createdAtTs > previousTs) {
			latestCommentMap.set(taskId, createdAtTs)
		}
	})
	return latestCommentMap
}

const getTaskActivityTimestamp = ({ task, currentUserId, latestCommentMap }) => {
	const normalizedUserId = normalizeObjectIdString(currentUserId)
	const taskCreatorId = normalizeObjectIdString(task.createdBy)
	const taskId = normalizeObjectIdString(task._id)

	let latestTs = 0
	if (taskCreatorId && normalizedUserId && taskCreatorId !== normalizedUserId) {
		latestTs = Math.max(latestTs, new Date(task.createdAt).getTime())
	}

	const latestCommentTs = latestCommentMap.get(taskId) || 0
	latestTs = Math.max(latestTs, latestCommentTs)
	return latestTs
}

const ensureBoardAccess = async ({ boardId, reqUser }) => {
	const board = await Board.findById(boardId)
	if (!board) return { error: { status: 404, message: 'Board not found' } }

	const isMember = Array.isArray(board.members) && board.members.some((member) => member.toString() === reqUser.userId.toString())
	const isTeamBoard = board.isTeamBoard
	const isDepartmentBoard = board.type === 'department'
	if (!isMember && !isTeamBoard && !isDepartmentBoard) {
		return { error: { status: 403, message: 'Access denied' } }
	}

	return { board }
}

exports.getBoardsUnreadSummary = async (req, res) => {
	try {
		const userId = req.user.userId
		const user = await User.findById(userId).select('teamId department roles')
		if (!user || !user.teamId) {
			return res.json({ totalUnread: 0, unreadBoardsCount: 0, byBoard: {} })
		}

		const isAdmin = isAdminUser(req.user)
		const boardQuery = buildAccessibleBoardQuery({ user, userId, isAdmin })
		const boards = await Board.find(boardQuery).select('_id').lean()
		const boardIds = boards.map((board) => board._id)
		if (boardIds.length === 0) {
			return res.json({ totalUnread: 0, unreadBoardsCount: 0, byBoard: {} })
		}

		const tasks = await Task.find(buildVisibleTaskQuery({ boardIds, userId, isAdmin }))
			.select('_id boardId createdAt createdBy')
			.lean()
		if (tasks.length === 0) {
			return res.json({ totalUnread: 0, unreadBoardsCount: 0, byBoard: {} })
		}

		const taskIds = tasks.map((task) => task._id)
		const comments = await TaskComment.find({
			taskId: { $in: taskIds },
			isActive: true,
			createdBy: { $ne: userId },
		})
			.select('taskId createdAt')
			.lean()

		const latestCommentMap = buildLatestCommentMap(comments)
		const taskViews = await TaskViewState.find({
			userId,
			taskId: { $in: taskIds },
		})
			.select('taskId lastModalViewedAt lastViewedAt')
			.lean()
		const taskViewMap = new Map(
			taskViews.map((view) => [
				normalizeObjectIdString(view.taskId),
				new Date(view.lastModalViewedAt || view.lastViewedAt).getTime(),
			])
		)

		let totalUnread = 0
		const byBoard = {}
		tasks.forEach((task) => {
			const activityTs = getTaskActivityTimestamp({ task, currentUserId: userId, latestCommentMap })
			if (!activityTs) return

			const taskId = normalizeObjectIdString(task._id)
			const taskSeenTs = taskViewMap.get(taskId) || 0
			if (activityTs > taskSeenTs) {
				const boardId = normalizeObjectIdString(task.boardId)
				byBoard[boardId] = (byBoard[boardId] || 0) + 1
				totalUnread += 1
			}
		})

		const unreadBoardsCount = Object.values(byBoard).filter((count) => count > 0).length
		res.json({ totalUnread, unreadBoardsCount, byBoard })
	} catch (error) {
		console.error('Error getting boards unread summary:', error)
		res.status(500).json({ message: 'Failed to get unread summary' })
	}
}

exports.getBoardUnreadSummary = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId
		const boardAccess = await ensureBoardAccess({ boardId, reqUser: req.user })
		if (boardAccess.error) {
			return res.status(boardAccess.error.status).json({ message: boardAccess.error.message })
		}

		const isAdmin = isAdminUser(req.user)
		const tasks = await Task.find(buildVisibleTaskQuery({ boardIds: [boardId], userId, isAdmin }))
			.select('_id boardId createdAt createdBy')
			.lean()

		if (tasks.length === 0) {
			return res.json({ boardId, unreadCount: 0, unreadByTask: {} })
		}

		const taskIds = tasks.map((task) => task._id)
		const comments = await TaskComment.find({
			taskId: { $in: taskIds },
			isActive: true,
			createdBy: { $ne: userId },
		})
			.select('taskId createdAt')
			.lean()

		const latestCommentMap = buildLatestCommentMap(comments)
		const taskViews = await TaskViewState.find({
			userId,
			taskId: { $in: taskIds },
		})
			.select('taskId lastModalViewedAt')
			.lean()
		const taskViewMap = new Map(
			taskViews.map((view) => [normalizeObjectIdString(view.taskId), new Date(view.lastModalViewedAt || view.lastViewedAt).getTime()])
		)

		const unreadByTask = {}
		let unreadCount = 0
		tasks.forEach((task) => {
			const taskId = normalizeObjectIdString(task._id)
			const activityTs = getTaskActivityTimestamp({ task, currentUserId: userId, latestCommentMap })
			if (!activityTs) {
				unreadByTask[taskId] = 0
				return
			}

			const taskSeenTs = taskViewMap.get(taskId) || 0
			const isUnread = activityTs > taskSeenTs
			unreadByTask[taskId] = isUnread ? 1 : 0
			if (isUnread) unreadCount += 1
		})

		res.json({ boardId, unreadCount, unreadByTask })
	} catch (error) {
		console.error('Error getting board unread summary:', error)
		res.status(500).json({ message: 'Failed to get board unread summary' })
	}
}

exports.markBoardViewed = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId
		const boardAccess = await ensureBoardAccess({ boardId, reqUser: req.user })
		if (boardAccess.error) {
			return res.status(boardAccess.error.status).json({ message: boardAccess.error.message })
		}

		const now = new Date()
		await BoardViewState.findOneAndUpdate(
			{ userId, boardId },
			{ $set: { lastViewedAt: now } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		res.json({ success: true, boardId, lastViewedAt: now })
	} catch (error) {
		console.error('Error marking board as viewed:', error)
		res.status(500).json({ message: 'Failed to mark board as viewed' })
	}
}

exports.markTaskViewed = async (req, res) => {
	try {
		const { taskId } = req.params
		const userId = req.user.userId
		const task = await Task.findById(taskId)
		if (!task) {
			return res.status(404).json({ message: 'Task not found' })
		}

		const boardAccess = await ensureBoardAccess({ boardId: task.boardId, reqUser: req.user })
		if (boardAccess.error) {
			return res.status(boardAccess.error.status).json({ message: boardAccess.error.message })
		}

		const isAdmin = isAdminUser(req.user)
		if (!canUserAccessTask(task, userId, isAdmin)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const now = new Date()
		await TaskViewState.findOneAndUpdate(
			{ userId, taskId },
			{
				$set: {
					boardId: task.boardId,
					lastViewedAt: now,
					lastModalViewedAt: now,
				},
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		// Mark board as viewed too, so board-level badge clears when user explores the board.
		await BoardViewState.findOneAndUpdate(
			{ userId, boardId: task.boardId },
			{ $set: { lastViewedAt: now } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		res.json({ success: true, taskId, lastViewedAt: now })
	} catch (error) {
		console.error('Error marking task as viewed:', error)
		res.status(500).json({ message: 'Failed to mark task as viewed' })
	}
}

