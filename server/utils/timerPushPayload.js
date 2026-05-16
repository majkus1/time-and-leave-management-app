const {
	buildTimerChromeText,
	computeTimerMetrics,
	serializeActiveTimerForPush,
} = require('./timerDisplay')

const TIMER_NOTIFICATION_TAG = 'planopia-active-timer'

/**
 * @param {'started'|'paused'|'resumed'|'stopped'} event
 * @param {object|null} activeTimer
 * @param {string} [locale='pl']
 */
function buildTimerPushPayload(event, activeTimer, locale = 'pl') {
	const pl = String(locale).startsWith('pl')

	if (event === 'stopped' || !activeTimer?.startTime) {
		return {
			type: 'timer',
			event: 'stopped',
			tag: TIMER_NOTIFICATION_TAG,
			silent: false,
			locale,
			title: pl ? 'Licznik zatrzymany' : 'Timer stopped',
			body: pl ? 'Sesja czasu pracy została zakończona.' : 'Work session has ended.',
			timerState: null,
			data: { url: '/dashboard', type: 'timer', active: false },
		}
	}

	const metrics = computeTimerMetrics(activeTimer)
	const chrome = buildTimerChromeText(metrics, locale)
	const timerState = serializeActiveTimerForPush(activeTimer)

	let eventTitle = chrome.title
	if (event === 'started') {
		eventTitle = pl ? 'Timer uruchomiony' : 'Timer started'
	} else if (event === 'paused') {
		eventTitle = pl ? 'Przerwa w liczniku' : 'Timer on break'
	} else if (event === 'resumed') {
		eventTitle = pl ? 'Wznowiono licznik' : 'Timer resumed'
	}

	return {
		type: 'timer',
		event,
		tag: TIMER_NOTIFICATION_TAG,
		silent: event !== 'started',
		locale,
		title: eventTitle,
		body: chrome.body,
		timerState,
		data: { url: '/dashboard', type: 'timer', active: true },
	}
}

module.exports = {
	TIMER_NOTIFICATION_TAG,
	buildTimerPushPayload,
}
