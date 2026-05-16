function canViewUserTimesheet({ isSelf, isSameTeam, isAdminOrHr, canSupervisorView }) {
	if (isSelf) return true
	if (!isSameTeam) return false
	if (isAdminOrHr) return true
	if (canSupervisorView) return true
	return false
}

module.exports = {
	canViewUserTimesheet,
}
