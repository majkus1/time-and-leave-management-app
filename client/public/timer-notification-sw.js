/* global self */
/**
 * Single ongoing timer notification — same tag, in-place body updates (no renotify stack).
 */

var PLANOPIA_TIMER_TAG = 'planopia-active-timer'
var PLANOPIA_TIMER_TICK_MS = 1000
var _planopiaTimerState = null
var _planopiaTimerTickId = null
var _planopiaTimerLocale = 'pl'
var _planopiaTimerVisible = false
var _planopiaTimerUserDismissed = false
/** Gdy karta jest widoczna, zegar tika z postMessage (SW setInterval na desktopie bywa zatrzymany). */
var _planopiaClientDriving = false

function _planopiaFormatClock(seconds) {
	var safe = Math.max(0, Math.floor(seconds || 0))
	var hours = Math.floor(safe / 3600)
	var minutes = Math.floor((safe % 3600) / 60)
	var secs = safe % 60
	return (
		(hours < 10 ? '0' : '') + hours + ':' +
		(minutes < 10 ? '0' : '') + minutes + ':' +
		(secs < 10 ? '0' : '') + secs
	)
}

function _planopiaComputeMetrics(state, nowMs) {
	if (!state || !state.active || !state.startTime) return null
	var now = nowMs || Date.now()
	var startMs = new Date(state.startTime).getTime()
	if (isNaN(startMs)) return null

	var elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000))
	var totalBreakTime = state.totalBreakTime || 0
	if (state.isBreak && state.breakStartTime) {
		var breakStartMs = new Date(state.breakStartTime).getTime()
		if (!isNaN(breakStartMs)) totalBreakTime += Math.max(0, (now - breakStartMs) / 1000)
	}
	var totalOvertimeTime = state.totalOvertimeTime || 0
	if (state.isOvertime && state.overtimeStartTime) {
		var otMs = new Date(state.overtimeStartTime).getTime()
		if (!isNaN(otMs)) totalOvertimeTime += Math.max(0, (now - otMs) / 1000)
	}

	return {
		elapsedSeconds: elapsedSeconds,
		totalBreakTime: Math.floor(totalBreakTime),
		totalOvertimeTime: Math.floor(totalOvertimeTime),
		isBreak: !!state.isBreak,
		isOvertime: !!state.isOvertime,
		workDescription: (state.workDescription || '').trim(),
	}
}

function _planopiaBuildTexts(metrics) {
	var pl = (_planopiaTimerLocale || 'pl').indexOf('pl') === 0
	var clock = _planopiaFormatClock(metrics.elapsedSeconds)
	var statusLabel = metrics.isBreak ? (pl ? 'Przerwa' : 'Break') : (pl ? 'Praca' : 'Working')
	var lines = [statusLabel, clock]
	if (metrics.workDescription) lines.push(metrics.workDescription)
	if (metrics.totalBreakTime > 0) {
		lines.push((pl ? 'Przerwy' : 'Breaks') + ': ' + _planopiaFormatClock(metrics.totalBreakTime))
	}
	if (metrics.isOvertime || metrics.totalOvertimeTime > 0) {
		lines.push((pl ? 'Nadgodziny' : 'Overtime') + ': ' + _planopiaFormatClock(metrics.totalOvertimeTime))
	}
	return {
		title: pl ? 'Licznik Planopia' : 'Planopia timer',
		body: lines.join(' · '),
	}
}

function _planopiaClearTimerTick() {
	if (_planopiaTimerTickId) {
		clearInterval(_planopiaTimerTickId)
		_planopiaTimerTickId = null
	}
}

function _planopiaResetTimerSession() {
	_planopiaClearTimerTick()
	_planopiaTimerState = null
	_planopiaTimerVisible = false
}

function _planopiaCloseTimerNotifications() {
	return self.registration.getNotifications({ tag: PLANOPIA_TIMER_TAG }).then(function (list) {
		list.forEach(function (n) {
			n.close()
		})
		_planopiaTimerVisible = false
	})
}

/**
 * @param {'create'|'update'} mode — create: pierwsze pojawienie; update: ta sama karta, bez dźwięku
 */
function _planopiaShowTimerNotification(mode) {
	if (_planopiaTimerUserDismissed) return Promise.resolve()
	if (!_planopiaTimerState || !_planopiaTimerState.active) return Promise.resolve()

	var metrics = _planopiaComputeMetrics(_planopiaTimerState)
	if (!metrics) return Promise.resolve()

	var texts = _planopiaBuildTexts(metrics)
	var isUpdate = mode === 'update'

	return self.registration.showNotification(texts.title, {
		body: texts.body,
		icon: '/icon-192x192.png',
		badge: '/icon-96x96.png',
		tag: PLANOPIA_TIMER_TAG,
		renotify: false,
		silent: isUpdate,
		requireInteraction: true,
		data: { url: '/dashboard', type: 'timer', active: true },
	})
		.then(function () {
			_planopiaTimerVisible = true
		})
}

function _planopiaEnsureTimerTick() {
	if (_planopiaClientDriving || _planopiaTimerTickId || _planopiaTimerUserDismissed) return
	if (!_planopiaTimerState || !_planopiaTimerState.active) return

	_planopiaTimerTickId = setInterval(function () {
		if (_planopiaTimerUserDismissed || !_planopiaTimerState || !_planopiaTimerState.active) {
			_planopiaClearTimerTick()
			return
		}
		_planopiaShowTimerNotification('update')
	}, PLANOPIA_TIMER_TICK_MS)
}

function _planopiaApplyTimerState(timerState, mode) {
	if (!timerState || !timerState.active) {
		_planopiaResetTimerSession()
		return _planopiaCloseTimerNotifications()
	}

	_planopiaTimerState = timerState
	var showMode = mode === 'create' || !_planopiaTimerVisible ? 'create' : 'update'

	return _planopiaShowTimerNotification(showMode).then(function () {
		_planopiaEnsureTimerTick()
	})
}

function planopiaApplyTimerPushData(data) {
	if (!data || data.type !== 'timer') return Promise.resolve()

	if (data.locale) _planopiaTimerLocale = data.locale

	if (data.event === 'stopped' || !data.timerState || !data.timerState.active) {
		_planopiaResetTimerSession()
		_planopiaTimerUserDismissed = false
		return _planopiaCloseTimerNotifications()
	}

	if (data.event === 'started') {
		_planopiaTimerUserDismissed = false
	}

	// Tylko start (i stan z push) — bez nowego push przy pauzie; aktualizacje robi tick w SW
	var mode = data.event === 'started' ? 'create' : 'update'
	return _planopiaApplyTimerState(data.timerState, mode)
}

function planopiaHandleTimerClientMessage(data) {
	if (!data || !data.type) return Promise.resolve()

	if (data.type === 'PLANOPIA_TIMER_CLEAR') {
		_planopiaResetTimerSession()
		_planopiaTimerUserDismissed = false
		return _planopiaCloseTimerNotifications()
	}

	if (data.type === 'PLANOPIA_TIMER_SYNC') {
		if (data.locale) _planopiaTimerLocale = data.locale
		if (!data.timerState || !data.timerState.active) {
			_planopiaResetTimerSession()
			return _planopiaCloseTimerNotifications()
		}
		var mode = data.forceCreate ? 'create' : 'update'
		if (data.forceCreate) _planopiaTimerUserDismissed = false
		return _planopiaApplyTimerState(data.timerState, mode)
	}

	if (data.type === 'PLANOPIA_TIMER_TICK') {
		if (data.locale) _planopiaTimerLocale = data.locale
		if (_planopiaTimerUserDismissed) return Promise.resolve()
		if (!data.timerState || !data.timerState.active) {
			_planopiaResetTimerSession()
			return _planopiaCloseTimerNotifications()
		}
		_planopiaTimerState = data.timerState
		var tickMode = _planopiaTimerVisible ? 'update' : 'create'
		return _planopiaShowTimerNotification(tickMode)
	}

	if (data.type === 'PLANOPIA_TIMER_CLIENT_DRIVING') {
		_planopiaClientDriving = data.active === true
		if (_planopiaClientDriving) {
			_planopiaClearTimerTick()
		} else {
			_planopiaEnsureTimerTick()
		}
		return Promise.resolve()
	}

	return Promise.resolve()
}

self.addEventListener('notificationclose', function (event) {
	if (!event.notification || event.notification.tag !== PLANOPIA_TIMER_TAG) return
	_planopiaTimerUserDismissed = true
	_planopiaClearTimerTick()
})
