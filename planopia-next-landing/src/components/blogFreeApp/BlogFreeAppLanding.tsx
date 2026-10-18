import Link from 'next/link'
import '../productLanding/productLanding.css'
import './blogFreeApp.css'
import BlogRelatedLinks from '../BlogRelatedLinks'
import { Arrow, BrowserShot, Check, HeroTitle } from '../productLanding/parts'
import { shot } from '@/data/productShots'
import { blogFreeAppCopy } from '@/data/blogFreeAppCopy'
import { FEATURE_COPY } from '@/data/landingFeatureCopy'
import { landingFeatures, landingModules } from '@/data/landingPlanPricing'

const REGISTER_HREF = 'https://app.planopia.pl/team-registration'

/**
 * Wpis „darmowa aplikacja do ewidencji czasu pracy” (PL/EN) w języku wizualnym stron produktowych (.pdl):
 * prawdziwe zrzuty zamiast filmu, jasny podział darmowy plan / okres próbny / Core i jedno główne CTA.
 * Treść i FAQ z blogFreeAppCopy — te same dane idą do JSON-LD (BlogFreeAppJsonLd), więc tekst i schema się nie rozjadą.
 */
export default function BlogFreeAppLanding({ locale }: { locale: 'pl' | 'en' }) {
	const copy = blogFreeAppCopy[locale]
	const p = copy.page
	const isPl = locale === 'pl'
	const heroShot = shot(locale, 'time-calendar')

	return (
		<main className="pdl bfa">
			<article>
				{/* Hero */}
				<section className="pdl-hero" aria-labelledby="bfa-hero-heading">
					<div className="pdl-wrap pdl-hero__grid">
						<header id="bfa-hero-heading" className="pdl-hero__copy">
							<nav className="bfa-crumbs" aria-label={isPl ? 'Ścieżka nawigacji' : 'Breadcrumb'}>
								<Link href={isPl ? '/blog' : '/en/blog'}>Blog</Link>
								<span aria-hidden="true">/</span>
								<span>{p.crumb}</span>
							</nav>
							<p className="pdl-pill">
								<span className="pdl-dot" />
								{p.pill}
							</p>
							<HeroTitle text={copy.heroH1} />
							<p className="pdl-hero__lead">{copy.heroLead}</p>
							<div className="pdl-hero__ctas">
								<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary">
									{copy.cta}
									<Arrow />
								</a>
								<a href="#za-darmo" className="pdl-btn pdl-btn--ghost">
									{p.ctaSecondary}
								</a>
							</div>
							<ul className="pdl-hero__checks">
								{p.checks.map(item => (
									<li key={item}>
										<Check size={16} />
										{item}
									</li>
								))}
							</ul>
							<p className="bfa-updated">
								<time dateTime={copy.dateModified}>{p.updated}</time>
							</p>
						</header>
						<div className="pdl-hero__visual">
							<BrowserShot shot={heroShot} priority />
						</div>
					</div>
				</section>

				{/* Fakty */}
				<section className="pdl-facts" aria-label={p.factsLabel}>
					<div className="pdl-wrap">
						<dl className="pdl-facts__grid">
							{p.facts.map(f => (
								<div key={f.label} className="pdl-facts__item">
									<dt className="pdl-facts__value">{f.value}</dt>
									<dd className="pdl-facts__label">{f.label}</dd>
								</div>
							))}
						</dl>
					</div>
				</section>

				{/* Co jest za darmo — karty planów */}
				<section id="za-darmo" className="pdl-section pdl-section--paper bfa-anchor" aria-labelledby="bfa-plans-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{p.plansEyebrow}</p>
							<h2 id="bfa-plans-heading" className="pdl-h2">
								{copy.plansTitle}
							</h2>
							<p className="pdl-lead">{copy.plansLead}</p>
						</div>
						<ul className="bfa-plans">
							{copy.planCards.map((card, i) => (
								<li key={card.title} className={`bfa-plan${i === 0 ? ' bfa-plan--free' : ''}`}>
									<span className="bfa-plan__badge">{p.planBadges[i]}</span>
									<h3 className="bfa-plan__title">{card.title}</h3>
									<p className="bfa-plan__note">{card.note}</p>
									<ul className="bfa-plan__list">
										{card.items.map(item => (
											<li key={item}>
												<span className="bfa-plan__icon">
													<Check size={14} />
												</span>
												<span>{item}</span>
											</li>
										))}
									</ul>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Prawdziwe ekrany */}
				<section className="pdl-section pdl-section--dark" aria-labelledby="bfa-gallery-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{p.galleryEyebrow}</p>
							<h2 id="bfa-gallery-heading" className="pdl-h2">
								{p.galleryTitle}
							</h2>
						</div>
						<div className="pdl-gallery">
							{p.gallery.map(g => (
								<figure key={g.name} className="pdl-gallery__item">
									<BrowserShot shot={shot(locale, g.name)} />
									<figcaption className="pdl-gallery__caption">
										<span className={`bfa-tag${g.free ? ' bfa-tag--free' : ''}`}>{g.free ? p.galleryTagFree : p.galleryTagTrial}</span>
										{g.caption}
									</figcaption>
								</figure>
							))}
						</div>
					</div>
				</section>

				{/* Porównanie funkcji — z planCatalog, ten sam generat co cennik */}
				<section className="pdl-section" aria-labelledby="bfa-table-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{p.tableEyebrow}</p>
							<h2 id="bfa-table-heading" className="pdl-h2">
								{copy.tableTitle}
							</h2>
						</div>
						<div className="bfa-table-wrap">
							<table className="bfa-table">
								<thead>
									<tr>
										<th scope="col">{copy.tableHead.feature}</th>
										<th scope="col" className="bfa-table__free">
											{copy.tableHead.free}
										</th>
										<th scope="col">{copy.tableHead.trial}</th>
										<th scope="col">{copy.tableHead.core}</th>
									</tr>
								</thead>
								<tbody>
									{landingFeatures.map(feature => {
										const included = feature.plan === 'free' || feature.plan === 'all'
										const addon = feature.plan === 'module' ? landingModules.find(m => m.id === feature.module) : null
										const yes = (
											<span className="bfa-yes" aria-label={isPl ? 'tak' : 'yes'}>
												<Check size={15} />
											</span>
										)
										return (
											<tr key={feature.id}>
												<th scope="row">{FEATURE_COPY[feature.id][locale].title}</th>
												<td className="bfa-table__free">
													{included ? (
														yes
													) : (
														<span className="bfa-no" aria-label={isPl ? 'nie' : 'no'}>
															—
														</span>
													)}
												</td>
												<td>{yes}</td>
												<td>{addon ? <span className="bfa-addon">{copy.tableModule.replace('{price}', String(addon.monthlyNetPln))}</span> : yes}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
						<p className="bfa-table-note">
							{copy.tableNote}{' '}
							<Link href={copy.pricingHref} className="pdl-link">
								{copy.pricingLabel}
								<Arrow />
							</Link>
						</p>
					</div>
				</section>

				{/* Jak zacząć */}
				<section className="pdl-section pdl-section--paper" aria-labelledby="bfa-steps-heading">
					<div className="pdl-wrap">
						<div className="pdl-head">
							<p className="pdl-eyebrow">{p.stepsEyebrow}</p>
							<h2 id="bfa-steps-heading" className="pdl-h2">
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

				{/* Czym jest Planopia — tekst pod frazy i linki wewnętrzne */}
				<section className="pdl-section" aria-labelledby="bfa-about-heading">
					<div className="pdl-wrap pdl-split">
						<div>
							<p className="pdl-eyebrow">{p.aboutEyebrow}</p>
							<h2 id="bfa-about-heading" className="pdl-h2">
								{p.aboutTitle}
							</h2>
						</div>
						<div className="bfa-prose">
							{isPl ? (
								<>
									<p>
										Ewidencję czasu pracy musi prowadzić każdy pracodawca (art. 149 Kodeksu pracy). Excel, papierowe listy obecności i
										rozproszone arkusze generują jednak błędy i zabierają godziny, które można przeznaczyć na pracę.
									</p>
									<p>
										<strong>Planopia</strong> to aplikacja do ewidencji czasu pracy i urlopów dla małych i średnich firm. Działa w
										przeglądarce i na telefonie, bez instalowania programów na komputerach pracowników. Mały zespół korzysta z
										ewidencji za darmo, a urlopy, grafiki i raporty dokłada wtedy, gdy ich potrzebuje.
									</p>
									<p>
										Szukasz pełnego narzędzia? Zobacz{' '}
										<Link href="/program-do-ewidencji-czasu-pracy">program do ewidencji czasu pracy</Link>,{' '}
										<Link href="/blog/programy-do-ewidencji-czasu-pracy-porownanie">porównanie programów do ewidencji</Link> albo
										przewodniki: <Link href="/blog/ewidencja-czasu-pracy-online">ewidencja czasu pracy online</Link> i{' '}
										<Link href="/blog/elektroniczna-ewidencja-czasu-pracy">elektroniczna ewidencja — Excel czy program</Link>.
									</p>
								</>
							) : (
								<>
									<p>
										Excel, paper attendance sheets and scattered spreadsheets lead to mistakes and eat up hours that could go into
										actual work.
									</p>
									<p>
										<strong>Planopia</strong> is a time tracking and leave management app for small and medium-sized companies. It
										runs in the browser and on phones, with nothing to install on employees’ computers. A small team tracks time for
										free and adds leave, schedules and reports when it needs them.
									</p>
									<p>
										Looking for the full tool? See the <Link href="/en/time-tracking-software">time tracking software</Link> page or
										the guides: <Link href="/en/blog/time-tracking-online">online time tracking</Link> and{' '}
										<Link href="/en/blog/electronic-time-tracking">electronic time tracking — Excel or software</Link>.
									</p>
								</>
							)}
						</div>
					</div>
				</section>

				{/* FAQ — te same pytania co w JSON-LD */}
				<section className="pdl-section pdl-section--paper" aria-labelledby="bfa-faq-heading">
					<div className="pdl-wrap pdl-faq">
						<div className="pdl-faq__aside">
							<p className="pdl-eyebrow">FAQ</p>
							<h2 id="bfa-faq-heading" className="pdl-h2">
								{p.faqTitle}
							</h2>
						</div>
						<div className="pdl-faq__list">
							{copy.faqs.map((f, i) => (
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
				<section className="pdl-cta" aria-labelledby="bfa-cta-heading">
					<div className="pdl-wrap pdl-cta__inner">
						<div>
							<h2 id="bfa-cta-heading" className="pdl-cta__title">
								{p.ctaTitle}
							</h2>
							<p className="pdl-cta__note">{p.ctaNote}</p>
						</div>
						<a href={REGISTER_HREF} className="pdl-btn pdl-btn--primary pdl-cta__btn">
							{copy.cta}
							<Arrow />
						</a>
					</div>
				</section>

				{/* Powiązane artykuły (linkowanie wewnętrzne bloga) */}
				<div className="pdl-wrap bfa-related">
					<BlogRelatedLinks slug={copy.slug} {...(isPl ? {} : { locale: 'en' as const })} />
				</div>
			</article>
		</main>
	)
}
