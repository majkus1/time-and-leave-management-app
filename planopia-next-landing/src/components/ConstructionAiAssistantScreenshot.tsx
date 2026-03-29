/**
 * Asystent AI — film z interfejsu (pętla, autoplay). Plakat z webp do szybkiego pierwszego kadru.
 * Używane na landingu branżowym i w artykule blogowym.
 */
type Props = {
	locale: 'pl' | 'en'
	imgClassName?: string
}

const VIDEO_DESKTOP = '/img/1.mp4'
const VIDEO_MOBILE = '/img/1-mobile.mp4'

export default function ConstructionAiAssistantScreenshot({
	locale,
	imgClassName = 'w-full h-auto object-cover object-top',
}: Props) {
	const isPl = locale === 'pl'
	const posterDesktop = isPl ? '/img/aiass.webp' : '/img/aiass-en.webp'
	const posterMobile = isPl ? '/img/aiass-mobile.webp' : '/img/aiass-mobile-en.webp'
	const label = isPl ? 'Asystent AI w aplikacji Planopia — podgląd czatu' : 'Planopia AI assistant in the app — chat preview'

	const videoProps = {
		autoPlay: true as const,
		muted: true as const,
		loop: true as const,
		playsInline: true as const,
		preload: 'auto' as const,
		'aria-label': label,
	}

	return (
		<>
			<video
				className={`${imgClassName} bg-slate-100 md:hidden`}
				{...videoProps}
				poster={posterMobile}
			>
				<source src={VIDEO_MOBILE} type="video/mp4" />
			</video>
			<video
				className={`${imgClassName} bg-slate-100 hidden md:block`}
				{...videoProps}
				poster={posterDesktop}
			>
				<source src={VIDEO_DESKTOP} type="video/mp4" />
			</video>
		</>
	)
}
