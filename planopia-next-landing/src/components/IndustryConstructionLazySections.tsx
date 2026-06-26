'use client'

import dynamic from 'next/dynamic'
import type { LandingGalleryImage } from '@/data/landingAppGallery'

const LandingAppScreenshotGallery = dynamic(() => import('./LandingAppScreenshotGallery'), {
	loading: () => <div className="min-h-[280px] w-full rounded-xl bg-gray-100/80" aria-hidden />,
})

const ConstructionAiAssistantScreenshot = dynamic(() => import('./ConstructionAiAssistantScreenshot'), {
	loading: () => <div className="aspect-[3/2] w-full rounded-xl bg-slate-100" aria-hidden />,
})

type Locale = 'pl' | 'en'

export function IndustryConstructionGallerySection({
	locale,
	title,
	images,
}: {
	locale: Locale
	title: string
	images: LandingGalleryImage[]
}) {
	return (
		<div className="rounded-2xl border border-gray-100/90 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-7 shadow-sm ring-1 ring-gray-100/70">
			<LandingAppScreenshotGallery locale={locale} title={title} images={images} sectionClassName="my-0" />
		</div>
	)
}

export function IndustryConstructionAiSection({
	locale,
	title,
	bullets,
}: {
	locale: Locale
	title: string
	bullets: string[]
}) {
	return (
		<section
			className="rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/40 px-5 py-7 shadow-md ring-1 ring-indigo-100/50 md:px-8 md:py-8 overflow-hidden"
			aria-labelledby="ai-heading"
		>
			<h2 id="ai-heading" className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
				{title}
			</h2>
			<div className="mb-5 overflow-hidden rounded-xl border border-indigo-200/70 bg-white shadow-md ring-1 ring-indigo-100/40">
				<ConstructionAiAssistantScreenshot locale={locale} />
			</div>
			<ul className="list-none space-y-2.5 m-0 p-0 text-gray-700">
				{bullets.map((b, i) => (
					<li key={i} className="flex gap-3 rounded-lg border border-indigo-100/50 bg-white/70 px-3 py-2">
						<span className="text-indigo-600 font-bold shrink-0" aria-hidden>
							✓
						</span>
						<span>{b}</span>
					</li>
				))}
			</ul>
		</section>
	)
}
