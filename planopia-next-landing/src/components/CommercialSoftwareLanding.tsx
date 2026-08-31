import Link from 'next/link'
import Image from 'next/image'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import { LANDING_APP_GALLERY_IMAGES } from '../data/landingAppGallery'
import {
	CANONICAL,
	COPY,
	PRICING_HREF_EN,
	PRICING_HREF_PL,
	REGISTER_HREF,
	type Locale,
	type Variant,
} from '../data/commercialLandingCopy'


type Props = { variant: Variant; locale: Locale }

export default function CommercialSoftwareLanding({ variant, locale }: Props) {
	const c = COPY[variant][locale]
	const canonical = CANONICAL[variant][locale]
	const pricingHref = locale === 'pl' ? PRICING_HREF_PL : PRICING_HREF_EN
	const siteOrigin = 'https://planopia.pl'

	// Cena idzie z danych wariantu, nie z warunku — inaczej nowa strona po cichu
	// dziedziczylaby cene 0 zl z galezi `else`, co dla modulu platnego byloby nieprawda.
	const offer = {
		'@type': 'Offer',
		price: c.offerPrice,
		priceCurrency: 'PLN',
		description: c.offerDescription,
	}

	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': `${canonical}#webpage`,
		name: c.heroH1,
		description: c.heroSub,
		url: canonical,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		isPartOf: {
			'@type': 'WebSite',
			name: 'Planopia',
			url: siteOrigin,
			publisher: {
				'@type': 'Organization',
				name: 'Planopia',
				url: siteOrigin,
				logo: { '@type': 'ImageObject', url: `${siteOrigin}/img/new-logoplanopia.webp` },
			},
		},
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: siteOrigin,
			image: `${siteOrigin}${c.heroImageSrc}`,
			offers: offer,
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
			{ '@type': 'ListItem', position: 2, name: c.breadcrumbName, item: canonical },
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: c.faqs.map((f) => ({
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
					<section
						className="px-4 pt-5 pb-10 md:py-12 bg-gradient-to-r from-blue-50 to-white"
						aria-labelledby="commercial-hero-heading"
					>
						<div className="max-w-7xl mx-auto">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
								<header id="commercial-hero-heading" className="order-2 md:order-1 min-w-0 text-left">
									<p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">{c.eyebrow}</p>
									<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{c.heroH1}</h1>
									<p className="text-lg text-gray-600 max-w-3xl">{c.heroSub}</p>
									<div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
										<a
											href={REGISTER_HREF}
											className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-center text-base font-semibold shadow-md transition hover:bg-green-700 white-text-btn"
										>
											{c.ctaButton}
										</a>
										<Link
											href={c.secondaryHref}
											className="inline-flex min-h-[48px] items-center justify-start px-1 text-left text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline sm:px-2"
										>
											{c.secondaryLabel}
										</Link>
									</div>
								</header>
								<div className="order-1 md:order-2 min-w-0">
									<Image
										src={c.heroImageSrc}
										alt={c.heroImageAlt}
										className="rounded-xl w-full h-auto aspect-[3/2] object-cover"
										priority
										sizes="(max-width: 767px) calc(100vw - 2rem), 50vw"
										width={800}
										height={533}
									/>
								</div>
							</div>
						</div>
					</section>

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
							className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/80 md:p-8"
							aria-labelledby="features-heading"
						>
							<h2 id="features-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
								{c.featuresTitle}
							</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{c.featuresIntro}</p>
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

						<div id="commercial-gallery" className="scroll-mt-24 rounded-2xl border border-gray-100/90 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-7 shadow-sm ring-1 ring-gray-100/70">
							<LandingAppScreenshotGallery
								locale={locale}
								title={c.galleryTitle}
								images={LANDING_APP_GALLERY_IMAGES}
								sectionClassName="my-0"
							/>
						</div>

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

						<section
							className="rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/90 via-white to-emerald-50/40 p-6 shadow-md ring-1 ring-blue-100/60 md:p-8"
							aria-labelledby="pricing-heading"
						>
							<h2 id="pricing-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
								{c.pricingTitle}
							</h2>
							<p className="text-gray-700 mb-5 leading-relaxed">{c.pricingIntro}</p>
							<ul className="list-none space-y-2.5 m-0 p-0 text-gray-800">
								{c.pricingBullets.map((b, i) => (
									<li key={i} className="flex gap-3 rounded-xl border border-blue-100/70 bg-white/80 px-4 py-2.5 shadow-sm">
										<span className="text-emerald-600 font-bold shrink-0" aria-hidden>
											✓
										</span>
										<span>{b}</span>
									</li>
								))}
							</ul>
							<p className="text-sm text-gray-500 mt-4 leading-relaxed">{c.pricingNote}</p>
							<div className="mt-5">
								<Link
									href={pricingHref}
									className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
								>
									{c.pricingCtaLabel}
								</Link>
							</div>
						</section>

						<section aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-6">
								{c.faqTitle}
							</h2>
							<div className="space-y-4 md:space-y-5">
								{c.faqs.map((f, i) => (
									<div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm ring-1 ring-gray-100/80">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
										<p className="text-gray-700 m-0 leading-relaxed">{f.a}</p>
									</div>
								))}
							</div>
						</section>

						<section aria-labelledby="commercial-cta-heading">
							<div className="text-center bg-gradient-to-br from-blue-50 via-white to-emerald-50/90 p-6 sm:p-9 rounded-2xl shadow-md ring-1 ring-blue-100/60">
								<h2
									id="commercial-cta-heading"
									className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug"
								>
									{c.ctaTitle}
								</h2>
								<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-3xl mx-auto leading-snug sm:leading-relaxed m-0">
									{c.ctaNote}
								</p>
								<a
									href={REGISTER_HREF}
									className="inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-5 sm:py-4 sm:px-8 shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn text-center max-w-full"
								>
									{c.ctaButton}
								</a>
							</div>
						</section>

						<nav className="border-t border-slate-200 pt-8" aria-label={c.relatedTitle}>
							<p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{c.relatedTitle}</p>
							<ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
								{c.related.map((r) => (
									<li key={r.href}>
										<Link
											href={r.href}
											className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 transition"
										>
											{r.label}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</div>
				</article>
			</main>
		</>
	)
}
