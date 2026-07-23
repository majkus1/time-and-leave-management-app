'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
	buildDashboardModules,
	loadPendingLeaveRequests,
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
