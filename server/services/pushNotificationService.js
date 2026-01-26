const webpush = require('web-push')
const { firmDb } = require('../db/db')
const PushSubscription = require('../models/PushSubscription')(firmDb)
const User = require('../models/user')(firmDb)

// Initialize web-push with VAPID keys
// These should be set in environment variables
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
	webpush.setVapidDetails(
		process.env.VAPID_SUBJECT, // Usually a mailto: URL
		process.env.VAPID_PUBLIC_KEY,
		process.env.VAPID_PRIVATE_KEY
	)
} else {
	console.warn('VAPID keys not set. Push notifications will not work. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in .env')
}

/**
 * Send push notification to a single user
 */
const sendPushNotification = async (userId, payload) => {
	try {
		// Get all active subscriptions for user
		const subscriptions = await PushSubscription.find({
			userId,
			enabled: true
		})

		if (subscriptions.length === 0) {
			return { sent: 0, failed: 0 }
		}

		const results = await Promise.allSettled(
			subscriptions.map(async (subscription) => {
				try {
					const subscriptionData = {
						endpoint: subscription.endpoint,
						keys: {
							p256dh: subscription.keys.p256dh,
							auth: subscription.keys.auth
						}
					}

					await webpush.sendNotification(
						subscriptionData,
						JSON.stringify(payload)
					)

					// Update lastUsed timestamp
					subscription.lastUsed = new Date()
					await subscription.save()

					return { success: true, subscriptionId: subscription._id }
				} catch (error) {
					// If subscription is invalid (410 Gone), remove it
					if (error.statusCode === 410) {
						await PushSubscription.findByIdAndDelete(subscription._id)
						return { success: false, error: 'Subscription expired', subscriptionId: subscription._id }
					}
					// Other errors - log but don't remove subscription
					console.error(`Error sending push to subscription ${subscription._id}:`, error.message)
					return { success: false, error: error.message, subscriptionId: subscription._id }
				}
			})
		)

		const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
		const failed = results.length - sent

		return { sent, failed, total: subscriptions.length }
	} catch (error) {
		console.error('Error in sendPushNotification:', error)
		return { sent: 0, failed: 0, error: error.message }
	}
}

/**
 * Send push notification to multiple users
 */
const sendPushNotificationToUsers = async (userIds, payload) => {
	try {
		const results = await Promise.all(
			userIds.map(userId => sendPushNotification(userId, payload))
		)

		const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
		const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

		return { sent: totalSent, failed: totalFailed, total: results.length }
	} catch (error) {
		console.error('Error in sendPushNotificationToUsers:', error)
		return { sent: 0, failed: 0, error: error.message }
	}
}

/**
 * Send chat message notification
 */
const sendChatNotification = async (channelId, message, recipientUserIds) => {
	// Filter subscriptions that have chat notifications enabled
	const subscriptions = await PushSubscription.find({
		userId: { $in: recipientUserIds },
		enabled: true,
		'preferences.chat': true
	})

	if (subscriptions.length === 0) {
		return { sent: 0, failed: 0 }
	}

	const messageSender = message.userId?.firstName && message.userId?.lastName
		? `${message.userId.firstName} ${message.userId.lastName}`
		: 'Ktoś'

	const payload = {
		title: 'Nowa wiadomość',
		body: `${messageSender}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
		icon: '/icon-192x192.png',
		badge: '/icon-96x96.png',
		tag: `chat-${channelId}`,
		data: {
			url: `/chat`,
			type: 'chat',
			channelId: channelId.toString(),
			messageId: message._id?.toString()
		},
		requireInteraction: false,
		silent: false
	}

	const results = await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				const subscriptionData = {
					endpoint: subscription.endpoint,
					keys: {
						p256dh: subscription.keys.p256dh,
						auth: subscription.keys.auth
					}
				}

				await webpush.sendNotification(
					subscriptionData,
					JSON.stringify(payload)
				)

				subscription.lastUsed = new Date()
				await subscription.save()

				return { success: true }
			} catch (error) {
				if (error.statusCode === 410) {
					await PushSubscription.findByIdAndDelete(subscription._id)
					return { success: false, error: 'Subscription expired' }
				}
				console.error(`Error sending chat push to subscription ${subscription._id}:`, error.message)
				return { success: false, error: error.message }
			}
		})
	)

	const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
	return { sent, failed: results.length - sent }
}

/**
 * Send task notification (new task or status change)
 */
const sendTaskNotification = async (task, board, createdByUser, recipientUserIds, isStatusChange = false, t = null) => {
	// Determine preference key based on notification type
	const preferenceKey = isStatusChange ? 'preferences.taskStatusChanges' : 'preferences.tasks'

	// Build query to filter subscriptions
	const query = {
		userId: { $in: recipientUserIds },
		enabled: true
	}
	query[preferenceKey] = true

	const subscriptions = await PushSubscription.find(query)

	if (subscriptions.length === 0) {
		return { sent: 0, failed: 0 }
	}

	const creatorName = createdByUser?.firstName && createdByUser?.lastName
		? `${createdByUser.firstName} ${createdByUser.lastName}`
		: 'Ktoś'

	const boardName = board.name || 'Tablica'
	const taskTitle = task.title || 'Zadanie'

	let title, body, statusText = task.status

	// Get status text if translation function is available
	if (t) {
		try {
			const statusKey = `boards.status.${task.status}`
			const translatedStatus = t(statusKey)
			if (translatedStatus && translatedStatus !== statusKey) {
				statusText = translatedStatus
			}
		} catch (error) {
			// Use default status
		}
	}

	if (isStatusChange) {
		title = t ? t('email.task.statusChangedTitle') : 'Zmiana statusu zadania'
		body = t 
			? t('email.task.statusChangedMessage', { creatorName, taskTitle, status: statusText, boardName })
			: `${creatorName} zmienił status zadania "${taskTitle}" na "${statusText}" w tablicy "${boardName}"`
	} else {
		title = t ? t('email.task.newTaskTitle') : 'Nowe zadanie'
		body = t
			? t('email.task.newTaskMessage', { creatorName, taskTitle, boardName })
			: `${creatorName} dodał nowe zadanie "${taskTitle}" w tablicy "${boardName}"`
	}

	const payload = {
		title,
		body,
		icon: '/icon-192x192.png',
		badge: '/icon-96x96.png',
		tag: `task-${task._id}`,
		data: {
			url: `/boards/${board._id}`,
			type: 'task',
			taskId: task._id?.toString(),
			boardId: board._id?.toString()
		},
		requireInteraction: false,
		silent: false
	}

	const results = await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				const subscriptionData = {
					endpoint: subscription.endpoint,
					keys: {
						p256dh: subscription.keys.p256dh,
						auth: subscription.keys.auth
					}
				}

				await webpush.sendNotification(
					subscriptionData,
					JSON.stringify(payload)
				)

				subscription.lastUsed = new Date()
				await subscription.save()

				return { success: true }
			} catch (error) {
				if (error.statusCode === 410) {
					await PushSubscription.findByIdAndDelete(subscription._id)
					return { success: false, error: 'Subscription expired' }
				}
				console.error(`Error sending task push to subscription ${subscription._id}:`, error.message)
				return { success: false, error: error.message }
			}
		})
	)

	const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
	return { sent, failed: results.length - sent }
}

module.exports = {
	sendPushNotification,
	sendPushNotificationToUsers,
	sendChatNotification,
	sendTaskNotification
}
