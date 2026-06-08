const { normalizeWorkdayPayload, validateNewWorkdayEntry } = require('../utils/workdayEntryValidation')
const { normalizeManualActivityBlocks } = require('../utils/manualActivityBlocks')
const { normalizeManualTaskBlocks, mergeRealTimeRanges } = require('../utils/manualTaskBlocks')

/**
 * Merge manual activity + task blocks into normalized workday payload.
 * @param {object} body
 * @param {object|null} settings
 * @param {Map<string, object>} [allowedTasksById]
 * @param {{ locale?: string }} [options]
 */
function mergeWorkBlocksIntoPayload(body, settings, allowedTasksById = new Map(), options = {}) {
	const activityResult = normalizeManualActivityBlocks(body?.manualActivityBlocks, settings, options)
	if (!activityResult.ok) {
		return { error: activityResult }
	}

	const taskResult = normalizeManualTaskBlocks(body?.manualTaskBlocks, allowedTasksById, options)
	if (!taskResult.ok) {
		return { error: taskResult }
	}

	const hasActivityBlocks = activityResult.blocks.length > 0
	const hasTaskBlocks = taskResult.blocks.length > 0
	const hasBlocks = hasActivityBlocks || hasTaskBlocks
	const payloadBody = { ...body }

	if (hasBlocks) {
		const totalHours = Math.round((activityResult.totalHours + taskResult.totalHours) * 2) / 2
		payloadBody.hoursWorked = totalHours
		payloadBody.realTimeDayWorked = mergeRealTimeRanges(
			activityResult.realTimeDayWorked,
			taskResult.realTimeDayWorked
		)
	}

	const normalized = normalizeWorkdayPayload(payloadBody)

	if (hasBlocks) {
		normalized.hasHours = (payloadBody.hoursWorked || 0) > 0
		normalized.hasTimeRange = !!payloadBody.realTimeDayWorked
	}

	return {
		normalized,
		manualActivityBlocks: hasActivityBlocks ? activityResult.blocks : [],
		manualTaskBlocks: hasTaskBlocks ? taskResult.blocks : [],
		clearManualActivityBlocks: body?.manualActivityBlocks != null && !hasActivityBlocks,
		clearManualTaskBlocks: body?.manualTaskBlocks != null && !hasTaskBlocks,
	}
}

/** @deprecated use mergeWorkBlocksIntoPayload */
function mergeActivityBlocksIntoPayload(body, settings, options = {}) {
	return mergeWorkBlocksIntoPayload(body, settings, new Map(), options)
}

/**
 * @param {object} deps
 */
async function validateAndSanitizeWorkdayCreate(deps) {
	const { body, settings, locale, allowedTasksById, ...validationDeps } = deps
	const merged = mergeWorkBlocksIntoPayload(body, settings, allowedTasksById || new Map(), { locale })
	if (merged.error) {
		return { ok: false, code: merged.error.code, message: merged.error.message }
	}

	const v = await validateNewWorkdayEntry({
		...validationDeps,
		normalized: merged.normalized,
		locale,
	})

	if (!v.ok) return v

	return {
		ok: true,
		sanitized: {
			...v.sanitized,
			manualActivityBlocks: merged.manualActivityBlocks,
			manualTaskBlocks: merged.manualTaskBlocks,
		},
	}
}

/**
 * Apply update fields to an existing workday document (does not save).
 */
function applyWorkdayUpdateFields(workday, body, settings, allowedTasksById = new Map(), options = {}) {
	const locale = options.locale === 'en' ? 'en' : 'pl'
	const msg = (pl, en) => (locale === 'en' ? en : pl)

	const merged = mergeWorkBlocksIntoPayload(body, settings, allowedTasksById, { locale })
	if (merged.error) {
		return { ok: false, code: merged.error.code, message: merged.error.message }
	}

	const { normalized, manualActivityBlocks, manualTaskBlocks, clearManualActivityBlocks, clearManualTaskBlocks } = merged

	if (body.hoursWorked !== undefined || body.manualActivityBlocks !== undefined || body.manualTaskBlocks !== undefined) {
		workday.hoursWorked = normalized.hoursWorked
	}
	if (body.additionalWorked !== undefined) {
		workday.additionalWorked = normalized.additionalWorked
	}
	if (body.realTimeDayWorked !== undefined || body.manualActivityBlocks !== undefined || body.manualTaskBlocks !== undefined) {
		workday.realTimeDayWorked = normalized.realTimeDayWorked
	}
	if (body.absenceType !== undefined) {
		workday.absenceType = normalized.absenceType
		if (normalized.absenceType) {
			workday.manualActivityBlocks = []
			workday.manualTaskBlocks = []
		}
	}
	if (body.notes !== undefined) {
		workday.notes = normalized.notes
	}
	if (body.manualActivityBlocks !== undefined) {
		workday.manualActivityBlocks = clearManualActivityBlocks ? [] : manualActivityBlocks
	}
	if (body.manualTaskBlocks !== undefined) {
		workday.manualTaskBlocks = clearManualTaskBlocks ? [] : manualTaskBlocks
	}

	if (normalized.hasHours && normalized.hasAbsence) {
		return {
			ok: false,
			code: 'HOURS_AND_ABSENCE',
			message: msg('Nie można jednocześnie podać godzin pracy i typu nieobecności.', 'Cannot set both hours and absence type.'),
		}
	}

	return { ok: true, workday }
}

module.exports = {
	mergeActivityBlocksIntoPayload,
	mergeWorkBlocksIntoPayload,
	validateAndSanitizeWorkdayCreate,
	applyWorkdayUpdateFields,
}
