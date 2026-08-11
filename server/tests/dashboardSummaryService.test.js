'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
	buildDashboardModules,
	loadPendingLeaveRequests,
	buildPersonalLeaveLimits,
} = require('../services/dashboardSummaryHelpers')

function coreEntitlements(moduleKeys, ai = {}) {
	return {
		planKey: 'core',
		freemiumTier: false,
		freemiumSeatBlocked: false,
		modules: { effectiveKeys: moduleKeys },
		ai,
	}
}

describe('dashboardSummaryService module access', () => {
	it('nie udostępnia Asystenta AI dla CORE z samym schedules_ai i dostępną pulą AI', () => {
		const modules = buildDashboardModules(
			coreEntitlements(['schedules_ai'], { hasAccess: true, remainingApprox: 100 }),
			true
		)

		assert.equal(modules.schedules, true)
		assert.equal(modules.ai, false)
	})

	it('udostępnia Asystenta AI dla CORE z modułem ai_assistant', () => {
		const modules = buildDashboardModules(
			coreEntitlements(['ai_assistant'], { hasAccess: true, remainingApprox: 100 }),
			true
		)

		assert.equal(modules.ai, true)
	})

	it('nie pokazuje timera dla CORE bez timer_qr mimo starego ustawienia true', () => {
		const modules = buildDashboardModules(coreEntitlements([]), true)

		assert.equal(modules.timeTracking, false)
	})

	it('pokazuje timer tylko przy aktywnym ustawieniu i module timer_qr', () => {
		const entitlements = coreEntitlements(['timer_qr'])

		assert.equal(buildDashboardModules(entitlements, true).timeTracking, true)
		assert.equal(buildDashboardModules(entitlements, false).timeTracking, false)
	})
})

describe('dashboardSummaryService pending leave KPI', () => {
	it('liczy wszystkie wnioski niezależnie od limitu podglądu', async () => {
		const requests = Array.from({ length: 20 }, (_, index) => ({ _id: `leave-${index}` }))
		let appliedLimit = null

		const query = {
			populate() {
				return this
			},
			sort() {
				return this
			},
			limit(value) {
				appliedLimit = value
				return this
			},
			lean() {
				return Promise.resolve(requests.slice(0, appliedLimit))
			},
		}
		const LeaveRequestModel = {
			countDocuments: () => Promise.resolve(requests.length),
			find: () => query,
		}

		const result = await loadPendingLeaveRequests(LeaveRequestModel, {
			status: 'status.pending',
		})

		assert.equal(result.pendingCount, 20)
		assert.equal(result.pending.length, 4)
		assert.equal(appliedLimit, 4)
	})
})

describe('buildPersonalLeaveLimits — jednostka per typ', () => {
	const YEAR = 2026
	// 2026-08-11 to wtorek, 2026-08-12 sroda, 2026-08-13 czwartek — dni robocze.
	const makeSettings = (settlementUnit, leaveCalculationMode = 'days') => ({
		workOnWeekends: true,
		includePolishHolidays: false,
		includeCustomHolidays: false,
		customHolidays: [],
		leaveCalculationMode,
		leaveHoursPerDay: 8,
		leaveRequestTypes: [
			{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', isEnabled: true, allowDaysLimit: true },
			{
				id: 'custom-childcare',
				name: 'Opieka nad dzieckiem',
				isEnabled: true,
				allowDaysLimit: true,
				settlementUnit,
			},
		],
	})

	const dayRequest = (type, status, start, end) => ({
		type,
		status,
		startDate: `${start}T00:00:00.000Z`,
		endDate: `${end}T00:00:00.000Z`,
		daysRequested: 3,
	})

	const hourRequest = (type, status, day, hours) => ({
		type,
		status,
		startDate: `${day}T00:00:00.000Z`,
		endDate: `${day}T00:00:00.000Z`,
		daysRequested: 1,
		hoursRequested: hours,
		settlementUnit: 'hours',
		hoursPerDaySnapshot: 8,
	})

	it('typ dzienny liczy sie w dniach — bez zmian wzgledem zachowania sprzed funkcji', () => {
		const limits = buildPersonalLeaveLimits({
			viewerDoc: { leaveTypeDays: { 'leaveform.option1': 26 } },
			ownRequests: [dayRequest('leaveform.option1', 'status.accepted', '2026-08-11', '2026-08-13')],
			settings: makeSettings('inherit'),
			year: YEAR,
		})
		assert.equal(limits.length, 1)
		assert.equal(limits[0].unit, 'days')
		assert.equal(limits[0].limit, 26)
		assert.equal(limits[0].used, 3)
		assert.equal(limits[0].remaining, 23)
	})

	it('typ godzinowy liczy sie w godzinach, a limit 16 znaczy 16 godzin', () => {
		const limits = buildPersonalLeaveLimits({
			viewerDoc: { leaveTypeDays: { 'custom-childcare': 16 } },
			ownRequests: [
				hourRequest('custom-childcare', 'status.accepted', '2026-08-11', 4),
				hourRequest('custom-childcare', 'status.pending', '2026-08-12', 2),
			],
			settings: makeSettings('hours'),
			year: YEAR,
		})
		assert.equal(limits.length, 1)
		assert.equal(limits[0].unit, 'hours')
		assert.equal(limits[0].limit, 16)
		assert.equal(limits[0].used, 4)
		assert.equal(limits[0].pending, 2)
		assert.equal(limits[0].remaining, 12)
	})

	it('typ przelaczony z powrotem na dni przelicza historie godzinowa na dni', () => {
		const limits = buildPersonalLeaveLimits({
			viewerDoc: { leaveTypeDays: { 'custom-childcare': 2 } },
			ownRequests: [
				hourRequest('custom-childcare', 'status.accepted', '2026-08-11', 4), // 0.5 dnia
				hourRequest('custom-childcare', 'status.accepted', '2026-08-12', 8), // 1 dzien
			],
			settings: makeSettings('days'),
			year: YEAR,
		})
		assert.equal(limits[0].unit, 'days')
		assert.equal(limits[0].used, 1.5)
		assert.equal(limits[0].remaining, 0.5)
	})

	it('jednostki roznych typow nie mieszaja sie ze soba', () => {
		const limits = buildPersonalLeaveLimits({
			viewerDoc: { leaveTypeDays: { 'leaveform.option1': 26, 'custom-childcare': 16 } },
			ownRequests: [
				dayRequest('leaveform.option1', 'status.accepted', '2026-08-11', '2026-08-13'),
				hourRequest('custom-childcare', 'status.accepted', '2026-08-11', 4),
			],
			settings: makeSettings('hours'),
			year: YEAR,
		})
		const vacation = limits.find(l => l.typeId === 'leaveform.option1')
		const childcare = limits.find(l => l.typeId === 'custom-childcare')
		assert.equal(vacation.unit, 'days')
		assert.equal(vacation.used, 3)
		assert.equal(childcare.unit, 'hours')
		assert.equal(childcare.used, 4)
	})

	it('wniosek spoza rozpatrywanego roku nie wchodzi do salda', () => {
		const limits = buildPersonalLeaveLimits({
			viewerDoc: { leaveTypeDays: { 'custom-childcare': 16 } },
			ownRequests: [hourRequest('custom-childcare', 'status.accepted', '2025-08-11', 4)],
			settings: makeSettings('hours'),
			year: YEAR,
		})
		assert.equal(limits[0].used, 0)
	})
})
