import Link from 'next/link'
import { HOW_TO_SECTIONS, type HowToLocale, type HowToSection } from '@/data/howToUseSections'

const UI = {
	pl: {
		eyebrow: 'Instrukcja',
		h1: 'Jak korzystać z Planopii — instrukcja krok po kroku',
		lead: 'Ta sama instrukcja, którą znajdziesz w aplikacji pod przyciskiem „Jak korzystać?". Opisuje każdy ekran po kolei: od pierwszego logowania, przez ewidencję czasu i wnioski urlopowe, po ustawienia zespołu i raporty.',
		tocHeading: 'Spis treści',
		grupaWszyscy: 'Dla każdego użytkownika',
		grupaRole: 'Dla Administratora, HR i przełożonego',
		badge: 'Admin / HR / przełożony',
		notkaRole: 'Poniższe ekrany widzą w aplikacji wyłącznie osoby z rolą Administratora, HR albo przełożonego. Zwykły pracownik ich nie zobaczy.',
		ctaTitle: 'Sprawdź to w praktyce',
		ctaLead: '30 dni pełnej aplikacji za darmo, dla zespołu do 5 osób, bez podawania karty.',
		ctaButton: 'Załóż darmowy zespół',
		ctaSecondary: 'Umów rozmowę',
		ctaSecondaryHref: '/kontakt',
		breadcrumb: 'Instrukcja',
	},
	en: {
		eyebrow: 'User guide',
		h1: 'How to use Planopia — a step-by-step guide',
		lead: 'The same guide you get inside the app under the “How to use?” button. It walks through every screen in order: from the first login, through time records and leave requests, to team settings and reports.',
		tocHeading: 'Contents',
		grupaWszyscy: 'For every user',
		grupaRole: 'For admins, HR, and supervisors',
		badge: 'Admin / HR / supervisor',
		notkaRole: 'The screens below are visible in the app only to users with an Administrator, HR, or supervisor role. A regular employee will not see them.',
		ctaTitle: 'See it in practice',
		ctaLead: '30 days of the full app for free, for a team of up to 5 people, no card required.',
		ctaButton: 'Create your free team',
		ctaSecondary: 'Book a call',
		ctaSecondaryHref: '/en#contact',
		breadcrumb: 'User guide',
	},
} as const

const REGISTER_HREF = 'https://app.planopia.pl/team-registration'

/**
 * Treść z aplikacji używa pustych linii jako granic akapitów, a wierszy zaczynających
 * się od „–" jako wypunktowania. Aplikacja dodatkowo tnie długie akapity na zdania,
 * bo modal jest wąski — na stronie nie jest to potrzebne.
 */
function bloki(tekst: string): Array<{ typ: 'akapit'; tekst: string } | { typ: 'lista'; pozycje: string[] }> {
	const wiersze = tekst
		.split('\n')
		.map(w => w.trim())
		.filter(Boolean)

	const wynik: Array<{ typ: 'akapit'; tekst: string } | { typ: 'lista'; pozycje: string[] }> = []
	const punkt = /^[–-]\s+/
	let i = 0
	while (i < wiersze.length) {
		if (punkt.test(wiersze[i])) {
			const pozycje: string[] = []
			while (i < wiersze.length && punkt.test(wiersze[i])) {
				pozycje.push(wiersze[i].replace(punkt, ''))
				i++
			}
			wynik.push({ typ: 'lista', pozycje })
			continue
		}
		wynik.push({ typ: 'akapit', tekst: wiersze[i] })
		i++
	}
	return wynik
}

/**
 * Prefiks jest konieczny: identyfikatory sekcji pochodzą z aplikacji i część z nich
 * (`leave-planner`, `leave-request`) pokrywa się z identyfikatorami widgetów, dla
 * których globals.css ma własne reguły szerokości. Bez prefiksu sekcja przejmowała
 * style kalendarza i renderowała się węższa oraz przesunięta.
 */
const domId = (id: string) => `instrukcja-${id}`

function Sekcja({ sekcja, locale, badge }: { sekcja: HowToSection; locale: HowToLocale; badge: string }) {
	return (
		<section id={domId(sekcja.id)} className="scroll-mt-24 border-t border-slate-200 pt-8">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="m-0 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
					{sekcja.title[locale]}
				</h2>
				{sekcja.dlaRoli ? (
					<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{badge}</span>
				) : null}
			</div>
			{sekcja.description ? (
				<p className="mt-2 text-lg leading-relaxed text-slate-600">{sekcja.description[locale]}</p>
			) : null}
			<div className="mt-4 flex flex-col gap-4">
				{bloki(sekcja.content[locale]).map((blok, idx) =>
					blok.typ === 'lista' ? (
						<ul key={idx} className="list-disc space-y-2 pl-6 leading-relaxed text-slate-700">
							{blok.pozycje.map(p => (
								<li key={p}>{p}</li>
							))}
						</ul>
					) : (
						<p key={idx} className="leading-relaxed text-slate-700">
							{blok.tekst}
						</p>
					)
				)}
			</div>
			{sekcja.externalLink && sekcja.externalLinkLabel ? (
				<p className="mt-4">
					<Link
						href={sekcja.externalLink.replace('https://planopia.pl', '')}
						className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
					>
						{sekcja.externalLinkLabel[locale]} →
					</Link>
				</p>
			) : null}
		</section>
	)
}

export default function HowToUseGuide({ locale }: { locale: HowToLocale }) {
	const t = UI[locale]
	const wszyscy = HOW_TO_SECTIONS.filter(s => !s.dlaRoli)
	const dlaRoli = HOW_TO_SECTIONS.filter(s => s.dlaRoli)
	const canonical = locale === 'pl' ? 'https://planopia.pl/jak-korzystac' : 'https://planopia.pl/en/how-to-use'

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: t.h1,
		description: t.lead,
		author: { '@type': 'Person', name: 'Michał Lipka', url: 'https://planopia.pl/o-autorze' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
		url: canonical,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Planopia',
				item: locale === 'pl' ? 'https://planopia.pl' : 'https://planopia.pl/en',
			},
			{ '@type': 'ListItem', position: 2, name: t.breadcrumb, item: canonical },
		],
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

			<main className="bg-white">
				<article>
					<header className="border-b border-slate-200 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/40">
						<div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 md:py-16">
							<p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">{t.eyebrow}</p>
							<h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{t.h1}</h1>
							<p className="mt-4 text-lg leading-relaxed text-slate-700">{t.lead}</p>
						</div>
					</header>

					<div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 md:py-14">
						<nav className="rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">
								{t.tocHeading}
							</h2>
							<p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
								{t.grupaWszyscy}
							</p>
							<ol className="mt-2 grid gap-1.5 leading-relaxed text-slate-700 sm:grid-cols-2">
								{wszyscy.map(s => (
									<li key={s.id}>
										<a className="text-emerald-700 hover:underline" href={`#${domId(s.id)}`}>
											{s.title[locale]}
										</a>
									</li>
								))}
							</ol>
							<p className="mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{t.grupaRole}</p>
							<ol className="mt-2 grid gap-1.5 leading-relaxed text-slate-700 sm:grid-cols-2">
								{dlaRoli.map(s => (
									<li key={s.id}>
										<a className="text-emerald-700 hover:underline" href={`#${domId(s.id)}`}>
											{s.title[locale]}
										</a>
									</li>
								))}
							</ol>
						</nav>

						<div className="mt-10 flex flex-col gap-10">
							{wszyscy.map(s => (
								<Sekcja key={s.id} sekcja={s} locale={locale} badge={t.badge} />
							))}
						</div>

						<div className="mt-12 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-5 py-4">
							<p className="m-0 leading-relaxed text-slate-800">{t.notkaRole}</p>
						</div>

						<div className="mt-10 flex flex-col gap-10">
							{dlaRoli.map(s => (
								<Sekcja key={s.id} sekcja={s} locale={locale} badge={t.badge} />
							))}
						</div>

						<section className="mt-14 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
							<h2 className="m-0 text-2xl font-semibold text-slate-900">{t.ctaTitle}</h2>
							<p className="mt-2 leading-relaxed text-slate-700">{t.ctaLead}</p>
							<div className="mt-5 flex flex-wrap gap-3">
								<Link
									href={REGISTER_HREF}
									className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline transition hover:bg-emerald-700"
								>
									{t.ctaButton}
								</Link>
								<Link
									href={t.ctaSecondaryHref}
									className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 bg-white px-6 py-3 font-semibold !text-emerald-700 no-underline transition hover:bg-emerald-50"
								>
									{t.ctaSecondary}
								</Link>
							</div>
						</section>
					</div>
				</article>
			</main>
		</>
	)
}
