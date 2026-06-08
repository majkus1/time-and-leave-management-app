const { validateHours } = require('./workdayEntryValidation')
const { getEnabledWorkActivityMap } = require('./workActivities')

const TIME_RE = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
const MAX_BLOCKS = 12

function isValidTime(value) {
	return value == null || value === '' || TIME_RE.test(String(value).trim())
}

function parseBlockHours(value) {
	if (value === null || value === undefined || value === '') return null
	const parsed = parseFloat(value)
	return Number.isNaN(parsed) ? null : parsed
}

function parseQuantity(value) {
	if (value === null || value === undefined || value === '') return null
	const parsed = parseFloat(value)
	return Number.isFinite(parsed) ? parsed : null
}

function calculateHoursFromRange(timeFrom, timeTo) {
	if (!timeFrom || !timeTo) return null
	const [fromH, fromM] = timeFrom.split(':').map(Number)
	const [toH, toM] = timeTo.split(':').map(Number)
	if ([fromH, fromM, toH, toM].some(Number.isNaN)) return null
	let minutes = toH * 60 + toM - (fromH * 60 + fromM)
	if (minutes < 0) minutes += 24 * 60
	if (minutes <= 0) return null
	const hours = minutes / 60
	return Math.round(hours * 2) / 2
}

function buildRealTimeFromBlocks(blocks) {
	const parts = blocks
		.map(block => {
			if (block.timeFrom && block.timeTo) return `${block.timeFrom}-${block.timeTo}`
			return null
		})
		.filter(Boolean)
	return parts.length ? parts.join(', ') : null
}

/**
 * @param {unknown} rawBlocks
 * @param {import('mongoose').Document|object|null} settings
 * @param {{ locale?: string }} [options]
 */
function normalizeManualActivityBlocks(rawBlocks, settings, options = {}) {
	const locale = options.locale === 'en' ? 'en' : 'pl'
	const msg = (pl, en) => (locale === 'en' ? en : pl)

	if (rawBlocks == null) {
		return { ok: true, blocks: [], totalHours: 0, realTimeDayWorked: null }
	}

	if (!Array.isArray(rawBlocks)) {
		return {
			ok: false,
			code: 'INVALID_ACTIVITY_BLOCKS',
			message: msg('Nieprawidłowy format bloków czynności.', 'Invalid activity blocks format.'),
		}
	}

	if (rawBlocks.length === 0) {
		return { ok: true, blocks: [], totalHours: 0, realTimeDayWorked: null }
	}

	if (rawBlocks.length > MAX_BLOCKS) {
		return {
			ok: false,
			code: 'TOO_MANY_ACTIVITY_BLOCKS',
			message: msg(`Maksymalnie ${MAX_BLOCKS} czynności na dzień.`, `At most ${MAX_BLOCKS} activities per day.`),
		}
	}

	const enabledActivitiesById = getEnabledWorkActivityMap(settings)
	const blocks = []
	let totalHours = 0

	for (let i = 0; i < rawBlocks.length; i += 1) {
		const raw = rawBlocks[i] || {}
		const activityId = typeof raw.activityId === 'string' ? raw.activityId.trim() : ''
		if (!activityId) {
			return {
				ok: false,
				code: 'ACTIVITY_REQUIRED',
				message: msg(`Wiersz ${i + 1}: wybierz czynność.`, `Row ${i + 1}: select an activity.`),
			}
		}
		const activity = enabledActivitiesById.get(activityId)
		if (!activity) {
			return {
				ok: false,
				code: 'UNKNOWN_ACTIVITY',
				message: msg(`Wiersz ${i + 1}: nieznana lub wyłączona czynność.`, `Row ${i + 1}: unknown or disabled activity.`),
			}
		}

		const timeFrom = raw.timeFrom != null && String(raw.timeFrom).trim() ? String(raw.timeFrom).trim() : null
		const timeTo = raw.timeTo != null && String(raw.timeTo).trim() ? String(raw.timeTo).trim() : null

		if (!isValidTime(timeFrom) || !isValidTime(timeTo)) {
			return {
				ok: false,
				code: 'INVALID_TIME',
				message: msg(`Wiersz ${i + 1}: nieprawidłowy format czasu (HH:mm).`, `Row ${i + 1}: invalid time format (HH:mm).`),
			}
		}

		if ((timeFrom && !timeTo) || (!timeFrom && timeTo)) {
			return {
				ok: false,
				code: 'TIME_PAIR_REQUIRED',
				message: msg(`Wiersz ${i + 1}: podaj oba czasy (od i do) albo zostaw oba puste.`, `Row ${i + 1}: provide both times or leave both empty.`),
			}
		}

		let hours = parseBlockHours(raw.hours)
		if (timeFrom && timeTo) {
			const fromRange = calculateHoursFromRange(timeFrom, timeTo)
			if (fromRange == null) {
				return {
					ok: false,
					code: 'INVALID_TIME_RANGE',
					message: msg(`Wiersz ${i + 1}: nieprawidłowy zakres czasu.`, `Row ${i + 1}: invalid time range.`),
				}
			}
			if (hours == null || hours <= 0) hours = fromRange
		}

		if (hours == null || hours <= 0 || !validateHours(String(hours), 24)) {
			return {
				ok: false,
				code: 'INVALID_BLOCK_HOURS',
				message: msg(`Wiersz ${i + 1}: godziny muszą być > 0 i ≤ 24 (co 0,5 h).`, `Row ${i + 1}: hours must be > 0 and ≤ 24 (0.5 h steps).`),
			}
		}

		totalHours += hours
		let quantity = null
		if (activity.trackQuantity === true) {
			quantity = parseQuantity(raw.quantity)
			if (quantity != null && quantity < 0) {
				return {
					ok: false,
					code: 'INVALID_ACTIVITY_QUANTITY',
					message: msg(`Wiersz ${i + 1}: ilość wykonania nie może być ujemna.`, `Row ${i + 1}: quantity cannot be negative.`),
				}
			}
		}
		blocks.push({
			activityId,
			activityName: activity.name || '',
			activityNameEn: activity.nameEn || '',
			activityGroup: activity.group || '',
			hours,
			timeFrom,
			timeTo,
			quantity,
			unit: activity.trackQuantity === true ? activity.unit || '' : '',
		})
	}

	totalHours = Math.round(totalHours * 2) / 2
	if (totalHours > 24) {
		return {
			ok: false,
			code: 'DAY_HOURS_EXCEEDED',
			message: msg('Suma godzin ze wszystkich czynności nie może przekraczać 24 h.', 'Total hours from all activities cannot exceed 24 h.'),
		}
	}

	return {
		ok: true,
		blocks,
		totalHours,
		realTimeDayWorked: buildRealTimeFromBlocks(blocks),
	}
}

module.exports = {
	normalizeManualActivityBlocks,
	buildRealTimeFromBlocks,
	calculateHoursFromRange,
	MAX_BLOCKS,
}
