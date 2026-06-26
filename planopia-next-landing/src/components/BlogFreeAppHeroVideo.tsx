'use client'

import { useEffect, useRef, useState } from 'react'
import {
	BLOG_FREE_APP_MEDIA_SIZE,
	BLOG_FREE_APP_POSTER,
	BLOG_FREE_APP_VIDEO_DESKTOP,
	BLOG_FREE_APP_VIDEO_MOBILE,
} from '@/data/blogFreeAppAssets'

type Props = { locale: 'pl' | 'en' }

export default function BlogFreeAppHeroVideo({ locale }: Props) {
	const wrapRef = useRef<HTMLDivElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isMd, setIsMd] = useState(false)
	const [inView, setInView] = useState(false)
	const [reduceMotion, setReduceMotion] = useState(false)

	const posters = BLOG_FREE_APP_POSTER[locale]
	const label =
		locale === 'pl'
			? 'Planopia — podgląd ewidencji czasu pracy w aplikacji'
			: 'Planopia — time tracking preview in the app'

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
	/** Mobile: zawsze obraz (LCP, mniejszy transfer). Desktop: wideo dopiero w viewport. */
	const shouldPlayVideo = isMd && inView && !reduceMotion

	useEffect(() => {
		const el = videoRef.current
		if (!el) return
		if (!shouldPlayVideo) {
			el.pause()
			return
		}
		const p = el.play()
		if (p && typeof p.catch === 'function') p.catch(() => {})
	}, [shouldPlayVideo])

	const { width, height } = BLOG_FREE_APP_MEDIA_SIZE

	return (
		<div ref={wrapRef} className="mt-8 sm:mt-10 w-full">
			<div className="overflow-hidden rounded-xl bg-slate-100 shadow-md ring-1 ring-slate-200/80">
				{shouldPlayVideo ? (
					<video
						ref={videoRef}
						className="block w-full h-auto object-contain object-center outline-none [border:0]"
						src={isMd ? BLOG_FREE_APP_VIDEO_DESKTOP : BLOG_FREE_APP_VIDEO_MOBILE}
						muted
						loop
						playsInline
						preload="none"
						poster={poster}
						width={width}
						height={height}
						aria-label={label}
					/>
				) : (
					<img
						src={poster}
						alt={label}
						className="block w-full h-auto object-contain object-center outline-none [border:0]"
						width={width}
						height={height}
						loading="lazy"
						decoding="async"
					/>
				)}
			</div>
		</div>
	)
}
