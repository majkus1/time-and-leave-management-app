// services/roleService.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)

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
 * Sprawdza czy użytkownik ma uprawnienia przełożonego do zatwierdzania urlopów
 * HIERARCHIA RÓL: Admin > HR > Przełożony
 * @param {Object} supervisor - obiekt użytkownika przełożonego
 * @param {Object} employee - obiekt użytkownika pracownika
 * @returns {Promise<Boolean>}
 */
exports.canSupervisorApproveLeaves = async (supervisor, employee) => {
	// HIERARCHIA: Admin i HR mają zawsze pełny dostęp
	if (supervisor.roles.includes('Admin') || supervisor.roles.includes('HR')) {
		return true
	}
	
	// Jeśli nie ma roli Przełożony, nie ma uprawnień
	if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
		return false
	}

	// Pobierz konfigurację przełożonego
	const config = await SupervisorConfig.findOne({ supervisorId: supervisor._id })
	if (!config) {
		// Jeśli nie ma konfiguracji, domyślnie ma wszystkie uprawnienia
		return true
	}

	// Sprawdź czy ma włączone zatwierdzanie urlopów
	if (!config.permissions.canApproveLeaves) {
		return false
	}

	// Sprawdź czy pracownik jest w tym samym dziale co przełożony
	const supervisorDepts = Array.isArray(supervisor.department) ? supervisor.department : (supervisor.department ? [supervisor.department] : [])
	const employeeDepts = Array.isArray(employee.department) ? employee.department : (employee.department ? [employee.department] : [])
	const hasCommonDepartment = supervisorDepts.some(dept => employeeDepts.includes(dept))

	const selectedEmployeeIds = config.selectedEmployees.map(id => id.toString())
	const isSelectedEmployee = selectedEmployeeIds.includes(employee._id.toString())

	// Logika dostępu:
	// 1. Jeśli użytkownik jest w selectedEmployees (zaznaczony) → pokaż go (nawet jeśli nie jest w dziale)
	// 2. Jeśli użytkownik jest w dziale i canApproveLeavesDepartment jest włączone → sprawdź czy nie został odznaczony
	// 3. selectedEmployees działa jako lista wykluczeń dla działu - można odznaczać użytkowników z działu
	
	// Jeśli ma uprawnienia do wybranych pracowników i pracownik jest na liście
	if (config.permissions.canApproveLeavesSelectedEmployees && isSelectedEmployee) {
		return true
	}

	// Jeśli ma uprawnienia do działu i pracownik jest w tym samym dziale
	if (config.permissions.canApproveLeavesDepartment && hasCommonDepartment) {
		// Jeśli selectedEmployees jest włączone i lista nie jest pusta, sprawdź czy użytkownik nie został odznaczony
		if (config.permissions.canApproveLeavesSelectedEmployees && selectedEmployeeIds.length > 0) {
			// Jeśli użytkownik jest w selectedEmployees (zaznaczony) → pokaż go
			if (isSelectedEmployee) {
				return true
			}
			// Jeśli użytkownik NIE jest w selectedEmployees, ale jest w dziale → nie pokazuj go (został odznaczony)
			return false
		}
		// Jeśli selectedEmployees nie jest włączone lub lista jest pusta, pokaż użytkowników z działu
		return true
	}

	return false
}

/**
 * Sprawdza czy użytkownik ma uprawnienia przełożonego do widzenia ewidencji czasu pracy
 * HIERARCHIA RÓL: Admin > HR > Przełożony
 * @param {Object} supervisor - obiekt użytkownika przełożonego
 * @param {Object} employee - obiekt użytkownika pracownika
 * @returns {Promise<Boolean>}
 */
exports.canSupervisorViewTimesheets = async (supervisor, employee) => {
	// HIERARCHIA: Admin i HR mają zawsze pełny dostęp
	if (supervisor.roles.includes('Admin') || supervisor.roles.includes('HR')) {
		return true
	}
	
	// Jeśli nie ma roli Przełożony, nie ma uprawnień
	if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
		return false
	}

	// Pobierz konfigurację przełożonego
	const config = await SupervisorConfig.findOne({ supervisorId: supervisor._id })
	if (!config) {
		// Jeśli nie ma konfiguracji, domyślnie ma wszystkie uprawnienia
		return true
	}

	// Sprawdź czy ma włączone widzenie ewidencji
	if (!config.permissions.canViewTimesheets) {
		return false
	}

	// Sprawdź czy pracownik jest w tym samym dziale co przełożony
	const supervisorDepts = Array.isArray(supervisor.department) ? supervisor.department : (supervisor.department ? [supervisor.department] : [])
	const employeeDepts = Array.isArray(employee.department) ? employee.department : (employee.department ? [employee.department] : [])
	const hasCommonDepartment = supervisorDepts.some(dept => employeeDepts.includes(dept))

	const selectedEmployeeIds = config.selectedEmployees.map(id => id.toString())
	const isSelectedEmployee = selectedEmployeeIds.includes(employee._id.toString())

	// Logika dostępu:
	// 1. Jeśli użytkownik jest w selectedEmployees (zaznaczony) → pokaż go (nawet jeśli nie jest w dziale)
	// 2. Jeśli użytkownik jest w dziale i canViewTimesheetsDepartment jest włączone → sprawdź czy nie został odznaczony
	// 3. selectedEmployees działa jako lista wykluczeń dla działu - można odznaczać użytkowników z działu
	
	// Jeśli ma uprawnienia do wybranych pracowników i pracownik jest na liście
	if (config.permissions.canViewTimesheetsSelectedEmployees && isSelectedEmployee) {
		return true
	}

	// Jeśli ma uprawnienia do działu i pracownik jest w tym samym dziale
	if (config.permissions.canViewTimesheetsDepartment && hasCommonDepartment) {
		// Jeśli selectedEmployees jest włączone i lista nie jest pusta, sprawdź czy użytkownik nie został odznaczony
		if (config.permissions.canViewTimesheetsSelectedEmployees && selectedEmployeeIds.length > 0) {
			// Jeśli użytkownik jest w selectedEmployees (zaznaczony) → pokaż go
			if (isSelectedEmployee) {
				return true
			}
			// Jeśli użytkownik NIE jest w selectedEmployees, ale jest w dziale → nie pokazuj go (został odznaczony)
			return false
		}
		// Jeśli selectedEmployees nie jest włączone lub lista jest pusta, pokaż użytkowników z działu
		return true
	}

	return false
}

/**
 * Sprawdza czy użytkownik ma uprawnienia przełożonego do zarządzania grafikiem
 * HIERARCHIA RÓL: Admin > HR > Przełożony
 * @param {Object} supervisor - obiekt użytkownika przełożonego
 * @param {Object} schedule - obiekt grafiku (opcjonalnie)
 * @returns {Promise<Boolean>}
 */
exports.canSupervisorManageSchedule = async (supervisor, schedule = null) => {
	// HIERARCHIA: Admin i HR mają zawsze pełny dostęp
	if (supervisor.roles.includes('Admin') || supervisor.roles.includes('HR')) {
		return true
	}
	
	// Jeśli nie ma roli Przełożony, nie ma uprawnień
	if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
		return false
	}

	// Pobierz konfigurację przełożonego
	const config = await SupervisorConfig.findOne({ supervisorId: supervisor._id })
	if (!config) {
		// Jeśli nie ma konfiguracji, domyślnie ma wszystkie uprawnienia
		return true
	}

	// Sprawdź czy ma włączone zarządzanie grafikiem
	if (!config.permissions.canManageSchedule) {
		return false
	}

	// Jeśli sprawdzamy konkretny grafik
	if (schedule) {
		// Jeśli grafik jest typu 'department' i przełożony ma uprawnienia do działu
		if (schedule.type === 'department' && config.permissions.canManageScheduleDepartment) {
			const supervisorDepts = Array.isArray(supervisor.department) ? supervisor.department : (supervisor.department ? [supervisor.department] : [])
			if (supervisorDepts.includes(schedule.departmentName)) {
				return true
			}
		}

		// Jeśli grafik jest typu 'custom' i przełożony ma uprawnienia do custom
		if (schedule.type === 'custom' && config.permissions.canManageScheduleCustom) {
			// Sprawdź czy przełożony jest członkiem grafiku
			if (schedule.members && schedule.members.includes(supervisor._id)) {
				return true
			}
		}
	} else {
		// Jeśli nie sprawdzamy konkretnego grafiku, zwróć czy ma jakiekolwiek uprawnienia
		return config.permissions.canManageScheduleDepartment || config.permissions.canManageScheduleCustom
	}

	return false
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
