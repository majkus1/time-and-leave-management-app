const SUPERVISOR_ROLE = 'Przełożony (Supervisor)'

function hasAnnouncementManagerRole(roles) {
	const r = Array.isArray(roles) ? roles : []
	return r.includes('Admin') || r.includes('HR') || r.includes(SUPERVISOR_ROLE)
}

/** Usuwanie: Admin/HR dowolny komunikat w zespole; przełożony tylko własny. */
function canDeleteTeamAnnouncement({ roles, userId, createdBy }) {
	const r = Array.isArray(roles) ? roles : []
	if (r.includes('Admin') || r.includes('HR')) return true
	if (!createdBy || !userId) return false
	return createdBy.toString() === userId.toString()
}

module.exports = {
	SUPERVISOR_ROLE,
	hasAnnouncementManagerRole,
	canDeleteTeamAnnouncement,
}
