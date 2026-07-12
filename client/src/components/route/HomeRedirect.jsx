import { Navigate } from 'react-router-dom'
import Loader from '../Loader'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { appHomePath } from '../../utils/appHomePath'

export default function HomeRedirect() {
	const { canUseDashboard, isLoading } = useDashboardAccess({ enabled: true })

	if (isLoading) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
				<Loader />
			</div>
		)
	}

	return <Navigate to={appHomePath({ canUseDashboard })} replace />
}
