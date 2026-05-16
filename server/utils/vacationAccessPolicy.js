function normalizeTeamId(teamId) {
	if (!teamId) return null
	return typeof teamId === 'string' ? teamId : teamId.toString()
}

function isSameTeam(viewerTeamId, targetTeamId) {
	const a = normalizeTeamId(viewerTeamId)
	const b = normalizeTeamId(targetTeamId)
	return Boolean(a && b && a === b)
}

function isSelfUser(viewerId, targetId) {
	if (!viewerId || !targetId) return false
	return viewerId.toString() === targetId.toString()
}

function hasAdminOrHrRole(user) {
	const roles = user?.roles
	return Array.isArray(roles) && (roles.includes('Admin') || roles.includes('HR'))
}

/**
 * Kto może GET /api/vacations/:userId/vacation-days (po potwierdzeniu tego samego zespołu lub self).
 */
function canViewUserVacationDays({ isSelf, isSameTeam, isAdminOrHr, canSupervisorApprove }) {
	if (isSelf) return true
	if (!isSameTeam) return false
	if (isAdminOrHr) return true
	if (canSupervisorApprove) return true
	return false
}

/** Admin/HR/przełożony w zespole — m.in. zmiana statusu wniosku, mark-processed (bez self). */
function canManageTeamLeaveRequest({ isSameTeam, isAdminOrHr, canSupervisorApprove }) {
	if (!isSameTeam) return false
	if (isAdminOrHr) return true
	if (canSupervisorApprove) return true
	return false
}

function formatVacationDaysPayload(user) {
	const vacationDays =
		user.vacationDays || (user.leaveTypeDays && user.leaveTypeDays['leaveform.option1']) || 0
	return {
		vacationDays,
		leaveTypeDays: user.leaveTypeDays || {},
	}
}

module.exports = {
	normalizeTeamId,
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
	canViewUserVacationDays,
	canManageTeamLeaveRequest,
	formatVacationDaysPayload,
}
