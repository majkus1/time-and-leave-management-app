function toDateValue(value) {
	if (value instanceof Date) {
		return value
	}
	return new Date(value)
}

async function findConflictingApprovedLeaveRequest({
	LeaveRequest,
	userId,
	startDate,
	endDate,
	excludeRequestId,
}) {
	const normalizedStartDate = toDateValue(startDate)
	const normalizedEndDate = toDateValue(endDate)

	const query = {
		userId,
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $lte: normalizedEndDate },
		endDate: { $gte: normalizedStartDate },
	}

	if (excludeRequestId) {
		query._id = { $ne: excludeRequestId }
	}

	return LeaveRequest.findOne(query).sort({ startDate: 1, createdAt: 1 })
}

module.exports = {
	findConflictingApprovedLeaveRequest,
}

