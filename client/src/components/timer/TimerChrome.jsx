import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useActiveTimer } from '../../hooks/useTimer'
import { useTimerElapsed } from '../../hooks/useTimerElapsed'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../context/AuthContext'
import { buildTimerChromeText } from '../../utils/timerDisplay'

/**
 * Global timer UX: document title shows live clock while timer runs.
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
	const metrics = useTimerElapsed(activeTimer)
	const locale = i18n.resolvedLanguage || 'pl'
	const chrome = buildTimerChromeText(metrics, { locale, defaultTitle: 'Planopia' })

	if (!isLoggedIn) return null

	return (
		<Helmet>
			<title>{chrome.documentTitle}</title>
		</Helmet>
	)
}
