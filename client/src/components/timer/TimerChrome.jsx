import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useActiveTimer } from '../../hooks/useTimer'
import { useTimerElapsed } from '../../hooks/useTimerElapsed'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../context/AuthContext'
import { buildTimerChromeText } from '../../utils/timerDisplay'
import {
	clearTimerNotificationInServiceWorker,
	setClientDrivingTimerNotification,
	syncTimerNotificationToServiceWorker,
	tickTimerNotificationInServiceWorker,
} from '../../utils/timerNotificationBridge'

/**
 * Tytuł karty + jedno powiadomienie (aktualizacja w miejscu).
 * Widoczna karta → tick z JS; ukryta → tick w service workerze.
 */
export default function TimerChrome() {
	const { i18n } = useTranslation()
	const { loggedIn } = useAuth()
	const isLoggedIn = loggedIn === true
	const { isLoading: freemiumEntLoading, freemiumTier } = useFreemiumAccess({ enabled: isLoggedIn })
	const { data: settings } = useSettings()
	const allowTimer =
		isLoggedIn && !freemiumEntLoading && !freemiumTier && settings?.timerEnabled !== false

	const { data: activeTimer } = useActiveTimer({ enabled: allowTimer })
	const activeTimerRef = useRef(activeTimer)
	activeTimerRef.current = activeTimer

	const prevActiveRef = useRef(false)
	const localeRef = useRef(i18n.resolvedLanguage || 'pl')
	localeRef.current = i18n.resolvedLanguage || 'pl'

	const metrics = useTimerElapsed(activeTimer)
	const locale = i18n.resolvedLanguage || 'pl'
	const chrome = buildTimerChromeText(metrics, { locale, defaultTitle: 'Planopia' })

	// Stan timera (start, pauza, opis…) → sync do SW
	useEffect(() => {
		if (!allowTimer) {
			void clearTimerNotificationInServiceWorker()
			prevActiveRef.current = false
			return undefined
		}

		if (!activeTimer?.active) {
			void clearTimerNotificationInServiceWorker()
			prevActiveRef.current = false
			return undefined
		}

		const forceCreate = !prevActiveRef.current
		prevActiveRef.current = true
		void syncTimerNotificationToServiceWorker(activeTimer, locale, { forceCreate })

		return undefined
	}, [
		allowTimer,
		activeTimer?.active,
		activeTimer?.startTime,
		activeTimer?.isBreak,
		activeTimer?.breakStartTime,
		activeTimer?.isOvertime,
		activeTimer?.overtimeStartTime,
		activeTimer?.workDescription,
		locale,
	])

	// Zegar w powiadomieniu: karta widoczna = tick z aplikacji; w tle = tick w SW
	useEffect(() => {
		if (!allowTimer || !activeTimer?.active) {
			void setClientDrivingTimerNotification(false)
			return undefined
		}

		let intervalId = null

		const runTick = () => {
			const current = activeTimerRef.current
			if (!current?.active) return
			void tickTimerNotificationInServiceWorker(current, localeRef.current)
		}

		const applyVisibilityMode = () => {
			const visible = document.visibilityState === 'visible'
			void setClientDrivingTimerNotification(visible)

			if (intervalId) {
				window.clearInterval(intervalId)
				intervalId = null
			}

			if (visible) {
				runTick()
				intervalId = window.setInterval(runTick, 1000)
			}
		}

		applyVisibilityMode()
		document.addEventListener('visibilitychange', applyVisibilityMode)

		return () => {
			document.removeEventListener('visibilitychange', applyVisibilityMode)
			if (intervalId) window.clearInterval(intervalId)
			void setClientDrivingTimerNotification(false)
		}
	}, [
		allowTimer,
		activeTimer?.active,
		activeTimer?.startTime,
	])

	useEffect(() => {
		return () => {
			void clearTimerNotificationInServiceWorker()
			void setClientDrivingTimerNotification(false)
		}
	}, [])

	if (!isLoggedIn) return null

	return (
		<Helmet>
			<title>{chrome.documentTitle}</title>
		</Helmet>
	)
}
