// Wspólne elementy stron produktowych i branżowych (styl .pdl z productLanding.css)
import Image from 'next/image'
import type { Shot } from '@/data/productShots'

export type { Shot }
/** „Tytuł — opis” z danych → osobny tytuł i opis karty (bez zmiany samej treści) */
export function splitFeature(text: string) {
	const i = text.indexOf(' — ')
	if (i < 0) return { title: null, text }
	const rest = text.slice(i + 3)
	return { title: text.slice(0, i), text: rest.charAt(0).toUpperCase() + rest.slice(1) }
}

/** H1 „Fraza — dopowiedzenie” → dopowiedzenie w kolorze akcentu; tekst nagłówka bez zmian (myślnik zostaje w DOM) */
export function HeroTitle({ text }: { text: string }) {
	const i = text.indexOf(' — ')
	if (i < 0) return <h1 className="pdl-hero__title">{text}</h1>
	return (
		<h1 className="pdl-hero__title">
			{text.slice(0, i)}
			<span className="pdl-hero__dash"> — </span>
			<span className="pdl-hero__accent">{text.slice(i + 3)}</span>
		</h1>
	)
}

export function Check({ size = 18 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M5 12.5l4.2 4.2L19 7" />
		</svg>
	)
}

export function Arrow() {
	return (
		<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M5 12h14M13 6l6 6-6 6" />
		</svg>
	)
}

/** Zrzut ekranu w ramce okna przeglądarki */
export function BrowserShot({ shot, priority = false, url = 'app.planopia.pl' }: { shot: Shot; priority?: boolean; url?: string }) {
	return (
		<div className="pdl-browser">
			<div className="pdl-browser__bar" aria-hidden="true">
				<i />
				<i />
				<i />
				<span className="pdl-browser__url">{url}</span>
			</div>
			<Image
				src={shot.src}
				alt={shot.alt}
				width={shot.width}
				height={shot.height}
				className="pdl-browser__img"
				priority={priority}
				// Zrzuty są już przygotowanymi WebP (do 1600 px, ~50–90 KB) — bez optymalizatora, który przy pierwszym
				// wejściu kodowałby je od nowa i zostawiał pustą ramkę do czasu zakończenia
				unoptimized
			/>
		</div>
	)
}

/** Zrzut z telefonu w ramce urządzenia */
export function PhoneShot({ shot, priority = false }: { shot: Shot; priority?: boolean }) {
	return (
		<div className="pdl-phone">
			<Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} className="pdl-phone__img" priority={priority} unoptimized />
		</div>
	)
}
