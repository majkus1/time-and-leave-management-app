/** Zgodnie z server/constants/planCatalog — pakiety bundle mają pełny zestaw w effectiveKeys. */
const BUNDLE_PLAN_KEYS = new Set(['pro', 'business', 'enterprise'])

/**
 * Czy pokazać link w sidebarze dla danego modułu (Core = dokupione klucze; bundle = wszystkie).
 * Trial / legacy / freemium / unrestricted — jak backend planModuleApiGuard (szerszy dostęp).
 * @param {boolean} [entitlementsLoading] — jeśli true, nie pokazuj modułów (uniknięcie błędnego „pełnego” menu przed odpowiedzią API).
 */
export function canShowBillingModuleNav(entitlements, moduleKey, entitlementsLoading = false) {
	if (!moduleKey) return true
	if (entitlementsLoading) return false
	if (!entitlements) return true
	if (entitlements.ai?.unrestricted === true) return true
	if (entitlements.legacy === true) return true
	if (entitlements.freemiumTier === true) return true
	if (entitlements.planKey === 'trial') return true
	const pk = entitlements.planKey
	if (pk && BUNDLE_PLAN_KEYS.has(pk)) return true
	const keys = entitlements.modules?.effectiveKeys
	if (!Array.isArray(keys)) return false
	return keys.includes(moduleKey)
}
