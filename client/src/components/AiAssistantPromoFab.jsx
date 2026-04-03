import React, { useId, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

/**
 * Stała zakładka przy prawej krawędzi → /ai-assistant (nad paskiem PWA jak inne FAB-y).
 * Na /settings zielony FAB „scroll do zapisu” jest na lewo od tej zakładki.
 */
function AiAssistantPromoFab() {
	const { loggedIn } = useAuth()
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const waveGradId = `ai-fab-wave-${useId().replace(/:/g, '')}`

	const show = useMemo(() => {
		if (!loggedIn) return false
		if (pathname === '/ai-assistant') return false
		if (['/login', '/team-registration', '/reset-password'].includes(pathname)) return false
		if (pathname.startsWith('/set-password/') || pathname.startsWith('/new-password/')) return false
		return true
	}, [loggedIn, pathname])

	if (!show) return null

	const isSettings = pathname === '/settings'
	const settingsClass = isSettings ? ' ai-assistant-promo-fab-edge--on-settings' : ''

	return (
		<Link
			to="/ai-assistant"
			className={`ai-assistant-promo-fab-edge${settingsClass}`}
			title={t('aiAssistant.promoFab.title')}
			aria-label={t('aiAssistant.promoFab.title')}
		>
			<span className="ai-assistant-promo-fab-edge__wave" aria-hidden>
				<svg
					className="ai-assistant-promo-fab-edge__wave-svg"
					viewBox="0 0 20 10"
					width="20"
					height="10"
					focusable="false"
				>
					<defs>
						<linearGradient id={waveGradId} x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.35" />
							<stop offset="45%" stopColor="#ffffff" stopOpacity="0.95" />
							<stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.55" />
						</linearGradient>
					</defs>
					<g className="ai-assistant-promo-fab-edge__wave-track">
						<path
							fill="none"
							stroke={`url(#${waveGradId})`}
							strokeWidth="1.35"
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M0 5 C6.6 1.2 13.4 8.8 20 5 C26.6 1.2 33.4 8.8 40 5"
						/>
					</g>
				</svg>
			</span>
			<span className="ai-assistant-promo-fab-edge__label">AI</span>
		</Link>
	)
}

export default AiAssistantPromoFab
