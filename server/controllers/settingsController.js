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
		const { workOnWeekends, includePolishHolidays, includeCustomHolidays, customHolidays, workHours, leaveRequestTypes } = req.body
		
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

		// Obsługa workHours (tablica konfiguracji godzin pracy)
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
				// Usuń wszystkie workHours jeśli null
				settings.workHours = []
			} else if (Array.isArray(workHours)) {
				// Walidacja i przetwarzanie tablicy konfiguracji
				const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
				const validWorkHours = workHours
					.filter(wh => wh && wh.timeFrom && wh.timeTo)
					.map(wh => {
						// Walidacja formatu czasu
						if (!timeRegex.test(wh.timeFrom) || !timeRegex.test(wh.timeTo)) {
							return null
						}
						const calculatedHours = calculateHours(wh.timeFrom, wh.timeTo)
						return {
							timeFrom: wh.timeFrom,
							timeTo: wh.timeTo,
							hours: calculatedHours
						}
					})
					.filter(wh => wh !== null) // Usuń nieprawidłowe wpisy
				
				settings.workHours = validWorkHours
			} else {
				// Kompatybilność wsteczna: jeśli przysłano stary format (obiekt), zamień na tablicę
				if (workHours.timeFrom && workHours.timeTo) {
					const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
					if (!timeRegex.test(workHours.timeFrom) || !timeRegex.test(workHours.timeTo)) {
						return res.status(400).send('Invalid time format for work hours. Use HH:mm.')
					}
					const calculatedHours = calculateHours(workHours.timeFrom, workHours.timeTo)
					settings.workHours = [{
						timeFrom: workHours.timeFrom,
						timeTo: workHours.timeTo,
						hours: calculatedHours
					}]
				} else {
					settings.workHours = []
				}
			}
		}

		// Obsługa leaveRequestTypes - tylko Admin i HR mogą modyfikować
		if (leaveRequestTypes !== undefined && Array.isArray(leaveRequestTypes)) {
			// Walidacja typów
			const validTypes = leaveRequestTypes.filter(type => {
				return type && 
					typeof type.id === 'string' && type.id.trim() !== '' &&
					typeof type.name === 'string' && type.name.trim() !== '' &&
					typeof type.isSystem === 'boolean' &&
					typeof type.isEnabled === 'boolean' &&
					typeof type.requireApproval === 'boolean' &&
				typeof type.allowDaysLimit === 'boolean' &&
				(type.minDaysBefore === null || type.minDaysBefore === undefined || (typeof type.minDaysBefore === 'number' && type.minDaysBefore > 0))
		}).map(type => ({
			id: type.id.trim(),
			name: type.name.trim(),
			nameEn: type.nameEn ? type.nameEn.trim() : undefined,
			isSystem: type.isSystem,
			isEnabled: type.isEnabled,
			requireApproval: type.requireApproval,
			allowDaysLimit: type.allowDaysLimit,
			minDaysBefore: type.minDaysBefore !== null && type.minDaysBefore !== undefined && type.minDaysBefore > 0 ? type.minDaysBefore : null
			}))
			
			// Nie można usuwać typów systemowych, tylko je włączać/wyłączać
			// Zachowaj istniejące typy systemowe, które nie są w nowej liście (mogły być wyłączone)
			const systemTypeIds = new Set(['leaveform.option1', 'leaveform.option2', 'leaveform.option3', 'leaveform.option4', 'leaveform.option5', 'leaveform.option6'])
			const existingSystemTypes = (settings.leaveRequestTypes || []).filter(t => t.isSystem && systemTypeIds.has(t.id))
			const newSystemTypes = validTypes.filter(t => t.isSystem && systemTypeIds.has(t.id))
			const customTypes = validTypes.filter(t => !t.isSystem)
			
			// Połącz typy systemowe z nowych z istniejącymi (aby zachować te, które nie zostały przesłane)
			const finalSystemTypes = existingSystemTypes.map(existing => {
				const updated = newSystemTypes.find(n => n.id === existing.id)
				return updated || existing
			})
			
			// Dodaj nowe typy systemowe, które nie były w istniejących
			newSystemTypes.forEach(newType => {
				if (!finalSystemTypes.find(t => t.id === newType.id)) {
					finalSystemTypes.push(newType)
				}
			})
			
			settings.leaveRequestTypes = [...finalSystemTypes, ...customTypes]
		}

		await settings.save()
		
		res.json(settings)
	} catch (error) {
		console.error('Error updating settings:', error)
		res.status(500).send('Failed to update settings.')
	}
}

