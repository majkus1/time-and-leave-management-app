'use strict'

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

module.exports = {
	buildDashboardModules,
	loadPendingLeaveRequests,
}
