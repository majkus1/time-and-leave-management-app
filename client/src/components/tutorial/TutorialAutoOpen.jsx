import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useTutorial } from '../../context/TutorialContext'
import { useSettings } from '../../hooks/useSettings'
import { API_URL } from '../../config.js'

/** Ekrany, na których samouczek nie ma sensu — komunikaty i płatności. */
const SKIP_PATHS = ['/team-access-notice', '/packages', '/login', '/team-registration']

/**
 * Otwiera samouczek raz — przy pierwszym logowaniu osoby, która go jeszcze nie widziała.
 * Zamknięcie zapisuje „widziane”, więc nie wróci. Zespół może to wyłączyć w Ustawieniach
 * (tutorialAutoOpen); ręcznie samouczek zawsze jest pod „Jak korzystać?”.
 */
export default function TutorialAutoOpen() {
	const location = useLocation()
	const { loggedIn, isCheckingAuth, hasSeenTutorial, markTutorialSeenLocally } = useAuth()
	const { isOpen, openTutorial } = useTutorial()
	const { data: settings, isLoading: settingsLoading } = useSettings()
	const autoOpenedRef = useRef(false)

	useEffect(() => {
		if (!loggedIn || isCheckingAuth || hasSeenTutorial || autoOpenedRef.current) return
		if (settingsLoading || settings?.tutorialAutoOpen === false) return
		if (SKIP_PATHS.some(p => location.pathname.startsWith(p))) return
		autoOpenedRef.current = true
		// Chwila na wyrenderowanie strony pod spodem — modal nad pustym ekranem wygląda jak błąd.
		const timer = setTimeout(openTutorial, 600)
		return () => clearTimeout(timer)
	}, [loggedIn, isCheckingAuth, hasSeenTutorial, settingsLoading, settings, location.pathname, openTutorial])

	// Po zamknięciu automatycznie otwartego samouczka zapisujemy, że został obejrzany.
	useEffect(() => {
		if (!autoOpenedRef.current || isOpen || hasSeenTutorial) return
		markTutorialSeenLocally?.()
		axios.post(`${API_URL}/api/users/tutorial/seen`, {}, { withCredentials: true }).catch(() => {})
	}, [isOpen, hasSeenTutorial, markTutorialSeenLocally])

	return null
}
