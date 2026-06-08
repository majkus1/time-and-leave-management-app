const mongoose = require('mongoose')
const { validateHours } = require('./workdayEntryValidation')
const { calculateHoursFromRange, buildRealTimeFromBlocks, MAX_BLOCKS } = require('./manualActivityBlocks')

function isValidObjectId(value) {
	return mongoose.Types.ObjectId.isValid(String(value))
}

/**
 * @param {unknown} rawBlocks
 * @param {Map<string, { _id: import('mongoose').Types.ObjectId, title: string }>} allowedTasksById
 * @param {{ locale?: string }} [options]
 */
function normalizeManualTaskBlocks(rawBlocks, allowedTasksById, options = {}) {
	const locale = options.locale === 'en' ? 'en' : 'pl'
	const msg = (pl, en) => (locale === 'en' ? en : pl)

	if (rawBlocks == null) {
		return { ok: true, blocks: [], totalHours: 0, realTimeDayWorked: null }
	}

	if (!Array.isArray(rawBlocks)) {
		return {
			ok: false,
			code: 'INVALID_TASK_BLOCKS',
			message: msg('Nieprawidłowy format bloków zadań.', 'Invalid task blocks format.'),
		}
	}

	if (rawBlocks.length === 0) {
		return { ok: true, blocks: [], totalHours: 0, realTimeDayWorked: null }
	}

	if (rawBlocks.length > MAX_BLOCKS) {
		return {
			ok: false,
			code: 'TOO_MANY_TASK_BLOCKS',
			message: msg(`Maksymalnie ${MAX_BLOCKS} zadań na dzień.`, `At most ${MAX_BLOCKS} tasks per day.`),
		}
	}

	const blocks = []
	let totalHours = 0

	for (let i = 0; i < rawBlocks.length; i += 1) {
		const raw = rawBlocks[i] || {}
		const taskIdRaw = raw.taskId != null ? String(raw.taskId).trim() : ''
		if (!taskIdRaw || !isValidObjectId(taskIdRaw)) {
			return {
				ok: false,
				code: 'TASK_REQUIRED',
				message: msg(`Wiersz ${i + 1}: wybierz zadanie.`, `Row ${i + 1}: select a task.`),
			}
		}

		const task = allowedTasksById.get(taskIdRaw)
		if (!task) {
			return {
				ok: false,
				code: 'UNKNOWN_TASK',
				message: msg(`Wiersz ${i + 1}: nieznane lub niedostępne zadanie.`, `Row ${i + 1}: unknown or inaccessible task.`),
			}
		}

		const timeFrom = raw.timeFrom != null && String(raw.timeFrom).trim() ? String(raw.timeFrom).trim() : null
		const timeTo = raw.timeTo != null && String(raw.timeTo).trim() ? String(raw.timeTo).trim() : null

		if ((timeFrom && !timeTo) || (!timeFrom && timeTo)) {
			return {
				ok: false,
				code: 'TIME_PAIR_REQUIRED',
				message: msg(`Wiersz ${i + 1}: podaj oba czasy (od i do) albo zostaw oba puste.`, `Row ${i + 1}: provide both times or leave both empty.`),
			}
		}

		let hours = raw.hours != null && raw.hours !== '' ? parseFloat(raw.hours) : null
		if (Number.isNaN(hours)) hours = null
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
		blocks.push({
			taskId: task._id,
			taskTitle: task.title || '',
			hours,
			timeFrom,
			timeTo,
		})
	}

	totalHours = Math.round(totalHours * 2) / 2
	if (totalHours > 24) {
		return {
			ok: false,
			code: 'DAY_HOURS_EXCEEDED',
			message: msg('Suma godzin ze wszystkich zadań nie może przekraczać 24 h.', 'Total hours from all tasks cannot exceed 24 h.'),
		}
	}

	return {
		ok: true,
		blocks,
		totalHours,
		realTimeDayWorked: buildRealTimeFromBlocks(blocks),
	}
}

function mergeRealTimeRanges(...parts) {
	return parts.filter(Boolean).join(', ') || null
}

module.exports = {
	normalizeManualTaskBlocks,
	mergeRealTimeRanges,
}
