const { sendTimerPushNotification } = require('./pushNotificationService')
const { buildTimerPushPayload } = require('../utils/timerPushPayload')

async function resolveUserLocale(_userId) {
	return 'pl'
}

/**
 * Push timer state to user's devices (respects preferences.timer).
 */
async function notifyUserTimerEvent(userId, event, activeTimer) {
	try {
		const locale = await resolveUserLocale(userId)
		const payload = buildTimerPushPayload(event, activeTimer, locale)
		return await sendTimerPushNotification(userId, payload)
	} catch (error) {
		console.error('[timerPushService] notifyUserTimerEvent:', error)
		return { sent: 0, failed: 0, error: error.message }
	}
}

module.exports = {
	notifyUserTimerEvent,
}
