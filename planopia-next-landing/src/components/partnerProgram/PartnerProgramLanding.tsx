import Link from 'next/link'
import './partnerProgram.css'
import {
	APPLY,
	AUDIENCES,
	CALCULATOR,
	CALCULATOR_DEFAULT_COMPANIES,
	CALCULATOR_DEFAULT_PLAN,
	CALCULATOR_PLANS,
	FAQ,
	HERO,
	META,
	OFFICE_PANEL,
	PARTNER_PAGE_URL,
	PARTNER_PANEL_URL,
	PARTNER_TERMS,
	PROOF,
	STEPS,
	TERMS_LABEL,
	TERMS_STRIP,
} from '@/data/partnerProgramCopy'
import { landingTestimonials } from '@/data/landingTestimonials'
import { LANDING_SELLER } from '@/data/landingFooterData'
import { formatPln, formatPlnSmart, partnerEarnings } from '@/lib/partnerEarnings'
import PartnerEarningsCalculator from './PartnerEarningsCalculator'
import PartnerApplicationForm from './PartnerApplicationForm'
import { IconArrow, IconCheck, IconCheckCircle, IconClock, IconCopy, IconDownload, IconChevron, IconMail, IconPhone, IconPlus, IconQuote } from './partnerIcons'

function Eyebrow({ num, children }: { num: string; children: React.ReactNode }) {
	return (
		<p className="plp-eyebrow">
			<span className="plp-eyebrow__num">{num}</span>
			{children}
		</p>
	)
}

/** Makieta panelu partnera — liczby z tego samego cennika i warunków co kalkulator */
function PartnerPanelMock() {
	const pro = CALCULATOR_PLANS.find(p => p.id === CALCULATOR_DEFAULT_PLAN) ?? CALCULATOR_PLANS[0]
	const core = CALCULATOR_PLANS[0]
	const perPro = pro.monthlyNetPln * PARTNER_TERMS.initialRate
	const perCore = core.monthlyNetPln * PARTNER_TERMS.initialRate
	const { monthlyInitial } = partnerEarnings({
		companies: CALCULATOR_DEFAULT_COMPANIES,
		monthlyNetPln: pro.monthlyNetPln,
		initialRate: PARTNER_TERMS.initialRate,
		initialMonths: PARTNER_TERMS.initialMonths,
		laterRate: PARTNER_TERMS.laterRate,
	})
	// Kolejne miesiące: przybywa poleconych firm, więc rośnie prowizja
	const bars = [2, 3, 3, 4, 5, 5, 6, 7, 8, 8, 9, 10]
	const firms = [
		{ initials: 'ZD', name: 'Zielona Dolina Sp. z o.o.', meta: 'PRO · od marca', amount: perPro },
		{ initials: 'TE', name: 'Transport Ekspres', meta: 'Core · od maja', amount: perCore },
		{ initials: 'SM', name: 'Salon Urody Magnolia', meta: 'PRO · od czerwca', amount: perPro },
	]

	return (
		<div className="plp-visual" aria-hidden="true">
			<div className="plp-mock">
				<div className="plp-mock__bar">
					<span className="plp-mock__logo">P</span>
					<span className="plp-mock__title">Program partnerski</span>
					<span className="plp-mock__chip">Aktywny</span>
				</div>
				<div className="plp-mock__kpis">
					<div className="plp-mock__kpi plp-mock__kpi--main">
						<span className="plp-mock__label">Do wypłaty za miesiąc</span>
						<span className="plp-mock__value">{formatPln(monthlyInitial, 2)}</span>
					</div>
					<div className="plp-mock__kpi">
						<span className="plp-mock__label">Polecone firmy</span>
						<span className="plp-mock__value">{CALCULATOR_DEFAULT_COMPANIES}</span>
					</div>
					<div className="plp-mock__kpi">
						<span className="plp-mock__label">Stawka</span>
						<span className="plp-mock__value">{TERMS_LABEL.initial}</span>
					</div>
				</div>
				<div className="plp-mock__chart">
					<div className="plp-mock__chart-head">
						<span>Prowizja w kolejnych miesiącach</span>
						<span>12 mies.</span>
					</div>
					<div className="plp-mock__bars">
						{bars.map((b, i) => (
							<i key={i} style={{ height: `${b * 10}%` }} />
						))}
					</div>
				</div>
				<ul className="plp-mock__list">
					{firms.map(f => (
						<li key={f.name}>
							<span className="plp-mock__avatar">{f.initials}</span>
							<span>
								<span className="plp-mock__name">{f.name}</span>
								<span className="plp-mock__meta">{f.meta}</span>
							</span>
							<span className="plp-mock__amount">+{formatPlnSmart(f.amount)}</span>
						</li>
					))}
				</ul>
			</div>
			<div className="plp-toast">
				<span className="plp-toast__icon">
					<IconPlus size={20} />
				</span>
				<span>
					<span className="plp-toast__title">Nowa płatność · Piekarnia Kowalczyk</span>
					<span className="plp-toast__value">
						<b>+{formatPlnSmart(perPro)}</b> prowizji
					</span>
				</span>
			</div>
		</div>
	)
}

/** Makieta panelu biura: podsumowanie miesiąca jednej firmy-klienta */
function OfficePanelMock() {
	const rows = [
		{ name: 'Aleksandra Wiśniewska', days: 21, hours: 168, over: '4,5 h', leave: '—', left: '18 dni', ok: true },
		{ name: 'Bartłomiej Nowak', days: 19, hours: 152, over: '—', leave: '2 dni', left: '22 dni', ok: true },
		{ name: 'Celina Lewandowska', days: 16, hours: 128, over: '—', leave: '5 dni', left: '15 dni', ok: false },
		{ name: 'Dawid Kamiński', days: 21, hours: 168, over: '8 h', leave: '—', left: '26 dni', ok: true },
		{ name: 'Ewelina Zając', days: 20, hours: 160, over: '1,5 h', leave: '1 dzień', left: '9 dni', ok: false },
	]
	const confirmed = rows.filter(r => r.ok).length

	return (
		<div className="plp-window" aria-hidden="true">
			<div className="plp-window__bar">
				<i />
				<i />
				<i />
				<span className="plp-window__url">app.planopia.pl/biuro</span>
			</div>
			<div className="plp-window__body">
				<div className="plp-window__toolbar">
					<span className="plp-window__select">
						<span>Zielona Dolina Sp. z o.o.</span>
						<IconChevron size={16} />
					</span>
					<span className="plp-window__month">Marzec</span>
					<span className="plp-window__exports">
						<span className="plp-window__export plp-window__export--xls">
							<IconDownload size={14} /> Excel
						</span>
						<span className="plp-window__export">
							<IconDownload size={14} /> PDF
						</span>
					</span>
				</div>
				<table className="plp-table">
					<thead>
						<tr>
							<th>Pracownik</th>
							<th className="plp-col-opt">Dni</th>
							<th>Godziny</th>
							<th className="plp-col-opt">Nadgodz.</th>
							<th className="plp-col-opt">Urlop</th>
							<th>Zostało</th>
							<th>Potw.</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(r => (
							<tr key={r.name}>
								<td>{r.name}</td>
								<td className="plp-col-opt">{r.days}</td>
								<td>{r.hours} h</td>
								<td className="plp-col-opt">{r.over}</td>
								<td className="plp-col-opt">{r.leave}</td>
								<td>{r.left}</td>
								<td>{r.ok ? <span className="plp-table__ok">✓</span> : <span className="plp-table__wait">czeka</span>}</td>
							</tr>
						))}
					</tbody>
				</table>
				<p className="plp-window__foot">
					<span>
						Potwierdziło {confirmed} z {rows.length} pracowników
					</span>
					<span>Tylko odczyt</span>
				</p>
			</div>
		</div>
	)
}

function JsonLd() {
	const graph = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': `${PARTNER_PAGE_URL}#webpage`,
				url: PARTNER_PAGE_URL,
				name: META.title,
				description: META.description,
				inLanguage: 'pl-PL',
				isPartOf: { '@type': 'WebSite', '@id': 'https://planopia.pl/#website', name: 'Planopia', url: 'https://planopia.pl' },
				publisher: {
					'@type': 'Organization',
					name: 'Planopia',
					url: 'https://planopia.pl',
					logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
					email: LANDING_SELLER.email,
					telephone: LANDING_SELLER.phoneLabel.replace(/\s/g, ''),
				},
				breadcrumb: { '@id': `${PARTNER_PAGE_URL}#breadcrumb` },
			},
			{
				'@type': 'BreadcrumbList',
				'@id': `${PARTNER_PAGE_URL}#breadcrumb`,
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
					{ '@type': 'ListItem', position: 2, name: 'Program partnerski', item: PARTNER_PAGE_URL },
				],
			},
			{
				'@type': 'FAQPage',
				'@id': `${PARTNER_PAGE_URL}#faq`,
				mainEntity: FAQ.map(item => ({
					'@type': 'Question',
					name: item.q,
					acceptedAnswer: { '@type': 'Answer', text: item.a },
				})),
			},
		],
	}
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }} />
}

export default function PartnerProgramLanding() {
	const testimonial = landingTestimonials[0]

	return (
		<main className="plp">
			<JsonLd />

			{/* Hero */}
			<section className="plp-hero" aria-labelledby="plp-title">
				<div className="plp-wrap plp-hero__grid">
					<div>
						{/* Fraza „Program partnerski” w H1 dla wyszukiwarek; wizualnie etykieta nad hasłem */}
						<h1 id="plp-title" className="plp-hero__h1">
							<span className="plp-pill">
								<span className="plp-dot" />
								{HERO.eyebrow}
							</span>{' '}
							<span className="plp-hero__title">
								{HERO.titleLead} <span className="plp-hero__accent">{HERO.titleAccent}</span>
							</span>
						</h1>
						<p className="plp-hero__lead">{HERO.lead}</p>
						<div className="plp-hero__ctas">
							<a href="#dolacz" className="plp-btn plp-btn--primary">
								{HERO.primaryCta}
								<IconArrow size={18} />
							</a>
							<a href="#kalkulator" className="plp-btn plp-btn--ghost">
								{HERO.secondaryCta}
							</a>
						</div>
						<ul className="plp-hero__checks">
							{HERO.checks.map(c => (
								<li key={c}>
									<IconCheck size={16} />
									{c}
								</li>
							))}
						</ul>
						<p className="plp-hero__login">
							{HERO.panelLink} <a href={PARTNER_PANEL_URL}>{HERO.panelLinkCta}</a>
						</p>
					</div>
					<PartnerPanelMock />
				</div>
			</section>

			{/* Warunki */}
			<section className="plp-terms" id="warunki" aria-label="Warunki programu partnerskiego">
				<div className="plp-wrap">
					<dl className="plp-terms__grid">
						{TERMS_STRIP.map(t => (
							<div key={t.title} className="plp-terms__item">
								<dt>
									<span className="plp-terms__value">{t.value}</span>
									<span className="plp-terms__title">{t.title}</span>
								</dt>
								<dd className="plp-terms__text">{t.text}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			{/* Dla kogo */}
			<section className="plp-section plp-section--paper" id="dla-kogo" aria-labelledby="plp-aud-title">
				<div className="plp-wrap">
					<div className="plp-head">
						<Eyebrow num="01">{AUDIENCES.eyebrow}</Eyebrow>
						<h2 id="plp-aud-title" className="plp-h2">
							{AUDIENCES.title}
						</h2>
					</div>
					<div className="plp-aud">
						<article className="plp-aud__card plp-aud__card--office">
							<span className="plp-aud__tag">{AUDIENCES.offices.tag}</span>
							<h3 className="plp-aud__title">{AUDIENCES.offices.title}</h3>
							<div className="plp-aud__visual" aria-hidden="true">
								<ul className="plp-clients">
									<li>
										<span className="plp-clients__name">Zielona Dolina Sp. z o.o.</span>
										<span className="plp-clients__meta">18 os.</span>
										<span className="plp-clients__status">
											<IconCheckCircle size={15} /> potwierdzone
										</span>
									</li>
									<li>
										<span className="plp-clients__name">Piekarnia Kowalczyk</span>
										<span className="plp-clients__meta">7 os.</span>
										<span className="plp-clients__status">
											<IconCheckCircle size={15} /> potwierdzone
										</span>
									</li>
									<li>
										<span className="plp-clients__name">Transport Ekspres</span>
										<span className="plp-clients__meta">24 os.</span>
										<span className="plp-clients__status plp-clients__status--wait">
											<IconClock size={15} /> 3 czekają
										</span>
									</li>
								</ul>
							</div>
							<ul className="plp-points">
								{AUDIENCES.offices.points.map(p => (
									<li key={p}>
										<IconCheck size={20} />
										<span>{p}</span>
									</li>
								))}
							</ul>
							<div className="plp-aud__bonus-wrap">
								<p className="plp-aud__bonus">
									<IconPlus size={18} />
									{AUDIENCES.offices.bonus}
								</p>
							</div>
						</article>

						<article className="plp-aud__card plp-aud__card--ref">
							<span className="plp-aud__tag">{AUDIENCES.referrers.tag}</span>
							<h3 className="plp-aud__title">{AUDIENCES.referrers.title}</h3>
							<div className="plp-aud__visual" aria-hidden="true">
								<div className="plp-reflink">
									<span className="plp-reflink__url">
										planopia.pl/?ref=<b>twoj-kod</b>
									</span>
									<span className="plp-reflink__copy">
										<IconCopy size={14} /> Kopiuj
									</span>
								</div>
								<span className="plp-reflink__hint">Twój link polecający — w panelu partnera</span>
							</div>
							<ul className="plp-points">
								{AUDIENCES.referrers.points.map(p => (
									<li key={p}>
										<IconCheck size={20} />
										<span>{p}</span>
									</li>
								))}
							</ul>
							<div className="plp-aud__bonus-wrap">
								<p className="plp-aud__bonus">
									<IconPlus size={18} />
									{AUDIENCES.referrers.bonus}
								</p>
							</div>
						</article>
					</div>
				</div>
			</section>

			{/* Kalkulator */}
			<section className="plp-section" id="kalkulator" aria-labelledby="plp-calc-title">
				<div className="plp-wrap">
					<div className="plp-head">
						<Eyebrow num="02">{CALCULATOR.eyebrow}</Eyebrow>
						<h2 id="plp-calc-title" className="plp-h2">
							{CALCULATOR.title}
						</h2>
						<p className="plp-lead">{CALCULATOR.lead}</p>
					</div>
					<PartnerEarningsCalculator />
				</div>
			</section>

			{/* Jak to działa */}
			<section className="plp-section plp-section--paper" id="jak-to-dziala" aria-labelledby="plp-steps-title">
				<div className="plp-wrap">
					<div className="plp-head">
						<Eyebrow num="03">{STEPS.eyebrow}</Eyebrow>
						<h2 id="plp-steps-title" className="plp-h2">
							{STEPS.title}
						</h2>
					</div>
					<ol className="plp-steps">
						{STEPS.items.map((s, i) => (
							<li key={s.title} className="plp-step">
								<span className="plp-step__num">{String(i + 1).padStart(2, '0')}</span>
								<div className="plp-step__body">
									<h3 className="plp-step__title">{s.title}</h3>
									<p className="plp-step__text">{s.text}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Panel biura */}
			<section className="plp-section plp-section--dark" id="panel-biura" aria-labelledby="plp-office-title">
				<div className="plp-wrap plp-office">
					<div>
						<div className="plp-head">
							<Eyebrow num="04">{OFFICE_PANEL.eyebrow}</Eyebrow>
							<h2 id="plp-office-title" className="plp-h2">
								{OFFICE_PANEL.title}
							</h2>
							<p className="plp-lead">{OFFICE_PANEL.lead}</p>
						</div>
						<div className="plp-features">
							{OFFICE_PANEL.features.map(f => (
								<div key={f.title} className="plp-feature">
									<h3 className="plp-feature__title">{f.title}</h3>
									<p className="plp-feature__text">{f.text}</p>
								</div>
							))}
						</div>
					</div>
					<OfficePanelMock />
				</div>
			</section>

			{/* Co polecasz + opinia */}
			<section className="plp-section" id="co-polecasz" aria-labelledby="plp-proof-title">
				<div className="plp-wrap plp-proof">
					<div>
						<Eyebrow num="05">{PROOF.eyebrow}</Eyebrow>
						<h2 id="plp-proof-title" className="plp-h2">
							{PROOF.title}
						</h2>
						<p className="plp-lead">{PROOF.lead}</p>
						<nav className="plp-links" aria-label="Funkcje Planopii">
							{PROOF.features.map(f => (
								<Link key={f.href} href={f.href}>
									{f.label}
									<IconArrow size={20} />
								</Link>
							))}
						</nav>
					</div>
					<div className="plp-proof__side">
						{testimonial && (
							<figure className="plp-quote">
								<IconQuote className="plp-quote__mark" />
								<blockquote>{testimonial.quote.pl}</blockquote>
								<figcaption className="plp-quote__author">
									{/* eslint-disable-next-line @next/next/no-img-element -- małe logo klienta, bez optymalizacji */}
									<img
										className="plp-quote__logo"
										src={testimonial.logo.src}
										width={testimonial.logo.width}
										height={testimonial.logo.height}
										alt={testimonial.company}
										loading="lazy"
									/>
									<span>
										<span className="plp-quote__name">{testimonial.author}</span>
										<span className="plp-quote__role">
											{testimonial.role.pl}, {testimonial.company}
										</span>
									</span>
								</figcaption>
							</figure>
						)}
						<dl className="plp-facts">
							{PROOF.facts.map(f => (
								<div key={f.text}>
									<dt className="plp-facts__value">{f.value}</dt>
									<dd className="plp-facts__text">{f.text}</dd>
								</div>
							))}
						</dl>
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="plp-section plp-section--paper" id="faq" aria-labelledby="plp-faq-title">
				<div className="plp-wrap plp-faq">
					<div className="plp-faq__aside">
						<Eyebrow num="06">FAQ</Eyebrow>
						<h2 id="plp-faq-title" className="plp-h2">
							Pytania o program partnerski
						</h2>
						<p className="plp-faq__contact">
							Nie ma tu Twojego pytania? Napisz na <a href={`mailto:${LANDING_SELLER.email}`}>{LANDING_SELLER.email}</a> albo
							zadzwoń: <a href={LANDING_SELLER.phoneHref}>{LANDING_SELLER.phoneLabel}</a>.
						</p>
					</div>
					<div className="plp-faq__list">
						{FAQ.map((item, i) => (
							<details key={item.q} className="plp-faq__item" open={i === 0}>
								<summary>
									{item.q}
									<span className="plp-faq__icon" aria-hidden="true" />
								</summary>
								<p className="plp-faq__answer">{item.a}</p>
							</details>
						))}
					</div>
				</div>
			</section>

			{/* Zgłoszenie */}
			<section className="plp-section" id="dolacz" aria-labelledby="plp-apply-title">
				<div className="plp-wrap">
					<div className="plp-apply">
						<div className="plp-apply__side">
							<Eyebrow num="07">{APPLY.eyebrow}</Eyebrow>
							<h2 id="plp-apply-title" className="plp-h2">
								{APPLY.title}
							</h2>
							<p className="plp-lead">{APPLY.lead}</p>
							<ol className="plp-next">
								<li>Oddzwaniamy i odpowiadamy na pytania</li>
								<li>Zakładamy Ci konto partnera w Planopii</li>
								<li>
									Dostajesz link i zarabiasz {TERMS_LABEL.initial}, potem {TERMS_LABEL.later}
								</li>
							</ol>
							<div className="plp-apply__contact">
								<span className="plp-apply__contact-label">{APPLY.altContact}</span>
								<a href={`mailto:${LANDING_SELLER.email}`}>
									<IconMail size={18} />
									{LANDING_SELLER.email}
								</a>
								<a href={LANDING_SELLER.phoneHref}>
									<IconPhone size={18} />
									{LANDING_SELLER.phoneLabel}
								</a>
							</div>
						</div>
						<div className="plp-apply__main">
							<PartnerApplicationForm />
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
