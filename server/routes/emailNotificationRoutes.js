const express = require('express')
const router = express.Router()
const { firmDb } = require('../db/db')
const { authenticateToken } = require('../middleware/authMiddleware')
const EmailNotificationPreference = require('../models/EmailNotificationPreference')(firmDb)
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { normalizePaidPlanKey, isCorePlanKey } = require('../constants/planCatalog')

const DEFAULT_EMAIL_NOTIFICATION_PREFERENCES = {
	chat: true,
	tasks: true,
	taskStatusChanges: true,
	taskComments: true,
	leaves: true,
	announcements: true,
	schedulePublished: true,
}

const EMAIL_PREF_MODULE_REQUIREMENTS = {
	chat: 'chat',
	tasks: 'tasks',
	taskStatusChanges: 'tasks',
	taskComments: 'tasks',
	schedulePublished: 'schedules_ai',
}

function canUseEmailPreference(team, prefKey) {
	const reqModule = EMAIL_PREF_MODULE_REQUIREMENTS[prefKey]
	if (!reqModule) return true
	if (!team) return false
	if (entitlementsService.isTrialActive(team)) return true
	if (entitlementsService.isLegacyPreBillingTeam(team)) return true
	if (entitlementsService.isSpecialNamedTeam(team)) return true
	if (entitlementsService.isFreemiumTierTeam(team)) return false
	if (!entitlementsService.isPaidSubscriptionActive(team)) return false
	const nk = normalizePaidPlanKey(team.billingPlanKey)
	if (!isCorePlanKey(nk)) return true
	return entitlementsService.effectiveBillingModuleKeys(team).includes(reqModule)
}

function sanitizeEmailPreferencesByTeam(team, raw) {
	const preferences = {
		...DEFAULT_EMAIL_NOTIFICATION_PREFERENCES,
		...(raw || {}),
	}
	for (const key of Object.keys(EMAIL_PREF_MODULE_REQUIREMENTS)) {
		if (!canUseEmailPreference(team, key)) preferences[key] = false
	}
	return preferences
}

router.get('/preferences', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId
		const teamId = req.user.teamId
		const team = await Team.findById(teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt'
		)

		const doc = await EmailNotificationPreference.findOne({ userId, teamId }).lean()
		const preferences = sanitizeEmailPreferencesByTeam(team, doc?.preferences)

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
		const team = await Team.findById(teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt'
		)

		if (!preferences || typeof preferences !== 'object') {
			return res.status(400).json({ message: 'Invalid preferences data' })
		}

		const mergedPreferences = sanitizeEmailPreferencesByTeam(team, preferences)

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
