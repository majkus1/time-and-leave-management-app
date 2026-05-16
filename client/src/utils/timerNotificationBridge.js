import { toTimerNotificationState } from './timerDisplay'

async function postToServiceWorker(message) {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
	const registration = await navigator.serviceWorker.ready
	const target = navigator.serviceWorker.controller || registration.active
	target?.postMessage(message)
}

/**
 * @param {object|null} activeTimer
 * @param {string} [locale]
 * @param {{ forceCreate?: boolean }} [options]
 */
export async function syncTimerNotificationToServiceWorker(activeTimer, locale, options = {}) {
	if (Notification.permission !== 'granted') return

	const timerState = toTimerNotificationState(activeTimer)
	if (!timerState) {
		await postToServiceWorker({ type: 'PLANOPIA_TIMER_CLEAR' })
		return
	}

	await postToServiceWorker({
		type: 'PLANOPIA_TIMER_SYNC',
		timerState,
		locale: locale || 'pl',
		forceCreate: options.forceCreate === true,
	})
}

/** Co sekundę: podmiana treści tego samego powiadomienia (karta widoczna). */
export async function tickTimerNotificationInServiceWorker(activeTimer, locale) {
	if (Notification.permission !== 'granted') return

	const timerState = toTimerNotificationState(activeTimer)
	if (!timerState) {
		await postToServiceWorker({ type: 'PLANOPIA_TIMER_CLEAR' })
		return
	}

	await postToServiceWorker({
		type: 'PLANOPIA_TIMER_TICK',
		timerState,
		locale: locale || 'pl',
	})
}

export async function setClientDrivingTimerNotification(active) {
	await postToServiceWorker({
		type: 'PLANOPIA_TIMER_CLIENT_DRIVING',
		active: active === true,
	})
}

export async function clearTimerNotificationInServiceWorker() {
	await postToServiceWorker({ type: 'PLANOPIA_TIMER_CLEAR' })
}
