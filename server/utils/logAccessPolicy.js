const SUPER_ADMIN_USERNAME = 'michalipka1@gmail.com'

function isSuperAdminUser(user) {
	const u = user?.username
	if (!u || typeof u !== 'string') return false
	return u.trim().toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()
}

function isLogViewerAdmin(user) {
	return Array.isArray(user?.roles) && user.roles.includes('Admin')
}

function canViewLogsAsAdmin(user) {
	return isSuperAdminUser(user) || isLogViewerAdmin(user)
}

/** Filtr Mongo dla Log.find — super admin bez ograniczeń, Admin tylko userów z teamId. */
function buildTeamScopedLogFilter({ isSuperAdmin, teamUserIds }) {
	if (isSuperAdmin) {
		return {}
	}
	if (!Array.isArray(teamUserIds) || teamUserIds.length === 0) {
		return { user: { $in: [] } }
	}
	return { user: { $in: teamUserIds } }
}

function canAdminViewTargetUserLogs({ isSuperAdmin, viewerTeamId, targetTeamId }) {
	if (isSuperAdmin) {
		return true
	}
	if (!viewerTeamId || !targetTeamId) {
		return false
	}
	return String(viewerTeamId) === String(targetTeamId)
}

module.exports = {
	SUPER_ADMIN_USERNAME,
	isSuperAdminUser,
	isLogViewerAdmin,
	canViewLogsAsAdmin,
	buildTeamScopedLogFilter,
	canAdminViewTargetUserLogs,
}
