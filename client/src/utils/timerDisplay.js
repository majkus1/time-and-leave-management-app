/**
 * Shared timer display math (panel, document title, service worker payloads).
 */

/**
 * @param {object | null | undefined} activeTimer
 * @param {number} [nowMs=Date.now()]
 */
export function computeTimerMetrics(activeTimer, nowMs = Date.now()) {
	if (!activeTimer?.active || !activeTimer.startTime) {
		return null
	}

	const now = nowMs
	const startMs = new Date(activeTimer.startTime).getTime()
	if (Number.isNaN(startMs)) return null

	const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000))

	let totalBreakTime = activeTimer.totalBreakTime || 0
	if (activeTimer.isBreak && activeTimer.breakStartTime) {
		const breakStartMs = new Date(activeTimer.breakStartTime).getTime()
		if (!Number.isNaN(breakStartMs)) {
			totalBreakTime += Math.max(0, (now - breakStartMs) / 1000)
		}
	}

	let totalOvertimeTime = activeTimer.totalOvertimeTime || 0
	if (activeTimer.isOvertime && activeTimer.overtimeStartTime) {
		const overtimeStartMs = new Date(activeTimer.overtimeStartTime).getTime()
		if (!Number.isNaN(overtimeStartMs)) {
			totalOvertimeTime += Math.max(0, (now - overtimeStartMs) / 1000)
		}
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

export function formatTimerClock(seconds) {
	const safe = Math.max(0, Math.floor(seconds || 0))
	const hours = Math.floor(safe / 3600)
	const minutes = Math.floor((safe % 3600) / 60)
	const secs = safe % 60
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * @param {ReturnType<typeof computeTimerMetrics>} metrics
 * @param {{ locale?: string, defaultTitle?: string }} [options]
 */
export function buildTimerChromeText(metrics, options = {}) {
	const locale = options.locale || 'pl'
	const defaultTitle = options.defaultTitle || 'Planopia'

	if (!metrics) {
		return { documentTitle: defaultTitle, notificationTitle: defaultTitle, notificationBody: '' }
	}

	const clock = formatTimerClock(metrics.elapsedSeconds)
	const statusLabel = metrics.isBreak
		? locale.startsWith('pl') ? 'Przerwa' : 'Break'
		: locale.startsWith('pl') ? 'Praca' : 'Working'

	const documentTitle = metrics.isBreak ? `⏸ ${clock} · ${defaultTitle}` : `${clock} · ${defaultTitle}`

	const lines = [statusLabel, clock]
	if (metrics.workDescription) {
		lines.push(metrics.workDescription)
	}
	if (metrics.totalBreakTime > 0) {
		const breakLabel = locale.startsWith('pl') ? 'Przerwy' : 'Breaks'
		lines.push(`${breakLabel}: ${formatTimerClock(metrics.totalBreakTime)}`)
	}
	if (metrics.isOvertime || metrics.totalOvertimeTime > 0) {
		const otLabel = locale.startsWith('pl') ? 'Nadgodziny' : 'Overtime'
		lines.push(`${otLabel}: ${formatTimerClock(metrics.totalOvertimeTime)}`)
	}

	const notificationTitle = locale.startsWith('pl') ? 'Licznik Planopia' : 'Planopia timer'
	const notificationBody = lines.join(' · ')

	return { documentTitle, notificationTitle, notificationBody }
}

/** Snapshot for service worker (ISO dates). */
export function toTimerNotificationState(activeTimer) {
	if (!activeTimer?.active || !activeTimer.startTime) return null
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
