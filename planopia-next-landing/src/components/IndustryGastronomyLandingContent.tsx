import Link from 'next/link'
import IndustryGastronomyHero from './IndustryGastronomyHero'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import { industryGastronomyCopy as copy } from '@/data/industryGastronomyCopy'
import { LANDING_APP_GALLERY_IMAGES } from '@/data/landingAppGallery'

const canonical = 'https://planopia.pl/dla-gastronomii'
const registerHref = 'https://app.planopia.pl/team-registration'

export default function IndustryGastronomyLandingContent() {
	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': `${canonical}#webpage`,
		name: copy.heroH1,
		description: copy.heroSub,
		url: canonical,
		inLanguage: 'pl-PL',
		isPartOf: {
			'@type': 'WebSite',
			'@id': 'https://planopia.pl/#website',
			name: 'Planopia',
			url: 'https://planopia.pl',
		},
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: 'https://planopia.pl',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'PLN',
				description: '30 dni pełnej aplikacji; potem darmowa ewidencja do 5 aktywnych kont lub pakiety płatne',
			},
		},
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
			{ '@type': 'ListItem', position: 2, name: 'Gastronomia', item: canonical },
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: copy.faqs.map(faq => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white overflow-x-hidden">
				<article className="break-words">
					<IndustryGastronomyHero />
					<div className="max-w-4xl mx-auto px-4 sm:px-5 pt-8 md:pt-10 pb-12 md:pb-16 flex flex-col gap-10 md:gap-12">
						<section aria-labelledby="gastronomy-problems-heading">
							<h2 id="gastronomy-problems-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5">
								{copy.problemsTitle}
							</h2>
							<ul className="list-none space-y-3 m-0 p-0">
								{copy.problems.map(problem => (
									<li key={problem} className="flex gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-gray-800 shadow-sm">
										<span className="font-bold text-red-600 shrink-0" aria-hidden>!</span>
										<span>{problem}</span>
									</li>
								))}
							</ul>
						</section>

						<section className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm md:p-8" aria-labelledby="gastronomy-team-heading">
							<h2 id="gastronomy-team-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">{copy.teamTitle}</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{copy.teamLead}</p>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-800">
								{copy.teamBullets.map(item => (
									<li key={item} className="flex gap-3 rounded-lg border border-amber-100 bg-white/85 px-4 py-2.5 shadow-sm">
										<span className="text-amber-700 font-bold shrink-0" aria-hidden>✓</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</section>

						<section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8" aria-labelledby="gastronomy-solution-heading">
							<h2 id="gastronomy-solution-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">{copy.solutionTitle}</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{copy.solutionIntro}</p>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-700">
								{copy.features.map(feature => (
									<li key={feature} className="flex gap-3 rounded-lg border border-gray-100 bg-slate-50/70 px-4 py-2.5 text-gray-800">
										<span className="text-blue-600 font-bold shrink-0" aria-hidden>✓</span>
										<span>{feature}</span>
									</li>
								))}
							</ul>
						</section>

						<div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 shadow-sm md:p-7">
							<LandingAppScreenshotGallery locale="pl" title={copy.galleryTitle} images={LANDING_APP_GALLERY_IMAGES} sectionClassName="my-0" />
						</div>

						<section className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-7 shadow-sm md:px-8" aria-labelledby="gastronomy-ai-heading">
							<h2 id="gastronomy-ai-heading" className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{copy.aiTitle}</h2>
							<div className="mb-5 overflow-hidden rounded-xl border border-indigo-200/70 bg-white shadow-sm">
								<ConstructionAiAssistantScreenshot locale="pl" />
							</div>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-700">
								{copy.aiBullets.map(item => (
									<li key={item} className="flex gap-3 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
										<span className="text-indigo-600 font-bold shrink-0" aria-hidden>✓</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</section>

						<section aria-labelledby="gastronomy-steps-heading">
							<h2 id="gastronomy-steps-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5">{copy.stepsTitle}</h2>
							<ol className="list-none space-y-3 m-0 p-0">
								{copy.steps.map((step, index) => (
									<li key={step} className="flex gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-gray-800">
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold !text-white" aria-hidden>{index + 1}</span>
										<span className="min-w-0 pt-0.5 leading-relaxed">{step}</span>
									</li>
								))}
							</ol>
						</section>

						<section aria-labelledby="gastronomy-faq-heading">
							<h2 id="gastronomy-faq-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-6">{copy.faqTitle}</h2>
							<div className="space-y-4">
								{copy.faqs.map(faq => (
									<div key={faq.q} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
										<p className="text-gray-700 m-0 leading-relaxed">{faq.a}</p>
									</div>
								))}
							</div>
						</section>

						<section aria-labelledby="gastronomy-cta-heading">
							<div className="text-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 sm:p-9 rounded-xl shadow-md ring-1 ring-blue-100">
								<h2 id="gastronomy-cta-heading" className="industry-cta-heading w-full text-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">{copy.ctaTitle}</h2>
								<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 max-w-3xl mx-auto leading-relaxed">{copy.ctaNote}</p>
								<a href={registerHref} className="inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-5 sm:py-4 sm:px-8 shadow-lg hover:bg-green-700 transition white-text-btn text-center">
									{copy.ctaButton}
								</a>
							</div>
						</section>

						<section className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-7 shadow-sm md:px-8" aria-labelledby="gastronomy-guide-heading">
							<p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Praktyczny poradnik</p>
							<h2 id="gastronomy-guide-heading" className="mt-2 text-xl font-bold leading-snug text-gray-900 md:text-2xl">Jak ułożyć grafik pracy w restauracji?</h2>
							<p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">Proces krok po kroku: dostępność zespołu, obsada sali i kuchni, publikacja zmian, zastępstwa oraz zamknięcie miesiąca.</p>
							<Link href="/blog/jak-ulozyc-grafik-pracy-w-restauracji" className="construction-solid-btn construction-solid-btn--blue mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold shadow-md transition hover:bg-blue-700">
								Czytaj poradnik
							</Link>
						</section>
					</div>
				</article>
			</main>
		</>
	)
}
