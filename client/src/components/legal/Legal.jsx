import { Navigate } from 'react-router-dom'

/** Dokumenty prawne są na dole strony Pakiety i rozliczenia. */
export default function Legal() {
	return <Navigate to="/packages#legal-documents" replace />
}
