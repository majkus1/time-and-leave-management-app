import { isAdmin, isHR } from './roleHelpers'

/**
 * Ścieżki dostępne przy freemium z przekroczonym limitem miejsc.
 * Zespół ma zejść do limitu albo kupić pakiet: Admin dostaje zarządzanie zespołem i pakiety,
 * HR pakiety, wszyscy pozostali — wyłącznie komunikat. Ta sama lista steruje routingiem
 * (FreemiumRouteSync) i reakcją na 403 z serwera (authErrorHandler), więc obie warstwy się zgadzają.
 */
export function isFreemiumSeatEscapePath(pathname, role) {
	const p = (pathname || '').replace(/\/+$/, '').split('?')[0] || '/'
	if (p === '/team-access-notice') return true
	const staff = isAdmin(role) || isHR(role)
	if (staff && p === '/packages') return true
	if (isAdmin(role) && (p === '/team-management' || p === '/helpcenter')) return true
	return false
}

export function freemiumSeatRecoveryPath(role) {
	if (isAdmin(role) || isHR(role)) return '/packages'
	return '/team-access-notice?reason=seats'
}
