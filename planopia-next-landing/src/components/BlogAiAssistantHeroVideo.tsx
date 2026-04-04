'use client'

import { useMobilePowerSaveStaticImage } from '@/hooks/useMobilePowerSaveStaticImage'

/**
 * Film pod kartą hero — Asystent AI. Szerokość = ta sama kolumna co karta (max-w-4xl / 5xl / 6xl z rodzica).
 * Desktop: podsumowanie-ai-desktop.mp4, mobile: ai-pods-mob.mp4.
 * Na mobile: przy oszczędzaniu energii / danych — statyczny obraz zamiast wideo (mniej obciążenia CPU/GPU).
 */
const VIDEO_DESKTOP = '/img/podsumowanie-ai-desktop.mp4'
const VIDEO_MOBILE = '/img/ai-pods-mob.mp4'
const POSTER_PL = '/img/aiass.webp'
const POSTER_EN = '/img/aiass-en.webp'

const FALLBACK: Record<'pl' | 'en', string> = {
	pl: '/img/ai-fallback.webp',
	en: '/img/ai-fallback-en.webp',
}

type Props = {
	locale?: 'pl' | 'en'
}

export default function BlogAiAssistantHeroVideo({ locale = 'pl' }: Props) {
	const loc = locale === 'en' ? 'en' : 'pl'
	const label =
		loc === 'en'
			? 'Planopia — AI Assistant, summaries and context from the app'
			: 'Planopia — Asystent AI, podsumowania i kontekst z aplikacji'

	const poster = loc === 'en' ? POSTER_EN : POSTER_PL
	const fallbackSrc = FALLBACK[loc]
	const staticOnMobile = useMobilePowerSaveStaticImage()

	const videoProps = {
		autoPlay: true as const,
		muted: true as const,
		loop: true as const,
		playsInline: true as const,
		preload: 'auto' as const,
	}

	return (
		<div className="mt-8 sm:mt-10 w-full">
			<div className="overflow-hidden rounded-xl bg-slate-100 shadow-md ring-1 ring-indigo-100/90">
				{staticOnMobile ? (
					<img
						src={fallbackSrc}
						alt={label}
						className="block w-full h-auto object-contain object-center outline-none [border:0] md:hidden"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<video
						className="block w-full h-auto object-contain object-center outline-none [border:0] md:hidden"
						{...videoProps}
						poster={poster}
						aria-label={label}
					>
						<source src={VIDEO_MOBILE} type="video/mp4" />
					</video>
				)}
				<video
					className="hidden md:block w-full h-auto object-contain object-center outline-none [border:0]"
					{...videoProps}
					poster={poster}
					aria-label={label}
				>
					<source src={VIDEO_DESKTOP} type="video/mp4" />
				</video>
			</div>
		</div>
	)
}
