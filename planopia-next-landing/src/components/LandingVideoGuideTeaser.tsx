'use client'

import Link from 'next/link'

type Locale = 'pl' | 'en'

const copy: Record<
	Locale,
	{ kicker: string; title: string; description: string; cta: string; href: string; sectionId: string; aria: string }
> = {
	pl: {
		kicker: 'Materiały wideo',
		title: 'Jak korzystać z Planopii?',
		description: 'Krótkie nagrania z aplikacji — krok po kroku, na telefonie i komputerze.',
		cta: 'Instrukcja wideo',
		href: '/blog/instrukcja-wideo-planopia',
		sectionId: 'instrukcja-wideo',
		aria: 'Instrukcja wideo Planopia',
	},
	en: {
		kicker: 'Video guides',
		title: 'How to use Planopia',
		description: 'Short clips from the app — step by step, on phone and desktop.',
		cta: 'Video tutorials',
		href: '/en/blog/video-tutorials',
		sectionId: 'video-tutorials',
		aria: 'Planopia video tutorials',
	},
}

export default function LandingVideoGuideTeaser({ locale }: { locale: Locale }) {
	const t = copy[locale]
	return (
		<section
			id={t.sectionId}
			className="landing-video-guide-teaser py-12 px-4 bg-white border-t border-gray-100"
			aria-label={t.aria}>
			<div className="max-w-7xl mx-auto">
				<div className="landing-video-guide-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl border px-6 py-8 sm:px-8 sm:py-9">
					<div className="min-w-0 flex-1">
						<p className="landing-section-eyebrow mb-2">{t.kicker}</p>
						<h2 className="landing-video-guide-title text-2xl sm:text-3xl font-bold">{t.title}</h2>
						<p className="landing-video-guide-description mt-2 text-base leading-relaxed max-w-2xl">{t.description}</p>
					</div>
					<div className="shrink-0 sm:pl-4">
						<Link
							href={t.href}
							className="landing-video-guide-teaser-cta inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-6 py-3.5 transition shadow-sm w-full sm:w-auto min-h-[48px]">
							<svg
								className="w-5 h-5 shrink-0 opacity-95"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{t.cta}
						</Link>
					</div>
				</div>
			</div>
		</section>
	)
}
