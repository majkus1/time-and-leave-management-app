const { firmDb } = require('../db/db')
const Settings = require('../models/Settings')(firmDb)
const User = require('../models/user')(firmDb)
const { sanitizeWorkActivity, validateWorkActivitiesArray } = require('../utils/workActivities')

async function getRequestingUser(req) {
	return User.findById(req.user.userId)
}

function assertAdminOrHr(user, res) {
	if (!user) {
		res.status(403).send('Access denied')
		return false
	}
	const isAdmin = user.roles.includes('Admin')
	const isHR = user.roles.includes('HR')
	if (!isAdmin && !isHR) {
		res.status(403).send('Access denied. Only Admin and HR can manage work activities.')
		return false
	}
	if (!user.teamId) {
		res.status(403).send('Access denied. User team not found.')
		return false
	}
	return true
}

exports.getWorkActivities = async (req, res) => {
	try {
		const requestingUser = await getRequestingUser(req)
		if (!requestingUser?.teamId) {
			return res.status(403).send('Access denied. User team not found.')
		}
		const settings = await Settings.getSettings(requestingUser.teamId)
		res.json(settings.workActivities || [])
	} catch (error) {
		console.error('Error retrieving work activities:', error)
		res.status(500).send('Failed to retrieve work activities.')
	}
}

exports.updateWorkActivities = async (req, res) => {
	try {
		const requestingUser = await getRequestingUser(req)
		if (!assertAdminOrHr(requestingUser, res)) return

		const validation = validateWorkActivitiesArray(req.body?.workActivities)
		if (!validation.ok) {
			return res.status(400).send(validation.message)
		}

		const settings = await Settings.getSettings(requestingUser.teamId)
		settings.workActivities = validation.activities
		await settings.save()
		res.json(settings.workActivities)
	} catch (error) {
		console.error('Error updating work activities:', error)
		res.status(500).send('Failed to update work activities.')
	}
}

exports.addWorkActivity = async (req, res) => {
	try {
		const requestingUser = await getRequestingUser(req)
		if (!assertAdminOrHr(requestingUser, res)) return

		const { name, nameEn, group, isEnabled, trackQuantity, unit } = req.body || {}
		if (!name || !String(name).trim()) {
			return res.status(400).send('name is required')
		}

		const settings = await Settings.getSettings(requestingUser.teamId)
		const newActivity = sanitizeWorkActivity({
			id: `activity-${Date.now()}`,
			name: String(name).trim(),
			nameEn: nameEn ? String(nameEn).trim() : undefined,
			group: group || 'other',
			trackQuantity: trackQuantity === true,
			unit: unit ? String(unit).trim() : '',
			isEnabled: isEnabled !== false,
		})
		if (!newActivity) {
			return res.status(400).send('Invalid activity data')
		}
		if (newActivity.trackQuantity && !newActivity.unit) {
			return res.status(400).send('Unit is required when quantity tracking is enabled')
		}

		settings.workActivities = [...(settings.workActivities || []), newActivity]
		await settings.save()
		res.status(201).json(newActivity)
	} catch (error) {
		console.error('Error adding work activity:', error)
		res.status(500).send('Failed to add work activity.')
	}
}

exports.deleteWorkActivity = async (req, res) => {
	try {
		const requestingUser = await getRequestingUser(req)
		if (!assertAdminOrHr(requestingUser, res)) return

		const activityId = req.params.id
		if (!activityId) return res.status(400).send('Activity id is required')

		const settings = await Settings.getSettings(requestingUser.teamId)
		const before = settings.workActivities || []
		const after = before.filter(item => item.id !== activityId)
		if (after.length === before.length) {
			return res.status(404).send('Activity not found')
		}
		settings.workActivities = after
		await settings.save()
		res.json({ success: true })
	} catch (error) {
		console.error('Error deleting work activity:', error)
		res.status(500).send('Failed to delete work activity.')
	}
}
