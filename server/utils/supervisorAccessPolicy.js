const { isSameTeam, isSelfUser } = require('./vacationAccessPolicy')

function canViewSupervisorSettings({ viewer, supervisor }) {
	if (!viewer || !supervisor) return false
	if (isSelfUser(viewer._id, supervisor._id)) return true
	if (!isSameTeam(viewer.teamId, supervisor.teamId)) return false
	return Array.isArray(viewer.roles) && viewer.roles.includes('Admin')
}

function canManageSupervisorSettings({ viewer, supervisor }) {
	if (!viewer || !supervisor) return false
	if (!isSameTeam(viewer.teamId, supervisor.teamId)) return false
	return Array.isArray(viewer.roles) && viewer.roles.includes('Admin')
}

module.exports = {
	canViewSupervisorSettings,
	canManageSupervisorSettings,
}
