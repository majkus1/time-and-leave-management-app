import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { appHomePath } from '../../utils/appHomePath'

const TEAM_ACCESS_NOTICE_PATH = '/team-access-notice'

const FREEMIUM_APP_PATHS = new Set([
	'/work-time',
	'/edit-profile',
	'/calendars-list',
	'/documents',
	'/team-management',
	'/create-user',
])

function isFreemiumAppPathAllowed(pathname, { staffBilling, userIsAdmin }) {
	if (pathname === TEAM_ACCESS_NOTICE_PATH) return true
	if (pathname === '/settings') return true
	if (pathname === '/helpcenter') return userIsAdmin
	if (pathname === '/packages') return staffBilling
	if (FREEMIUM_APP_PATHS.has(pathname)) {
		if (
			(pathname === '/team-management' || pathname === '/create-user' || pathname === '/documents') &&
			!userIsAdmin
		) {
			return false
		}
		return true
	}
	if (pathname.startsWith('/work-calendars/')) return true
	if (pathname.startsWith('/qr-scan/')) return true
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
	const { data: supervisorConfig } = useSupervisorConfig(
		userId,
		isSupervisorRole && !isAdminRole && !isHRRole
	)
	const canFreemiumCalendars = useMemo(() => {
		if (isAdminRole || isHRRole) return true
		if (isSupervisorRole && supervisorConfig?.permissions?.canViewTimesheets !== false) return true
		return false
	}, [isAdminRole, isHRRole, isSupervisorRole, supervisorConfig])
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

		if (freemiumSeatBlocked) {
			if (p === TEAM_ACCESS_NOTICE_PATH) {
				if (staffBilling) {
					navigate('/packages', { replace: true })
					return
				}
				return
			}
			if (p === '/dashboard' && !canUseDashboard) {
				navigate('/work-time', { replace: true })
				return
			}
			if (p === '/work-time') return
			if (p === '/edit-profile') return
			if (staffBilling && p === '/packages') return
			if (p === '/settings') return
			if (userIsAdmin && (p === '/team-management' || p === '/documents' || p === '/helpcenter')) return
			if (
				canFreemiumCalendars &&
				(p === '/calendars-list' || p.startsWith('/work-calendars/'))
			) {
				return
			}
			if (staffBilling) {
				navigate('/packages', { replace: true })
				return
			}
			navigate(`${TEAM_ACCESS_NOTICE_PATH}?reason=seats`, { replace: true })
			return
		}

		if (freemiumAppRestricted && !isFreemiumAppPathAllowed(p, { staffBilling, userIsAdmin })) {
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
		navigate,
		role,
		canFreemiumCalendars,
		canUseDashboard,
	])

	return null
}
