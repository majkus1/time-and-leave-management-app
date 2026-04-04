'use client'

import { useMobilePowerSaveStaticImage } from '@/hooks/useMobilePowerSaveStaticImage'

/**
 * Film pod kartą hero — ta sama szerokość kolumny co karta (rodzic: max-w-4xl / 5xl / 6xl).
 * Desktop: ewi.mp4, mobile: ewi-mob.mp4.
 * Na mobile przy oszczędzaniu baterii/danych: mobilenews.webp / mobile-ennews.webp zamiast wideo.
 */
type Props = {
	locale: 'pl' | 'en'
}

const VIDEO_DESKTOP = '/img/ewi.mp4'
const VIDEO_MOBILE = '/img/ewi-mob.mp4'
const POSTER = '/img/ewidencja.webp'

const FALLBACK: Record<'pl' | 'en', string> = {
	pl: '/img/mobilenews.webp',
	en: '/img/mobile-ennews.webp',
}

export default function BlogFreeAppHeroVideo({ locale }: Props) {
	const loc = locale === 'en' ? 'en' : 'pl'
	const label =
		loc === 'pl'
			? 'Planopia — podgląd ewidencji czasu pracy w aplikacji'
			: 'Planopia — time tracking preview in the app'

	const poster = POSTER
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
			<div className="overflow-hidden rounded-xl bg-slate-100 shadow-md ring-1 ring-slate-200/80">
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
