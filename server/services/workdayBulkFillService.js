const { isHoliday } = require('../utils/holidays')
const { normalizeWorkdayPayload, toWarsawYmd } = require('../utils/workdayEntryValidation')
const { mergeWorkBlocksIntoPayload } = require('../services/workdayPayloadService')
const { fetchTimesheetTasksForUser, tasksToAllowedMap } = require('../utils/timesheetTaskAccess')

const MAX_BULK_FILL_DAYS = 62

function parseYmd(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
	return value
}

function ymdToDate(ymd) {
	return new Date(`${ymd}T12:00:00.000Z`)
}

function addDaysYmd(ymd, days) {
	const date = ymdToDate(ymd)
	date.setUTCDate(date.getUTCDate() + days)
	return toWarsawYmd(date)
}

function listYmdRange(startYmd, endYmd) {
	const dates = []
	let current = startYmd
	while (current && current <= endYmd) {
		dates.push(current)
		current = addDaysYmd(current, 1)
		if (dates.length > MAX_BULK_FILL_DAYS + 1) break
	}
	return dates
}

function monthKeyFromYmd(ymd) {
	const [year, month] = ymd.split('-').map(Number)
	return `${year}-${month - 1}`
}

function isWeekendYmd(ymd) {
	const day = ymdToDate(ymd).getUTCDay()
	return day === 0 || day === 6
}

function hasExistingEntry(workday) {
	if (!workday) return false
	return (
		(workday.hoursWorked != null && workday.hoursWorked > 0) ||
		(workday.additionalWorked != null && workday.additionalWorked > 0) ||
		(workday.realTimeDayWorked && String(workday.realTimeDayWorked).trim() !== '') ||
		(workday.absenceType && String(workday.absenceType).trim() !== '' && String(workday.absenceType).trim().toLowerCase() !== 'null') ||
		(workday.notes && String(workday.notes).trim() !== '') ||
		(Array.isArray(workday.manualActivityBlocks) && workday.manualActivityBlocks.some(b => b && b.hours > 0)) ||
		(Array.isArray(workday.manualTaskBlocks) && workday.manualTaskBlocks.some(b => b && b.hours > 0)) ||
		(Array.isArray(workday.timeEntries) && workday.timeEntries.length > 0) ||
		(workday.activeTimer && workday.activeTimer.startTime)
	)
}

function leaveCoversYmd(request, ymd) {
	if (!request?.startDate || !request?.endDate) return false
	const start = toWarsawYmd(request.startDate)
	const end = toWarsawYmd(request.endDate)
	return !!start && !!end && ymd >= start && ymd <= end
}

function isHalfHourStep(value) {
	if (value == null) return true
	const doubled = Number(value) * 2
	return Number.isFinite(doubled) && Math.abs(doubled - Math.round(doubled)) < 0.01
}

async function ensureValidBulkPayload(body, settings, allowedTasksById = new Map()) {
	const startDate = parseYmd(body?.startDate)
	const endDate = parseYmd(body?.endDate)
	if (!startDate || !endDate || startDate > endDate) {
		return { error: { status: 400, code: 'INVALID_RANGE', message: 'Nieprawidłowy zakres dat.' } }
	}

	const dates = listYmdRange(startDate, endDate)
	if (dates.length > MAX_BULK_FILL_DAYS) {
		return { error: { status: 400, code: 'RANGE_TOO_LONG', message: 'Zakres może obejmować maksymalnie 62 dni.' } }
	}

	const merged = mergeWorkBlocksIntoPayload(body, settings, allowedTasksById, { locale: 'pl' })
	if (merged.error) {
		return {
			error: {
				status: 400,
				code: merged.error.code,
				message: merged.error.message,
			},
		}
	}

	const normalized = merged.normalized
	const manualActivityBlocks = merged.manualActivityBlocks
	const manualTaskBlocks = merged.manualTaskBlocks

	if (!normalized.hasHours && !normalized.hasAbsence) {
		return { error: { status: 400, code: 'ENTRY_REQUIRED', message: 'Podaj godziny pracy albo typ nieobecności.' } }
	}

	if (normalized.hasHours && normalized.hasAbsence) {
		return { error: { status: 400, code: 'HOURS_AND_ABSENCE', message: 'Wybierz godziny pracy albo nieobecność, nie oba pola naraz.' } }
	}

	if (normalized.hasHours && (normalized.hoursWorked > 24 || !isHalfHourStep(normalized.hoursWorked))) {
		return { error: { status: 400, code: 'INVALID_HOURS', message: 'Godziny pracy muszą być od 0 do 24 co 0,5 h.' } }
	}

	if (
		normalized.additionalWorked != null &&
		(normalized.additionalWorked < 0 || normalized.additionalWorked > 100 || !isHalfHourStep(normalized.additionalWorked))
	) {
		return { error: { status: 400, code: 'INVALID_OVERTIME', message: 'Nadgodziny muszą być od 0 do 100 co 0,5 h.' } }
	}

	return { startDate, endDate, dates, normalized, manualActivityBlocks, manualTaskBlocks }
}

async function bulkFillWorkdays({
	WorkdayModel,
	LeaveRequestModel,
	CalendarConfirmationModel,
	targetUser,
	settings,
	body,
	actorUserId = null,
}) {
	if (!targetUser?._id || !targetUser.teamId) {
		return { error: { status: 404, code: 'USER_INVALID', message: 'Użytkownik nie znaleziony.' } }
	}
	if (!settings) {
		return { error: { status: 400, code: 'NO_SETTINGS', message: 'Brak ustawień zespołu.' } }
	}

	const allowedTasks = await fetchTimesheetTasksForUser(targetUser._id, targetUser.teamId, targetUser)
	const allowedTasksById = tasksToAllowedMap(allowedTasks)

	const parsed = await ensureValidBulkPayload(body, settings, allowedTasksById)
	if (parsed.error) return parsed

	const { startDate, endDate, dates, normalized, manualActivityBlocks, manualTaskBlocks } = parsed
	const todayYmd = toWarsawYmd(new Date())

	if (settings.workdayEntriesOnlyToday === true && (dates.length !== 1 || dates[0] !== todayYmd)) {
		return {
			error: {
				status: 400,
				code: 'ONLY_TODAY_ALLOWED',
				message: 'W ustawieniach zespołu włączono dodawanie wpisów tylko dla dzisiejszego dnia.',
			},
		}
	}

	const monthKeys = [...new Set(dates.map(monthKeyFromYmd))]
	const confirmationFilters = monthKeys.map(key => {
		const [year, month] = key.split('-').map(Number)
		return { userId: targetUser._id, year, month, isConfirmed: true }
	})
	const confirmations = confirmationFilters.length
		? await CalendarConfirmationModel.find({ $or: confirmationFilters }).lean()
		: []
	const confirmedMonths = new Set(confirmations.map(item => `${item.year}-${item.month}`))

	const queryStart = new Date(`${startDate}T00:00:00.000Z`)
	const queryEnd = new Date(`${endDate}T23:59:59.999Z`)
	const padMs = 24 * 3600000
	const [existingWorkdays, acceptedLeaveRequests] = await Promise.all([
		WorkdayModel.find({
			userId: targetUser._id,
			date: { $gte: new Date(queryStart.getTime() - padMs), $lte: new Date(queryEnd.getTime() + padMs) },
		}).lean(),
		LeaveRequestModel.find({
			userId: targetUser._id,
			status: { $in: ['status.accepted', 'status.sent'] },
		}).lean(),
	])

	const existingByDate = new Map()
	for (const workday of existingWorkdays) {
		const ymd = toWarsawYmd(workday.date)
		if (!ymd) continue
		if (!existingByDate.has(ymd)) existingByDate.set(ymd, [])
		existingByDate.get(ymd).push(workday)
	}

	const skipped = {
		weekend: 0,
		holiday: 0,
		leave: 0,
		existing: 0,
		confirmed: 0,
	}
	const insertedDocs = []

	for (const ymd of dates) {
		if (confirmedMonths.has(monthKeyFromYmd(ymd))) {
			skipped.confirmed += 1
			continue
		}
		if (settings.workOnWeekends === false && isWeekendYmd(ymd)) {
			skipped.weekend += 1
			continue
		}
		if (isHoliday(ymd, settings)) {
			skipped.holiday += 1
			continue
		}
		if ((existingByDate.get(ymd) || []).some(hasExistingEntry)) {
			skipped.existing += 1
			continue
		}
		if (acceptedLeaveRequests.some(request => leaveCoversYmd(request, ymd))) {
			skipped.leave += 1
			continue
		}

		insertedDocs.push({
			userId: targetUser._id,
			date: ymdToDate(ymd),
			hoursWorked: normalized.hasHours ? normalized.hoursWorked : null,
			additionalWorked: normalized.hasHours && normalized.additionalWorked != null && normalized.additionalWorked > 0 ? normalized.additionalWorked : null,
			realTimeDayWorked: normalized.hasHours ? normalized.realTimeDayWorked || null : null,
			absenceType: normalized.hasAbsence ? normalized.absenceType : null,
			notes: normalized.notes || null,
			manualActivityBlocks: normalized.hasHours && manualActivityBlocks.length ? manualActivityBlocks : [],
			manualTaskBlocks: normalized.hasHours && manualTaskBlocks.length ? manualTaskBlocks : [],
			lastChangedBy: actorUserId,
		})
	}

	const created = insertedDocs.length ? await WorkdayModel.insertMany(insertedDocs, { ordered: true }) : []

	return {
		createdCount: created.length,
		skipped,
		requestedCount: dates.length,
	}
}

module.exports = {
	bulkFillWorkdays,
}
