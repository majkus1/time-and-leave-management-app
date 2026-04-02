'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Timer na górze, podsumowanie AI pod spodem (zamiana względem wcześniejszej kolejności). */
const DESKTOP_VIDEOS = ['/img/timer-desktop.mp4', '/img/podsumowanie-ai-desktop.mp4'] as const

const MOBILE_VIDEOS = [
	'/img/timer-mobile.mp4',
	'/img/ewidencja-mobile.mp4',
	'/img/urlop-zgloszenie-ai-mobile.mp4',
] as const

/** Jak wcześniej w sekcji „O aplikacji” — gdy na telefonie wideo nie wystartuje (np. oszczędzanie baterii). */
const MOBILE_FALLBACK_IMG: Record<'pl' | 'en', string> = {
	pl: '/img/mobilenews.webp',
	en: '/img/mobile-ennews.webp',
}

type Props = { locale: 'pl' | 'en' }

export default function AboutAppShowcaseVideos({ locale }: Props) {
	const [isLg, setIsLg] = useState(false)
	const [showDesktopPair, setShowDesktopPair] = useState(true)
	const [mobileIndex, setMobileIndex] = useState(0)
	const [reduceMotion, setReduceMotion] = useState(false)
	/** Tylko layout mobilny (!isLg): play() nie wystartował → pokazujemy statyczny obraz zamiast pustego wideo */
	const [mobileStaticFallback, setMobileStaticFallback] = useState(false)

	const desktopRefs = useRef<(HTMLVideoElement | null)[]>([])
	const desktopEndedRef = useRef([false, false])
	const mobileRefs = useRef<(HTMLVideoElement | null)[]>([])

	useEffect(() => {
		setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
		const mq = window.matchMedia('(min-width: 1024px)')
		const sync = () => setIsLg(mq.matches)
		sync()
		mq.addEventListener('change', sync)
		return () => mq.removeEventListener('change', sync)
	}, [])

	const desktopLabel =
		locale === 'pl' ? 'Planopia — podgląd aplikacji na komputerze' : 'Planopia — desktop preview'
	const mobileLabel =
		locale === 'pl' ? 'Planopia — podgląd na telefonie' : 'Planopia — mobile preview'

	const handleDesktopEnded = useCallback(
		(index: 0 | 1) => {
			if (reduceMotion || !isLg) return
			desktopEndedRef.current[index] = true
			if (desktopEndedRef.current[0] && desktopEndedRef.current[1]) {
				desktopEndedRef.current = [false, false]
				setShowDesktopPair(false)
				setMobileIndex(0)
			}
		},
		[reduceMotion, isLg]
	)

	const handleMobileEnded = useCallback(() => {
		if (reduceMotion) return
		if (!isLg) {
			setMobileIndex(i => (i + 1) % MOBILE_VIDEOS.length)
			return
		}
		setMobileIndex(i => {
			if (i === MOBILE_VIDEOS.length - 1) {
				setShowDesktopPair(true)
				return 0
			}
			return i + 1
		})
	}, [reduceMotion, isLg])

	// Desktop pair: start / replay when phase is active (wide + pair)
	useEffect(() => {
		if (!isLg || !showDesktopPair) return
		desktopEndedRef.current = [false, false]
		desktopRefs.current.forEach(el => {
			if (!el) return
			el.currentTime = 0
			if (reduceMotion) {
				el.loop = true
			} else {
				el.loop = false
			}
			const p = el.play()
			if (p && typeof p.catch === 'function') p.catch(() => {})
		})
	}, [isLg, showDesktopPair, reduceMotion])

	useEffect(() => {
		if (!isLg || showDesktopPair) return
		desktopRefs.current.forEach(el => el?.pause())
	}, [isLg, showDesktopPair])

	// Po zmianie szerokości (np. obrót telefonu) ponów próbę wideo zamiast trzymać stary fallback
	useEffect(() => {
		setMobileStaticFallback(false)
	}, [isLg])

	// Mobile clips: play active, pause rest
	const showMobileCarousel = !isLg || (isLg && !showDesktopPair)
	const effectiveMobileIndex = reduceMotion ? 0 : mobileIndex

	useEffect(() => {
		if (!showMobileCarousel) {
			mobileRefs.current.forEach(el => el?.pause())
			return
		}
		// Na desktopie (szeroki ekran, fazie „mobilnych” klipów) — bez obrazka zamiast wideo
		if (!isLg && mobileStaticFallback) {
			mobileRefs.current.forEach(el => el?.pause())
			return
		}

		mobileRefs.current.forEach((el, i) => {
			if (!el) return
			const active = reduceMotion ? i === 0 : i === effectiveMobileIndex
			if (!active) {
				el.pause()
				return
			}
			el.currentTime = 0
			if (reduceMotion) el.loop = true
			else el.loop = false
			const p = el.play()
			if (p && typeof p.then === 'function') {
				p.then(() => {
					if (!isLg) setMobileStaticFallback(false)
				}).catch(() => {
					if (!isLg) setMobileStaticFallback(true)
				})
			}
		})
	}, [showMobileCarousel, effectiveMobileIndex, reduceMotion, isLg, mobileStaticFallback])

	/* Desktop: pełna szerokość w opakowaniu */
	const desktopVideoClass =
		'block w-full bg-white object-contain object-center outline-none [border:0]'

	/* Mobile: naturalna szerokość klipu (bez w-full), max. szerokość kolumny, wyśrodkowanie */
	const mobileVideoClass =
		'mx-auto block h-auto w-auto max-w-full max-h-[600px] rounded-xl bg-white shadow-xl outline-none [border:0]'

	return (
		<div className="about-app-mockup-wrap relative flex w-full min-h-[280px] flex-col justify-center lg:min-h-0">
			{/* Wide: two desktop clips, then mobile carousel in same column */}
			<div
				className={
					isLg && showDesktopPair
						? 'flex w-full max-w-[1000px] flex-col gap-5'
						: 'hidden'
				}
			>
				{DESKTOP_VIDEOS.map((src, i) => (
					<div
						key={src}
						className="overflow-hidden rounded-xl bg-white shadow-xl"
					>
						<video
							ref={el => {
								desktopRefs.current[i] = el
							}}
							className={`w-full ${desktopVideoClass}`}
							src={src}
							muted
							playsInline
							preload="metadata"
							autoPlay
							loop={reduceMotion}
							onEnded={reduceMotion ? undefined : () => handleDesktopEnded(i as 0 | 1)}
							aria-label={`${desktopLabel} ${i + 1} / ${DESKTOP_VIDEOS.length}`}
						/>
					</div>
				))}
			</div>

			{/* Mobile: kontener na pełną szerokość kolumny; samo wideo wyśrodkowane (mx-auto), bez rozciągania */}
			<div className={showMobileCarousel ? 'flex w-full flex-col items-center' : 'hidden'}>
				{!isLg && mobileStaticFallback ? (
					<img
						src={MOBILE_FALLBACK_IMG[locale]}
						alt={mobileLabel}
						className={mobileVideoClass}
						loading="lazy"
						decoding="async"
					/>
				) : (
					MOBILE_VIDEOS.map((src, i) => (
						<video
							key={src}
							ref={el => {
								mobileRefs.current[i] = el
							}}
							className={i === effectiveMobileIndex ? mobileVideoClass : 'hidden'}
							src={src}
							muted
							playsInline
							preload="metadata"
							poster={MOBILE_FALLBACK_IMG[locale]}
							loop={reduceMotion}
							onEnded={reduceMotion ? undefined : handleMobileEnded}
							aria-hidden={i !== effectiveMobileIndex}
							aria-label={`${mobileLabel} ${i + 1} / ${MOBILE_VIDEOS.length}`}
						/>
					))
				)}
				{!reduceMotion && showMobileCarousel && !(!isLg && mobileStaticFallback) && (
					<div className="mt-3 flex justify-center gap-2" aria-hidden>
						{MOBILE_VIDEOS.map((_, i) => (
							<span
								key={i}
								className={`h-1.5 rounded-full transition-all duration-300 ${
									i === mobileIndex ? 'w-6 bg-green-600' : 'w-1.5 bg-gray-300'
								}`}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
