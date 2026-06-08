const { firmDb } = require('../db/db')
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)

/**
 * Tasks a user may log time against in timesheet (open tasks on accessible boards).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {import('mongoose').Types.ObjectId|string} teamId
 * @param {object} user - user document with roles, department
 */
async function fetchTimesheetTasksForUser(userId, teamId, user) {
	if (!teamId || !userId) return []

	const isAdmin = user?.roles && user.roles.includes('Admin')
	const userDepartments = Array.isArray(user?.department)
		? user.department
		: (user?.department ? [user.department] : [])

	let boardQuery = { teamId, isActive: true }
	if (!isAdmin) {
		const orConditions = [{ members: userId }, { isTeamBoard: true }]
		if (userDepartments.length > 0) {
			orConditions.push({ type: 'department', departmentName: { $in: userDepartments } })
		}
		boardQuery.$or = orConditions
	}

	const boards = await Board.find(boardQuery).select('_id').lean()
	const boardIds = boards.map(board => board._id)
	if (!boardIds.length) return []

	const taskQuery = {
		boardId: { $in: boardIds },
		isActive: true,
		status: { $ne: 'done' },
	}
	if (!isAdmin) {
		taskQuery.$or = [{ assignedScope: 'all-members' }, { assignedTo: userId }]
	}

	return Task.find(taskQuery)
		.select('_id title boardId status')
		.sort({ title: 1 })
		.lean()
}

function tasksToAllowedMap(tasks) {
	const map = new Map()
	for (const task of tasks || []) {
		if (task?._id) map.set(String(task._id), task)
	}
	return map
}

module.exports = {
	fetchTimesheetTasksForUser,
	tasksToAllowedMap,
}
