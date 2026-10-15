// Strona branżowa (budownictwo, gastronomia, sprzątanie) w stylu stron produktowych (.pdl).
// Dane i JSON-LD zostają w komponentach branżowych — tu tylko układ.
import Image from 'next/image'
import Link from 'next/link'
import './productLanding.css'
import { Arrow, BrowserShot, Check, HeroTitle, PhoneShot, splitFeature, type Shot } from './parts'
import { REGISTER_HREF, UI } from '@/data/commercialLandingCopy'
import { LANDING_TRIAL_DAYS, landingTrial } from '@/data/landingPlanPricing'

type Locale = 'pl' | 'en'

export type IndustrySpotlight = {
	id: string
	eyebrow: string
	title: string
	lead: string
	bullets: string[]
	note?: string
	shot: Shot
}

export type IndustryLandingProps = {
	locale: Locale
	eyebrow: string
	heroH1: string
	heroSub: string
	ctaButton: string
	secondary: { label: string; href: string }
	heroImage: { src: string; alt: string; width: number; height: number }
	heroPhone?: Shot
	problemsTitle: string
	problems: string[]
	spotlights: IndustrySpotlight[]
	solutionTitle: string
	solutionIntro: string
	features: string[]
	galleryTitle: string
	gallery: Shot[]
	ai: { title: string; bullets: string[]; visual: React.ReactNode }
	stepsTitle: string
	steps: string[]
	faqTitle: string
	faqs: { q: string; a: string }[]
	cta: { title: string; note: string; button: string }
	guide?: { eyebrow: string; title: string; body: string; href: string; cta: string }
}

const EYEBROW = {
	pl: { problem: 'Problem', features: 'Wszystko w jednym', gallery: 'W aplikacji', ai: 'Asystent AI', steps: 'Start', faq: 'FAQ' },
	en: { problem: 'The problem', features: 'All in one place', gallery: 'In the app', ai: 'AI Assistant', steps: 'Getting started', faq: 'FAQ' },
}

export default function IndustryLanding(p: IndustryLandingProps) {
	const t = UI[p.locale]
	const e = EYEBROW[p.locale]
	const facts = [
		{ value: `${LANDING_TRIAL_DAYS} ${t.factDays}`, label: t.factTrial },
		{ value: t.factFreeValue, label: t.factFreeLabel(landingTrial.maxUsers) },
		{ value: 'PDF + Excel', label: t.factExport },
		{ value: t.factMobileValue, label: t.factMobileLabel },
	]

	return (
		<main className="pdl">
			<article>
				{/* Hero */}
				<section className="pdl-hero" aria-labelledby="industry-hero-heading">
					<div className="pdl-wrap pdl-hero__grid">
						<header id="industry-hero-heading" className="pdl-hero__copy">
							<p className="pdl-pill">
								<span className="pdl-dot" />
								{p.eyebrow}
							</p>
							<HeroTitle text={p.heroH1} />
							<p className="pdl-hero__lead">{p.heroSub}</p>
							<div className="pdl-hero__ctas">
								<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary">
									{p.ctaButton}
									<Arrow />
								</a>
								<Link href={p.secondary.href} className="pdl-btn pdl-btn--ghost">
									{p.secondary.label}
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
						<div className={`pdl-hero__visual${p.heroPhone ? ' pdl-hero__visual--phone' : ''}`}>
							<div className="pdl-illustration">
								<Image
									src={p.heroImage.src}
									alt={p.heroImage.alt}
									width={p.heroImage.width}
									height={p.heroImage.height}
									priority
									fetchPriority="high"
									sizes="(max-width: 960px) calc(100vw - 32px), 620px"
									className="pdl-illustration__img"
								/>
							</div>
							{p.heroPhone ? <PhoneShot shot={p.heroPhone} /> : null}
						</div>
					</div>
				</section>

				<section className="pdl-facts" aria-label={t.factsLabel}>
					<div className="pdl-wrap">
						<dl className="pdl-facts__grid">
							{facts.map(f => (
								<div key={f.label} className="pdl-facts__item">
									<dt className="pdl-facts__value">{f.value}</dt>
									<dd className="pdl-facts__label">{f.label}</dd>
								</div>
							))}
						</dl>
					</div>
				</section>

				{/* Problem */}
				<section className="pdl-section pdl-section--paper" aria-labelledby="problems-heading">
					<div className="pdl-wrap pdl-split">
						<div>
							<p className="pdl-eyebrow">{e.problem}</p>
							<h2 id="problems-heading" className="pdl-h2">
								{p.problemsTitle}
							</h2>
						</div>
						<ol className="pdl-problems">
							{p.problems.map((x, i) => (
								<li key={x}>
									<span className="pdl-problems__num">{String(i + 1).padStart(2, '0')}</span>
									<p className="pdl-problems__text">{x}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* Najważniejsze funkcje dla branży — naprzemiennie tekst i zrzut */}
				{p.spotlights.map((s, i) => (
					<section key={s.id} id={s.id} className={`pdl-section pdl-spot${i % 2 ? ' pdl-section--paper pdl-spot--flip' : ''}`} aria-labelledby={`${s.id}-heading`}>
						<div className="pdl-wrap pdl-spot__grid">
							<div className="pdl-spot__copy">
								<p className="pdl-eyebrow">
									<span className="pdl-spot__num">{String(i + 1).padStart(2, '0')}</span>
									{s.eyebrow}
								</p>
								<h2 id={`${s.id}-heading`} className="pdl-h2">
									{s.title}
								</h2>
								<p className="pdl-lead">{s.lead}</p>
								<ul className="pdl-spot__list">
									{s.bullets.map(b => (
										<li key={b}>
											<span className="pdl-spot__icon">
												<Check size={14} />
											</span>
											<span>{b}</span>
										</li>
									))}
								</ul>
								{s.note ? <p className="pdl-spot__note">{s.note}</p> : null}
							</div>
							<div className={`pdl-spot__visual${s.shot.height > s.shot.width ? ' pdl-spot__visual--tall' : ''}`}>
								<BrowserShot shot={s.shot} />
							</div>
						</div>
					</section>
				))}

				{/* Funkcje */}
				<section className={`pdl-section${p.spotlights.length % 2 ? ' pdl-section--paper' : ''}`} aria-labelledby="solution-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{e.features}</p>
							<h2 id="solution-heading" className="pdl-h2">
								{p.solutionTitle}
							</h2>
							<p className="pdl-lead">{p.solutionIntro}</p>
						</div>
						<ul className="pdl-features">
							{p.features.map(f => {
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
				<section id="industry-gallery" className="pdl-section pdl-section--dark" aria-labelledby="gallery-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{e.gallery}</p>
							<h2 id="gallery-heading" className="pdl-h2">
								{p.galleryTitle}
							</h2>
						</div>
						<div className="pdl-gallery">
							{p.gallery.map(s => (
								<figure key={s.src} className="pdl-gallery__item">
									<BrowserShot shot={s} />
									{s.caption ? <figcaption className="pdl-gallery__caption">{s.caption}</figcaption> : null}
								</figure>
							))}
						</div>
					</div>
				</section>

				{/* Asystent AI */}
				<section className="pdl-section" aria-labelledby="ai-heading">
					<div className="pdl-wrap pdl-spot__grid">
						<div className="pdl-spot__copy">
							<p className="pdl-eyebrow">{e.ai}</p>
							<h2 id="ai-heading" className="pdl-h2">
								{p.ai.title}
							</h2>
							<ul className="pdl-spot__list">
								{p.ai.bullets.map(b => (
									<li key={b}>
										<span className="pdl-spot__icon">
											<Check size={14} />
										</span>
										<span>{b}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="pdl-spot__visual pdl-ai-visual">{p.ai.visual}</div>
					</div>
				</section>

				{/* Jak zacząć */}
				<section className="pdl-section pdl-section--paper" aria-labelledby="steps-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{e.steps}</p>
							<h2 id="steps-heading" className="pdl-h2">
								{p.stepsTitle}
							</h2>
						</div>
						<ol className="pdl-steps">
							{p.steps.map((s, i) => (
								<li key={s} className="pdl-step">
									<span className="pdl-step__num">{String(i + 1).padStart(2, '0')}</span>
									<p className="pdl-step__text">{s}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* FAQ */}
				<section className="pdl-section" aria-labelledby="faq-heading">
					<div className="pdl-wrap pdl-faq">
						<div className="pdl-faq__aside">
							<p className="pdl-eyebrow">{e.faq}</p>
							<h2 id="faq-heading" className="pdl-h2">
								{p.faqTitle}
							</h2>
						</div>
						<div className="pdl-faq__list">
							{p.faqs.map((f, i) => (
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

				{/* CTA */}
				<section className="pdl-cta" aria-labelledby="industry-landing-cta-h">
					<div className="pdl-wrap pdl-cta__inner">
						<div>
							<h2 id="industry-landing-cta-h" className="pdl-cta__title">
								{p.cta.title}
							</h2>
							<p className="pdl-cta__note">{p.cta.note}</p>
						</div>
						<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary pdl-cta__btn">
							{p.cta.button}
							<Arrow />
						</a>
					</div>
				</section>

				{p.guide ? (
					<section className="pdl-guide" aria-labelledby="industry-guide-heading">
						<div className="pdl-wrap">
							<div className="pdl-guide__card">
								<div>
									<p className="pdl-eyebrow">{p.guide.eyebrow}</p>
									<h2 id="industry-guide-heading" className="pdl-guide__title">
										{p.guide.title}
									</h2>
									<p className="pdl-guide__body">{p.guide.body}</p>
								</div>
								<Link href={p.guide.href} className="pdl-link pdl-guide__link">
									{p.guide.cta}
									<Arrow />
								</Link>
							</div>
						</div>
					</section>
				) : null}
			</article>
		</main>
	)
}
