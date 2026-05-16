const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { canSupervisorViewTimesheets } = require('../services/roleService')
const {
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
} = require('./vacationAccessPolicy')
const { canViewUserTimesheet } = require('./timesheetAccessPolicy')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

async function loadActiveUser(userId) {
	return User.findOne({
		_id: userId,
		...ACTIVE_USER_FILTER,
	})
}

/**
 * Kto może GET workdays/sessions innego usera.
 * Obcy zespół → 404. Ten sam zespół bez roli → 403.
 */
async function resolveTeamScopedTimesheetViewAccess(requestingUserId, targetUserId) {
	const requestingUser = await loadActiveUser(requestingUserId)
	if (!requestingUser) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const targetUser = await loadActiveUser(targetUserId)
	if (!targetUser) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const self = isSelfUser(requestingUser._id, targetUser._id)
	const sameTeam = isSameTeam(requestingUser.teamId, targetUser.teamId)

	if (!self && !sameTeam) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const isAdminOrHr = hasAdminOrHrRole(requestingUser)
	let canSupervisorView = false
	if (!self && !isAdminOrHr) {
		canSupervisorView = await canSupervisorViewTimesheets(requestingUser, targetUser)
	}

	const allowed = canViewUserTimesheet({
		isSelf: self,
		isSameTeam: sameTeam,
		isAdminOrHr,
		canSupervisorView,
	})

	if (!allowed) {
		return { error: { status: 403, message: 'Access denied' } }
	}

	return { requestingUser, targetUser }
}

function sendTeamScopedTimesheetViewAccessError(res, error, { asJson = false } = {}) {
	if (error.status === 403) {
		const message = 'Access denied'
		return asJson ? res.status(403).json({ message }) : res.status(403).send(message)
	}
	const message = error.message || 'Użytkownik nie znaleziony'
	return asJson ? res.status(404).json({ message }) : res.status(404).send(message)
}

module.exports = {
	canViewUserTimesheet,
	resolveTeamScopedTimesheetViewAccess,
	sendTeamScopedTimesheetViewAccessError,
	loadActiveUser,
}
