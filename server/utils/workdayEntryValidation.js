/**
 * Server-side validation for new workday entries (POST /api/workdays).
 * Aligned with client rules in MonthlyCalendar.jsx (weekends, holidays, accepted leave, one-action rules).
 */
const { isHoliday } = require('./holidays')

/**
 * Calendar date (YYYY-MM-DD) in Europe/Warsaw for an instant or ISO string.
 * @param {Date|string} input
 * @returns {string|null}
 */
function toWarsawYmd(input) {
	if (input == null) return null
	const d = input instanceof Date ? input : new Date(input)
	if (Number.isNaN(d.getTime())) return null
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(d)
	const y = parts.find(p => p.type === 'year')?.value
	const m = parts.find(p => p.type === 'month')?.value
	const day = parts.find(p => p.type === 'day')?.value
	if (!y || !m || !day) return null
	return `${y}-${m}-${day}`
}

/**
 * @param {string} ymd
 * @returns {boolean}
 */
function isWeekendWarsawYmd(ymd) {
	if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
	const [Y, M, D] = ymd.split('-').map(Number)
	let utc = Date.UTC(Y, M - 1, D, 12, 0, 0)
	const fmt = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
	for (let i = 0; i < 6; i++) {
		const s = fmt.format(new Date(utc))
		if (s === ymd) {
			const wd = new Intl.DateTimeFormat('en-US', {
				timeZone: 'Europe/Warsaw',
				weekday: 'short',
			}).format(new Date(utc))
			return wd === 'Sat' || wd === 'Sun'
		}
		utc += (s < ymd ? 24 : -24) * 3600000
	}
	return false
}

function parseHoursValue(value) {
	if (value === null || value === undefined || value === '') return null
	const parsed = parseFloat(value)
	return Number.isNaN(parsed) ? null : parsed
}

function isNonEmptyString(s) {
	return typeof s === 'string' && s.trim() !== '' && s.trim().toLowerCase() !== 'null'
}

/**
 * @param {string} value
 * @param {number} maxHours
 */
function validateHours(value, maxHours = 24) {
	if (value === null || value === undefined || value === '') return true
	const numValue = parseFloat(value)
	if (Number.isNaN(numValue) || numValue < 0 || numValue > maxHours) return false
	const remainder = (numValue * 2) % 1
	return Math.abs(remainder) < 0.01 || Math.abs(remainder - 1) < 0.01
}

/**
 * Normalize raw request body fields.
 */
function normalizeWorkdayPayload(body) {
	const { hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes } = body || {}
	const hw = parseHoursValue(hoursWorked)
	const aw = parseHoursValue(additionalWorked)
	const rt =
		realTimeDayWorked != null && String(realTimeDayWorked).trim() !== ''
			? String(realTimeDayWorked).trim()
			: null
	const abs = isNonEmptyString(absenceType) ? absenceType.trim() : null
	const n = isNonEmptyString(notes) ? notes.trim() : null

	const hasHours = hw != null && hw > 0
	const hasAbsence = abs != null
	const hasNotes = n != null
	const hasOvertime = aw != null && aw > 0
	const hasTimeRange = rt != null

	return {
		hoursWorked: hw,
		additionalWorked: aw,
		realTimeDayWorked: rt,
		absenceType: abs,
		notes: n,
		hasHours,
		hasAbsence,
		hasNotes,
		hasOvertime,
		hasTimeRange,
	}
}

/**
 * @param {object} deps
 * @param {import('mongoose').Model} deps.WorkdayModel
 * @param {import('mongoose').Model} deps.LeaveRequestModel
 * @param {function} deps.getSettings - async (teamId) => settings
 * @param {string} deps.userId
 * @param {string} deps.teamId
 * @param {string} deps.dateYmd - YYYY-MM-DD (Warsaw calendar date of the entry)
 * @param {ReturnType<typeof normalizeWorkdayPayload>} normalized
 */
async function validateNewWorkdayEntry(deps) {
	const { WorkdayModel, LeaveRequestModel, getSettings, userId, teamId, dateYmd, normalized } = deps

	const locale = deps.locale === 'en' ? 'en' : 'pl'
	const msg = (pl, en) => (locale === 'en' ? en : pl)

	if (typeof dateYmd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
		return {
			ok: false,
			code: 'INVALID_DATE',
			message: msg('Nieprawidłowa data.', 'Invalid date.'),
		}
	}

	const settings = await getSettings(teamId)
	if (!settings) {
		return { ok: false, code: 'NO_SETTINGS', message: msg('Brak ustawień zespołu.', 'Team settings missing.') }
	}

	const workOnWeekends = settings.workOnWeekends !== false
	const holidayInfo = isHoliday(dateYmd, settings)
	const isHolidayDay = holidayInfo != null
	const isWeekendDay = !workOnWeekends && isWeekendWarsawYmd(dateYmd)

	const { hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes } = normalized
	const { hasHours, hasAbsence, hasNotes, hasOvertime, hasTimeRange } = normalized

	if ((hasOvertime || hasTimeRange) && !hasHours && !hasAbsence) {
		return {
			ok: false,
			code: 'OVERTIME_WITHOUT_HOURS',
			message: msg(
				'Nadgodziny lub zakres czasu wymagają podania godzin pracy.',
				'Overtime or time range requires work hours.',
			),
		}
	}

	// Raw validation for numeric fields (match form)
	if (hoursWorked != null && hoursWorked !== 0 && !validateHours(String(hoursWorked), 24)) {
		return {
			ok: false,
			code: 'INVALID_HOURS',
			message: msg(
				'Godziny muszą być od 0 do 24 (co 0,5 h).',
				'Hours must be between 0 and 24 (0.5 h steps).',
			),
		}
	}
	if (additionalWorked != null && additionalWorked !== 0 && !validateHours(String(additionalWorked), 100)) {
		return {
			ok: false,
			code: 'INVALID_OVERTIME',
			message: msg(
				'Nadgodziny muszą być liczbą ≥ 0 (co 0,5 h).',
				'Overtime must be a number ≥ 0 (0.5 h steps).',
			),
		}
	}

	if (hasHours && hasAbsence) {
		return {
			ok: false,
			code: 'HOURS_AND_ABSENCE',
			message: msg('Nie można jednocześnie podać godzin pracy i typu nieobecności.', 'Cannot set both hours and absence type.'),
		}
	}

	const acceptedLeaveRequests = await LeaveRequestModel.find({
		userId,
		status: { $in: ['status.accepted', 'status.sent'] },
	}).lean()

	const hasAcceptedRequest = acceptedLeaveRequests.some(request => {
		if (!request.startDate || !request.endDate) return false
		const start = toWarsawYmd(request.startDate)
		const end = toWarsawYmd(request.endDate)
		if (!start || !end) return false
		return dateYmd >= start && dateYmd <= end
	})

	const isNotesOnly = !hasHours && !hasAbsence

	// Load existing workdays for this calendar day (Warsaw)
	const dayStart = new Date(`${dateYmd}T00:00:00.000Z`)
	const dayEnd = new Date(`${dateYmd}T23:59:59.999Z`)
	const padMs = 24 * 3600000
	const existingCandidates = await WorkdayModel.find({
		userId,
		date: { $gte: new Date(dayStart.getTime() - padMs), $lte: new Date(dayEnd.getTime() + padMs) },
	}).lean()

	const existingWorkdays = existingCandidates.filter(w => toWarsawYmd(w.date) === dateYmd)

	const hasHeavyExisting = existingWorkdays.some(
		w =>
			(w.hoursWorked != null && w.hoursWorked > 0) ||
			(w.additionalWorked != null && w.additionalWorked > 0) ||
			(w.realTimeDayWorked && String(w.realTimeDayWorked).trim() !== '') ||
			(w.absenceType && isNonEmptyString(w.absenceType)),
	)

	const onlyNotesExisting =
		existingWorkdays.length > 0 &&
		existingWorkdays.every(
			w =>
				!(w.hoursWorked != null && w.hoursWorked > 0) &&
				!(w.additionalWorked != null && w.additionalWorked > 0) &&
				!(w.realTimeDayWorked && String(w.realTimeDayWorked).trim() !== '') &&
				!isNonEmptyString(w.absenceType) &&
				w.notes != null &&
				String(w.notes).trim() !== '',
		)

	const newHeavy = hasHours || hasAbsence || hasOvertime || hasTimeRange

	if (hasHeavyExisting && newHeavy) {
		return {
			ok: false,
			code: 'ONE_ACTION_FOR_DAY',
			message: msg(
				'Dla tego dnia jest już wpis z godzinami lub nieobecnością. Dodaj tylko uwagi albo edytuj wpis w kalendarzu.',
				'This day already has hours or an absence entry. Add only notes or edit the entry in the calendar.',
			),
		}
	}

	if (onlyNotesExisting && newHeavy) {
		return {
			ok: false,
			code: 'MERGE_IN_CALENDAR',
			message: msg(
				'Ten dzień ma wpis tylko z uwagami — aby dodać godziny lub nieobecność, użyj kalendarza (edycja wpisu).',
				'This day has a notes-only entry — add hours or absence via the calendar (edit the entry).',
			),
		}
	}

	if (isHolidayDay && (hasHours || hasAbsence)) {
		return {
			ok: false,
			code: 'HOLIDAY_NO_HOURS',
			message: msg(
				'W dniu świątecznym można dodać tylko uwagi.',
				'On a public holiday you can only add notes.',
			),
		}
	}

	if (isWeekendDay && (hasHours || hasAbsence)) {
		return {
			ok: false,
			code: 'WEEKEND_NO_HOURS',
			message: msg(
				'W weekend (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.',
				'On weekends (when the team does not work weekends) you can only add notes.',
			),
		}
	}

	if (hasAcceptedRequest && !isNotesOnly) {
		return {
			ok: false,
			code: 'LEAVE_BLOCK',
			message: msg(
				'Nie można dodawać godzin ani nieobecności w dniu objętym zaakceptowanym urlopem.',
				'Cannot add hours or absence on a day covered by approved leave.',
			),
		}
	}

	if (hasAcceptedRequest && isNotesOnly && !hasNotes) {
		return {
			ok: false,
			code: 'NOTES_REQUIRED',
			message: msg('W tym dniu możesz dodać tylko uwagi — wpisz treść uwag.', 'Only notes are allowed — enter note text.'),
		}
	}

	if ((isWeekendDay || isHolidayDay) && isNotesOnly && !hasNotes) {
		return {
			ok: false,
			code: 'NOTES_REQUIRED',
			message: msg('W weekend lub święto wymagane są uwagi.', 'Notes are required on a weekend or holiday.'),
		}
	}

	if (!hasAcceptedRequest && !isWeekendDay && !isHolidayDay && !hasHours && !hasAbsence && !hasNotes) {
		return {
			ok: false,
			code: 'EMPTY_ENTRY',
			message: msg('Podaj godziny, typ nieobecności lub uwagi.', 'Provide hours, absence type, or notes.'),
		}
	}

	// Absence clears overtime / time range (match client)
	let finalAdditional = additionalWorked
	let finalReal = realTimeDayWorked
	if (hasAbsence) {
		finalAdditional = null
		finalReal = null
	}
	if (hasHours && !hasOvertime && !hasTimeRange) {
		finalAdditional = null
		finalReal = null
	}

	return {
		ok: true,
		code: 'OK',
		sanitized: {
			hoursWorked: isWeekendDay || isHolidayDay ? null : hasHours ? hoursWorked : null,
			additionalWorked: isWeekendDay || isHolidayDay ? null : finalAdditional,
			realTimeDayWorked: isWeekendDay || isHolidayDay ? null : finalReal,
			absenceType: isWeekendDay || isHolidayDay ? null : hasAbsence ? absenceType : null,
			notes: hasNotes ? notes : null,
		},
	}
}

module.exports = {
	toWarsawYmd,
	isWeekendWarsawYmd,
	normalizeWorkdayPayload,
	validateNewWorkdayEntry,
}
