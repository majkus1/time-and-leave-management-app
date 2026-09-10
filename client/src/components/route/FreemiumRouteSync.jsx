import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { appHomePath } from '../../utils/appHomePath'
import { isFreemiumSeatEscapePath } from '../../utils/freemiumSeatEscape'

const TEAM_ACCESS_NOTICE_PATH = '/team-access-notice'

/**
 * Freemium w limicie miejsc: ewidencja czasu pracy i profil dla wszystkich; listy ewidencji dla
 * Admin / HR / przełożonego z uprawnieniem; zarządzanie zespołem dla Admina; pakiety dla Admin / HR.
 * Bez QR, urlopów, grafików, zadań, czatu i asystenta — te są w planie płatnym.
 */
function isFreemiumAppPathAllowed(pathname, { userIsAdmin, staffBilling, canCalendars }) {
	if (pathname === TEAM_ACCESS_NOTICE_PATH) return true
	if (pathname === '/work-time' || pathname === '/edit-profile' || pathname === '/settings') return true
	if (canCalendars && (pathname === '/calendars-list' || pathname.startsWith('/work-calendars/'))) return true
	if (staffBilling && pathname === '/packages') return true
	if (
		userIsAdmin &&
		(pathname === '/team-management' ||
			pathname === '/create-user' ||
			pathname === '/documents' ||
			pathname === '/helpcenter')
	) {
		return true
	}
	return false
}

/**
 * Utrzymuje zgodność tras klienta z polityką freemiumApiGuard (wąski moduł + blokada przy >5 miejscach).
 */
export default function FreemiumRouteSync() {
	const location = useLocation()
	const navigate = useNavigate()
	const { loggedIn, role, userId } = useAuth()
	const isSupervisorRole = isSupervisor(role)
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const {
		isLoading,
		isFetching,
		data: ent,
		freemiumTier,
		freemiumSeatBlocked,
		freemiumAppRestricted,
	} = useFreemiumAccess({
		enabled: !!loggedIn,
	})
	// Przy blokadzie miejsc serwer i tak odrzuci to zapytanie — nie ma po co go wysyłać.
	const { data: supervisorConfig } = useSupervisorConfig(
		userId,
		isSupervisorRole && !isAdminRole && !isHRRole && !freemiumSeatBlocked
	)
	const canFreemiumCalendars = useMemo(() => {
		if (isAdminRole || isHRRole) return true
		if (isSupervisorRole && supervisorConfig?.permissions?.canViewTimesheets !== false) return true
		return false
	}, [isAdminRole, isHRRole, isSupervisorRole, supervisorConfig])
	const { canUseDashboard } = useDashboardAccess({ enabled: !!loggedIn })

	useEffect(() => {
		if (!loggedIn) return
		if (isLoading || isFetching || !ent) return

		const p = (location.pathname.replace(/\/+$/, '') || '/').split('?')[0]

		const userIsAdmin = isAdmin(role)
		const staffBilling = userIsAdmin || isHR(role)
		const freemiumHome = appHomePath({ canUseDashboard: false })

		if (p === '/dashboard' && !canUseDashboard) {
			navigate('/work-time', { replace: true })
			return
		}

		if (freemiumTier && p === '/packages' && !staffBilling) {
			navigate(`${TEAM_ACCESS_NOTICE_PATH}?reason=billing`, { replace: true })
			return
		}

		// Ponad limit miejsc: zespół ma zejść do limitu albo kupić pakiet. Admin i HR lądują w pakietach,
		// reszta widzi komunikat — ta sama lista ścieżek co przy 403 z serwera (freemiumSeatEscape).
		if (freemiumSeatBlocked) {
			if (p === TEAM_ACCESS_NOTICE_PATH && staffBilling) {
				navigate('/packages', { replace: true })
				return
			}
			if (isFreemiumSeatEscapePath(p, role)) return
			navigate(staffBilling ? '/packages' : `${TEAM_ACCESS_NOTICE_PATH}?reason=seats`, { replace: true })
			return
		}

		// Blokada miejsc zniknęła (admin przyciął zespół albo kupił pakiet), a pracownik wciąż ogląda
		// komunikat — ta trasa jest dozwolona także w limicie, więc bez tej reguły nikt by go stamtąd nie wyprowadził.
		if (p === TEAM_ACCESS_NOTICE_PATH && new URLSearchParams(location.search).get('reason') === 'seats') {
			navigate(appHomePath({ canUseDashboard }), { replace: true })
			return
		}

		if (
			freemiumAppRestricted &&
			!isFreemiumAppPathAllowed(p, { userIsAdmin, staffBilling, canCalendars: canFreemiumCalendars })
		) {
			navigate(freemiumHome, { replace: true })
		}
	}, [
		loggedIn,
		isLoading,
		isFetching,
		ent,
		freemiumTier,
		freemiumSeatBlocked,
		freemiumAppRestricted,
		location.pathname,
		location.search,
		navigate,
		role,
		canFreemiumCalendars,
		canUseDashboard,
	])

	return null
}
