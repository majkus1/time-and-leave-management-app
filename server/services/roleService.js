// services/roleService.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const { SUPERVISOR_ROLE, evaluateLeaveApproval, evaluateTimesheetView, evaluateScheduleManage } = require('../utils/supervisorScope')

/**
 * Zwraca userów będących przełożonymi działu (mogą zatwierdzać urlopy)
 * TYLKO w obrębie tego samego zespołu i tego samego działu
 * @param {String|Array<String>} department - pojedynczy dział lub tablica działów
 * @param {String|ObjectId} teamId
 * @returns {Promise<Array<User>>}
 */
exports.findSupervisorsForDepartment = async (department, teamId) => {
	// Jeśli department to tablica, sprawdź czy użytkownik jest w którymkolwiek z działów
	const departmentFilter = Array.isArray(department) 
		? { department: { $in: department } }
		: { department: { $in: [department] } }
	
	return User.find({
		...departmentFilter,
		teamId,
		roles: { $in: ['Przełożony (Supervisor)'] },
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
	})
}

/**
 * Uprawnienia przełożonego — reguły w utils/supervisorScope (czyste, testowane). Admin i HR zawsze tak.
 * Brak SupervisorConfig = konfiguracja domyślna (zakres „mój dział”), NIE cały zespół.
 */
async function loadSupervisorConfig(supervisor) {
	return SupervisorConfig.findOne({ supervisorId: supervisor._id }).lean()
}

function needsConfig(user) {
	const roles = Array.isArray(user?.roles) ? user.roles : []
	return !roles.includes('Admin') && !roles.includes('HR') && roles.includes(SUPERVISOR_ROLE)
}

exports.canSupervisorApproveLeaves = async (supervisor, employee) => {
	const config = needsConfig(supervisor) ? await loadSupervisorConfig(supervisor) : null
	return evaluateLeaveApproval(config, supervisor, employee)
}

exports.canSupervisorViewTimesheets = async (supervisor, employee) => {
	const config = needsConfig(supervisor) ? await loadSupervisorConfig(supervisor) : null
	return evaluateTimesheetView(config, supervisor, employee)
}

exports.canSupervisorManageSchedule = async (supervisor, schedule = null) => {
	const config = needsConfig(supervisor) ? await loadSupervisorConfig(supervisor) : null
	return evaluateScheduleManage(config, supervisor, schedule)
}

/**
 * Czy użytkownik może redagować wpisy w konkretnym grafiku.
 *
 * To jest zarazem reguła widoczności SZKICÓW: wpisy z isPublished === false widzi
 * wyłącznie ten, kto danym grafikiem zarządza. Trzymamy ją przy pozostałych regułach
 * ról, żeby moduł grafików i dashboard pytały o to samo w jednym miejscu.
 *
 * @param {Object} user
 * @param {Object} schedule - musi mieć teamId, type, createdBy, departmentName i members
 * @returns {Promise<Boolean>}
 */
exports.canManageScheduleEntries = async (user, schedule) => {
	if (!user || !schedule) return false
	const isAdmin = user.roles && user.roles.includes('Admin')
	const isHR = user.roles && user.roles.includes('HR')
	if (isAdmin || isHR) {
		return user.teamId.toString() === schedule.teamId.toString()
	}

	const isCreator =
		schedule.type === 'custom' &&
		schedule.createdBy &&
		schedule.createdBy.toString() === user._id.toString()
	if (isCreator) {
		return user.teamId.toString() === schedule.teamId.toString()
	}

	return exports.canSupervisorManageSchedule(user, schedule)
}

/**
 * Sprawdza czy użytkownik jest w jednym z działów (dla wielu działów)
 * @param {Array<String>} userDepartments - tablica działów użytkownika
 * @param {String|Array<String>} targetDepartment - pojedynczy dział lub tablica działów do sprawdzenia
 * @returns {Boolean}
 */
exports.isUserInDepartment = (userDepartments, targetDepartment) => {
	if (!userDepartments || userDepartments.length === 0) return false
	if (!targetDepartment) return false
	
	const targetDepartments = Array.isArray(targetDepartment) ? targetDepartment : [targetDepartment]
	
	// Sprawdź czy przynajmniej jeden dział się przecina
	return userDepartments.some(dept => targetDepartments.includes(dept))
}
