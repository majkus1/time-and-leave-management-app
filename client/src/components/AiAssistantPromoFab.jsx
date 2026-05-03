import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useFreemiumAccess } from '../hooks/useFreemiumAccess'
import { canShowBillingModuleNav } from '../utils/moduleNavAccess'

/**
 * Stała zakładka przy prawej krawędzi → /ai-assistant (nad paskiem PWA jak inne FAB-y).
 * Na /settings zielony FAB „scroll do zapisu” jest na lewo od tej zakładki.
 */
function AiAssistantPromoFab() {
	const { loggedIn } = useAuth()
	const {
		isLoading: billingEntLoading,
		freemiumTier,
		data: billingEnt,
	} = useFreemiumAccess({ enabled: !!loggedIn })
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const show = useMemo(() => {
		if (!loggedIn) return false
		/** Freemium: brak promocji AI (Sidebar też wyłącza premium). Do czasu entitlements nie pokazuj — unikamy błysku. */
		if (billingEntLoading || freemiumTier) return false
		if (!canShowBillingModuleNav(billingEnt, 'ai_assistant', billingEntLoading)) return false
		if (pathname === '/ai-assistant') return false
		if (['/login', '/team-registration', '/reset-password', '/chat'].includes(pathname)) return false
		if (pathname.startsWith('/set-password/') || pathname.startsWith('/new-password/')) return false
		return true
	}, [loggedIn, pathname, billingEntLoading, freemiumTier, billingEnt])

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
			<img
				className="ai-assistant-promo-fab-edge__icon"
				src="/img/aiasystent.png"
				alt=""
				aria-hidden
				draggable={false}
			/>
		</Link>
	)
}

export default AiAssistantPromoFab
