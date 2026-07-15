'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
	CONSENT_EVENT_NAME,
	initializeConsentMode,
	loadGoogleTag,
	readConsent,
	trackEvent,
} from '@/lib/analytics'

export default function GoogleAnalytics() {
	const pathname = usePathname()
	const lastTrackedPage = useRef('')

	useEffect(() => {
		initializeConsentMode()
		const consent = readConsent()
		if (consent) void loadGoogleTag(consent)
	}, [])

	useEffect(() => {
		const trackCurrentPage = () => {
			const consent = readConsent()
			if (!consent?.analytics) return

			const pagePath = `${pathname}${window.location.search}`
			if (lastTrackedPage.current === pagePath) return
			lastTrackedPage.current = pagePath

			trackEvent('page_view', {
				page_location: window.location.href,
				page_path: pagePath,
				page_title: document.title,
			})
		}

		trackCurrentPage()
		window.addEventListener(CONSENT_EVENT_NAME, trackCurrentPage)
		return () => window.removeEventListener(CONSENT_EVENT_NAME, trackCurrentPage)
	}, [pathname])

	useEffect(() => {
		const trackRegistrationClick = (event: MouseEvent) => {
			const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
			if (!anchor) return

			try {
				const url = new URL(anchor.href, window.location.href)
				if (url.hostname !== 'app.planopia.pl' || url.pathname !== '/team-registration') return
				trackEvent('begin_sign_up', {
					link_url: url.href,
					link_text: anchor.textContent?.trim().slice(0, 100) || 'registration',
					page_path: window.location.pathname,
				})
			} catch {
				// Ignore malformed third-party links.
			}
		}

		document.addEventListener('click', trackRegistrationClick, true)
		return () => document.removeEventListener('click', trackRegistrationClick, true)
	}, [])

	return null
}
