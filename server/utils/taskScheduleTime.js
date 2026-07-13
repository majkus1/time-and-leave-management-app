const TIME_RE = /^([0-1]?[0-9]|2[0-3]):[0-5]\d$/

/** @param {unknown} val @returns {string|null} HH:mm */
function parseOptionalTimeInput(val) {
	if (val === undefined || val === null || val === '') return null
	const s = String(val).trim()
	if (!s) return null
	const match = s.match(/^(\d{1,2}):(\d{2})/)
	if (!match) return null
	const hours = Number(match[1])
	const minutes = Number(match[2])
	if (hours > 23 || minutes > 59) return null
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isValidTimeString(val) {
	return typeof val === 'string' && TIME_RE.test(val)
}

/**
 * @param {import('mongoose').Document} task
 * @param {{ dueTime?: unknown, workPeriodStartTime?: unknown, workPeriodEndTime?: unknown }} input
 */
function applyScheduleTimesToTask(task, input) {
	if (input.dueTime !== undefined) {
		const parsed = parseOptionalTimeInput(input.dueTime)
		if (input.dueTime && !parsed) {
			return { error: 'Invalid due time (use HH:mm)' }
		}
		task.dueTime = parsed
	}
	if (input.workPeriodStartTime !== undefined) {
		const parsed = parseOptionalTimeInput(input.workPeriodStartTime)
		if (input.workPeriodStartTime && !parsed) {
			return { error: 'Invalid period start time (use HH:mm)' }
		}
		task.workPeriodStartTime = parsed
	}
	if (input.workPeriodEndTime !== undefined) {
		const parsed = parseOptionalTimeInput(input.workPeriodEndTime)
		if (input.workPeriodEndTime && !parsed) {
			return { error: 'Invalid period end time (use HH:mm)' }
		}
		task.workPeriodEndTime = parsed
	}
	return { error: null }
}

/** Wyczyść godziny niespójne z trybem terminu. */
function normalizeTaskScheduleTimes(task) {
	if (task.workPeriodStart && task.workPeriodEnd) {
		task.dueTime = null
	} else if (task.dueDate) {
		task.workPeriodStartTime = null
		task.workPeriodEndTime = null
	} else {
		task.dueTime = null
		task.workPeriodStartTime = null
		task.workPeriodEndTime = null
	}
}

function resolveNotificationLocale(t) {
	const lang = (t && (t.language || t.lng || (t.i18n && t.i18n.language))) || 'pl'
	return String(lang).startsWith('en') ? 'en-GB' : 'pl-PL'
}

function formatNotificationDate(dateValue, locale) {
	const d = new Date(dateValue)
	if (Number.isNaN(d.getTime())) return ''
	return new Intl.DateTimeFormat(locale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(d)
}

function formatNotificationTime(timeValue) {
	if (!timeValue || typeof timeValue !== 'string') return ''
	const match = timeValue.trim().match(/^(\d{1,2}):(\d{2})/)
	if (!match) return timeValue
	const h = Number(match[1])
	const m = Number(match[2])
	if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return timeValue
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Tekst terminu zadania do maili / push (null gdy brak harmonogramu).
 * @param {object} task
 * @param {(key: string, opts?: object) => string} t
 * @param {string} [locale]
 */
function formatTaskScheduleForNotification(task, t, locale) {
	if (!task || typeof t !== 'function') return null
	const loc = locale || resolveNotificationLocale(t)

	if (task.dueDate) {
		const date = formatNotificationDate(task.dueDate, loc)
		if (!date) return null
		if (task.dueTime) {
			return t('email.task.scheduleDeadlineWithTime', {
				date,
				time: formatNotificationTime(task.dueTime),
			})
		}
		return t('email.task.scheduleDeadline', { date })
	}

	if (task.workPeriodStart && task.workPeriodEnd) {
		const start = formatNotificationDate(task.workPeriodStart, loc)
		const end = formatNotificationDate(task.workPeriodEnd, loc)
		if (!start || !end) return null
		if (task.workPeriodStartTime || task.workPeriodEndTime) {
			const startTime = task.workPeriodStartTime
				? formatNotificationTime(task.workPeriodStartTime)
				: '…'
			const endTime = task.workPeriodEndTime
				? formatNotificationTime(task.workPeriodEndTime)
				: '…'
			return t('email.task.schedulePeriodWithTime', { start, end, startTime, endTime })
		}
		return t('email.task.schedulePeriod', { start, end })
	}

	return null
}

module.exports = {
	parseOptionalTimeInput,
	isValidTimeString,
	applyScheduleTimesToTask,
	normalizeTaskScheduleTimes,
	resolveNotificationLocale,
	formatTaskScheduleForNotification,
}
