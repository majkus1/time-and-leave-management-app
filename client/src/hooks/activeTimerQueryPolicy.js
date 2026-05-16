/** Background sync while timer is running (UI clock is client-side). */
export const ACTIVE_TIMER_REFETCH_MS = 5000

/**
 * While timer is off, treat status as fresh to avoid remount/refocus storms.
 * Mutations and window focus still refresh when needed.
 */
export const INACTIVE_TIMER_STALE_MS = 5 * 60 * 1000

/**
 * @param {{ active?: boolean } | undefined} data
 * @param {boolean} [queryEnabled=true]
 * @returns {number | false}
 */
export function resolveActiveTimerRefetchInterval(data, queryEnabled = true) {
	if (!queryEnabled) return false
	if (data?.active !== true) return false
	return ACTIVE_TIMER_REFETCH_MS
}

/**
 * @param {{ active?: boolean } | undefined} data
 * @returns {number}
 */
export function resolveActiveTimerStaleTime(data) {
	if (data?.active === true) return 0
	return INACTIVE_TIMER_STALE_MS
}
