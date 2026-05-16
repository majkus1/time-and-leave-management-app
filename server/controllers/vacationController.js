const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { canSupervisorApproveLeaves } = require('../services/roleService')
const { resolveVacationDaysAccess } = require('../utils/vacationAccess')
const { formatVacationDaysPayload, isSameTeam } = require('../utils/vacationAccessPolicy')

exports.updateVacationDays = async (req, res) => {
	const { userId } = req.params
	const { vacationDays, leaveTypeDays } = req.body

	try {
		const access = await resolveVacationDaysAccess(req.user.userId, userId)
		if (access.error) {
			return res.status(access.error.status).send(access.error.message)
		}

		const requestingUser = access.requestingUser
		const user = access.targetUser

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		const canApprove = await canSupervisorApproveLeaves(requestingUser, user)

		if (!isAdmin && !isHR && !canApprove) {
			return res.status(403).send('Access denied')
		}

		// Jeśli przysłano leaveTypeDays, użyj tego (nowy system)
		if (leaveTypeDays !== undefined && leaveTypeDays !== null && typeof leaveTypeDays === 'object') {
			if (!user.leaveTypeDays || typeof user.leaveTypeDays !== 'object') {
				user.leaveTypeDays = {}
			}

			Object.keys(leaveTypeDays).forEach((typeId) => {
				const value = leaveTypeDays[typeId]
				if (value !== null && value !== undefined && value !== '') {
					const numValue = Number(value)
					if (!isNaN(numValue) && numValue >= 0) {
						user.leaveTypeDays[typeId] = numValue
					} else {
						delete user.leaveTypeDays[typeId]
					}
				} else {
					delete user.leaveTypeDays[typeId]
				}
			})

			user.markModified('leaveTypeDays')

			const savedUser = await user.save()

			res.status(200).json({ message: 'Liczba dni urlopu zaktualizowana pomyślnie', user: savedUser })
			return
		}
		if (vacationDays !== undefined) {
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
		const access = await resolveVacationDaysAccess(req.user.userId, userId)
		if (access.error) {
			return res.status(access.error.status).send(access.error.message)
		}

		const targetUser = await User.findById(access.targetUser._id).select('vacationDays leaveTypeDays')
		if (!targetUser) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		res.status(200).json(formatVacationDaysPayload(targetUser))
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}

exports.getMyVacationDays = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('vacationDays leaveTypeDays teamId')
		if (!user || user.isActive === false) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		if (!isSameTeam(user.teamId, req.user.teamId)) {
			return res.status(401).send('Unauthorized')
		}

		res.status(200).json(formatVacationDaysPayload(user))
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
}
