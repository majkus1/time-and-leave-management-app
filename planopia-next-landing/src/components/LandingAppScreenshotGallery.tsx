'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'
import type { LandingGalleryImage } from '../data/landingAppGallery'

type Props = {
	locale: 'pl' | 'en'
	title: string
	images?: LandingGalleryImage[]
	/** Domyślnie my-10 md:my-12 — ustaw np. my-0 w osadzonej karcie */
	sectionClassName?: string
}

export default function LandingAppScreenshotGallery({
	locale,
	title,
	images = [],
	sectionClassName = 'my-10 md:my-12',
}: Props) {
	const pathname = usePathname()
	const [openIndex, setOpenIndex] = useState<number | null>(null)

	const close = useCallback(() => setOpenIndex(null), [])

	useEffect(() => {
		close()
	}, [pathname, close])

	useEffect(() => {
		if (openIndex === null) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close()
		}
		document.addEventListener('keydown', onKey)
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', onKey)
			resetBodyScrollLock()
		}
	}, [openIndex, close])

	if (images.length === 0) return null

	return (
		<section className={`landing-app-gallery ${sectionClassName}`} aria-labelledby="landing-gallery-heading">
			<h2 id="landing-gallery-heading" className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
				{title}
			</h2>
			<p className="text-sm text-gray-600 mb-4">
				{locale === 'pl' ? 'Kliknij miniaturę, aby powiększyć.' : 'Tap a thumbnail to enlarge.'}
			</p>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
				{images.map((im, i) => {
					const alt = locale === 'pl' ? im.altPl : im.altEn
					const src = locale === 'pl' ? im.srcPl : im.srcEn
					return (
						<button
							key={`${im.srcPl}-${im.srcEn}-${i}`}
							type="button"
							className="landing-app-gallery__thumb group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm transition hover:ring-2 hover:ring-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
							onClick={() => setOpenIndex(i)}
							aria-label={locale === 'pl' ? `Powiększ: ${alt}` : `Enlarge: ${alt}`}>
							<img
								src={src}
								alt=""
								className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
								loading="lazy"
							/>
							<div
								className="landing-app-gallery__caption-wrap pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/88 from-[8%] via-45% to-transparent px-2.5 pb-3 pt-14 text-left sm:px-3 sm:pb-3.5 sm:pt-16"
								aria-hidden>
								<span className="landing-app-gallery__caption block text-sm font-semibold leading-snug !text-white line-clamp-2 [text-shadow:0_2px_8px_rgba(0,0,0,.95),0_1px_2px_rgba(0,0,0,.9)]">
									{alt}
								</span>
							</div>
						</button>
					)
				})}
			</div>

			{openIndex !== null && (
				<div
					className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 p-4 md:p-8"
					onClick={close}
					role="dialog"
					aria-modal="true"
					aria-label={locale === 'pl' ? 'Powiększone zdjęcie' : 'Enlarged screenshot'}>
					<button
						type="button"
						className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-light text-white transition hover:bg-white/20"
						onClick={close}
						aria-label={locale === 'pl' ? 'Zamknij' : 'Close'}>
						×
					</button>
					<img
						src={locale === 'pl' ? images[openIndex].srcPl : images[openIndex].srcEn}
						alt={locale === 'pl' ? images[openIndex].altPl : images[openIndex].altEn}
						className="max-h-[min(92vh,900px)] max-w-full rounded-lg object-contain shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</section>
	)
}
