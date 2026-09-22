import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useOnboardingStatus } from '../../hooks/useOnboarding'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './OnboardingChecklist.css'

/**
 * „Umów 15 min wdrożenia z twórcą” — przez pierwsze 7 dni po założeniu zespołu (serwer: founderCall w statusie
 * onboardingu; wymaga FOUNDER_CALENDAR_URL). Zamknięcie pamiętane w localStorage per zespół — to zaproszenie,
 * nie komunikat systemowy, więc nie wraca po odświeżeniu.
 */
function dismissKey(teamId) {
	return `po-founder-call-dismissed:${teamId || 'team'}`
}

function readDismissed(teamId) {
	try {
		return localStorage.getItem(dismissKey(teamId)) === '1'
	} catch {
		return false
	}
}

export default function FounderCallBanner() {
	const { t } = useTranslation()
	const { loggedIn, role, teamId } = useAuth()
	const staff = isAdmin(role) || isHR(role)
	const { data } = useOnboardingStatus({ enabled: !!loggedIn && staff })
	const [dismissed, setDismissed] = useState(() => readDismissed(teamId))

	const call = data?.founderCall
	// Gdy lista „Pierwsze kroki” jest widoczna, kalendarz jest w niej (dla zespołów bez numeru) — baner tylko po jej ukryciu.
	if (!staff || !call?.active || !call.url || dismissed || data?.visible) return null

	const dismiss = () => {
		try {
			localStorage.setItem(dismissKey(teamId), '1')
		} catch {
			// brak localStorage — baner zniknie tylko na tę sesję
		}
		setDismissed(true)
	}

	return (
		<aside className="po-founder-call" aria-label={t('founderCall.title')}>
			<img className="po-founder-call__avatar" src="/img/1709827103942.webp" alt="" width="42" height="42" loading="lazy" />
			<div className="po-founder-call__text">
				<strong>{t('founderCall.title')}</strong>
				<p>{t('founderCall.body')}</p>
			</div>
			<div className="po-founder-call__actions">
				<a href={call.url} target="_blank" rel="noopener noreferrer" className="po-founder-call__cta">
					{t('founderCall.cta')}
				</a>
				<button type="button" className="po-founder-call__dismiss" onClick={dismiss} aria-label={t('founderCall.dismiss')}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
		</aside>
	)
}
