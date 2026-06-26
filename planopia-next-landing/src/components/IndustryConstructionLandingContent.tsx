import Link from 'next/link'
import IndustryConstructionHero from './IndustryConstructionHero'
import {
	IndustryConstructionAiSection,
	IndustryConstructionGallerySection,
} from './IndustryConstructionLazySections'
import { industryConstructionCopy, type IndustryConstructionLocale } from '@/data/industryConstructionCopy'
import { INDUSTRY_CONSTRUCTION_HERO } from '@/data/industryConstructionHeroAssets'
import { LANDING_APP_GALLERY_IMAGES } from '@/data/landingAppGallery'

type Props = { locale: IndustryConstructionLocale }

export default function IndustryConstructionLandingContent({ locale }: Props) {
	const c = industryConstructionCopy[locale]
	const canonical =
		locale === 'pl' ? 'https://planopia.pl/dla-branzy-budowlanej' : 'https://planopia.pl/en/for-construction-industry'
	const registerHref = 'https://app.planopia.pl/team-registration'

	const siteOrigin = 'https://planopia.pl'
	const webPageId = `${canonical}#webpage`
	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': webPageId,
		name: c.heroH1,
		description: c.heroSub,
		url: canonical,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		isPartOf: {
			'@type': 'WebSite',
			'@id': `${siteOrigin}/#website`,
			name: 'Planopia',
			url: siteOrigin,
			publisher: {
				'@type': 'Organization',
				name: 'Planopia',
				url: siteOrigin,
				logo: { '@type': 'ImageObject', url: `${siteOrigin}/img/new-logoplanopia.webp` },
			},
		},
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			width: INDUSTRY_CONSTRUCTION_HERO.width,
			height: INDUSTRY_CONSTRUCTION_HERO.height,
			caption: c.heroH1,
		},
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: siteOrigin,
			image: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			screenshot: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'PLN',
				description:
					locale === 'pl'
						? '30 dni pełnej aplikacji; potem darmowy plan ewidencji do 5 kont lub pakiety płatne'
						: '30-day full trial; then free time tracking (5 accounts) or paid plans',
			},
		},
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Planopia',
				item: locale === 'pl' ? siteOrigin : `${siteOrigin}/en`,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: locale === 'pl' ? 'Budownictwo' : 'Construction',
				item: canonical,
			},
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: c.faqs.map(f => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white overflow-x-hidden">
				<article className="break-words">
					<IndustryConstructionHero locale={locale} />

					<div className="max-w-4xl mx-auto px-4 sm:px-5 pt-8 md:pt-10 pb-12 md:pb-16 flex flex-col gap-10 md:gap-12">
						<section aria-labelledby="problems-heading">
							<h2 id="problems-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5">
								{c.problemsTitle}
							</h2>
							<ul className="list-none space-y-3 m-0 p-0">
								{c.problems.map((p, i) => (
									<li
										key={i}
										className="flex gap-3 rounded-2xl border border-red-100/90 bg-gradient-to-r from-red-50/90 to-white px-4 py-3.5 text-gray-800 shadow-sm ring-1 ring-red-100/40"
									>
										<span className="font-bold text-red-600 shrink-0" aria-hidden>
											!
										</span>
										<span>{p}</span>
									</li>
								))}
							</ul>
						</section>

						<section
							className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/40 p-6 shadow-md ring-1 ring-amber-100/70 md:p-8"
							aria-labelledby="field-crew-heading"
						>
							<h2 id="field-crew-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
								{c.fieldCrewTitle}
							</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{c.fieldCrewLead}</p>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-800">
								{c.fieldCrewBullets.map((b, i) => (
									<li
										key={i}
										className="flex gap-3 rounded-xl border border-amber-100/80 bg-white/80 px-4 py-2.5 shadow-sm"
									>
										<span className="text-amber-700 font-bold shrink-0" aria-hidden>
											✓
										</span>
										<span>{b}</span>
									</li>
								))}
							</ul>
						</section>

						<section
							className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/80 md:p-8"
							aria-labelledby="solution-heading"
						>
							<h2 id="solution-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
								{c.solutionTitle}
							</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{c.solutionIntro}</p>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-700">
								{c.features.map((f, i) => (
									<li
										key={i}
										className="flex gap-3 rounded-xl border border-gray-100 bg-slate-50/60 px-4 py-2.5 text-gray-800 shadow-sm"
									>
										<span className="text-blue-600 font-bold shrink-0" aria-hidden>
											✓
										</span>
										<span>{f}</span>
									</li>
								))}
							</ul>
						</section>

						<IndustryConstructionGallerySection
							locale={locale}
							title={c.galleryTitle}
							images={LANDING_APP_GALLERY_IMAGES}
						/>

						<IndustryConstructionAiSection locale={locale} title={c.aiTitle} bullets={c.aiBullets} />

						<section aria-labelledby="steps-heading">
							<h2 id="steps-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5">
								{c.stepsTitle}
							</h2>
							<ol className="list-none space-y-3 m-0 p-0">
								{c.steps.map((s, i) => (
									<li
										key={i}
										className="flex gap-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/50 to-white px-4 py-3.5 text-gray-800 ring-1 ring-emerald-100/40"
									>
										<div
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold !text-white tabular-nums leading-none"
											aria-hidden
										>
											{i + 1}
										</div>
										<span className="min-w-0 pt-0.5 leading-relaxed">{s}</span>
									</li>
								))}
							</ol>
						</section>

						<section aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-6">
								{c.faqTitle}
							</h2>
							<div className="space-y-4 md:space-y-5">
								{c.faqs.map((f, i) => (
									<div
										key={i}
										className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm ring-1 ring-gray-100/80"
									>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
										<p className="text-gray-700 m-0 leading-relaxed">{f.a}</p>
									</div>
								))}
							</div>
						</section>

						<section className="pb-0" aria-labelledby="industry-landing-cta-h">
							<div className="text-center bg-gradient-to-br from-blue-50 via-white to-emerald-50/90 p-6 sm:p-9 rounded-2xl shadow-md ring-1 ring-blue-100/60">
								<h2
									id="industry-landing-cta-h"
									className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug"
								>
									{c.ctaTitle}
								</h2>
								<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-3xl mx-auto leading-snug sm:leading-relaxed m-0">
									{c.ctaNote}
								</p>
								<a
									href={registerHref}
									className="inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-5 sm:py-4 sm:px-8 shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn text-center max-w-full"
								>
									{c.ctaButton}
								</a>
							</div>
						</section>

						<section
							className="construction-video-card rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-slate-100/70 px-5 py-7 shadow-md ring-1 ring-slate-200/60 md:px-8 md:py-8"
							aria-labelledby="construction-video-teaser"
						>
							<div className="mx-auto flex max-w-2xl flex-col gap-3 md:gap-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{c.videoEyebrow}</p>
								<h2 id="construction-video-teaser" className="text-xl font-bold leading-snug text-gray-900 md:text-2xl">
									{c.videoTitle}
								</h2>
								<p className="text-sm leading-relaxed text-gray-600 md:text-base">{c.videoBody}</p>
								<div className="pt-1">
									<Link
										href={c.videoHref}
										className="construction-solid-btn construction-solid-btn--blue inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold shadow-md transition hover:bg-blue-700 sm:w-auto sm:px-6"
									>
										{c.videoCta}
									</Link>
								</div>
							</div>
						</section>
					</div>
				</article>
			</main>
		</>
	)
}
