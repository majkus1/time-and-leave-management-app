/**
 * Dostęp do grafiku — czysta logika (bez bazy). Grafik zawsze musi należeć do zespołu użytkownika;
 * potem: Admin/HR — każdy grafik zespołu, grafik zespołu — każdy członek, działowy — osoby z tego działu,
 * niestandardowy — jego członkowie.
 */
const normalizeDepartments = departmentValue =>
	Array.isArray(departmentValue) ? departmentValue : departmentValue ? [departmentValue] : []

function canAccessSchedule(schedule, user) {
	if (!schedule || !user || !user.teamId || !schedule.teamId) return false
	if (user.teamId.toString() !== schedule.teamId.toString()) return false

	const roles = Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles] : []
	if (roles.includes('Admin') || roles.includes('HR')) return true

	if (schedule.type === 'team') return true
	if (schedule.type === 'department') {
		return normalizeDepartments(user.department).includes(schedule.departmentName)
	}
	if (schedule.type === 'custom') {
		const uid = String(user._id || user.userId || '')
		return Array.isArray(schedule.members) && schedule.members.some(memberId => String(memberId) === uid)
	}
	return false
}

/** Filtr Mongo: grafik o danym id WYŁĄCZNIE z zespołu użytkownika (obcy = „nie znaleziono”). */
function teamScheduleFilter(scheduleId, teamId) {
	return { _id: scheduleId, teamId }
}

module.exports = { canAccessSchedule, teamScheduleFilter, normalizeDepartments }
