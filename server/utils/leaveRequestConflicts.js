const { NON_HOURLY_LEAVE_QUERY, isHourlyLeaveRequest, roundQuantity } = require('./leaveSettlement')

function toDateValue(value) {
	if (value instanceof Date) {
		return value
	}
	return new Date(value)
}

/** Granice jednego dnia (UTC) dla daty w formacie 'YYYY-MM-DD'. */
function dayBounds(dateYmd) {
	const start = toDateValue(dateYmd)
	const end = new Date(start)
	end.setUTCHours(23, 59, 59, 999)
	start.setUTCHours(0, 0, 0, 0)
	return { start, end }
}

/**
 * @param {Boolean} ignoreHourly - pomija wnioski godzinowe. Wniosek godzinowy nie zajmuje
 *   calego dnia, wiec nie moze blokowac zwyklego urlopu w tym samym dniu.
 */
async function findConflictingApprovedLeaveRequest({
	LeaveRequest,
	userId,
	startDate,
	endDate,
	excludeRequestId,
	ignoreHourly = false,
}) {
	const normalizedStartDate = toDateValue(startDate)
	const normalizedEndDate = toDateValue(endDate)

	const query = {
		userId,
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $lte: normalizedEndDate },
		endDate: { $gte: normalizedStartDate },
	}

	if (ignoreHourly) {
		Object.assign(query, NON_HOURLY_LEAVE_QUERY)
	}

	if (excludeRequestId) {
		query._id = { $ne: excludeRequestId }
	}

	return LeaveRequest.findOne(query).sort({ startDate: 1, createdAt: 1 })
}

/**
 * Zatwierdzony wniosek zajmujacy CALY dany dzien. Wniosek godzinowy nie moze byc zlozony
 * na dzien, w ktorym pracownik ma juz pelny urlop — to nie mialoby sensu.
 */
async function findBlockingLeaveRequestOnDate({ LeaveRequest, userId, dateYmd, excludeRequestId }) {
	const { start, end } = dayBounds(dateYmd)
	const query = {
		userId,
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $lte: end },
		endDate: { $gte: start },
		...NON_HOURLY_LEAVE_QUERY,
	}
	if (excludeRequestId) {
		query._id = { $ne: excludeRequestId }
	}
	return LeaveRequest.findOne(query)
}

/**
 * Suma godzin juz zarezerwowanych wnioskami godzinowymi w danym dniu.
 *
 * Domyslnie liczymy takze wnioski OCZEKUJACE — inaczej pracownik moglby przy skladaniu
 * zakolejkowac 4 x 8 h na jeden dzien. Natomiast przy ZATWIERDZANIU trzeba podac
 * statuses: ['status.accepted', 'status.sent'], bo inaczej dwa oczekujace wnioski
 * blokowalyby sie nawzajem i nie dalby sie zatwierdzic zaden.
 */
async function sumHourlyLeaveHoursOnDate({
	LeaveRequest,
	userId,
	dateYmd,
	excludeRequestId,
	statuses = ['status.accepted', 'status.sent', 'status.pending'],
}) {
	const { start, end } = dayBounds(dateYmd)
	const query = {
		userId,
		status: { $in: statuses },
		startDate: { $lte: end },
		endDate: { $gte: start },
		hoursRequested: { $gt: 0 },
	}
	if (excludeRequestId) {
		query._id = { $ne: excludeRequestId }
	}

	const requests = await LeaveRequest.find(query).select('hoursRequested settlementUnit').lean()
	const total = requests
		.filter(isHourlyLeaveRequest)
		.reduce((sum, request) => sum + (Number(request.hoursRequested) || 0), 0)
	return roundQuantity(total)
}

module.exports = {
	findConflictingApprovedLeaveRequest,
	findBlockingLeaveRequestOnDate,
	sumHourlyLeaveHoursOnDate,
}
