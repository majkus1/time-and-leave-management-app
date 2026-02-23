const emitLeaveRequestsUpdated = (req, { teamId, userId, leaveRequestId, status, action } = {}) => {
	const io = req?.app?.io
	if (!io) return

	const payload = {
		action: action || 'updated',
		teamId: teamId ? String(teamId) : null,
		userId: userId ? String(userId) : null,
		leaveRequestId: leaveRequestId ? String(leaveRequestId) : null,
		status: status || null,
		updatedAt: new Date().toISOString(),
	}

	if (payload.teamId) {
		io.to(`team:${payload.teamId}`).emit('leave-requests-updated', payload)
	}
	if (payload.userId) {
		io.to(`user:${payload.userId}`).emit('leave-requests-updated', payload)
	}
}

module.exports = {
	emitLeaveRequestsUpdated,
}
