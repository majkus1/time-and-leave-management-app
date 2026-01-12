const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

exports.updateVacationDays = async (req, res) => {
	const { userId } = req.params
	const { vacationDays, leaveTypeDays } = req.body

	try {
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		
		// Sprawdź uprawnienia przełożonego (w tym niestandardowego przez SupervisorConfig)
		const { canSupervisorApproveLeaves } = require('../services/roleService')
		const canApprove = await canSupervisorApproveLeaves(requestingUser, user)

		if (!isAdmin && !isHR && !canApprove) {
			return res.status(403).send('Access denied')
		}

		// Jeśli przysłano leaveTypeDays, użyj tego (nowy system)
		if (leaveTypeDays !== undefined && leaveTypeDays !== null && typeof leaveTypeDays === 'object') {
			if (!user.leaveTypeDays || typeof user.leaveTypeDays !== 'object') {
				user.leaveTypeDays = {}
			}
			
			// Zaktualizuj leaveTypeDays - merge z istniejącymi wartościami
			Object.keys(leaveTypeDays).forEach(typeId => {
				const value = leaveTypeDays[typeId]
				// Dopuszczamy również 0 jako ważną wartość
				if (value !== null && value !== undefined && value !== '') {
					const numValue = Number(value)
					if (!isNaN(numValue) && numValue >= 0) {
						user.leaveTypeDays[typeId] = numValue
					} else {
						delete user.leaveTypeDays[typeId]
					}
				} else {
					// Jeśli wartość jest null, undefined lub '', usuń klucz
					delete user.leaveTypeDays[typeId]
				}
			})
			
			user.markModified('leaveTypeDays')
			
			const savedUser = await user.save()
			
			res.status(200).json({ message: 'Liczba dni urlopu zaktualizowana pomyślnie', user: savedUser })
			return
		} else if (vacationDays !== undefined) {
			// Stary system - aktualizuj vacationDays i leaveTypeDays dla 'leaveform.option1'
			user.vacationDays = vacationDays
			if (!user.leaveTypeDays || typeof user.leaveTypeDays !== 'object') {
				user.leaveTypeDays = {}
			}
			user.leaveTypeDays['leaveform.option1'] = vacationDays
			user.markModified('leaveTypeDays')
		}

		await user.save()

		res.status(200).json({ message: 'Liczba dni urlopu zaktualizowana pomyślnie', user })
	} catch (error) {
		console.error('Błąd podczas aktualizacji liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}

exports.getVacationDays = async (req, res) => {
	const { userId } = req.params
	try {
		const user = await User.findById(userId).select('vacationDays leaveTypeDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		// Dla kompatybilności wstecznej, zwróć vacationDays (może być przestarzałe) lub leaveTypeDays dla 'leaveform.option1'
		const vacationDays = user.vacationDays || (user.leaveTypeDays && user.leaveTypeDays['leaveform.option1']) || 0
		res.status(200).json({ vacationDays, leaveTypeDays: user.leaveTypeDays || {} })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}

exports.getMyVacationDays = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('vacationDays leaveTypeDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		// Dla kompatybilności wstecznej, zwróć vacationDays (może być przestarzałe) lub leaveTypeDays dla 'leaveform.option1'
		const vacationDays = user.vacationDays || (user.leaveTypeDays && user.leaveTypeDays['leaveform.option1']) || 0
		res.status(200).json({ vacationDays, leaveTypeDays: user.leaveTypeDays || {} })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}
