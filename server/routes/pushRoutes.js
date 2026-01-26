const express = require('express')
const router = express.Router()
const { firmDb } = require('../db/db')
const PushSubscription = require('../models/PushSubscription')(firmDb)
const { authenticateToken } = require('../middleware/authMiddleware')

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
				preferences: {
					chat: true,
					tasks: true,
					taskStatusChanges: true
				}
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

		if (!preferences || typeof preferences !== 'object') {
			return res.status(400).json({ message: 'Invalid preferences data' })
		}

		// Update all user's subscriptions
		const result = await PushSubscription.updateMany(
			{ userId },
			{
				$set: {
					'preferences.chat': preferences.chat !== undefined ? preferences.chat : true,
					'preferences.tasks': preferences.tasks !== undefined ? preferences.tasks : true,
					'preferences.taskStatusChanges': preferences.taskStatusChanges !== undefined ? preferences.taskStatusChanges : true
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

		const subscription = await PushSubscription.findOne({ userId, enabled: true })

		if (!subscription) {
			return res.json({
				enabled: false,
				preferences: {
					chat: true,
					tasks: true,
					taskStatusChanges: true
				}
			})
		}

		res.json({
			enabled: subscription.enabled,
			preferences: subscription.preferences
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
