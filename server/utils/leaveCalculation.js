const Settings = require('../models/Settings')

/**
 * Oblicza liczbę dni urlopu na podstawie zakresu dat
 * @param {Date|String} startDate - Data początkowa
 * @param {Date|String} endDate - Data końcowa
 * @param {String} teamId - ID zespołu
 * @returns {Promise<Number>} - Liczba dni urlopu
 */
async function calculateLeaveDays(startDate, endDate, teamId) {
	const settings = await Settings.getSettings(teamId)
	const { generateDateRange } = require('../controllers/leaveController')
	
	const dates = await generateDateRange(startDate, endDate, teamId)
	return dates.length
}

/**
 * Konwertuje dni urlopu na godziny
 * @param {Number} days - Liczba dni
 * @param {Number} hoursPerDay - Liczba godzin na dzień
 * @returns {Number} - Liczba godzin
 */
function convertDaysToHours(days, hoursPerDay) {
	return days * hoursPerDay
}

/**
 * Formatuje wartość urlopu (dni lub godziny) do wyświetlenia
 * @param {Number} days - Liczba dni
 * @param {String} teamId - ID zespołu
 * @param {Object} t - Funkcja tłumaczeń
 * @returns {Promise<Object>} - { value: Number, unit: String, display: String }
 */
async function formatLeaveValue(days, teamId, t) {
	const settings = await Settings.getSettings(teamId)
	
	if (settings.leaveCalculationMode === 'hours') {
		const hours = convertDaysToHours(days, settings.leaveHoursPerDay || 8)
		return {
			value: hours,
			days: days,
			unit: t('leaveform.hours') || 'godzin',
			display: `${hours} ${t('leaveform.hours') || 'godzin'}`
		}
	} else {
		return {
			value: days,
			days: days,
			unit: t('leaveform.days') || 'dni',
			display: `${days} ${t('leaveform.days') || 'dni'}`
		}
	}
}

/**
 * Pobiera etykietę dla wartości urlopu (dni/godziny)
 * @param {String} teamId - ID zespołu
 * @param {Object} t - Funkcja tłumaczeń
 * @returns {Promise<String>} - Etykieta (np. "Dni" lub "Godziny")
 */
async function getLeaveValueLabel(teamId, t) {
	const settings = await Settings.getSettings(teamId)
	
	if (settings.leaveCalculationMode === 'hours') {
		return t('leaveform.hours') || 'Godziny'
	} else {
		return t('leaveform.days') || 'Dni'
	}
}

module.exports = {
	calculateLeaveDays,
	convertDaysToHours,
	formatLeaveValue,
	getLeaveValueLabel
}
