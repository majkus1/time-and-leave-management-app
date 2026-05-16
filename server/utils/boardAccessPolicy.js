const { isAdminUser } = require('./taskAccess')

const BOARD_NOT_FOUND = { status: 404, message: 'Board not found' }

function normalizeObjectIdString(value) {
	if (!value) return null
	if (typeof value === 'string') return value
	if (value._id) return value._id.toString()
	if (typeof value.toString === 'function') return value.toString()
	return null
}

function getUserDepartments(user) {
	if (!user) return []
	return Array.isArray(user.department) ? user.department : user.department ? [user.department] : []
}

/**
 * Czy użytkownik może otworzyć tablicę — ta sama logika co getUserBoards / buildAccessibleBoardQuery.
 * Wymaga: board należy do user.teamId (wywołujący powinien ładować tablicę z filtrem teamId).
 */
function canUserAccessBoard(board, user, options = {}) {
	if (!board || !user?.teamId) return false
	if (board.isActive === false) return false

	const boardTeamId = normalizeObjectIdString(board.teamId)
	const userTeamId = normalizeObjectIdString(user.teamId)
	if (!boardTeamId || !userTeamId || boardTeamId !== userTeamId) {
		return false
	}

	const userId = normalizeObjectIdString(user._id || user.userId)
	if (!userId) return false

	const isAdmin = options.isAdmin ?? isAdminUser(user)
	if (isAdmin) return true

	if (board.isTeamBoard) return true

	if (board.type === 'department' && board.departmentName) {
		const userDepartments = getUserDepartments(user)
		return userDepartments.includes(board.departmentName)
	}

	const members = Array.isArray(board.members) ? board.members : []
	return members.some((member) => normalizeObjectIdString(member) === userId)
}

module.exports = {
	BOARD_NOT_FOUND,
	normalizeObjectIdString,
	getUserDepartments,
	canUserAccessBoard,
}
