'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
	LANDING_SHOWCASE_DESKTOP_VIDEOS,
	LANDING_SHOWCASE_MOBILE_FALLBACK,
	LANDING_SHOWCASE_MOBILE_VIDEOS,
} from '@/data/landingShowcaseVideos'

/** Timer na górze, podsumowanie AI pod spodem (zamiana względem wcześniejszej kolejności). */
const DESKTOP_VIDEOS = LANDING_SHOWCASE_DESKTOP_VIDEOS

const MOBILE_VIDEOS = LANDING_SHOWCASE_MOBILE_VIDEOS

/** Jak wcześniej w sekcji „O aplikacji” — gdy na telefonie wideo nie wystartuje (np. oszczędzanie baterii). */
const MOBILE_FALLBACK_IMG = LANDING_SHOWCASE_MOBILE_FALLBACK

/**
 * Rzeczywiste proporcje materiałów (odczytane z nagłówków MP4).
 * Trzymamy je jako aspect-ratio na KAŻDYM pudełku, żeby przeglądarka znała wysokość
 * zanim cokolwiek się wczyta. Bez tego box ma zerową wysokość do czasu pobrania
 * metadanych i cała sekcja pod spodem podskakuje.
 */
const DESKTOP_RATIO = '1902 / 912'
const MOBILE_RATIO = '358 / 780'

type Props = { locale: 'pl' | 'en' }

export default function AboutAppShowcaseVideos({ locale }: Props) {
	const wrapRef = useRef<HTMLDivElement>(null)
	const [isLg, setIsLg] = useState(false)
	const [inView, setInView] = useState(false)
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

	useEffect(() => {
		const el = wrapRef.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: '200px 0px', threshold: 0 }
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])

	const desktopLabel =
		locale === 'pl' ? 'Planopia — podgląd aplikacji na komputerze' : 'Planopia — desktop preview'
	const mobileLabel =
		locale === 'pl' ? 'Planopia — podgląd na telefonie' : 'Planopia — mobile preview'

	const handleDesktopEnded = useCallback(
		(index: 0 | 1) => {
			if (reduceMotion || !isLg || !inView) return
			desktopEndedRef.current[index] = true
			if (desktopEndedRef.current[0] && desktopEndedRef.current[1]) {
				desktopEndedRef.current = [false, false]
				setShowDesktopPair(false)
				setMobileIndex(0)
			}
		},
		[reduceMotion, isLg, inView]
	)

	const handleMobileEnded = useCallback(() => {
		if (reduceMotion || !inView) return
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
	}, [reduceMotion, isLg, inView])

	const showMobileCarousel = !isLg || (isLg && !showDesktopPair)
	const effectiveMobileIndex = reduceMotion ? 0 : mobileIndex
	/** Klipy desktop maja sens tylko na szerokim ukladzie i tylko gdy sekcja jest w poblizu. */
	const desktopActive = isLg && showDesktopPair && inView
	const mobileActive = inView && showMobileCarousel && !(!isLg && mobileStaticFallback)

	// Para desktop: start / restart, gdy faza jest aktywna. Elementy pozostaja w DOM,
	// wiec wyjscie z viewportu tylko zatrzymuje odtwarzanie — nic sie nie przebudowuje.
	useEffect(() => {
		if (!desktopActive) {
			desktopRefs.current.forEach(el => el?.pause())
			return
		}
		desktopEndedRef.current = [false, false]
		desktopRefs.current.forEach(el => {
			if (!el) return
			el.currentTime = 0
			el.loop = reduceMotion
			const p = el.play()
			if (p && typeof p.catch === 'function') p.catch(() => {})
		})
	}, [desktopActive, reduceMotion])

	// Po zmianie szerokości (np. obrót telefonu) ponów próbę wideo zamiast trzymać stary fallback
	useEffect(() => {
		setMobileStaticFallback(false)
	}, [isLg])

	// Klipy mobilne: gra aktywny, reszta zapauzowana.
	useEffect(() => {
		if (!mobileActive) {
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
			el.loop = reduceMotion
			const p = el.play()
			if (p && typeof p.then === 'function') {
				p.then(() => {
					if (!isLg) setMobileStaticFallback(false)
				}).catch(() => {
					if (!isLg) setMobileStaticFallback(true)
				})
			}
		})
	}, [mobileActive, effectiveMobileIndex, reduceMotion, isLg])

	const mediaClass = 'block h-full w-full bg-white object-contain object-center outline-none [border:0]'

	return (
		<div
			ref={wrapRef}
			className="about-app-mockup-wrap relative flex w-full flex-col justify-center"
		>
			{/*
			 * Scena desktop wyznacza wysokosc calej sekcji na szerokim ukladzie.
			 * Karuzela telefonowa jest nad nia pozycjonowana absolutnie, wiec przelaczanie
			 * faz zmienia wylacznie widocznosc — uklad strony nie drgnie.
			 */}
			<div className="relative w-full max-w-[1000px] lg:mx-0">
				<div
					className={[
						'flex w-full flex-col gap-5',
						isLg ? 'transition-opacity duration-500' : 'invisible h-0 overflow-hidden',
						// Para desktop zostaje w ukladzie (wyznacza wysokosc sceny), ale gasnie,
						// gdy na wierzchu pokazuje sie telefon — inaczej przebijalaby sie dookola niego.
						isLg && !showDesktopPair ? 'opacity-0' : 'opacity-100',
					].join(' ')}
					aria-hidden={isLg && !showDesktopPair}
				>
					{DESKTOP_VIDEOS.map((src, i) => (
						<div
							key={src}
							className="overflow-hidden rounded-xl bg-white shadow-xl"
							style={{ aspectRatio: DESKTOP_RATIO }}
						>
							{/*
							 * Brak autoPlay i preload="none": 43 MB na klip nie zaczyna sie sciagac,
							 * dopoki sekcja nie jest w poblizu — odtwarzanie startuje z efektu.
							 */}
							<video
								ref={el => {
									desktopRefs.current[i] = el
								}}
								className={mediaClass}
								src={src}
								muted
								playsInline
								preload="none"
								poster={MOBILE_FALLBACK_IMG[locale]}
								loop={reduceMotion}
								onEnded={reduceMotion ? undefined : () => handleDesktopEnded(i as 0 | 1)}
								aria-label={`${desktopLabel} ${i + 1} / ${DESKTOP_VIDEOS.length}`}
							/>
						</div>
					))}
				</div>

				{/* Telefon: w toku na malych ekranach, nakladka na duzych */}
				<div
					className={[
						'flex w-full flex-col items-center',
						isLg ? 'absolute inset-0 justify-center transition-opacity duration-500' : '',
						isLg && !showMobileCarousel ? 'pointer-events-none opacity-0' : 'opacity-100',
					].join(' ')}
					aria-hidden={isLg && !showMobileCarousel}
				>
					<div
						className="relative mx-auto w-auto max-h-[600px] overflow-hidden rounded-xl bg-white shadow-xl"
						style={{ aspectRatio: MOBILE_RATIO, height: 'min(600px, 70vh)' }}
					>
						{!isLg && mobileStaticFallback ? (
							<img
								src={MOBILE_FALLBACK_IMG[locale]}
								alt={mobileLabel}
								className={mediaClass}
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
									className={`${mediaClass} ${i === effectiveMobileIndex ? '' : 'hidden'}`}
									src={src}
									muted
									playsInline
									preload="none"
									poster={MOBILE_FALLBACK_IMG[locale]}
									loop={reduceMotion}
									onEnded={reduceMotion ? undefined : handleMobileEnded}
									aria-hidden={i !== effectiveMobileIndex}
									aria-label={`${mobileLabel} ${i + 1} / ${MOBILE_VIDEOS.length}`}
								/>
							))
						)}
					</div>

					{/* Kropki maja stala wysokosc, zeby ich pojawienie sie niczego nie przesuwalo */}
					<div className="mt-3 flex h-1.5 justify-center gap-2" aria-hidden>
						{!reduceMotion &&
							!(!isLg && mobileStaticFallback) &&
							MOBILE_VIDEOS.map((_, i) => (
								<span
									key={i}
									className={`h-1.5 rounded-full transition-all duration-300 ${
										i === mobileIndex ? 'w-6 bg-green-600' : 'w-1.5 bg-gray-300'
									}`}
								/>
							))}
					</div>
				</div>
			</div>
		</div>
	)
}
