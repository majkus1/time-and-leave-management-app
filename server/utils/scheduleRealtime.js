const emitScheduleUpdated = (req, { teamId, scheduleId, action } = {}) => {
	const io = req?.app?.io
	if (!io) return

	const payload = {
		action: action || 'updated',
		teamId: teamId ? String(teamId) : null,
		scheduleId: scheduleId ? String(scheduleId) : null,
		updatedAt: new Date().toISOString(),
	}

	if (payload.teamId) {
		io.to(`team:${payload.teamId}`).emit('schedule-updated', payload)
	}
}

module.exports = {
	emitScheduleUpdated,
}

