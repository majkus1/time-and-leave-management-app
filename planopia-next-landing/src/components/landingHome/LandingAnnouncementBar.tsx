'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './announcementBar.css'
import { ANNOUNCE_DISMISS_KEY } from '@/lib/announcementBar'

/**
 * Cienki pasek ogłoszenia nad stałym nagłówkiem — wszystkie strony PL (layout), poza stroną, do której prowadzi.
 * Zamknięcie zapamiętujemy w przeglądarce; klasę lab-off przy kolejnej wizycie ustawia skrypt w layoucie PL.
 * Adres i stawka przychodzą z layoutu — import partnerProgramCopy dołożyłby cennik i walidację do JS każdej strony.
 */
export default function LandingAnnouncementBar({ href, rate }: { href: string; rate: string }) {
	const pathname = usePathname()

	const dismiss = () => {
		try {
			localStorage.setItem(ANNOUNCE_DISMISS_KEY, '1')
		} catch {}
		document.documentElement.classList.add('lab-off')
	}

	// Bez paska: --lab-h spada do 0 i nagłówek wraca na górę (też przy przejściu bez przeładowania)
	if (pathname === href) return null

	return (
		<div className="lab" role="region" aria-label="Ogłoszenie">
			<Link href={href} className="lab__link">
				<b className="lab__badge">Nowość</b>
				<span className="lab__text lab__text--long">
					Program partnerski: polecaj Planopię i zarabiaj {rate} od płatności poleconych firm
				</span>
				<span className="lab__text lab__text--short">Program partnerski — {rate} prowizji</span>
				<svg className="lab__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M5 12h14M13 6l6 6-6 6" />
				</svg>
			</Link>
			<button type="button" className="lab__close" onClick={dismiss} aria-label="Zamknij ogłoszenie">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</div>
	)
}
