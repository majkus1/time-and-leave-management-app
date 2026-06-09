import { isAdmin, isHR, isSupervisor } from './roleHelpers'

/** Ścieżki dostępne przy freemium + przekroczonym limicie miejsc (admin/HR muszą móc naprawić sytuację). */
export function isFreemiumSeatEscapePath(pathname, role, { canViewTimesheets = false } = {}) {
	const p = (pathname || '').replace(/\/+$/, '').split('?')[0] || '/'
	if (p === '/edit-profile' || p === '/settings') return true
	if (isAdmin(role) && (p === '/team-management' || p === '/documents' || p === '/helpcenter' || p === '/create-user')) {
		return true
	}
	if ((isAdmin(role) || isHR(role)) && p === '/packages') return true
	if (canViewTimesheets || isAdmin(role) || isHR(role) || isSupervisor(role)) {
		if (p === '/calendars-list' || p.startsWith('/work-calendars/')) return true
	}
	return false
}

export function freemiumSeatRecoveryPath(role) {
	if (isAdmin(role) || isHR(role)) return '/packages'
	return '/team-access-notice?reason=seats'
}
