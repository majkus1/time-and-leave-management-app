const { firmDb } = require('../db/db')
const Settings = require('../models/Settings')(firmDb)
const User = require('../models/user')(firmDb)

/**
 * Pobierz wszystkie typy wniosków dla zespołu (włączone i wyłączone)
 * GET /api/leave-request-types
 */
exports.getLeaveRequestTypes = async (req, res) => {
	try {
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser || !requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}

		const settings = await Settings.getSettings(requestingUser.teamId)
		res.json(settings.leaveRequestTypes || [])
	} catch (error) {
		console.error('Error retrieving leave request types:', error)
		res.status(500).send('Failed to retrieve leave request types.')
	}
}

/**
 * Aktualizuj typy wniosków dla zespołu
 * PUT /api/leave-request-types
 * Body: { leaveRequestTypes: [...] }
 */
exports.updateLeaveRequestTypes = async (req, res) => {
	try {
		const { leaveRequestTypes } = req.body

		// Sprawdź uprawnienia - tylko Admin i HR
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) {
			return res.status(403).send('Access denied')
		}

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).send('Access denied. Only Admin and HR can update leave request types.')
		}

		if (!requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}

		if (!Array.isArray(leaveRequestTypes)) {
			return res.status(400).send('leaveRequestTypes must be an array')
		}

		const settings = await Settings.getSettings(requestingUser.teamId)

		// Walidacja typów
		const validTypes = leaveRequestTypes.filter(type => {
			return type && 
				typeof type.id === 'string' && type.id.trim() !== '' &&
				typeof type.name === 'string' && type.name.trim() !== '' &&
				typeof type.isSystem === 'boolean' &&
				typeof type.isEnabled === 'boolean' &&
				typeof type.requireApproval === 'boolean' &&
				typeof type.allowDaysLimit === 'boolean'
		}).map(type => ({
			id: type.id.trim(),
			name: type.name.trim(),
			nameEn: type.nameEn ? type.nameEn.trim() : undefined,
			isSystem: type.isSystem,
			isEnabled: type.isEnabled,
			requireApproval: type.requireApproval,
			allowDaysLimit: type.allowDaysLimit
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
		await settings.save()

		res.json(settings.leaveRequestTypes)
	} catch (error) {
		console.error('Error updating leave request types:', error)
		res.status(500).send('Failed to update leave request types.')
	}
}

/**
 * Dodaj niestandardowy typ wniosku
 * POST /api/leave-request-types
 * Body: { name, nameEn?, requireApproval, allowDaysLimit }
 */
exports.addCustomLeaveRequestType = async (req, res) => {
	try {
		const { name, nameEn, requireApproval, allowDaysLimit } = req.body

		// Sprawdź uprawnienia - tylko Admin i HR
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) {
			return res.status(403).send('Access denied')
		}

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).send('Access denied. Only Admin and HR can add custom leave request types.')
		}

		if (!requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return res.status(400).send('name is required and must be a non-empty string')
		}

		if (typeof requireApproval !== 'boolean') {
			return res.status(400).send('requireApproval is required and must be a boolean')
		}

		if (typeof allowDaysLimit !== 'boolean') {
			return res.status(400).send('allowDaysLimit is required and must be a boolean')
		}

		const settings = await Settings.getSettings(requestingUser.teamId)

		// Generuj unikalne ID dla niestandardowego typu
		const existingIds = (settings.leaveRequestTypes || []).map(t => t.id)
		let customId = `custom-${Date.now()}`
		while (existingIds.includes(customId)) {
			customId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		}

		const newType = {
			id: customId,
			name: name.trim(),
			nameEn: nameEn ? nameEn.trim() : undefined,
			isSystem: false,
			isEnabled: true,
			requireApproval: requireApproval,
			allowDaysLimit: allowDaysLimit
		}

		if (!settings.leaveRequestTypes) {
			settings.leaveRequestTypes = []
		}
		settings.leaveRequestTypes.push(newType)
		await settings.save()

		res.status(201).json(newType)
	} catch (error) {
		console.error('Error adding custom leave request type:', error)
		res.status(500).send('Failed to add custom leave request type.')
	}
}

/**
 * Usuń niestandardowy typ wniosku
 * DELETE /api/leave-request-types/:id
 */
exports.deleteCustomLeaveRequestType = async (req, res) => {
	try {
		const { id } = req.params

		// Sprawdź uprawnienia - tylko Admin i HR
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) {
			return res.status(403).send('Access denied')
		}

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).send('Access denied. Only Admin and HR can delete custom leave request types.')
		}

		if (!requestingUser.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}

		const settings = await Settings.getSettings(requestingUser.teamId)

		// Nie można usuwać typów systemowych
		const systemTypeIds = new Set(['leaveform.option1', 'leaveform.option2', 'leaveform.option3', 'leaveform.option4', 'leaveform.option5', 'leaveform.option6'])
		if (systemTypeIds.has(id)) {
			return res.status(400).send('Cannot delete system leave request types')
		}

		const typeIndex = (settings.leaveRequestTypes || []).findIndex(t => t.id === id && !t.isSystem)
		if (typeIndex === -1) {
			return res.status(404).send('Custom leave request type not found')
		}

		settings.leaveRequestTypes.splice(typeIndex, 1)
		await settings.save()

		res.json({ message: 'Custom leave request type deleted successfully' })
	} catch (error) {
		console.error('Error deleting custom leave request type:', error)
		res.status(500).send('Failed to delete custom leave request type.')
	}
}
