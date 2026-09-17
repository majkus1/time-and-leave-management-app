'use client'

import { useId, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LandingChatPanel, { ChatIcon } from '@/components/landingChat/LandingChatPanel'
import { useLandingChatOptional } from '@/components/landingChat/LandingChatProvider'
import { isLandingHomePath } from '@/components/landingChat/landingChatCopy'

/**
 * Pływający przycisk + panel czatu na każdej stronie landingu. Stan rozmowy jest wspólny z sekcją na stronie
 * głównej (LandingChatProvider), więc pytanie zadane w sekcji jest widoczne tu po przejściu na /blog.
 * Gdy sekcja jest na ekranie, przycisk znika — jeden czat na raz.
 */
export default function LandingChatWidget() {
	const pathname = usePathname()
	const chat = useLandingChatOptional()
	const panelId = useId()
	/** Menu mobilne ustawia `mobile-menu-open` na body — ten sam z-index co panel (9999) kładł czat wizualnie NAD menu. */
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	const enabledPublic = process.env.NEXT_PUBLIC_LANDING_CHAT_ENABLED !== 'false'

	useLayoutEffect(() => {
		if (typeof document === 'undefined') return
		const sync = () => setMobileMenuOpen(document.body.classList.contains('mobile-menu-open'))
		sync()
		const mo = new MutationObserver(sync)
		mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
		return () => mo.disconnect()
	}, [])

	if (!enabledPublic || !chat) return null
	const { copy, open, openPanel, closePanel, sectionVisible } = chat
	const hideFab = isLandingHomePath(pathname) && sectionVisible && !open

	return (
		<div
			className={`landing-chat-widget pointer-events-none fixed bottom-0 right-0 z-[9997] flex flex-col items-end gap-2 p-4 md:p-5 [&_*]:pointer-events-auto ${mobileMenuOpen ? 'hidden' : ''}`}
		>
			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby={panelId}
					className="landing-chat-panel flex max-h-[min(640px,calc(100vh-6rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80"
				>
					<div className="flex items-center justify-between gap-2 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
						{/* div zamiast h2: globalne `h2 { color: #213555 !important }` nadpisuje biały tekst */}
						<div
							id={panelId}
							role="heading"
							aria-level={2}
							className="landing-chat-panel__title m-0 text-base font-bold tracking-tight !text-white"
							style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
						>
							{copy.title}
						</div>
						<button
							type="button"
							onClick={closePanel}
							className="landing-chat-panel__close flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-2xl font-normal leading-none text-white hover:bg-white/15"
							aria-label={copy.close}
						>
							✕
						</button>
					</div>
					<LandingChatPanel variant="widget" />
				</div>
			)}

			<button
				type="button"
				onClick={() => (open ? closePanel() : openPanel('fab'))}
				className={`landing-chat-fab flex h-14 w-14 items-center justify-center rounded-full bg-transparent p-0 text-white shadow-none transition hover:scale-[1.03] hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500${hideFab ? ' landing-chat-fab--hidden' : ''}`}
				aria-label={open ? copy.close : copy.open}
				aria-expanded={open}
				tabIndex={hideFab ? -1 : 0}
			>
				<ChatIcon className="h-14 w-14" alt={copy.chatIconAlt} />
			</button>
		</div>
	)
}
