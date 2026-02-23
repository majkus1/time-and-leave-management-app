const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

const normalizeObjectIdString = (value) => {
	if (!value) return null
	if (typeof value === 'string') return value
	if (value._id) return value._id.toString()
	if (typeof value.toString === 'function') return value.toString()
	return null
}

const isAdminUser = (reqUser) => {
	const roles = reqUser?.roles
	return Array.isArray(roles) && roles.includes('Admin')
}

const getBoardAssignableUsers = async (board) => {
	if (!board) return []

	if (board.type === 'department' && board.departmentName) {
		return User.find({
			teamId: board.teamId,
			$and: [
				{
					$or: [
						{ department: board.departmentName },
						{ department: { $in: [board.departmentName] } }
					]
				},
				{
					$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
				}
			]
		}).select('_id')
	}

	if (board.isTeamBoard) {
		return User.find({
			teamId: board.teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('_id')
	}

	return User.find({
		_id: { $in: board.members || [] },
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
	}).select('_id')
}

const buildTaskAssignment = ({ assignedTo, assignToAllMembers, boardUsers }) => {
	const boardUserIds = new Set((boardUsers || []).map(u => normalizeObjectIdString(u?._id || u)).filter(Boolean))
	const shouldAssignToAll = !!assignToAllMembers

	if (shouldAssignToAll) {
		return {
			assignedScope: 'all-members',
			assignedTo: Array.from(boardUserIds),
		}
	}

	const selectedIds = Array.isArray(assignedTo) ? assignedTo.map(normalizeObjectIdString).filter(Boolean) : []
	const uniqueSelectedIds = Array.from(new Set(selectedIds)).filter(id => boardUserIds.has(id))

	return {
		assignedScope: 'specific',
		assignedTo: uniqueSelectedIds,
	}
}

const getTaskNotificationRecipients = async (task, board) => {
	const taskScope = task?.assignedScope || 'specific'
	const taskAssignedIds = Array.isArray(task?.assignedTo) ? task.assignedTo.map(normalizeObjectIdString).filter(Boolean) : []

	if (taskScope === 'all-members') {
		const boardUsers = await getBoardAssignableUsers(board)
		return boardUsers.map(u => normalizeObjectIdString(u._id)).filter(Boolean)
	}

	return taskAssignedIds
}

const canUserAccessTask = (task, userId, isAdmin = false) => {
	if (!task || !userId) return false
	if (isAdmin) return true

	const normalizedUserId = normalizeObjectIdString(userId)
	const assignedIds = Array.isArray(task.assignedTo) ? task.assignedTo.map(normalizeObjectIdString).filter(Boolean) : []

	if (task.assignedScope === 'all-members') return true
	if (assignedIds.includes(normalizedUserId)) return true
	return false
}

module.exports = {
	normalizeObjectIdString,
	isAdminUser,
	getBoardAssignableUsers,
	buildTaskAssignment,
	getTaskNotificationRecipients,
	canUserAccessTask,
}
