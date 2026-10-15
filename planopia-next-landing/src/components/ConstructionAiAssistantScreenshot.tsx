'use client'

import { useState } from 'react'
import {
	CONSTRUCTION_AI_POSTER,
	CONSTRUCTION_AI_VIDEO_DESKTOP,
	CONSTRUCTION_AI_VIDEO_MOBILE,
} from '@/data/industryConstructionAiVideo'

type Props = {
	locale: 'pl' | 'en'
	imgClassName?: string
	/** Nadpisanie źródła wideo na desktop (np. starszy materiał). Domyślnie: podsumowanie-ai-desktop.mp4. */
	desktopVideoSrc?: string
}

const COPY = {
	pl: { label: 'Asystent AI w aplikacji Planopia — podgląd czatu', play: 'Odtwórz nagranie' },
	en: { label: 'Planopia AI assistant in the app — chat preview', play: 'Play the recording' },
}

/**
 * Podgląd Asystenta AI: plakat w ramce o stałych proporcjach (bez przesuwania układu przy ładowaniu),
 * nagranie dopiero po kliknięciu — wersja na komputer waży ~45 MB, więc nie pobieramy jej bez potrzeby.
 */
export default function ConstructionAiAssistantScreenshot({
	locale,
	imgClassName = 'h-full w-full object-cover object-top',
	desktopVideoSrc = CONSTRUCTION_AI_VIDEO_DESKTOP,
}: Props) {
	const [videoSrc, setVideoSrc] = useState<string | null>(null)
	const posters = CONSTRUCTION_AI_POSTER[locale]
	const t = COPY[locale]

	const play = () => {
		const desktop = window.matchMedia('(min-width: 768px)').matches
		setVideoSrc(desktop ? desktopVideoSrc : CONSTRUCTION_AI_VIDEO_MOBILE)
	}

	return (
		// Proporcje plakatów: telefon 355×772, komputer 1900×911 — ramka trzyma miejsce, zanim cokolwiek się wczyta
		<div className="relative mx-auto aspect-[355/772] w-full max-w-[360px] overflow-hidden bg-slate-100 md:aspect-[1900/911] md:max-w-none">
			{videoSrc ? (
				<video
					className={imgClassName}
					src={videoSrc}
					autoPlay
					muted
					loop
					playsInline
					controls
					aria-label={t.label}
				/>
			) : (
				<>
					<picture>
						<source media="(min-width: 768px)" srcSet={posters.desktop} width={1900} height={911} />
						<img src={posters.mobile} alt={t.label} className={imgClassName} width={355} height={772} loading="lazy" decoding="async" />
					</picture>
					<button
						type="button"
						onClick={play}
						className="absolute inset-0 flex items-center justify-center bg-slate-900/10 transition hover:bg-slate-900/20"
						aria-label={t.play}
					>
						<svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
							<circle cx="36" cy="36" r="34" fill="#00a63e" />
							<path d="M29 23.5v25L49 36 29 23.5z" fill="#fff" />
						</svg>
					</button>
				</>
			)}
		</div>
	)
}
