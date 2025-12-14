// services/roleService.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

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
		roles: { $in: ['Może zatwierdzać urlopy swojego działu (Approve Leaves Department)'] },
	})
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
