import { Navigate, useLocation } from 'react-router-dom'
import Loader from '../Loader'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { appHomePath } from '../../utils/appHomePath'

// Zalogowany trafił na /login z celem (np. skan QR z przepustką) — wróć tam zamiast na stronę główną.
// Tylko ścieżki wewnętrzne; state.from ustawia wyłącznie aplikacja (ProtectedRoute, QRScan).
function returnPathFromState(state) {
	const from = state?.from
	const pathname = typeof from?.pathname === 'string' ? from.pathname : ''
	if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.startsWith('/\\')) return null
	if (pathname === '/' || pathname === '/login' || pathname === '/team-registration') return null
	return `${pathname}${from.search || ''}${from.hash || ''}`
}

export default function HomeRedirect() {
	const location = useLocation()
	const returnPath = returnPathFromState(location.state)
	const { canUseDashboard, isLoading } = useDashboardAccess({ enabled: !returnPath })

	if (returnPath) {
		return <Navigate to={returnPath} replace />
	}

	if (isLoading) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
				<Loader />
			</div>
		)
	}

	return <Navigate to={appHomePath({ canUseDashboard })} replace />
}
