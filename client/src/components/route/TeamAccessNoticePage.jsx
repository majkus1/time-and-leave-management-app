import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../context/AuthContext'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import { freemiumSeatRecoveryPath } from '../../utils/freemiumSeatEscape'
import './TeamAccessNoticePage.css'

/**
 * Informacja dla użytkowników bez dostępu do Pakietów / w sytuacji limitu miejsc (freemium).
 * Nie jest to błąd HTTP — celowo czytelny ekran z logo i wyjaśnieniem.
 */
export default function TeamAccessNoticePage() {
	const { t } = useTranslation()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { logout, role } = useAuth()
	const reason = searchParams.get('reason') || 'generic'
	const { freemiumMaxSeats, freemiumSeatBlocked } = useFreemiumAccess({ enabled: true })
	const userIsAdmin = isAdmin(role)
	const userIsHR = isHR(role)
	const seatsIssue = reason === 'seats' || (reason === 'generic' && freemiumSeatBlocked)

	useEffect(() => {
		if (!seatsIssue) return
		if (userIsAdmin || userIsHR) {
			navigate(freemiumSeatRecoveryPath(role), { replace: true })
		}
	}, [seatsIssue, userIsAdmin, userIsHR, role, navigate])

	const title = t('teamAccessNotice.title')
	let body = t('teamAccessNotice.genericBody')

	if (seatsIssue) {
		body = t('teamAccessNotice.seatsBody', { max: freemiumMaxSeats })
	} else if (reason === 'billing') {
		body = t('teamAccessNotice.billingBody')
	} else if (reason === 'settings') {
		body = t('teamAccessNotice.settingsBody')
	}

	const handleLogout = async () => {
		await logout?.()
		navigate('/login', { replace: true })
	}

	return (
		<div className="team-access-notice">
			<Helmet>
				<title>{title} — Planopia</title>
			</Helmet>
			<div className="team-access-notice__card">
				<img
					className="team-access-notice__logo app-brand-logo"
					src="/img/new-logoplanopia.png"
					alt="Planopia"
				/>
				<h1 className="team-access-notice__title">{title}</h1>
				<p className="team-access-notice__body">{body}</p>
				<div className="team-access-notice__actions">
					{(userIsAdmin || userIsHR) && seatsIssue ? (
						<button
							type="button"
							className="team-access-notice__btn primary"
							onClick={() => navigate('/packages')}
						>
							{t('teamAccessNotice.goPackages')}
						</button>
					) : (
						<button type="button" className="team-access-notice__btn primary" onClick={() => navigate('/dashboard')}>
							{t('teamAccessNotice.backDashboard')}
						</button>
					)}
					{userIsAdmin && seatsIssue ? (
						<button
							type="button"
							className="team-access-notice__btn secondary"
							onClick={() => navigate('/team-management')}
						>
							{t('teamAccessNotice.goTeamManagement')}
						</button>
					) : null}
					<button type="button" className="team-access-notice__btn secondary" onClick={handleLogout}>
						{t('teamAccessNotice.logout')}
					</button>
				</div>
			</div>
		</div>
	)
}
