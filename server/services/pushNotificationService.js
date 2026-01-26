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
	console.log(`[Push] Sending chat notification for channel ${channelId} to ${recipientUserIds.length} users`)
	
	// Filter subscriptions that have chat notifications enabled
	const subscriptions = await PushSubscription.find({
		userId: { $in: recipientUserIds },
		enabled: true,
		'preferences.chat': true
	})

	console.log(`[Push] Found ${subscriptions.length} active subscriptions with chat enabled`)

	if (subscriptions.length === 0) {
		console.log('[Push] No subscriptions found, skipping push notification')
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

				console.log(`[Push] Sending to subscription ${subscription._id}, endpoint: ${subscription.endpoint.substring(0, 50)}...`)
				
				await webpush.sendNotification(
					subscriptionData,
					JSON.stringify(payload)
				)

				console.log(`[Push] Successfully sent to subscription ${subscription._id}`)
				subscription.lastUsed = new Date()
				await subscription.save()

				return { success: true }
			} catch (error) {
				if (error.statusCode === 410) {
					console.log(`[Push] Subscription ${subscription._id} expired (410), removing`)
					await PushSubscription.findByIdAndDelete(subscription._id)
					return { success: false, error: 'Subscription expired' }
				}
				console.error(`[Push] Error sending chat push to subscription ${subscription._id}:`, error.message, error.statusCode)
				return { success: false, error: error.message }
			}
		})
	)

	const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
	const failed = results.length - sent
	console.log(`[Push] Chat notification result: ${sent} sent, ${failed} failed`)
	return { sent, failed }
}

/**
 * Send task notification (new task or status change)
 */
const sendTaskNotification = async (task, board, createdByUser, recipientUserIds, isStatusChange = false, t = null) => {
	const notificationType = isStatusChange ? 'status change' : 'new task'
	console.log(`[Push] Sending task ${notificationType} notification for task ${task._id} to ${recipientUserIds.length} users`)
	
	// Determine preference key based on notification type
	const preferenceKey = isStatusChange ? 'preferences.taskStatusChanges' : 'preferences.tasks'

	// Build query to filter subscriptions
	const query = {
		userId: { $in: recipientUserIds },
		enabled: true
	}
	query[preferenceKey] = true

	const subscriptions = await PushSubscription.find(query)

	console.log(`[Push] Found ${subscriptions.length} active subscriptions with ${preferenceKey} enabled`)

	if (subscriptions.length === 0) {
		console.log('[Push] No subscriptions found, skipping push notification')
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

				console.log(`[Push] Sending task notification to subscription ${subscription._id}, endpoint: ${subscription.endpoint.substring(0, 50)}...`)
				
				await webpush.sendNotification(
					subscriptionData,
					JSON.stringify(payload)
				)

				console.log(`[Push] Successfully sent task notification to subscription ${subscription._id}`)
				subscription.lastUsed = new Date()
				await subscription.save()

				return { success: true }
			} catch (error) {
				if (error.statusCode === 410) {
					console.log(`[Push] Subscription ${subscription._id} expired (410), removing`)
					await PushSubscription.findByIdAndDelete(subscription._id)
					return { success: false, error: 'Subscription expired' }
				}
				console.error(`[Push] Error sending task push to subscription ${subscription._id}:`, error.message, error.statusCode)
				return { success: false, error: error.message }
			}
		})
	)

	const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
	const failed = results.length - sent
	console.log(`[Push] Task notification result: ${sent} sent, ${failed} failed`)
	return { sent, failed }
}

/**
 * Send leave request notification
 * @param {Object} leaveRequest - The leave request object
 * @param {Object} user - The employee who created the request
 * @param {Array} recipientUserIds - Array of user IDs to notify
 * @param {String} notificationType - 'new', 'statusChanged', 'cancelled'
 * @param {Object} updatedByUser - User who updated/cancelled (optional)
 * @param {Function} t - Translation function
 */
const sendLeaveRequestPushNotification = async (leaveRequest, user, recipientUserIds, notificationType, updatedByUser = null, t = null) => {
	console.log(`[Push] Sending leave request ${notificationType} notification to ${recipientUserIds.length} users`)
	
	// Filter subscriptions that have leave notifications enabled
	// For now, we'll use a general 'leaves' preference, but we can add more specific preferences later
	const subscriptions = await PushSubscription.find({
		userId: { $in: recipientUserIds },
		enabled: true,
		'preferences.leaves': true // New preference for leave notifications
	})

	console.log(`[Push] Found ${subscriptions.length} active subscriptions with leave notifications enabled`)

	if (subscriptions.length === 0) {
		console.log('[Push] No subscriptions found, skipping push notification')
		return { sent: 0, failed: 0 }
	}

	const userName = user?.firstName && user?.lastName
		? `${user.firstName} ${user.lastName}`
		: 'Pracownik'

	const startDate = leaveRequest.startDate ? new Date(leaveRequest.startDate).toISOString().split('T')[0] : ''
	const endDate = leaveRequest.endDate ? new Date(leaveRequest.endDate).toISOString().split('T')[0] : ''
	
	// Get leave request type name
	let typeText = leaveRequest.type || 'Urlop'
	if (t) {
		try {
			// Try to get translated type name
			const translatedType = t(leaveRequest.type)
			if (translatedType && translatedType !== leaveRequest.type) {
				typeText = translatedType
			}
		} catch (error) {
			// Use default
		}
	}

	let title, body

	switch (notificationType) {
		case 'new':
			title = t ? t('push.leave.newRequestTitle') : 'Nowy wniosek urlopowy'
			body = t
				? t('push.leave.newRequestBody', { userName, type: typeText, startDate, endDate, days: leaveRequest.daysRequested })
				: `${userName} złożył wniosek: ${typeText} (${startDate} - ${endDate}, ${leaveRequest.daysRequested} dni)`
			break
		case 'statusChanged':
			const statusText = leaveRequest.status ? (t ? t(leaveRequest.status) : leaveRequest.status) : 'zmieniony'
			const updatedByName = updatedByUser?.firstName && updatedByUser?.lastName
				? `${updatedByUser.firstName} ${updatedByUser.lastName}`
				: 'Ktoś'
			title = t ? t('push.leave.statusChangedTitle') : 'Status wniosku zmieniony'
			body = t
				? t('push.leave.statusChangedBody', { userName, type: typeText, status: statusText, updatedByName })
				: `Status wniosku ${userName} (${typeText}) został zmieniony na "${statusText}" przez ${updatedByName}`
			break
		case 'cancelled':
			title = t ? t('push.leave.cancelledTitle') : 'Wniosek urlopowy anulowany'
			body = t
				? t('push.leave.cancelledBody', { userName, type: typeText, startDate, endDate })
				: `${userName} anulował wniosek: ${typeText} (${startDate} - ${endDate})`
			break
		default:
			title = 'Powiadomienie o urlopie'
			body = `${userName}: ${typeText}`
	}

	const payload = {
		title,
		body,
		icon: '/icon-192x192.png',
		badge: '/icon-96x96.png',
		tag: `leave-${leaveRequest._id}`,
		data: {
			url: `/leave-requests/${user._id}`,
			type: 'leave',
			leaveRequestId: leaveRequest._id?.toString(),
			userId: user._id?.toString()
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

				console.log(`[Push] Sending leave notification to subscription ${subscription._id}`)
				
				await webpush.sendNotification(
					subscriptionData,
					JSON.stringify(payload)
				)

				console.log(`[Push] Successfully sent leave notification to subscription ${subscription._id}`)
				subscription.lastUsed = new Date()
				await subscription.save()

				return { success: true }
			} catch (error) {
				if (error.statusCode === 410) {
					console.log(`[Push] Subscription ${subscription._id} expired (410), removing`)
					await PushSubscription.findByIdAndDelete(subscription._id)
					return { success: false, error: 'Subscription expired' }
				}
				console.error(`[Push] Error sending leave push to subscription ${subscription._id}:`, error.message, error.statusCode)
				return { success: false, error: error.message }
			}
		})
	)

	const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
	const failed = results.length - sent
	console.log(`[Push] Leave notification result: ${sent} sent, ${failed} failed`)
	return { sent, failed }
}

module.exports = {
	sendPushNotification,
	sendPushNotificationToUsers,
	sendChatNotification,
	sendTaskNotification,
	sendLeaveRequestPushNotification
}
