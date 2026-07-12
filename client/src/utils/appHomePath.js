/** Domyślna strona startowa po logowaniu. */
export function appHomePath({ canUseDashboard = false } = {}) {
	return canUseDashboard ? '/dashboard' : '/work-time'
}
