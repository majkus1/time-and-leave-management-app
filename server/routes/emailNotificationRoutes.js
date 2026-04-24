const express = require('express')
const router = express.Router()
const { firmDb } = require('../db/db')
const { authenticateToken } = require('../middleware/authMiddleware')
const EmailNotificationPreference = require('../models/EmailNotificationPreference')(firmDb)

const DEFAULT_EMAIL_NOTIFICATION_PREFERENCES = {
	chat: true,
	tasks: true,
	taskStatusChanges: true,
	taskComments: true,
	leaves: true,
	announcements: true,
	schedulePublished: true,
}

router.get('/preferences', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId
		const teamId = req.user.teamId

		const doc = await EmailNotificationPreference.findOne({ userId, teamId }).lean()
		const preferences = {
			...DEFAULT_EMAIL_NOTIFICATION_PREFERENCES,
			...(doc?.preferences || {}),
		}

		res.json({ preferences })
	} catch (error) {
		console.error('Error getting email notification preferences:', error)
		res.status(500).json({ message: 'Failed to get email notification preferences' })
	}
})

router.put('/preferences', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId
		const teamId = req.user.teamId
		const { preferences } = req.body || {}

		if (!preferences || typeof preferences !== 'object') {
			return res.status(400).json({ message: 'Invalid preferences data' })
		}

		const mergedPreferences = {
			...DEFAULT_EMAIL_NOTIFICATION_PREFERENCES,
			...preferences,
		}

		await EmailNotificationPreference.findOneAndUpdate(
			{ userId, teamId },
			{
				$set: {
					userId,
					teamId,
					'preferences.chat': mergedPreferences.chat !== false,
					'preferences.tasks': mergedPreferences.tasks !== false,
					'preferences.taskStatusChanges': mergedPreferences.taskStatusChanges !== false,
					'preferences.taskComments': mergedPreferences.taskComments !== false,
					'preferences.leaves': mergedPreferences.leaves !== false,
					'preferences.announcements': mergedPreferences.announcements !== false,
					'preferences.schedulePublished': mergedPreferences.schedulePublished !== false,
				},
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		res.json({
			message: 'Email notification preferences updated successfully',
			preferences: mergedPreferences,
		})
	} catch (error) {
		console.error('Error updating email notification preferences:', error)
		res.status(500).json({ message: 'Failed to update email notification preferences' })
	}
})

module.exports = router
