import React, { useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useFreemiumAccess } from '../hooks/useFreemiumAccess'
import { canShowBillingModuleNav } from '../utils/moduleNavAccess'

/**
 * Stała zakładka przy prawej krawędzi → /ai-assistant (nad paskiem PWA jak inne FAB-y).
 * Na /settings zielony FAB „scroll do zapisu” jest na lewo od tej zakładki.
 */
const TAP_MOVE_THRESHOLD_PX = 14

function AiAssistantPromoFab() {
	const navigate = useNavigate()
	const pointerRef = useRef(null)
	const touchNavigatedRef = useRef(false)
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

	const goToAssistant = useCallback(() => {
		navigate('/ai-assistant')
	}, [navigate])

	const onPointerDown = useCallback((e) => {
		pointerRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
		if (e.pointerType === 'touch') {
			try {
				e.currentTarget.setPointerCapture(e.pointerId)
			} catch {
				/* ignore */
			}
		}
	}, [])

	const onPointerUp = useCallback(
		(e) => {
			const start = pointerRef.current
			pointerRef.current = null
			if (!start || start.pointerId !== e.pointerId) return
			const dx = Math.abs(e.clientX - start.x)
			const dy = Math.abs(e.clientY - start.y)
			if (dx <= TAP_MOVE_THRESHOLD_PX && dy <= TAP_MOVE_THRESHOLD_PX) {
				e.preventDefault()
				touchNavigatedRef.current = true
				goToAssistant()
				window.setTimeout(() => {
					touchNavigatedRef.current = false
				}, 400)
			}
		},
		[goToAssistant]
	)

	const onPointerCancel = useCallback(() => {
		pointerRef.current = null
	}, [])

	const onClick = useCallback(
		(e) => {
			// Dotyk: nawigacja w pointerup; click z iOS często nadgania — nie duplikuj.
			if (touchNavigatedRef.current || e.pointerType === 'touch') {
				e.preventDefault()
				return
			}
			e.preventDefault()
			goToAssistant()
		},
		[goToAssistant]
	)

	if (!show) return null

	const isSettings = pathname === '/settings'
	const settingsClass = isSettings ? ' ai-assistant-promo-fab-edge--on-settings' : ''
	const label = t('aiAssistant.promoFab.title')

	return (
		<button
			type="button"
			className={`ai-assistant-promo-fab-edge${settingsClass}`}
			title={label}
			aria-label={label}
			onPointerDown={onPointerDown}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
			onClick={onClick}
		>
			<img
				className="ai-assistant-promo-fab-edge__icon"
				src="/img/aiasystent.png"
				alt=""
				aria-hidden
				draggable={false}
			/>
		</button>
	)
}

export default AiAssistantPromoFab
