'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

type Labels = { region: string; prev: string; next: string; goTo: string }

/**
 * Karuzela opinii: jedna karta naraz, samo przełączanie co `interval` ms, kropki, strzałki i przesunięcie palcem.
 * Wszystkie karty są w HTML od początku (indeksują się), ukryte są tylko wizualnie i dla czytników.
 * Pauza przy najechaniu, fokusie i preferencji ograniczonego ruchu.
 */
export default function TestimonialsCarousel({ children, labels, interval = 8000 }: { children: ReactNode; labels: Labels; interval?: number }) {
	const slides = Children.toArray(children)
	const count = slides.length
	const [index, setIndex] = useState(0)
	const [paused, setPaused] = useState(false)
	const reducedMotion = useRef(false)
	const touchStartX = useRef<number | null>(null)

	useEffect(() => {
		reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	}, [])

	// Licznik startuje od nowa po każdej zmianie slajdu — ręczne przełączenie nie skraca czasu kolejnej karty
	useEffect(() => {
		if (count < 2 || paused || reducedMotion.current) return
		const timer = window.setTimeout(() => setIndex(i => (i + 1) % count), interval)
		return () => window.clearTimeout(timer)
	}, [index, paused, count, interval])

	const go = (i: number) => setIndex((i + count) % count)

	return (
		<div
			className="lt-carousel"
			role="region"
			aria-roledescription="carousel"
			aria-label={labels.region}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={e => {
				if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
			}}
		>
			<div
				className="lt-carousel__viewport"
				onTouchStart={e => {
					touchStartX.current = e.touches[0].clientX
				}}
				onTouchEnd={e => {
					if (touchStartX.current === null) return
					const dx = e.changedTouches[0].clientX - touchStartX.current
					touchStartX.current = null
					if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
				}}
			>
				<div className="lt-carousel__track" style={{ transform: `translateX(calc(${-index} * (100% + 4rem)))` }}>
					{slides.map((slide, i) => (
						<div
							className="lt-carousel__slide"
							key={i}
							role="group"
							aria-roledescription="slide"
							aria-label={`${i + 1} / ${count}`}
							aria-hidden={i !== index}
						>
							{slide}
						</div>
					))}
				</div>
			</div>

			{count > 1 ? (
				<div className="lt-carousel__controls">
					<button type="button" className="lt-carousel__arrow" onClick={() => go(index - 1)} aria-label={labels.prev}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
					<div className="lt-carousel__dots">
						{slides.map((_, i) => (
							<button
								type="button"
								key={i}
								className={`lt-carousel__dot${i === index ? ' is-active' : ''}`}
								onClick={() => go(i)}
								aria-label={`${labels.goTo} ${i + 1}`}
								aria-current={i === index ? 'true' : undefined}
							/>
						))}
					</div>
					<button type="button" className="lt-carousel__arrow" onClick={() => go(index + 1)} aria-label={labels.next}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
				</div>
			) : null}
		</div>
	)
}
