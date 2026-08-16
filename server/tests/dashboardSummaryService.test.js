'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
	buildDashboardModules,
	countMissingWorkdayEntries,
	filterUsersInScope,
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

describe('countMissingWorkdayEntries — kogo realnie trzeba popędzić', () => {
	const zespol = ['a', 'b', 'c', 'd', 'e']

	it('liczy tylko tych bez wpisu', () => {
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: zespol,
			recordedUserIds: ['a', 'b', 'c'],
		})
		assert.equal(wynik, 2)
	})

	it('nie liczy osób na całodniowym urlopie', () => {
		// 10 osób, 3 na urlopie, 2 zapomniały — ma wyjść 2, nie 5.
		const dziesiec = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10']
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: dziesiec,
			recordedUserIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
			excusedUserIds: ['u6', 'u7', 'u8'],
		})
		assert.equal(wynik, 2)
	})

	it('osoba na urlopie, która i tak zrobiła wpis, nie psuje liczby', () => {
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: zespol,
			recordedUserIds: ['a', 'b'],
			excusedUserIds: ['b', 'c'],
		})
		// zostają d i e
		assert.equal(wynik, 2)
	})

	it('w weekend i święto nikogo nie popędzamy', () => {
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: zespol,
			recordedUserIds: [],
			isWorkingDay: false,
		})
		assert.equal(wynik, 0)
	})

	it('nigdy nie schodzi poniżej zera', () => {
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: ['a'],
			recordedUserIds: ['a', 'b', 'c'],
			excusedUserIds: ['a'],
		})
		assert.equal(wynik, 0)
	})

	it('przyjmuje zbiór zamiast tablicy i porównuje identyfikatory jako tekst', () => {
		const wynik = countMissingWorkdayEntries({
			scopeUserIds: [1, 2, 3],
			recordedUserIds: new Set(['1']),
			excusedUserIds: new Set([2]),
		})
		assert.equal(wynik, 1)
	})

	it('pusty zakres daje zero', () => {
		assert.equal(countMissingWorkdayEntries({ scopeUserIds: [] }), 0)
		assert.equal(countMissingWorkdayEntries({}), 0)
	})
})

describe('filterUsersInScope — zakres per uprawnienie', () => {
	const anna = { _id: 'anna' }
	const bartek = { _id: 'bartek' }
	const celina = { _id: 'celina' }

	it('zwraca tylko pracowników objętych danym uprawnieniem', () => {
		const wynik = filterUsersInScope([anna, bartek, celina], [bartek, celina])
		assert.deepEqual(wynik.map(u => u._id), ['bartek', 'celina'])
	})

	it('uprawnienie do ewidencji nie wpuszcza pracownika do zakresu urlopowego', () => {
		// Przełożony widzi ewidencję Anny, ale zatwierdza urlopy tylko Bartkowi.
		const zakresEwidencji = [anna, bartek]
		const zakresUrlopowy = [bartek]
		assert.deepEqual(filterUsersInScope([anna], zakresEwidencji).map(u => u._id), ['anna'])
		assert.deepEqual(filterUsersInScope([anna], zakresUrlopowy), [])
	})

	it('pusty zakres uprawnienia nie przepuszcza nikogo', () => {
		assert.deepEqual(filterUsersInScope([anna, bartek], []), [])
	})

	it('porównuje identyfikatory jako tekst, nie przez referencję', () => {
		const jakoObiekt = { _id: { toString: () => 'anna' } }
		assert.equal(filterUsersInScope([jakoObiekt], [anna]).length, 1)
	})

	it('nie wywraca się na brakujących danych', () => {
		assert.deepEqual(filterUsersInScope(null, [anna]), [])
		assert.deepEqual(filterUsersInScope([anna], null), [])
		assert.deepEqual(filterUsersInScope([null, anna], [anna]).map(u => u._id), ['anna'])
	})
})

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
