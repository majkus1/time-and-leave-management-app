const express = require('express')
const router = express.Router()
const { firmDb } = require('../db/db')
const PushSubscription = require('../models/PushSubscription')(firmDb)
const Team = require('../models/Team')(firmDb)
const { authenticateToken } = require('../middleware/authMiddleware')
const entitlementsService = require('../services/entitlementsService')
const { normalizePaidPlanKey, isCorePlanKey } = require('../constants/planCatalog')

const DEFAULT_PUSH_PREFERENCES = {
	chat: true,
	tasks: true,
	taskStatusChanges: true,
	taskComments: true,
	leaves: true,
	announcements: true,
	schedulePublished: true,
	timer: true,
}

const PUSH_PREF_MODULE_REQUIREMENTS = {
	chat: 'chat',
	tasks: 'tasks',
	taskStatusChanges: 'tasks',
	taskComments: 'tasks',
	schedulePublished: 'schedules_ai',
	timer: 'timer_qr',
}

function canUsePushPreference(team, prefKey) {
	const reqModule = PUSH_PREF_MODULE_REQUIREMENTS[prefKey]
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

function sanitizePushPreferencesByTeam(team, raw) {
	const prefs = { ...DEFAULT_PUSH_PREFERENCES, ...(raw || {}) }
	for (const key of Object.keys(PUSH_PREF_MODULE_REQUIREMENTS)) {
		if (!canUsePushPreference(team, key)) prefs[key] = false
	}
	return prefs
}

// Register push subscription
router.post('/register', authenticateToken, async (req, res) => {
	try {
		const { endpoint, keys, userAgent } = req.body
		const userId = req.user.userId
		const teamId = req.user.teamId

		if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
			return res.status(400).json({ message: 'Invalid subscription data' })
		}

		// Check if subscription already exists
		let subscription = await PushSubscription.findOne({ endpoint })

		if (subscription) {
			// Update existing subscription
			subscription.userId = userId
			subscription.teamId = teamId
			subscription.keys = keys
			subscription.userAgent = userAgent || req.headers['user-agent'] || ''
			subscription.enabled = true
			subscription.lastUsed = new Date()
			await subscription.save()
		} else {
			// Create new subscription
			subscription = new PushSubscription({
				userId,
				teamId,
				endpoint,
				keys,
				userAgent: userAgent || req.headers['user-agent'] || '',
				enabled: true,
			preferences: DEFAULT_PUSH_PREFERENCES
			})
			await subscription.save()
		}

		res.json({ 
			message: 'Push subscription registered successfully',
			subscriptionId: subscription._id
		})
	} catch (error) {
		console.error('Error registering push subscription:', error)
		res.status(500).json({ message: 'Failed to register push subscription' })
	}
})

// Unregister push subscription
router.post('/unregister', authenticateToken, async (req, res) => {
	try {
		const { endpoint } = req.body

		if (!endpoint) {
			return res.status(400).json({ message: 'Endpoint is required' })
		}

		await PushSubscription.findOneAndDelete({ endpoint })

		res.json({ message: 'Push subscription unregistered successfully' })
	} catch (error) {
		console.error('Error unregistering push subscription:', error)
		res.status(500).json({ message: 'Failed to unregister push subscription' })
	}
})

// Update push notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId
		const { preferences } = req.body
		const team = await Team.findById(req.user.teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt'
		)

		if (!preferences || typeof preferences !== 'object') {
			return res.status(400).json({ message: 'Invalid preferences data' })
		}
		const sanitized = sanitizePushPreferencesByTeam(team, preferences)

		// Update all user's subscriptions
		const result = await PushSubscription.updateMany(
			{ userId },
			{
				$set: {
					'preferences.chat': sanitized.chat !== false,
					'preferences.tasks': sanitized.tasks !== false,
					'preferences.taskStatusChanges': sanitized.taskStatusChanges !== false,
					'preferences.taskComments': sanitized.taskComments !== false,
					'preferences.leaves': sanitized.leaves !== false,
					'preferences.announcements': sanitized.announcements !== false,
					'preferences.schedulePublished': sanitized.schedulePublished !== false,
					'preferences.timer': sanitized.timer !== false,
				}
			}
		)

		res.json({ 
			message: 'Preferences updated successfully',
			updated: result.modifiedCount
		})
	} catch (error) {
		console.error('Error updating push preferences:', error)
		res.status(500).json({ message: 'Failed to update preferences' })
	}
})

// Get push notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.userId
		const team = await Team.findById(req.user.teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt'
		)

		const subscription = await PushSubscription.findOne({ userId, enabled: true })

		if (!subscription) {
			return res.json({
				enabled: false,
				preferences: sanitizePushPreferencesByTeam(team, DEFAULT_PUSH_PREFERENCES)
			})
		}

		const preferences = sanitizePushPreferencesByTeam(team, subscription.preferences)

		res.json({
			enabled: subscription.enabled,
			preferences
		})
	} catch (error) {
		console.error('Error getting push preferences:', error)
		res.status(500).json({ message: 'Failed to get preferences' })
	}
})

// Get VAPID public key (needed for client-side subscription)
router.get('/vapid-public-key', (req, res) => {
	const publicKey = process.env.VAPID_PUBLIC_KEY
	if (!publicKey) {
		return res.status(500).json({ message: 'VAPID keys not configured' })
	}
	res.json({ publicKey })
})

module.exports = router
