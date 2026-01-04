const { firmDb } = require('../db/db')
const Settings = require('../models/Settings')(firmDb)

exports.getSettings = async (req, res) => {
	try {
		// Pobierz teamId z użytkownika
		const requestingUser = await require('../models/user')(firmDb).findById(req.user.userId)
		if (!requestingUser || !requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}
		
		const settings = await Settings.getSettings(requestingUser.teamId)
		res.json(settings)
	} catch (error) {
		console.error('Error retrieving settings:', error)
		res.status(500).send('Failed to retrieve settings.')
	}
}

exports.updateSettings = async (req, res) => {
	try {
		const { workOnWeekends, includePolishHolidays, includeCustomHolidays, customHolidays, workHours } = req.body
		
		// Sprawdź uprawnienia - tylko Admin i HR
		const requestingUser = await require('../models/user')(firmDb).findById(req.user.userId)
		if (!requestingUser) {
			return res.status(403).send('Access denied')
		}
		
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		
		if (!isAdmin && !isHR) {
			return res.status(403).send('Access denied. Only Admin and HR can update settings.')
		}
		
		// Pobierz teamId z użytkownika
		if (!requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}
		
		// Pobierz lub utwórz ustawienia dla zespołu
		let settings = await Settings.getSettings(requestingUser.teamId)
		if (workOnWeekends !== undefined) {
			settings.workOnWeekends = workOnWeekends
		}
		if (includePolishHolidays !== undefined) {
			settings.includePolishHolidays = includePolishHolidays
		}
		if (includeCustomHolidays !== undefined) {
			settings.includeCustomHolidays = includeCustomHolidays
		}
		if (Array.isArray(customHolidays)) {
			// Walidacja customHolidays - każdy element musi mieć date i name
			const validCustomHolidays = customHolidays
				.filter(h => h && h.date && h.name && typeof h.date === 'string' && typeof h.name === 'string')
				.map(h => ({
					date: h.date,
					name: h.name.trim()
				}))
			settings.customHolidays = validCustomHolidays
		}

		// Obsługa workHours (wspólne godziny pracy)
		if (workHours !== undefined) {
			// Helper function to calculate hours from time range
			const calculateHours = (timeFrom, timeTo) => {
				if (!timeFrom || !timeTo) return null
				const parseTime = (timeStr) => {
					const [hours, minutes] = timeStr.split(':').map(Number)
					return hours + minutes / 60
				}
				const from = parseTime(timeFrom)
				const to = parseTime(timeTo)
				let hours = to - from
				if (hours < 0) hours += 24 // Handle overnight shifts
				return Math.round(hours * 100) / 100
			}

			if (workHours === null) {
				// Usuń workHours jeśli null
				settings.workHours = { timeFrom: null, timeTo: null, hours: null }
			} else if (workHours.timeFrom && workHours.timeTo) {
				// Walidacja formatu czasu
				const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
				if (!timeRegex.test(workHours.timeFrom) || !timeRegex.test(workHours.timeTo)) {
					return res.status(400).send('Invalid time format for work hours. Use HH:mm.')
				}
				const calculatedHours = calculateHours(workHours.timeFrom, workHours.timeTo)
				settings.workHours = {
					timeFrom: workHours.timeFrom,
					timeTo: workHours.timeTo,
					hours: calculatedHours
				}
			} else {
				// Jeśli tylko część pól, zachowaj istniejące i zaktualizuj tylko podane
				if (!settings.workHours) {
					settings.workHours = { timeFrom: null, timeTo: null, hours: null }
				}
				if (workHours.timeFrom !== undefined) settings.workHours.timeFrom = workHours.timeFrom || null
				if (workHours.timeTo !== undefined) settings.workHours.timeTo = workHours.timeTo || null
				if (workHours.timeFrom && workHours.timeTo) {
					settings.workHours.hours = calculateHours(workHours.timeFrom, workHours.timeTo)
				}
			}
		}

		await settings.save()
		
		res.json(settings)
	} catch (error) {
		console.error('Error updating settings:', error)
		res.status(500).send('Failed to update settings.')
	}
}

