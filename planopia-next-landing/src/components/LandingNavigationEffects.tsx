'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'

/** Scroll do góry przy zmianie strony + odblokowanie body po bfcache / wyjściu na zewnętrzny URL. */
export default function LandingNavigationEffects() {
	const pathname = usePathname()
	const prevPathname = useRef(pathname)

	useLayoutEffect(() => {
		if (prevPathname.current !== pathname) {
			prevPathname.current = pathname
			resetBodyScrollLock()
			window.scrollTo(0, 0)
		}
	}, [pathname])

	useEffect(() => {
		const onPageHide = () => {
			resetBodyScrollLock()
		}

		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				resetBodyScrollLock()
			}
		}

		window.addEventListener('pagehide', onPageHide)
		window.addEventListener('pageshow', onPageShow)
		return () => {
			window.removeEventListener('pagehide', onPageHide)
			window.removeEventListener('pageshow', onPageShow)
		}
	}, [])

	return null
}
