const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Board = require('../models/Board')(firmDb)
const User = require('../models/user')(firmDb)
const { isAdminUser } = require('./taskAccess')
const {
	BOARD_NOT_FOUND,
	canUserAccessBoard,
} = require('./boardAccessPolicy')

/**
 * Ładuje aktywną tablicę wyłącznie z zespołu użytkownika (izolacja tenantów).
 */
async function loadBoardForUser(boardId, user) {
	if (!user?.teamId || !mongoose.Types.ObjectId.isValid(String(boardId))) {
		return null
	}
	return Board.findOne({
		_id: boardId,
		teamId: user.teamId,
		isActive: { $ne: false },
	})
}

/**
 * Pełna ścieżka: user z bazy + tablica z teamId + canUserAccessBoard.
 * Brak dostępu lub obcy tenant → 404 (nie ujawniamy istnienia zasobu).
 */
async function resolveBoardAccessForUser({ boardId, userId, reqUser }) {
	const uid = userId || reqUser?.userId
	if (!uid) {
		return { error: BOARD_NOT_FOUND }
	}

	const user = await User.findById(uid).select('teamId department roles isActive')
	if (!user || user.isActive === false || !user.teamId) {
		return { error: BOARD_NOT_FOUND }
	}

	const board = await loadBoardForUser(boardId, user)
	if (!board) {
		return { error: BOARD_NOT_FOUND }
	}

	const isAdmin = isAdminUser(reqUser || user)
	if (!canUserAccessBoard(board, user, { isAdmin })) {
		return { error: BOARD_NOT_FOUND }
	}

	return { board, user, isAdmin }
}

/**
 * Gdy board już załadowany z loadBoardForUser — weryfikacja dostępu (np. po task.boardId).
 */
function assertBoardAccess(board, user, reqUser) {
	if (!canUserAccessBoard(board, user, { isAdmin: isAdminUser(reqUser || user) })) {
		return { error: BOARD_NOT_FOUND }
	}
	return { board, user }
}

module.exports = {
	...require('./boardAccessPolicy'),
	loadBoardForUser,
	resolveBoardAccessForUser,
	assertBoardAccess,
}
