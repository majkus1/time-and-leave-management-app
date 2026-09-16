// controllers/departmentController.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Department = require('../models/Department')(firmDb)
const { createChannelForDepartment } = require('./chatController')
const { createBoardForDepartment } = require('./boardController')
const { createScheduleForDepartment } = require('./scheduleController')
const {
	ACTIVE_USER_FILTER,
	resolveScopedTeamId,
	assertCanMutateTeamResource,
} = require('../utils/teamScopeAccess')

async function loadViewer(req) {
	return User.findOne({
		_id: req.user.userId,
		...ACTIVE_USER_FILTER,
	})
}

function sendScopeError(res, scope) {
	return res.status(scope.status).json({ message: scope.message })
}

exports.getDepartments = async (req, res) => {
	try {
		const viewer = await loadViewer(req)
		const scope = resolveScopedTeamId({
			viewer,
			requestedTeamId: req.query.teamId,
		})
		if (!scope.ok) return sendScopeError(res, scope)

		const { teamId } = scope

		let departments = await Department.find({ teamId, isActive: true }).select('name')

		if (departments.length === 0) {
			const users = await User.find({
				teamId,
				department: { $ne: null, $ne: [], $exists: true },
				...ACTIVE_USER_FILTER,
			}).select('department')

			const allDepartments = new Set()
			users.forEach(user => {
				if (Array.isArray(user.department)) {
					user.department.forEach(dept => {
						if (dept && dept.trim() !== '') {
							allDepartments.add(dept)
						}
					})
				} else if (user.department && user.department.trim() !== '') {
					allDepartments.add(user.department)
				}
			})

			departments = Array.from(allDepartments).map(name => ({ name }))
		}

		const departmentNames = departments.map(dept => dept.name)

		res.json(departmentNames)
	} catch (error) {
		console.error('Error in getDepartments:', error)
		res.status(500).json({ message: 'Błąd pobierania departmentów' })
	}
}

exports.createDepartment = async (req, res) => {
	try {
		const viewer = await loadViewer(req)
		const mutate = assertCanMutateTeamResource(viewer)
		if (!mutate.ok) return sendScopeError(res, mutate)

		const { name, teamId: bodyTeamId } = req.body
		const scope = resolveScopedTeamId({
			viewer,
			requestedTeamId: bodyTeamId,
		})
		if (!scope.ok) return sendScopeError(res, scope)

		const { teamId } = scope

		if (!name || !teamId) {
			return res.status(400).json({ message: 'Nazwa działu i teamId są wymagane' })
		}

		const existingDepartment = await Department.findOne({ name, teamId })
		if (existingDepartment) {
			return res.status(400).json({ message: 'Dział o takiej nazwie już istnieje w tym zespole' })
		}

		const trimmedName = name.trim()
		if (trimmedName.length < 2) {
			return res.status(400).json({ message: 'Nazwa działu musi mieć minimum 2 znaki' })
		}
		if (trimmedName.length > 100) {
			return res.status(400).json({ message: 'Nazwa działu może mieć maksimum 100 znaków' })
		}

		const newDepartment = new Department({ name: trimmedName, teamId })
		await newDepartment.save()

		res.status(201).json({ message: 'Dział został utworzony', department: newDepartment })

		// Kanał, tablica i grafik działu powstają w tle — to ~10 sekwencyjnych zapytań,
		// na które użytkownik nie musi czekać. Klient odświeża listy z opóźnieniem (useDepartments).
		void (async () => {
			for (const [label, create] of [
				['channel', createChannelForDepartment],
				['board', createBoardForDepartment],
				['schedule', createScheduleForDepartment],
			]) {
				try {
					await create(teamId, trimmedName)
				} catch (error) {
					console.error(`Error creating ${label} for department:`, error)
				}
			}
		})()
	} catch (error) {
		console.error('Error in createDepartment:', error)

		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(err => err.message)
			return res.status(400).json({ message: messages.join(', ') })
		}

		res.status(500).json({ message: 'Błąd tworzenia działu' })
	}
}

exports.deleteDepartment = async (req, res) => {
	try {
		const viewer = await loadViewer(req)
		const mutate = assertCanMutateTeamResource(viewer)
		if (!mutate.ok) return sendScopeError(res, mutate)

		const { name } = req.params
		const scope = resolveScopedTeamId({
			viewer,
			requestedTeamId: req.query.teamId,
		})
		if (!scope.ok) return sendScopeError(res, scope)

		const { teamId } = scope

		if (!name || !teamId) {
			return res.status(400).json({ message: 'Nazwa działu i teamId są wymagane' })
		}

		const department = await Department.findOne({ name, teamId })
		if (department) {
			department.isActive = false
			await department.save()
		}

		const users = await User.find({
			teamId,
			...ACTIVE_USER_FILTER,
		})
		for (const user of users) {
			if (Array.isArray(user.department)) {
				user.department = user.department.filter(dept => dept !== name)
			} else if (user.department === name) {
				user.department = []
			}
			await user.save()
		}

		const Board = require('../models/Board')(firmDb)
		const departmentBoard = await Board.findOne({
			teamId,
			departmentName: name,
			type: 'department',
		})
		if (departmentBoard) {
			departmentBoard.isActive = false
			await departmentBoard.save()
		}

		const Schedule = require('../models/Schedule')(firmDb)
		const departmentSchedule = await Schedule.findOne({
			teamId,
			departmentName: name,
			type: 'department',
		})
		if (departmentSchedule) {
			departmentSchedule.isActive = false
			await departmentSchedule.save()
		}

		res.status(200).json({ message: 'Dział został usunięty' })
	} catch (error) {
		console.error('Error in deleteDepartment:', error)
		res.status(500).json({ message: 'Błąd usuwania działu' })
	}
}

exports.getDepartmentUsers = async (req, res) => {
	try {
		const viewer = await loadViewer(req)
		const scope = resolveScopedTeamId({
			viewer,
			requestedTeamId: req.query.teamId,
		})
		if (!scope.ok) return sendScopeError(res, scope)

		const { teamId } = scope
		const { name } = req.params

		if (!name || !teamId) {
			return res.status(400).json({ message: 'Nazwa działu i teamId są wymagane' })
		}

		const users = await User.find({
			teamId,
			$or: [{ department: name }, { department: { $in: [name] } }],
			...ACTIVE_USER_FILTER,
		})
			.select('firstName lastName username position')
			.sort({ firstName: 1, lastName: 1 })

		res.json(users)
	} catch (error) {
		console.error('Error in getDepartmentUsers:', error)
		res.status(500).json({ message: 'Błąd pobierania użytkowników działu' })
	}
}
