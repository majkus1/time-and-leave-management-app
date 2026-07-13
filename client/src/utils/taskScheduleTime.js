/** @param {string|null|undefined} time HH:mm — zawsze wyświetlane w formacie 24h */
export function formatTaskTimeLabel(time) {
	if (!time || typeof time !== 'string') return ''
	const match = time.trim().match(/^(\d{1,2}):(\d{2})/)
	if (!match) return time
	const h = Number(match[1])
	const m = Number(match[2])
	if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return time
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Minuty od północy do sortowania w kalendarzu. */
export function taskTimeSortMinutes(time) {
	if (!time) return 24 * 60
	const [h, m] = String(time).split(':').map(Number)
	if (Number.isNaN(h) || Number.isNaN(m)) return 24 * 60
	return h * 60 + m
}

export function formatCalendarTimeDisplay(task, locale = 'pl-PL') {
	if (!task) return null
	if (task.dueDate && task.dueTime) {
		return formatTaskTimeLabel(task.dueTime)
	}
	if (task.workPeriodStartTime || task.workPeriodEndTime) {
		const from = task.workPeriodStartTime ? formatTaskTimeLabel(task.workPeriodStartTime) : '…'
		const to = task.workPeriodEndTime ? formatTaskTimeLabel(task.workPeriodEndTime) : '…'
		return `${from}–${to}`
	}
	return null
}

export function calendarTaskSortMinutes(task) {
	if (task.dueDate && task.dueTime) {
		return taskTimeSortMinutes(task.dueTime)
	}
	if (task.workPeriodStart && task.workPeriodEnd && task.workPeriodStartTime) {
		return taskTimeSortMinutes(task.workPeriodStartTime)
	}
	return 24 * 60
}

export function buildSchedulePayload(scheduleMode, { dueDate, dueTime, periodStart, periodEnd, periodStartTime, periodEndTime }) {
	if (scheduleMode === 'deadline') {
		return {
			dueDate: dueDate || null,
			dueTime: dueTime || null,
			workPeriodStart: null,
			workPeriodEnd: null,
			workPeriodStartTime: null,
			workPeriodEndTime: null,
		}
	}
	if (scheduleMode === 'period') {
		return {
			dueDate: null,
			dueTime: null,
			workPeriodStart: periodStart || null,
			workPeriodEnd: periodEnd || null,
			workPeriodStartTime: periodStartTime || null,
			workPeriodEndTime: periodEndTime || null,
		}
	}
	return {
		dueDate: null,
		dueTime: null,
		workPeriodStart: null,
		workPeriodEnd: null,
		workPeriodStartTime: null,
		workPeriodEndTime: null,
	}
}

export function scheduleSummaryFromTask(task, t, locale) {
	if (!task) return null
	if (task.dueDate) {
		const d = new Date(task.dueDate)
		const dateStr = d.toLocaleDateString(locale)
		if (task.dueTime) {
			return `${t('boards.deadline')}: ${dateStr}, ${formatTaskTimeLabel(task.dueTime)}`
		}
		return `${t('boards.deadline')}: ${dateStr}`
	}
	if (task.workPeriodStart && task.workPeriodEnd) {
		const a = new Date(task.workPeriodStart)
		const b = new Date(task.workPeriodEnd)
		let text = `${t('boards.workPeriod')}: ${a.toLocaleDateString(locale)} – ${b.toLocaleDateString(locale)}`
		if (task.workPeriodStartTime || task.workPeriodEndTime) {
			const from = task.workPeriodStartTime ? formatTaskTimeLabel(task.workPeriodStartTime) : '…'
			const to = task.workPeriodEndTime ? formatTaskTimeLabel(task.workPeriodEndTime) : '…'
			text += ` (${from} – ${to})`
		}
		return text
	}
	return null
}
