/**
 * Timer display helpers (server-side push copy; mirrors client timerDisplay.js).
 */

function computeTimerMetrics(activeTimer, nowMs = Date.now()) {
	if (!activeTimer?.startTime) return null
	const now = nowMs
	const startMs = new Date(activeTimer.startTime).getTime()
	if (Number.isNaN(startMs)) return null

	const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000))
	let totalBreakTime = activeTimer.totalBreakTime || 0
	if (activeTimer.isBreak && activeTimer.breakStartTime) {
		const breakStartMs = new Date(activeTimer.breakStartTime).getTime()
		if (!Number.isNaN(breakStartMs)) totalBreakTime += Math.max(0, (now - breakStartMs) / 1000)
	}
	let totalOvertimeTime = activeTimer.totalOvertimeTime || 0
	if (activeTimer.isOvertime && activeTimer.overtimeStartTime) {
		const otMs = new Date(activeTimer.overtimeStartTime).getTime()
		if (!Number.isNaN(otMs)) totalOvertimeTime += Math.max(0, (now - otMs) / 1000)
	}

	return {
		elapsedSeconds,
		totalBreakTime: Math.floor(totalBreakTime),
		totalOvertimeTime: Math.floor(totalOvertimeTime),
		isBreak: !!activeTimer.isBreak,
		isOvertime: !!activeTimer.isOvertime,
		workDescription: (activeTimer.workDescription || '').trim(),
	}
}

function formatTimerClock(seconds) {
	const safe = Math.max(0, Math.floor(seconds || 0))
	const hours = Math.floor(safe / 3600)
	const minutes = Math.floor((safe % 3600) / 60)
	const secs = safe % 60
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function buildTimerChromeText(metrics, locale = 'pl') {
	const pl = String(locale).startsWith('pl')
	if (!metrics) {
		return { title: pl ? 'Planopia' : 'Planopia', body: '' }
	}
	const clock = formatTimerClock(metrics.elapsedSeconds)
	const statusLabel = metrics.isBreak ? (pl ? 'Przerwa' : 'Break') : (pl ? 'Praca' : 'Working')
	const lines = [statusLabel, clock]
	if (metrics.workDescription) lines.push(metrics.workDescription)
	const title = pl ? 'Licznik Planopia' : 'Planopia timer'
	return { title, body: lines.join(' · ') }
}

function serializeActiveTimerForPush(activeTimer) {
	if (!activeTimer?.startTime) return null
	return {
		active: true,
		startTime: new Date(activeTimer.startTime).toISOString(),
		isBreak: !!activeTimer.isBreak,
		breakStartTime: activeTimer.breakStartTime
			? new Date(activeTimer.breakStartTime).toISOString()
			: null,
		totalBreakTime: activeTimer.totalBreakTime || 0,
		isOvertime: !!activeTimer.isOvertime,
		overtimeStartTime: activeTimer.overtimeStartTime
			? new Date(activeTimer.overtimeStartTime).toISOString()
			: null,
		totalOvertimeTime: activeTimer.totalOvertimeTime || 0,
		workDescription: (activeTimer.workDescription || '').trim(),
	}
}

module.exports = {
	computeTimerMetrics,
	formatTimerClock,
	buildTimerChromeText,
	serializeActiveTimerForPush,
}
