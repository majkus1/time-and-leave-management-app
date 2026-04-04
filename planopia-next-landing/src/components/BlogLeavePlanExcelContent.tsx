import Link from 'next/link'
import type { ReactNode } from 'react'
import BlogHeroDualCtaCards from './BlogHeroDualCtaCards'
import AnimatedBlogImages from './AnimatedBlogImages'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'

type Locale = 'pl' | 'en'

const UI: Record<
	Locale,
	{
		h1: string
		lead: string
		trialCard: ReactNode
		h2Why: string
		pWhy: string
		h2Structure: string
		pStructure: string
		tableCaption: string
		colEmployee: string
		colDays: string
		colStatus: string
		h2Limits: string
		pLimits: string
		h2Checklist: string
		checklist: string[]
		h2Overtime: string
		pOvertime: string
		h2Hr: string
		pHr: string
		h2Planopia: string
		planopiaList: string[]
		h2Faq: string
		faq: { q: string; a: string }[]
		ctaTitle: string
		ctaLead: string
		ctaBtn: string
		relatedTitle: string
		related: { href: string; label: string }[]
		jsonDesc: string
		jsonKeywords: string
	}
> = {
	pl: {
		h1: 'Roczny plan urlopów: Excel, PDF i aplikacja — co wybrać w 2026?',
		lead:
			'Wielu pracodawców zaczyna od **arkusza Excel** lub **eksportu do PDF**, żeby zobaczyć urlopy zespołu w jednym widoku. To działa przy małej skali — przy większej liczbie osób i częstych zmianach warto rozważyć **program do wniosków urlopowych** z historią i powiadomieniami. Poniżej: praktyczna checklista i jak Planopia mieści się w tym modelu cenowym.',
		trialCard: (
			<>
				<span className="font-semibold text-emerald-900">Urlopy i ewidencja w jednym koncie</span> — 30 dni pełnej
				aplikacji (do 5 osób); potem darmowa ewidencja do 5 kont lub pakiety z urlopami.
			</>
		),
		h2Why: 'Dlaczego szukamy „rocznego planu urlopów” w Excelu lub PDF?',
		pWhy:
			'Zapytania typu „roczny plan urlopów excel darmowy” czy „plan urlopów pdf” wynikają z potrzeby **uporządkowania sald i terminów** bez wdrażania od razu pełnego HR. Excel i PDF są tanie na start, ale nie zastąpią automatycznego obiegu wniosków ani przypomnień — stąd często drugi krok to aplikacja.',
		h2Structure: 'Jak zbudować prosty roczny plan urlopów w arkuszu?',
		pStructure:
			'Minimalny szablon to lista pracowników, przysługujące dni i zaplanowane terminy. Taki plik można udostępniać jako XLSX lub wydrukować do PDF — pamiętaj jednak o **aktualizacji wersji**, gdy ktoś zmieni termin.',
		tableCaption: 'Przykładowa struktura kolumn',
		colEmployee: 'Pracownik / zespół',
		colDays: 'Saldo / plan dni',
		colStatus: 'Status (np. zatwierdzony)',
		h2Limits: 'Ograniczenia Excela i statycznego PDF',
		pLimits:
			'Współedycja wielu osób w Excelu kończy się konfliktem wersji; PDF po wygenerowaniu **nie aktualizuje się sam**. Brakuje też powiązania z faktycznym obiegiem wniosków i powiadomieniami — to obszar, w którym **system urlopowy** w aplikacji daje największy zysk czasu.',
		h2Checklist: 'Program do wniosków urlopowych — co powinien umieć?',
		checklist: [
			'Składanie wniosku przez pracownika i śledzenie statusu (oczekuje / zaakceptowany / odrzucony).',
			'Widok kalendarza lub listy dla zespołu i HR, bez ręcznego scalania plików.',
			'Spójność z ewidencją czasu pracy i nieobecnościami (jeden zapis zamiast dwóch miejsc).',
			'Eksport do PDF/XLSX do archiwum lub kontroli zewnętrznej.',
			'Powiadomienia (e-mail / w aplikacji), żeby zmniejszyć zapomniane akceptacje.',
		],
		h2Overtime: 'A co z nadgodzinami i rozliczeniem czasu pracy?',
		pOvertime:
			'Osobny nurt zapytań w wyszukiwarce to **oprogramowanie do ewidencji nadgodzin** i rejestracja czasu — to uzupełnia plan urlopów: najpierw wiadomo, kto kiedy pracuje, potem łatwiej planować nieobecności. W Planopii ewidencja czasu pracy i urlopy są w jednym koncie zespołu po wybraniu odpowiedniego pakietu. Więcej:',
		h2Hr: 'Program kadrowy dla małej firmy — czy to to samo?',
		pHr:
			'„Program kadrowy urlopy” często oznacza po prostu narzędzie do **wniosków i kalendarza** bez pełnego ERP. Mała firma może zacząć od okresu próbnego z pełną aplikacją, a następnie zostać na **bezpłatnym planie ewidencji** do 5 aktywnych kont lub rozszerzyć pakiet o urlopy — zgodnie z aktualnym modelem Planopii.',
		h2Planopia: 'Jak Planopia wpisuje się w ten scenariusz?',
		planopiaList: [
			'30 dni pełnej aplikacji dla do 5 użytkowników — możesz sprawdzić moduł urlopowy i ewidencję w praktyce.',
			'Po okresie próbnym: darmowa ewidencja czasu pracy do 5 aktywnych kont lub pakiety płatne z urlopami, grafikami, czatem i AI.',
			'Eksporty PDF/XLSX tam, gdzie potrzebujesz kopii „na półkę”.',
		],
		h2Faq: 'Najczęstsze pytania',
		faq: [
			{
				q: 'Czy muszę od razu rezygnować z Excela?',
				a: 'Nie — wiele zespołów migruje etapami: najpierw porządek w arkuszu, potem import lub równoległe prowadzenie urlopów w aplikacji, aż zespół przyzwyczai się do obiegu wniosków.',
			},
			{
				q: 'Czy „roczny plan urlopów 2026 pdf” zastąpi aplikację?',
				a: 'PDF jest dobry do udostępnienia **zdjęcia sytuacji w jednym momencie**. Nie zastąży jednak bieżących zmian ani akceptacji — do tego służy system z uprawnieniami i historią.',
			},
			{
				q: 'Czy Planopia jest darmowa?',
				a: blogArticleOfferLine.pl,
			},
		],
		ctaTitle: 'Przetestuj plan urlopów i ewidencję w jednym miejscu',
		ctaLead: 'Załóż darmowy zespół i oceń moduły w okresie próbnym — bez zobowiązań przed poznaniem interfejsu.',
		ctaBtn: 'Załóż darmowy zespół',
		relatedTitle: 'Powiązane artykuły',
		related: [
			{ href: '/blog/dni-wolne-2026', label: 'Dni wolne 2026 — kalendarz świąt' },
			{ href: '/blog/planowanie-urlopow', label: 'Planowanie urlopów pracowników' },
			{ href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami w firmie' },
			{ href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy', label: 'Darmowa aplikacja do ewidencji czasu pracy' },
		],
		jsonDesc:
			'Roczny plan urlopów w Excelu i PDF versus aplikacja: checklista programu do wniosków urlopowych, ograniczenia arkuszy, migracja do Planopii.',
		jsonKeywords:
			'roczny plan urlopów excel, plan urlopów pdf, program do wniosków urlopowych, program kadrowy urlopy, oprogramowanie do ewidencji nadgodzin, zarządzanie urlopami',
	},
	en: {
		h1: 'Annual leave plan: Excel, PDF, and an app — what to pick in 2026?',
		lead:
			'Many teams start with **Excel** or a **PDF snapshot** to see everyone’s leave in one view. That works at small scale; with more people and frequent changes, a **leave request workflow** with history and notifications pays off. Below: a practical checklist and how Planopia’s pricing model fits.',
		trialCard: (
			<>
				<span className="font-semibold text-emerald-900">Leave and time tracking in one account</span> — 30-day full
				trial (up to 5 users); then free time tracking for 5 accounts or paid plans with leave.
			</>
		),
		h2Why: 'Why people search for an “annual leave plan” in Excel or PDF',
		pWhy:
			'Queries like “annual leave calendar excel” reflect a need to **organise balances and dates** without a full HR suite on day one. Spreadsheets and PDFs are cheap to start but won’t run approvals or reminders — which is where a **leave system** in software helps.',
		h2Structure: 'A minimal leave plan in a spreadsheet',
		pStructure:
			'At minimum: employees, entitled days, and planned dates. You can share XLSX or print PDF — but agree how you **update the master file** when someone changes dates.',
		tableCaption: 'Example column layout',
		colEmployee: 'Employee / team',
		colDays: 'Balance / planned days',
		colStatus: 'Status (e.g. approved)',
		h2Limits: 'Limits of Excel and static PDF',
		pLimits:
			'Multi-editor Excel often ends in conflicting file versions; a exported **PDF does not update itself**. You also miss a real request/approval trail — that is where an **online leave app** saves the most time.',
		h2Checklist: 'Leave request software — what it should do',
		checklist: [
			'Employees submit requests and track status (pending / approved / rejected).',
			'Team/HR calendar or list view without merging files manually.',
			'Aligned with time tracking and absences (one system of record).',
			'PDF/XLSX export for archive or audits.',
			'Notifications so approvals are not forgotten.',
		],
		h2Overtime: 'Overtime and working time records',
		pOvertime:
			'Search demand often pairs **leave planning** with **time tracking and overtime**. Recording hours first makes leave planning easier. In Planopia, time tracking and leave sit in the same team account on eligible plans. Read more:',
		h2Hr: '“HR leave program” for a small business — what does it mean?',
		pHr:
			'It usually means **requests and a calendar**, not a full ERP. You can start with the full-product trial, then stay on the **free time tracking tier** for up to 5 active accounts or upgrade for leave and other HR modules — per Planopia’s current model.',
		h2Planopia: 'How Planopia fits',
		planopiaList: [
			'30-day full trial for up to 5 users — try leave and time tracking together.',
			'After the trial: free time tracking for up to 5 active accounts, or paid plans with leave, schedules, chat, and AI.',
			'PDF/XLSX exports where you need a file copy.',
		],
		h2Faq: 'FAQ',
		faq: [
			{
				q: 'Do we have to drop Excel immediately?',
				a: 'No — many teams migrate gradually: tidy spreadsheet first, then run leave in the app in parallel until the team adopts approvals.',
			},
			{
				q: 'Can a PDF replace an app?',
				a: 'A PDF is a **snapshot**. It will not update live or route approvals — use it for sharing a point-in-time view, not ongoing workflow.',
			},
			{
				q: 'Is Planopia free?',
				a: blogArticleOfferLine.en,
			},
		],
		ctaTitle: 'Try leave and time tracking in one place',
		ctaLead: 'Create a free team and explore the trial — no commitment before you test the UI.',
		ctaBtn: 'Create your free team',
		relatedTitle: 'Related articles',
		related: [
			{ href: '/en/blog/leave-planning', label: 'Leave planning — tools and practices' },
			{ href: '/en/blog/leave-management', label: 'Leave management guide' },
			{ href: '/en/blog/free-time-tracking-app', label: 'Free time tracking after the trial' },
		],
		jsonDesc:
			'Annual leave plan in Excel and PDF vs app: leave request checklist, spreadsheet limits, and migrating to Planopia.',
		jsonKeywords:
			'annual leave plan excel, leave calendar pdf, leave request software, overtime tracking software, HR leave app',
	},
}

/** Zamienia fragmenty **pogrubienie** na <strong> (bez widocznych gwiazdek). */
function RichInline({ text }: { text: string }) {
	const parts = text.split('**')
	return (
		<>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<strong key={i}>{part}</strong>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</>
	)
}

function LeadRich({ text }: { text: string }) {
	return (
		<p className="text-gray-700 text-lg leading-relaxed">
			<RichInline text={text} />
		</p>
	)
}

function stripBoldMarkersForJsonLd(s: string): string {
	return s.replace(/\*\*(.+?)\*\*/g, '$1')
}

export default function BlogLeavePlanExcelContent({ locale }: { locale: Locale }) {
	const t = UI[locale]
	const url =
		locale === 'pl'
			? 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja'
			: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app'
	const datePublished = '2026-03-27'
	const overtimeHref =
		locale === 'pl' ? '/blog/ewidencja-czasu-pracy-online' : '/en/blog/time-tracking-online'

	const blogPostingSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: t.h1,
		description: t.jsonDesc,
		image: ['https://planopia.pl/img/roczny-plan.webp'],
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/planopiaheader.webp' },
		},
		url,
		datePublished,
		dateModified: datePublished,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		keywords: t.jsonKeywords,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: t.faq.map(item => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: stripBoldMarkersForJsonLd(item.a) },
		})),
	}

	const desktopHeroImages =
		locale === 'en'
			? [
					{ src: '/img/request-en.webp', alt: 'Leave request form in Planopia' },
					{ src: '/img/plan-leave-en.webp', alt: 'Leave plans and calendar in the Planopia app' },
					{ src: '/img/calendar-plan-urlop-en.webp', alt: 'Leave calendar plan in Planopia' },
				]
			: [
					{
						src: '/img/plans-urlopnew.webp',
						alt: 'Widok kalendarza urlopów w aplikacji Planopia',
					},
					{
						src: '/img/wniosek-urlop.webp',
						alt: 'Formularz wniosku urlopowego w Planopii',
					},
					{
						src: '/img/calendar-plan-urlop.webp',
						alt: 'Plan kalendarza urlopów w Planopii',
					},
				]

	const mobileHeroImages =
		locale === 'en'
			? [
					{ src: '/img/moje-plany-mobile-en.webp', alt: 'Leave plans — mobile view' },
					{ src: '/img/reques-en-mob.webp', alt: 'Leave request — mobile view' },
					{ src: '/img/urlopy-plany-mob-en.webp', alt: 'Leave calendar plan — mobile view' },
				]
			: [
					{
						src: '/img/moje-plany-mobile.webp',
						alt: 'Kalendarz urlopów — widok mobilny',
					},
					{
						src: '/img/wniosek-urlop-mob.webp',
						alt: 'Wniosek urlopowy — widok mobilny',
					},
					{
						src: '/img/urlopy-plany-mob.webp',
						alt: 'Plan kalendarza urlopów — widok mobilny',
					},
				]

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>

			<section
				className="px-4 py-10 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/50"
				id="blog-hero"
			>
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="grid xl:grid-cols-2 gap-10 items-center">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700/90 mb-2">
								{locale === 'pl' ? 'Planowanie urlopów' : 'Leave planning'}
							</p>
							<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">{t.h1}</h1>
							<LeadRich text={t.lead} />
							<div className="mt-6">
								<BlogHeroDualCtaCards locale={locale} trial={t.trialCard} />
							</div>
						</div>
						<AnimatedBlogImages
							desktopImages={desktopHeroImages}
							mobileImages={mobileHeroImages}
							interval={5200}
						/>
					</div>
				</div>
			</section>

			<main>
				<article className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-14">
					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Why}</h2>
					<p className="text-gray-700 mb-8 leading-relaxed">
						<RichInline text={t.pWhy} />
					</p>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Structure}</h2>
					<p className="text-gray-700 mb-4 leading-relaxed">
						<RichInline text={t.pStructure} />
					</p>
					<div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden mb-8 shadow-sm">
						<table className="w-full text-sm text-left">
							<caption className="px-4 py-3 text-left text-slate-600 border-b border-slate-200 bg-white/80">
								{t.tableCaption}
							</caption>
							<thead>
								<tr className="border-b border-slate-200 bg-white">
									<th scope="col" className="px-4 py-3 font-semibold text-gray-900">
										{t.colEmployee}
									</th>
									<th scope="col" className="px-4 py-3 font-semibold text-gray-900">
										{t.colDays}
									</th>
									<th scope="col" className="px-4 py-3 font-semibold text-gray-900">
										{t.colStatus}
									</th>
								</tr>
							</thead>
							<tbody className="text-gray-700">
								<tr className="border-b border-slate-100">
									<td className="px-4 py-2.5">…</td>
									<td className="px-4 py-2.5">…</td>
									<td className="px-4 py-2.5">…</td>
								</tr>
							</tbody>
						</table>
					</div>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Limits}</h2>
					<p className="text-gray-700 mb-8 leading-relaxed">
						<RichInline text={t.pLimits} />
					</p>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Checklist}</h2>
					<ul className="list-none space-y-3 mb-8">
						{t.checklist.map((item, i) => (
							<li
								key={i}
								className="flex gap-3 rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-4 py-3 text-gray-800 leading-relaxed"
							>
								<span
									className="blog-leave-checklist-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold"
									aria-hidden
								>
									{i + 1}
								</span>
								<span>{item}</span>
							</li>
						))}
					</ul>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Overtime}</h2>
					<p className="text-gray-700 mb-4 leading-relaxed">
						<RichInline text={t.pOvertime} />{' '}
						<Link
							href={overtimeHref}
							className="font-medium text-emerald-700 underline-offset-2 hover:underline"
						>
							{locale === 'pl' ? 'ewidencja czasu pracy online' : 'online time tracking'}
						</Link>
						{locale === 'pl' ? ' — oraz ' : ' — and '}
						<Link
							href={locale === 'pl' ? '/blog/elektroniczna-ewidencja-czasu-pracy' : '/en/blog/electronic-time-tracking'}
							className="font-medium text-emerald-700 underline-offset-2 hover:underline"
						>
							{locale === 'pl' ? 'elektroniczna ewidencja czasu pracy' : 'electronic time tracking guide'}
						</Link>
						.
					</p>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Hr}</h2>
					<p className="text-gray-700 mb-8 leading-relaxed">
						<RichInline text={t.pHr} />
					</p>

					<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">{t.h2Planopia}</h2>
					<ul className="list-disc pl-6 mb-8 text-gray-700 space-y-2 leading-relaxed">
						{t.planopiaList.map((line, i) => (
							<li key={i}>
								<RichInline text={line} />
							</li>
						))}
					</ul>

					<section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm mb-10" aria-labelledby="faq-leave-excel">
						<h2 id="faq-leave-excel" className="text-2xl font-semibold text-gray-900 mb-5">
							{t.h2Faq}
						</h2>
						<dl className="space-y-6">
							{t.faq.map((item, i) => (
								<div key={i}>
									<dt className="font-semibold text-gray-900">{item.q}</dt>
									<dd className="mt-1 text-gray-700 leading-relaxed">
										<RichInline text={item.a} />
									</dd>
								</div>
							))}
						</dl>
					</section>

					<section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/30 p-6 md:p-8 shadow-sm ring-1 ring-emerald-100/50 mb-10">
						<h3 className="text-xl md:text-2xl font-bold text-gray-900 m-0">{t.ctaTitle}</h3>
						<p className="mt-2 text-gray-600 leading-relaxed mb-6">{t.ctaLead}</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="blog-leave-excel-cta inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold shadow-md transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
						>
							{t.ctaBtn}
						</Link>
					</section>

					<nav className="border-t border-slate-200 pt-8" aria-label={t.relatedTitle}>
						<p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{t.relatedTitle}</p>
						<ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
							{t.related.map(r => (
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
				</article>
			</main>

		</>
	)
}
