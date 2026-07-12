import { Navigate } from 'react-router-dom'
import Loader from '../Loader'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'

export default function FreemiumDashboardGuard({ children }) {
	const { canUseDashboard, isLoading } = useDashboardAccess({ enabled: true })

	if (isLoading) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
				<Loader />
			</div>
		)
	}

	if (!canUseDashboard) {
		return <Navigate to="/work-time" replace />
	}

	return children
}
