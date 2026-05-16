const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const {
	assertCanViewSupervisor,
	assertCanManageSupervisor,
	sendSupervisorAccessError,
} = require('../utils/supervisorAccess')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

/**
 * Pobierz konfigurację przełożonego
 */
exports.getSupervisorConfig = async (req, res) => {
	try {
		const { supervisorId } = req.params
		const access = await assertCanViewSupervisor({
			viewerId: req.user.userId,
			supervisorId,
		})
		if (!access.ok) {
			return sendSupervisorAccessError(res, access)
		}

		const { supervisor } = access

		let config = await SupervisorConfig.findOne({ supervisorId })
			.populate({
				path: 'selectedEmployees',
				select: 'firstName lastName username position department',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
			})

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
					canManageScheduleCustom: true,
				},
				selectedEmployees: [],
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

		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl',
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		const access = await assertCanManageSupervisor({
			viewerId: req.user.userId,
			supervisorId,
		})
		if (!access.ok) {
			return sendSupervisorAccessError(res, access)
		}

		const { supervisor } = access

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
					canManageScheduleCustom: true,
				},
				selectedEmployees: selectedEmployees || [],
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

		await User.updateMany({ supervisors: supervisorId }, { $pull: { supervisors: supervisorId } })

		if (selectedEmployees && selectedEmployees.length > 0) {
			await User.updateMany(
				{ _id: { $in: selectedEmployees }, teamId: supervisor.teamId },
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
		const access = await assertCanViewSupervisor({
			viewerId: req.user.userId,
			supervisorId,
		})
		if (!access.ok) {
			return sendSupervisorAccessError(res, access)
		}

		const { supervisor } = access

		const teamUsers = await User.find({
			teamId: supervisor.teamId,
			...ACTIVE_USER_FILTER,
		})
			.select('firstName lastName username position department supervisors')
			.lean()

		const config = await SupervisorConfig.findOne({ supervisorId })
		const selectedEmployeeIds = config ? config.selectedEmployees.map(id => id.toString()) : []

		const supervisorDepts = Array.isArray(supervisor.department)
			? supervisor.department
			: supervisor.department
				? [supervisor.department]
				: []

		const usersWithSubordinateStatus = teamUsers.map(user => {
			const userIdStr = user._id.toString()
			const isInSelectedEmployees = selectedEmployeeIds.includes(userIdStr)

			let isSubordinate = false
			if (selectedEmployeeIds.length > 0) {
				isSubordinate = isInSelectedEmployees
			} else if (supervisorDepts.length > 0) {
				const userDepts = Array.isArray(user.department)
					? user.department
					: user.department
						? [user.department]
						: []
				isSubordinate = supervisorDepts.some(dept => userDepts.includes(dept))
			}

			return {
				...user,
				isSubordinate,
				_id: user._id,
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

		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl',
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		const access = await assertCanManageSupervisor({
			viewerId: req.user.userId,
			supervisorId,
		})
		if (!access.ok) {
			return sendSupervisorAccessError(res, access)
		}

		const { supervisor } = access

		if (!supervisor.roles.includes('Przełożony (Supervisor)')) {
			return res.status(400).json({
				message: t('supervisor.notASupervisor') || 'User is not a supervisor',
			})
		}

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
					canManageScheduleCustom: true,
				},
				selectedEmployees: subordinateIds || [],
			})
		} else {
			config.selectedEmployees = subordinateIds || []
		}

		await config.save()

		await User.updateMany({ supervisors: supervisorId }, { $pull: { supervisors: supervisorId } })

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
