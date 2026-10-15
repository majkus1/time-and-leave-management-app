import Link from 'next/link'
import './productLanding/productLanding.css'
import CommercialHighlight from './CommercialHighlight'
import { Arrow, BrowserShot, Check, HeroTitle, PhoneShot, splitFeature, type Shot } from './productLanding/parts'
import { productShots } from '../data/productShots'
import {
	CANONICAL,
	COPY,
	PRICING_HREF_EN,
	PRICING_HREF_PL,
	REGISTER_HREF,
	UI,
	type Copy,
	type Locale,
	type Variant,
} from '../data/commercialLandingCopy'
import { LANDING_TRIAL_DAYS, landingTrial } from '../data/landingPlanPricing'

type Props = { variant: Variant; locale: Locale }

function facts(c: Copy, locale: Locale) {
	const t = UI[locale]
	const free = c.offerPrice === '0'
	return [
		{ value: `${LANDING_TRIAL_DAYS} ${t.factDays}`, label: t.factTrial },
		free
			? { value: t.factFreeValue, label: t.factFreeLabel(landingTrial.maxUsers) }
			: { value: t.factFromValue(c.offerPrice), label: t.factFromLabel },
		{ value: 'PDF + Excel', label: t.factExport },
		{ value: t.factMobileValue, label: t.factMobileLabel },
	]
}

export default function CommercialSoftwareLanding({ variant, locale }: Props) {
	const c = COPY[variant][locale]
	const t = UI[locale]
	const canonical = CANONICAL[variant][locale]
	const pricingHref = locale === 'pl' ? PRICING_HREF_PL : PRICING_HREF_EN
	const siteOrigin = 'https://planopia.pl'
// Prawdziwe zrzuty modułu: pierwszy w hero, reszta w galerii
	const { shots, phone } = productShots(variant, locale)
	const heroShot: Shot = shots[0] ?? { src: c.heroImageSrc, alt: c.heroImageAlt, caption: '', width: 800, height: 533 }
	const galleryShots = shots.slice(1)

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
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: siteOrigin,
			image: `${siteOrigin}${heroShot.src}`,
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

			<main className="pdl">
				<article>
					{/* Hero */}
					<section className="pdl-hero" aria-labelledby="commercial-hero-heading">
						<div className="pdl-wrap pdl-hero__grid">
							<header id="commercial-hero-heading" className="pdl-hero__copy">
								{c.heroBadge ? (
									<a href={c.heroBadge.href} className="pdl-badge">
										<span className="pdl-badge__dot" />
										{c.heroBadge.label}
										<Arrow />
									</a>
								) : null}
								<p className="pdl-pill">
									<span className="pdl-dot" />
									{c.eyebrow}
								</p>
								<HeroTitle text={c.heroH1} />
								<p className="pdl-hero__lead">{c.heroSub}</p>
								<div className="pdl-hero__ctas">
									<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary">
										{c.ctaButton}
										<Arrow />
									</a>
									<Link href={c.secondaryHref} className="pdl-btn pdl-btn--ghost">
										{c.secondaryLabel}
									</Link>
								</div>
								<ul className="pdl-hero__checks">
									{t.heroChecks.map(item => (
										<li key={item}>
											<Check size={16} />
											{item}
										</li>
									))}
								</ul>
							</header>
							<div className={`pdl-hero__visual${phone ? ' pdl-hero__visual--phone' : ''}`}>
								<BrowserShot shot={heroShot} priority url="app.planopia.pl" />
								{phone ? <PhoneShot shot={phone} /> : null}
							</div>
						</div>
					</section>

					{/* Fakty: próba, cena, eksport, telefon */}
					{/* Pod paskiem faktów od razu ciemna sekcja „Nowość” — tło dociągnięte, żeby nie było białej szczeliny */}
					<section className={`pdl-facts${c.highlight ? ' pdl-facts--dark' : ''}`} aria-label={t.factsLabel}>
						<div className="pdl-wrap">
							<dl className="pdl-facts__grid">
								{facts(c, locale).map(f => (
									<div key={f.label} className="pdl-facts__item">
										<dt className="pdl-facts__value">{f.value}</dt>
										<dd className="pdl-facts__label">{f.label}</dd>
									</div>
								))}
							</dl>
						</div>
					</section>

					{c.highlight ? <CommercialHighlight highlight={c.highlight} /> : null}

					{/* Problem */}
					<section className="pdl-section pdl-section--paper" aria-labelledby="problems-heading">
						<div className="pdl-wrap pdl-split">
							<div>
								<p className="pdl-eyebrow">{t.eyebrowProblem}</p>
								<h2 id="problems-heading" className="pdl-h2">
									{c.problemsTitle}
								</h2>
							</div>
							<ol className="pdl-problems">
								{c.problems.map((p, i) => (
									<li key={p}>
										<span className="pdl-problems__num">{String(i + 1).padStart(2, '0')}</span>
										<p className="pdl-problems__text">{p}</p>
									</li>
								))}
							</ol>
						</div>
					</section>

					{/* Funkcje */}
					<section className="pdl-section" aria-labelledby="features-heading">
						<div className="pdl-wrap">
							<div className="pdl-head">
								<p className="pdl-eyebrow">{t.eyebrowFeatures}</p>
								<h2 id="features-heading" className="pdl-h2">
									{c.featuresTitle}
								</h2>
								<p className="pdl-lead">{c.featuresIntro}</p>
							</div>
							<ul className="pdl-features">
								{c.features.map(f => {
									const { title, text } = splitFeature(f)
									return (
										<li key={f} className="pdl-feature">
											<span className="pdl-feature__icon">
												<Check />
											</span>
											{title ? <h3 className="pdl-feature__title">{title}</h3> : null}
											<p className="pdl-feature__text">{text}</p>
										</li>
									)
								})}
							</ul>
						</div>
					</section>

					{/* Zrzuty z aplikacji */}
					<section id="commercial-gallery" className="pdl-section pdl-section--dark" aria-labelledby="gallery-heading">
						<div className="pdl-wrap">
							<div className="pdl-head">
								<p className="pdl-eyebrow">{t.eyebrowGallery}</p>
								<h2 id="gallery-heading" className="pdl-h2">
									{c.galleryTitle}
								</h2>
							</div>
							{galleryShots.length ? (
								<div className="pdl-gallery">
									{galleryShots.map(s => (
										<figure key={s.src} className="pdl-gallery__item">
											<BrowserShot shot={s} url="app.planopia.pl" />
											{s.caption ? <figcaption className="pdl-gallery__caption">{s.caption}</figcaption> : null}
										</figure>
									))}
								</div>
							) : (
								<div className="pdl-gallery pdl-gallery--single">
									<figure className="pdl-gallery__item">
										<BrowserShot shot={heroShot} url="app.planopia.pl" />
									</figure>
								</div>
							)}
						</div>
					</section>

					{/* Jak zacząć */}
					<section className="pdl-section pdl-section--paper" aria-labelledby="steps-heading">
						<div className="pdl-wrap">
							<div className="pdl-head">
								<p className="pdl-eyebrow">{t.eyebrowSteps}</p>
								<h2 id="steps-heading" className="pdl-h2">
									{c.stepsTitle}
								</h2>
							</div>
							<ol className="pdl-steps">
								{c.steps.map((s, i) => (
									<li key={s} className="pdl-step">
										<span className="pdl-step__num">{String(i + 1).padStart(2, '0')}</span>
										<p className="pdl-step__text">{s}</p>
									</li>
								))}
							</ol>
						</div>
					</section>

					{/* Cennik */}
					<section className="pdl-section" aria-labelledby="pricing-heading">
						<div className="pdl-wrap pdl-pricing">
							<div>
								<p className="pdl-eyebrow">{t.eyebrowPricing}</p>
								<h2 id="pricing-heading" className="pdl-h2">
									{c.pricingTitle}
								</h2>
								<p className="pdl-lead">{c.pricingIntro}</p>
								<Link href={pricingHref} className="pdl-link">
									{c.pricingCtaLabel}
									<Arrow />
								</Link>
							</div>
							<div className="pdl-pricing__card">
								<ul className="pdl-pricing__list">
									{c.pricingBullets.map(b => (
										<li key={b}>
											<span className="pdl-pricing__icon">
												<Check size={14} />
											</span>
											<span>{b}</span>
										</li>
									))}
								</ul>
								<p className="pdl-pricing__note">{c.pricingNote}</p>
							</div>
						</div>
					</section>

					{/* FAQ */}
					<section className="pdl-section pdl-section--paper" aria-labelledby="faq-heading">
						<div className="pdl-wrap pdl-faq">
							<div className="pdl-faq__aside">
								<p className="pdl-eyebrow">FAQ</p>
								<h2 id="faq-heading" className="pdl-h2">
									{c.faqTitle}
								</h2>
							</div>
							<div className="pdl-faq__list">
								{c.faqs.map((f, i) => (
									<details key={f.q} className="pdl-faq__item" open={i === 0}>
										<summary>
											<h3 className="pdl-faq__q">{f.q}</h3>
											<span className="pdl-faq__icon" aria-hidden="true" />
										</summary>
										<p className="pdl-faq__a">{f.a}</p>
									</details>
								))}
							</div>
						</div>
					</section>

					{/* Wezwanie do działania */}
					<section className="pdl-cta" aria-labelledby="commercial-cta-heading">
						<div className="pdl-wrap pdl-cta__inner">
							<div>
								<h2 id="commercial-cta-heading" className="pdl-cta__title">
									{c.ctaTitle}
								</h2>
								<p className="pdl-cta__note">{c.ctaNote}</p>
							</div>
							<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary pdl-cta__btn">
								{c.ctaButton}
								<Arrow />
							</a>
						</div>
					</section>

					{/* Powiązane */}
					<nav className="pdl-related" aria-label={c.relatedTitle}>
						<div className="pdl-wrap">
							<p className="pdl-related__title">{c.relatedTitle}</p>
							<ul className="pdl-related__list">
								{c.related.map(r => (
									<li key={r.href}>
										<Link href={r.href}>
											{r.label}
											<Arrow />
										</Link>
									</li>
								))}
							</ul>
						</div>
					</nav>
				</article>
			</main>
		</>
	)
}
