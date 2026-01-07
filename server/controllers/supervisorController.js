const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)

/**
 * Pobierz konfigurację przełożonego
 */
exports.getSupervisorConfig = async (req, res) => {
	try {
		const { supervisorId } = req.params
		const requestingUser = await User.findById(req.user.userId)

		// Sprawdź uprawnienia - tylko admin lub sam przełożony może zobaczyć konfigurację
		if (!requestingUser.roles.includes('Admin') && requestingUser._id.toString() !== supervisorId) {
			return res.status(403).json({ message: 'Access denied' })
		}

		let config = await SupervisorConfig.findOne({ supervisorId })
			.populate({
				path: 'selectedEmployees',
				select: 'firstName lastName username position department',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})

		// Jeśli nie ma konfiguracji, utwórz domyślną
		if (!config) {
			const supervisor = await User.findById(supervisorId)
			if (!supervisor) {
				return res.status(404).json({ message: 'Supervisor not found' })
			}

			config = new SupervisorConfig({
				supervisorId: supervisor._id,
				teamId: supervisor.teamId,
				permissions: {
					canApproveLeaves: true,
					canApproveLeavesDepartment: true,
					canApproveLeavesSelectedEmployees: true,
					canViewTimesheets: true,
					canViewTimesheetsDepartment: true,
					canViewTimesheetsSelectedEmployees: true,
					canManageSchedule: true,
					canManageScheduleDepartment: true,
					canManageScheduleCustom: true
				},
				selectedEmployees: []
			})
			await config.save()
		}

		res.json(config)
	} catch (error) {
		console.error('Error getting supervisor config:', error)
		res.status(500).json({ message: 'Error getting supervisor config' })
	}
}

/**
 * Zaktualizuj konfigurację przełożonego
 */
exports.updateSupervisorConfig = async (req, res) => {
	try {
		const { supervisorId } = req.params
		const { permissions, selectedEmployees } = req.body
		const requestingUser = await User.findById(req.user.userId)
		
		// Get translation function - use req.t if available, otherwise create instance with default 'pl'
		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl', // Default to Polish
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		// Sprawdź uprawnienia - tylko admin może aktualizować konfigurację
		if (!requestingUser.roles.includes('Admin')) {
			return res.status(403).json({ message: 'Access denied. Only Admin can update supervisor config.' })
		}

		const supervisor = await User.findById(supervisorId)
		if (!supervisor) {
			return res.status(404).json({ message: 'Supervisor not found' })
		}

		if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
			return res.status(400).json({ message: t('supervisor.notASupervisor') || 'User is not a supervisor' })
		}

		let config = await SupervisorConfig.findOne({ supervisorId })

		if (!config) {
			config = new SupervisorConfig({
				supervisorId: supervisor._id,
				teamId: supervisor.teamId,
				permissions: permissions || {
					canApproveLeaves: true,
					canApproveLeavesDepartment: true,
					canApproveLeavesSelectedEmployees: true,
					canViewTimesheets: true,
					canViewTimesheetsDepartment: true,
					canViewTimesheetsSelectedEmployees: true,
					canManageSchedule: true,
					canManageScheduleDepartment: true,
					canManageScheduleCustom: true
				},
				selectedEmployees: selectedEmployees || []
			})
		} else {
			if (permissions) {
				config.permissions = { ...config.permissions, ...permissions }
			}
			if (selectedEmployees !== undefined) {
				config.selectedEmployees = selectedEmployees
			}
		}

		await config.save()

		// Zaktualizuj relacje supervisors w User
		// Usuń stare relacje
		await User.updateMany(
			{ supervisors: supervisorId },
			{ $pull: { supervisors: supervisorId } }
		)

		// Dodaj nowe relacje dla wybranych pracowników
		if (selectedEmployees && selectedEmployees.length > 0) {
			await User.updateMany(
				{ _id: { $in: selectedEmployees } },
				{ $addToSet: { supervisors: supervisorId } }
			)
		}

		res.json({ message: 'Supervisor config updated successfully', config })
	} catch (error) {
		console.error('Error updating supervisor config:', error)
		res.status(500).json({ message: 'Error updating supervisor config' })
	}
}

/**
 * Pobierz listę podwładnych przełożonego
 */
exports.getSupervisorSubordinates = async (req, res) => {
	try {
		const { supervisorId } = req.params
		const requestingUser = await User.findById(req.user.userId)

		// Sprawdź uprawnienia
		if (!requestingUser.roles.includes('Admin') && requestingUser._id.toString() !== supervisorId) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const supervisor = await User.findById(supervisorId)
		if (!supervisor) {
			return res.status(404).json({ message: 'Supervisor not found' })
		}

		// Pobierz wszystkich użytkowników z zespołu
		const teamUsers = await User.find({ teamId: supervisor.teamId })
			.select('firstName lastName username position department supervisors')
			.lean()

		// Pobierz konfigurację przełożonego
		const config = await SupervisorConfig.findOne({ supervisorId })
		const selectedEmployeeIds = config ? config.selectedEmployees.map(id => id.toString()) : []

		// Sprawdź działy przełożonego
		const supervisorDepts = Array.isArray(supervisor.department) ? supervisor.department : (supervisor.department ? [supervisor.department] : [])

		// Oznacz którzy użytkownicy są podwładnymi
		// Podwładny to: użytkownik, który jest w selectedEmployees LUB (jeśli selectedEmployees jest puste) 
		// użytkownik z działu przełożonego (domyślne zachowanie)
		// UWAGA: Lista podwładnych powinna być niezależna od uprawnień - pokazuje tylko, którzy użytkownicy są w selectedEmployees
		const usersWithSubordinateStatus = teamUsers.map((user) => {
			const userIdStr = user._id.toString()
			
			// Sprawdź czy użytkownik jest w selectedEmployees
			const isInSelectedEmployees = selectedEmployeeIds.includes(userIdStr)
			
			// Jeśli selectedEmployees jest puste, sprawdź czy użytkownik jest w dziale przełożonego
			let isSubordinate = false
			if (selectedEmployeeIds.length > 0) {
				// Jeśli są wybrani pracownicy, tylko oni są podwładnymi
				isSubordinate = isInSelectedEmployees
			} else {
				// Jeśli nie ma wybranych pracowników, domyślnie wszyscy z działu są podwładnymi
				if (supervisorDepts.length > 0) {
					const userDepts = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
					isSubordinate = supervisorDepts.some(dept => userDepts.includes(dept))
				} else {
					// Jeśli przełożony nie ma działu, nikt nie jest domyślnie podwładnym
					isSubordinate = false
				}
			}
			
			return {
				...user,
				isSubordinate: isSubordinate,
				_id: user._id
			}
		})

		res.json(usersWithSubordinateStatus)
	} catch (error) {
		console.error('Error getting supervisor subordinates:', error)
		res.status(500).json({ message: 'Error getting supervisor subordinates' })
	}
}

/**
 * Zaktualizuj listę podwładnych przełożonego
 */
exports.updateSupervisorSubordinates = async (req, res) => {
	try {
		const { supervisorId } = req.params
		const { subordinateIds } = req.body
		const requestingUser = await User.findById(req.user.userId)
		
		// Get translation function - use req.t if available, otherwise create instance with default 'pl'
		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl', // Default to Polish
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		// Sprawdź uprawnienia - tylko admin może aktualizować podwładnych
		if (!requestingUser.roles.includes('Admin')) {
			return res.status(403).json({ message: 'Access denied. Only Admin can update supervisor subordinates.' })
		}

		const supervisor = await User.findById(supervisorId)
		if (!supervisor) {
			return res.status(404).json({ message: 'Supervisor not found' })
		}

		if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
			return res.status(400).json({ message: t('supervisor.notASupervisor') || 'User is not a supervisor' })
		}

		// Pobierz lub utwórz konfigurację
		let config = await SupervisorConfig.findOne({ supervisorId })
		if (!config) {
			config = new SupervisorConfig({
				supervisorId: supervisor._id,
				teamId: supervisor.teamId,
				permissions: {
					canApproveLeaves: true,
					canApproveLeavesDepartment: true,
					canApproveLeavesSelectedEmployees: true,
					canViewTimesheets: true,
					canViewTimesheetsDepartment: true,
					canViewTimesheetsSelectedEmployees: true,
					canManageSchedule: true,
					canManageScheduleDepartment: true,
					canManageScheduleCustom: true
				},
				selectedEmployees: subordinateIds || []
			})
		} else {
			config.selectedEmployees = subordinateIds || []
		}

		await config.save()

		// Usuń stare relacje supervisors
		await User.updateMany(
			{ supervisors: supervisorId },
			{ $pull: { supervisors: supervisorId } }
		)

		// Dodaj nowe relacje supervisors
		if (subordinateIds && subordinateIds.length > 0) {
			await User.updateMany(
				{ _id: { $in: subordinateIds }, teamId: supervisor.teamId },
				{ $addToSet: { supervisors: supervisorId } }
			)
		}

		res.json({ message: 'Supervisor subordinates updated successfully', config })
	} catch (error) {
		console.error('Error updating supervisor subordinates:', error)
		res.status(500).json({ message: 'Error updating supervisor subordinates' })
	}
}

