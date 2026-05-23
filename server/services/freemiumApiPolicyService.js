const { TRIAL } = require('../constants/planCatalog')
const { isSuperAdminUser } = require('../utils/logAccessPolicy')

/**
 * Polityka dostępu API dla zespołów w trybie freemium (wygasły trial / niewznowiona subskrypcja / koniec okresu legacy).
 * Wyodrębniona od middleware — łatwa do testów i jednego miejsca na listy ścieżek.
 */

function freemiumMaxAppSeats() {
	return TRIAL.maxUsers
}

function normalizeApiPath(req) {
	return (req.originalUrl || req.url || '').split('?')[0]
}

function isFreemiumTimerPath(path) {
	return path.startsWith('/api/workdays/timer')
}

/** Zawsze dostępne w freemium (także przy przekroczeniu liczby miejsc). */
function isFreemiumBaseEscape(path, method) {
	if (method === 'GET' && path === '/api/csrf-token') return true
	if (path.startsWith('/api/billing')) return true
	if (path.startsWith('/api/legal')) return true
	if (method === 'GET' && path === '/api/users/me') return true
	if (method === 'POST' && path === '/api/users/logout') return true
	if (method === 'POST' && path === '/api/users/refresh-token') return true
	return false
}

function matchesOwnTeamGet(path, method, teamId) {
	if (method !== 'GET' || !teamId) return false
	const m = /^\/api\/teams\/([a-f\d]{24})$/i.exec(path)
	return m && m[1].toLowerCase() === String(teamId).toLowerCase()
}

/**
 * Zespół ma > freemiumMaxAppSeats() aktywnych kont — tylko billing + przycinanie zespołu (bez dodawania użytkowników).
 */
function isFreemiumSeatOverageAllowed(path, method, teamId) {
	if (isFreemiumBaseEscape(path, method)) return true
	if (matchesOwnTeamGet(path, method, teamId)) return true

	if (path.startsWith('/api/teams/')) {
		const m = /^\/api\/teams\/([a-f\d]{24})(\/users|\/check-limit)$/i.exec(path)
		if (!m || m[1].toLowerCase() !== String(teamId).toLowerCase()) return false
		if (m[2] === '/users' && method === 'GET') return true
		if (m[2] === '/check-limit' && method === 'POST') return true
		return false
	}

	if (path.startsWith('/api/users')) {
		if (method === 'POST' && path === '/api/users/register') return false
		return true
	}

	/** Lista kalendarzy i podgląd ewidencji — Admin / HR / przełożony muszą móc pracować przy przycinaniu zespołu. */
		if (
		pathStartsWithAny(path, [
			'/api/workdays',
			'/api/time-entry',
			'/api/calendar',
			'/api/departments',
			'/api/leaveworks',
			'/api/supervisors',
		])
	) {
		return true
	}

	if (pathStartsWithAny(path, ['/api/settings', '/api/email-notifications', '/api/tickets'])) return true

	return false
}

const FREEMIUM_ACTIVE_EXTRA_PREFIXES = [
	'/api/workdays',
	'/api/time-entry',
	'/api/calendar',
	'/api/settings',
	'/api/email-notifications',
	'/api/supervisors',
	'/api/departments',
	/** Wnioski urlopowe (GET m.in. accepted-leave-requests) — lista kalendarzy / ewidencja zespołu na freemium. */
	'/api/leaveworks',
	'/api/userlogs',
	'/api/qr',
	'/api/push',
	'/api/notifications',
	/** Centrum pomocy — zgłoszenia wsparcia (UI tylko Admin). */
	'/api/tickets',
]

function pathStartsWithAny(path, prefixes) {
	return prefixes.some(p => path === p || path.startsWith(`${p}/`))
}

function isPlatformSuperAdminActivityApiPath(path) {
	return path === '/api/super/activity' || path.startsWith('/api/super/activity/')
}

/** Monitor sesji platformy — tylko właściciel, poza polityką freemium / modułów planu. */
function isPlatformSuperAdminActivityAllowed(path, decodedUser) {
	return isPlatformSuperAdminActivityApiPath(path) && isSuperAdminUser({ username: decodedUser?.username })
}

/**
 * Freemium z liczbą miejsc w limicie — wąski zestaw modułów (bez timera, bez grafiku/urlopów/tablic itd.).
 */
function isFreemiumActiveTierAllowed(path, method) {
	if (isFreemiumBaseEscape(path, method)) return true
	if (isFreemiumTimerPath(path)) return false
	if (pathStartsWithAny(path, FREEMIUM_ACTIVE_EXTRA_PREFIXES)) return true
	if (path.startsWith('/api/users')) return true
	if (path.startsWith('/api/teams')) return true
	return false
}

module.exports = {
	freemiumMaxAppSeats,
	normalizeApiPath,
	isFreemiumTimerPath,
	isFreemiumSeatOverageAllowed,
	isFreemiumActiveTierAllowed,
	isPlatformSuperAdminActivityAllowed,
}
