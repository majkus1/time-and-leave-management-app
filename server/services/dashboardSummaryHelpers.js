'use strict'

const { isHoliday } = require('../utils/holidays')
const {
	getLeaveRequestAmountInUnit,
	resolveLeaveTypeSettlement,
} = require('../utils/leaveSettlement')

const BUNDLE_PLAN_KEYS = new Set(['pro', 'business', 'enterprise'])

function hasModule(entitlements, moduleKey) {
	if (!moduleKey) return true
	if (!entitlements) return false
	if (entitlements.freemiumTier === true || entitlements.freemiumSeatBlocked === true) return false
	if (entitlements.ai?.unrestricted === true) return true
	if (entitlements.legacy === true || entitlements.legacyGrandfatheredActive === true) return true
	if (entitlements.planKey === 'trial') return true
	if (BUNDLE_PLAN_KEYS.has(entitlements.planKey)) return true
	return Array.isArray(entitlements.modules?.effectiveKeys)
		? entitlements.modules.effectiveKeys.includes(moduleKey)
		: false
}

function buildDashboardModules(entitlements, timerEnabledSetting) {
	const premiumUnlocked = entitlements.freemiumTier !== true && entitlements.freemiumSeatBlocked !== true
	return {
		work: true,
		timeTracking:
			timerEnabledSetting &&
			premiumUnlocked &&
			hasModule(entitlements, 'timer_qr'),
		leaves: premiumUnlocked,
		tasks: premiumUnlocked && hasModule(entitlements, 'tasks'),
		chat: premiumUnlocked && hasModule(entitlements, 'chat'),
		schedules: premiumUnlocked && hasModule(entitlements, 'schedules_ai'),
		ai: premiumUnlocked && hasModule(entitlements, 'ai_assistant'),
		announcements: premiumUnlocked,
	}
}

async function loadPendingLeaveRequests(LeaveRequestModel, pendingQuery) {
	const [pendingCount, pending] = await Promise.all([
		LeaveRequestModel.countDocuments(pendingQuery),
		LeaveRequestModel.find(pendingQuery)
			.populate('userId', 'firstName lastName username department')
			.sort({ startDate: 1 })
			.limit(4)
			.lean(),
	])

	return { pendingCount, pending }
}


/* ------------------------------------------------------------------ *
 * Salda urlopowe pracownika.
 * Przeniesione tu z dashboardSummaryService.js, ktory przy imporcie wymaga
 * zywego polaczenia z baza — te funkcje sa czyste i dzieki temu testowalne.
 * ------------------------------------------------------------------ */

function startOfDay(date) {
	const copy = new Date(date)
	copy.setHours(0, 0, 0, 0)
	return copy
}

function normalizeLeaveRequestStatus(status) {
	const normalized = String(status || '').replace('status.', '')
	return ['accepted', 'pending', 'rejected', 'sent'].includes(normalized) ? normalized : null
}

function countLeaveRequestDaysInYear(request, year, settings) {
	const yearStart = new Date(year, 0, 1, 0, 0, 0, 0)
	const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)
	const requestStart = new Date(request.startDate)
	const requestEnd = new Date(request.endDate)
	if (Number.isNaN(requestStart.getTime()) || Number.isNaN(requestEnd.getTime())) return 0

	const start = new Date(Math.max(requestStart.getTime(), yearStart.getTime()))
	const end = new Date(Math.min(requestEnd.getTime(), yearEnd.getTime()))
	if (start > end) return 0

	let days = 0
	const current = startOfDay(start)
	const lastDay = startOfDay(end)
	const workOnWeekends = settings?.workOnWeekends !== false

	while (current <= lastDay) {
		const dayOfWeek = current.getDay()
		const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
		const holiday = isHoliday(current, settings)
		if ((workOnWeekends || !isWeekendDay) && !holiday) days += 1
		current.setDate(current.getDate() + 1)
	}

	return days
}

function resolveViewerLeaveTypeDays(viewerDoc) {
	const leaveTypeDays = { ...(viewerDoc?.leaveTypeDays || {}) }
	if (
		(leaveTypeDays['leaveform.option1'] === undefined || leaveTypeDays['leaveform.option1'] === null) &&
		viewerDoc?.vacationDays !== undefined &&
		viewerDoc?.vacationDays !== null
	) {
		leaveTypeDays['leaveform.option1'] = viewerDoc.vacationDays
	}
	return leaveTypeDays
}

function buildPersonalLeaveLimits({ viewerDoc, ownRequests, settings, year }) {
	const leaveTypes = Array.isArray(settings?.leaveRequestTypes) ? settings.leaveRequestTypes : []
	const leaveTypeDays = resolveViewerLeaveTypeDays(viewerDoc)

	return leaveTypes
		.filter(type => {
			if (type?.isEnabled === false) return false
			const assigned = leaveTypeDays[type.id]
			if (assigned === undefined || assigned === null) return false
			// Typ z limitem albo przypisana pula dni (np. urlop wypoczynkowy).
			return type.allowDaysLimit === true || Number(assigned) > 0
		})
		.map(type => {
			// Jednostkę rozstrzygamy PER TYP, więc dni i godziny nigdy się tu nie mieszają.
			// Limit z leaveTypeDays czytamy w jednostce typu (16 przy typie godzinowym = 16 godzin).
			const settlement = resolveLeaveTypeSettlement(settings, type.id)
			const limit = Number(leaveTypeDays[type.id]) || 0
			let used = 0
			let pending = 0

			for (const request of ownRequests) {
				if (request.type !== type.id) continue
				const status = normalizeLeaveRequestStatus(request.status)
				// Historyczne rekordy w innej jednostce przeliczamy na aktualną jednostkę typu,
				// dzięki czemu przełączenie jednostki przez admina nie psuje salda.
				const amount = getLeaveRequestAmountInUnit(
					request,
					settlement.unit,
					settlement.hoursPerDay,
					countLeaveRequestDaysInYear(request, year, settings)
				)
				if (status === 'accepted' || status === 'sent') used += amount
				if (status === 'pending') pending += amount
			}

			const remaining = Math.round((limit - used) * 10) / 10
			return {
				typeId: type.id,
				typeName: type.name,
				typeNameEn: type.nameEn || type.name,
				unit: settlement.unit,
				hoursPerDay: settlement.hoursPerDay,
				limit,
				used: Math.round(used * 10) / 10,
				pending: Math.round(pending * 10) / 10,
				remaining,
				usagePercent: limit > 0 ? Math.min(100, Math.max(0, Math.round((used / limit) * 1000) / 10)) : 0,
				isAtRisk: limit > 0 && used <= limit && used + pending > limit,
			}
		})
		.sort((a, b) => b.limit - a.limit)
}

module.exports = {
	buildDashboardModules,
	loadPendingLeaveRequests,
	normalizeLeaveRequestStatus,
	countLeaveRequestDaysInYear,
	resolveViewerLeaveTypeDays,
	buildPersonalLeaveLimits,
}
