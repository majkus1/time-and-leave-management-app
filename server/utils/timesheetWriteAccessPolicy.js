function canWriteUserTimesheet({
	isSelf,
	isSameTeam,
	isAdminOrHr,
	canSupervisorWrite,
	managedWorkdayEntriesEnabled,
	targetHasAppAccess,
}) {
	if (isSelf) return true
	if (!isSameTeam) return false
	if (!managedWorkdayEntriesEnabled) return false
	if (targetHasAppAccess) return false
	if (isAdminOrHr) return true
	if (canSupervisorWrite) return true
	return false
}

module.exports = {
	canWriteUserTimesheet,
}
