const { TRIAL } = require('../constants/planCatalog')
const { isSuperAdminUser } = require('../utils/logAccessPolicy')

/**
 * Polityka dostępu API dla zespołów w trybie freemium (wygasły trial / niewznowiona subskrypcja / koniec okresu legacy).
 * Wyodrębniona od middleware — łatwa do testów i jednego miejsca na listy ścieżek.
 *
 * Dwa tryby:
 *  - w limicie miejsc (<= freemiumMaxAppSeats): ewidencja czasu pracy i kalendarz, bez QR i licznika;
 *    Admin/HR dodatkowo zarządzanie zespołem oraz pakiety i rozliczenia;
 *  - ponad limit: zespół ma zejść do limitu albo kupić pakiet. Admin/HR widzą tylko to, co jest
 *    do tego potrzebne; pozostałe role — wyłącznie komunikat (żadnych danych aplikacji).
 */

const ROLE_ADMIN = 'Admin'
const ROLE_HR = 'HR'

function hasRole(roles, name) {
	return Array.isArray(roles) && roles.includes(name)
}

function isAdminRoles(roles) {
	return hasRole(roles, ROLE_ADMIN)
}

/** Admin lub HR — role, które mogą naprawić sytuację zespołu (zakup pakietu). */
function isBillingStaffRoles(roles) {
	return isAdminRoles(roles) || hasRole(roles, ROLE_HR)
}

function freemiumMaxAppSeats() {
	return TRIAL.maxUsers
}

/**
 * Ścieżka w takiej postaci, w jakiej zobaczy ją router. Express dopasowuje trasy bez rozróżniania
 * wielkości liter, z końcowym ukośnikiem i po zdublowanych ukośnikach — bez tej normalizacji
 * `/API/schedules/` omijałoby politykę, a router i tak obsłużyłby żądanie.
 */
function normalizeApiPath(req) {
	const raw = (req.originalUrl || req.url || '').split('?')[0]
	const collapsed = raw.replace(/\/{2,}/g, '/').toLowerCase()
	return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
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

/** Odczyty ekranów, które Admin/HR widzą przy blokadzie miejsc (sidebar, dzwonek, ustawienia). */
const SEAT_OVERAGE_STAFF_READ_PREFIXES = ['/api/settings', '/api/email-notifications']
/** Powiadomienia, push i zgłoszenia do pomocy — Admin/HR muszą móc skontaktować się z nami, gdy utkną. */
const SEAT_OVERAGE_STAFF_PREFIXES = ['/api/notifications', '/api/push', '/api/tickets']
/** Zarządzanie zespołem — to, czego używa ekran przycinania kont (tylko Admin), łącznie z konfiguracją przełożonych. */
const SEAT_OVERAGE_ADMIN_PREFIXES = ['/api/departments', '/api/userlogs', '/api/supervisors']

/**
 * Zespół ma > freemiumMaxAppSeats() aktywnych kont.
 * Pracownik / przełożony: nic poza wylogowaniem i uprawnieniami (komunikat po stronie klienta).
 * HR: pakiety i rozliczenia. Admin: dodatkowo zarządzanie zespołem — bez dodawania i przywracania kont,
 * bo to zwiększałoby liczbę miejsc zamiast ją zmniejszać.
 */
function isFreemiumSeatOverageAllowed(path, method, teamId, roles = []) {
	if (isFreemiumBaseEscape(path, method)) return true
	if (!isBillingStaffRoles(roles)) return false

	if (matchesOwnTeamGet(path, method, teamId)) return true
	if (pathStartsWithAny(path, SEAT_OVERAGE_STAFF_READ_PREFIXES)) return method === 'GET'
	if (pathStartsWithAny(path, SEAT_OVERAGE_STAFF_PREFIXES)) return true

	if (!isAdminRoles(roles)) return false

	if (path.startsWith('/api/teams/')) {
		const m = /^\/api\/teams\/([a-f\d]{24})(\/users|\/check-limit|\/permanent)?$/i.exec(path)
		if (!m || m[1].toLowerCase() !== String(teamId).toLowerCase()) return false
		if (m[2] === '/users' && method === 'GET') return true
		if (m[2] === '/check-limit' && method === 'POST') return true
		// Usunięcie własnego zespołu to też wyjście z blokady — Admin ma do niego prawo.
		if ((m[2] === undefined || m[2] === '/permanent') && method === 'DELETE') return true
		return false
	}

	if (path.startsWith('/api/users')) {
		if (method === 'POST' && path === '/api/users/register') return false
		if (/\/restore$/.test(path)) return false
		return true
	}

	return pathStartsWithAny(path, SEAT_OVERAGE_ADMIN_PREFIXES)
}

const FREEMIUM_ACTIVE_EXTRA_PREFIXES = [
	'/api/workdays',
	/** Czynności ewidencji — konfiguracja (Admin/HR) i rozbicie wpisów w kalendarzu. */
	'/api/work-activities',
	'/api/calendar',
	'/api/settings',
	'/api/email-notifications',
	'/api/supervisors',
	'/api/departments',
	'/api/userlogs',
	'/api/push',
	'/api/notifications',
	/** Centrum pomocy — zgłoszenia wsparcia (UI tylko Admin). */
	'/api/tickets',
	/** Lista „pierwsze kroki” po założeniu zespołu — pomaga także zespołom, którym skończył się trial. */
	'/api/onboarding',
	/** Asystent w trybie „jak działa Planopia” — wiedza o produkcie bez danych zespołu, także po trialu. */
	'/api/ai-help',
]

/** Prefiksy dostępne w freemium wyłącznie do odczytu. */
const FREEMIUM_ACTIVE_READ_ONLY_PREFIXES = [
	/** Listy do kalendarzy (accepted-leave-requests itp.) — bez składania wniosków, urlopy są w planie płatnym. */
	'/api/leaveworks',
	/** Wpisy wejść/wyjść widoczne w kalendarzu — rejestracja przez QR jest wyłączona. */
	'/api/time-entry',
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
 * Freemium z liczbą miejsc w limicie — ewidencja i kalendarz bez QR i licznika;
 * zarządzanie zespołem i rozliczenia przez /api/users, /api/teams i /api/billing.
 */
function isFreemiumActiveTierAllowed(path, method) {
	if (isFreemiumBaseEscape(path, method)) return true
	if (isFreemiumTimerPath(path)) return false
	if (path.startsWith('/api/qr')) return false
	if (pathStartsWithAny(path, FREEMIUM_ACTIVE_READ_ONLY_PREFIXES)) return method === 'GET'
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
	isBillingStaffRoles,
}
