'use client'

import { useEffect, useRef, useState } from 'react'
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

export default function ConstructionAiAssistantScreenshot({
	locale,
	imgClassName = 'w-full h-auto object-cover object-top',
	desktopVideoSrc = CONSTRUCTION_AI_VIDEO_DESKTOP,
}: Props) {
	const wrapRef = useRef<HTMLDivElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isMd, setIsMd] = useState(false)
	const [inView, setInView] = useState(false)
	const [reduceMotion, setReduceMotion] = useState(false)

	const posters = CONSTRUCTION_AI_POSTER[locale]
	const label =
		locale === 'pl'
			? 'Asystent AI w aplikacji Planopia — podgląd czatu'
			: 'Planopia AI assistant in the app — chat preview'

	useEffect(() => {
		setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
		const mq = window.matchMedia('(min-width: 768px)')
		const sync = () => setIsMd(mq.matches)
		sync()
		mq.addEventListener('change', sync)
		return () => mq.removeEventListener('change', sync)
	}, [])

	useEffect(() => {
		const el = wrapRef.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: '120px 0px', threshold: 0.1 }
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])

	const poster = isMd ? posters.desktop : posters.mobile
	const shouldPlayVideo = inView && !reduceMotion

	useEffect(() => {
		const el = videoRef.current
		if (!el) return
		if (!shouldPlayVideo) {
			el.pause()
			return
		}
		const p = el.play()
		if (p && typeof p.catch === 'function') p.catch(() => {})
	}, [shouldPlayVideo, isMd, inView])

	return (
		<div ref={wrapRef} className="w-full">
			{shouldPlayVideo ? (
				<video
					ref={videoRef}
					className={imgClassName}
					src={isMd ? desktopVideoSrc : CONSTRUCTION_AI_VIDEO_MOBILE}
					muted
					loop
					playsInline
					preload="none"
					poster={poster}
					aria-label={label}
				/>
			) : (
				<img
					src={poster}
					alt={label}
					className={imgClassName}
					width={800}
					height={533}
					loading="lazy"
					decoding="async"
				/>
			)}
		</div>
	)
}
