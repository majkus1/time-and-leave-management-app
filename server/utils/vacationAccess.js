const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { canSupervisorApproveLeaves } = require('../services/roleService')
const {
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
	canViewUserVacationDays,
	canManageTeamLeaveRequest,
} = require('./vacationAccessPolicy')

async function loadActiveUser(userId) {
	return User.findOne({
		_id: userId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	})
}

/**
 * Kto może przeglądać dane urlopowe innego usera (dni urlopu, wnioski itd.).
 * Obcy zespół → 404. Ten sam zespół, brak roli → 403.
 */
async function resolveTeamScopedLeaveUserViewAccess(requestingUserId, targetUserId) {
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
	let canSupervisorApprove = false
	if (!self && !isAdminOrHr) {
		canSupervisorApprove = await canSupervisorApproveLeaves(requestingUser, targetUser)
	}

	const allowed = canViewUserVacationDays({
		isSelf: self,
		isSameTeam: sameTeam,
		isAdminOrHr,
		canSupervisorApprove,
	})

	if (!allowed) {
		return { error: { status: 403, message: 'Access denied' } }
	}

	return { requestingUser, targetUser }
}

/** @deprecated alias — użyj resolveTeamScopedLeaveUserViewAccess */
const resolveVacationDaysAccess = resolveTeamScopedLeaveUserViewAccess

/**
 * Kto może zarządzać wnioskiem urlopowym innego pracownika (status, processed).
 * Obcy zespół → 404. Worker bez roli → 403.
 */
async function resolveTeamScopedLeaveManageAccess(requestingUserId, targetUserId) {
	const requestingUser = await loadActiveUser(requestingUserId)
	if (!requestingUser) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const targetUser = await loadActiveUser(targetUserId)
	if (!targetUser) {
		return { error: { status: 404, message: 'Wniosek nie znaleziony' } }
	}

	const sameTeam = isSameTeam(requestingUser.teamId, targetUser.teamId)
	if (!sameTeam) {
		return { error: { status: 404, message: 'Wniosek nie znaleziony' } }
	}

	const isAdminOrHr = hasAdminOrHrRole(requestingUser)
	let canSupervisorApprove = false
	if (!isAdminOrHr) {
		canSupervisorApprove = await canSupervisorApproveLeaves(requestingUser, targetUser)
	}

	const allowed = canManageTeamLeaveRequest({
		isSameTeam: sameTeam,
		isAdminOrHr,
		canSupervisorApprove,
	})

	if (!allowed) {
		return { error: { status: 403, message: 'Access denied' } }
	}

	return { requestingUser, targetUser }
}

function sendTeamScopedLeaveViewAccessError(res, error) {
	if (error.status === 403) {
		return res.status(403).send('Brak uprawnień')
	}
	return res.status(404).send(error.message || 'Nie znaleziono użytkownika')
}

module.exports = {
	resolveTeamScopedLeaveUserViewAccess,
	resolveVacationDaysAccess,
	resolveTeamScopedLeaveManageAccess,
	sendTeamScopedLeaveViewAccessError,
	loadActiveUser,
}
