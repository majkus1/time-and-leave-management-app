const { isSameTeam, isSelfUser } = require('./vacationAccessPolicy')

const SUPER_ADMIN_USERNAME = 'michalipka1@gmail.com'

function isSuperAdminUser(user) {
	return user?.username === SUPER_ADMIN_USERNAME
}

/**
 * Profil innego usera (GET /api/users/:userId) — ten sam zespół lub super admin.
 * Obcy zespół (bez super admin) → brak dostępu.
 */
function canViewTeamUserProfile({ viewer, targetUserId, targetUser, allowSuperAdmin = true }) {
	if (!viewer || !targetUser) return false

	if (isSelfUser(viewer._id, targetUserId)) return true
	if (allowSuperAdmin && isSuperAdminUser(viewer)) return true
	return isSameTeam(viewer.teamId, targetUser.teamId)
}

/**
 * Modyfikacja usera (role, usuwanie itd.) — wyłącznie własny zespół (super admin osobno w handlerze).
 */
function canManageTeamUser({ viewer, targetUser }) {
	if (!viewer || !targetUser) return false
	return isSameTeam(viewer.teamId, targetUser.teamId)
}

module.exports = {
	SUPER_ADMIN_USERNAME,
	isSuperAdminUser,
	canViewTeamUserProfile,
	canManageTeamUser,
}
