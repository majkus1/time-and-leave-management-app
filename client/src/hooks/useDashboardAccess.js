import { useFreemiumAccess } from './useFreemiumAccess'

/** Pulpit (Start) — tylko poza freemium i gdy Admin/HR włączył go w ustawieniach zespołu. */
export function useDashboardAccess(options = {}) {
	const q = useFreemiumAccess(options)
	const dashboardEnabled = q.data?.dashboardEnabled === true
	const canUseDashboard = dashboardEnabled && !q.freemiumTier
	return {
		...q,
		dashboardEnabled,
		canUseDashboard,
	}
}
