const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

exports.updateVacationDays = async (req, res) => {
	const { userId } = req.params
	const { vacationDays } = req.body

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

		user.vacationDays = vacationDays
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
		const user = await User.findById(userId).select('vacationDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		res.status(200).json({ vacationDays: user.vacationDays })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}

exports.getMyVacationDays = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('vacationDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		res.status(200).json({ vacationDays: user.vacationDays })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}
