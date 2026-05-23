import Link from 'next/link'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import BlogRelatedLinks from './BlogRelatedLinks'
import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import { LANDING_APP_GALLERY_IMAGES } from '../data/landingAppGallery'

type Locale = 'pl' | 'en'

const COPY: Record<
	Locale,
	{
		title: string
		intro: string
		galleryTitle: string
		videoEyebrow: string
		videoTitle: string
		videoBody: string
		videoCta: string
		videoHref: string
		problemTitle: string
		problemBullets: string[]
		solutionTitle: string
		solutionIntro: string
		solutionBridge: string
		solutionBullets: string[]
		autoTitle: string
		autoBullets: string[]
		aiTitle: string
		aiParas: string[]
		dailyTitle: string
		dailyParas: string[]
		crewTitle: string
		crewLead: string
		crewBullets: string[]
		faqTitle: string
		faqs: { q: string; a: string }[]
		ctaTitle: string
		ctaBody: string
		ctaButton: string
	}
> = {
	pl: {
		title: 'Jak prowadzić ewidencję czasu pracy na budowie (prosto i bez Excela)',
		intro:
			'Ewidencja czasu pracy na budowie to jeden z najczęstszych problemów w firmach budowlanych. Godziny lądują na kartkach, w SMS-ach albo w arkuszach — stąd błędy, spory i brak pewności przy rozliczeniach. Poniżej: jak to uprościć i jednocześnie dać zespołowi narzędzie na co dzień (nie tylko „do urlopów”).',
		galleryTitle: 'Planopia w praktyce — zrzuty z aplikacji (desktop i telefon)',
		videoEyebrow: 'Instrukcja wideo',
		videoTitle: 'Wolisz zobaczyć kliknięcia w aplikacji?',
		videoBody:
			'Mamy krótkie poradniki wideo z Planopii — m.in. jak ręcznie dodać godziny w ewidencji. Obejrzysz na telefonie lub komputerze.',
		videoCta: 'Otwórz instrukcję wideo Planopii',
		videoHref: '/blog/instrukcja-wideo-planopia',
		problemTitle: 'Jak to wygląda w praktyce',
		problemBullets: [
			'Brak jednej listy godzin — każdy kierownik prowadzi „swoje” notatki.',
			'Trudne rozliczenie nadgodzin i pracy w terenie.',
			'Brak przejrzystego dowodu: kto był na budowie i kiedy.',
			'Chaos przy urlopach — nie wiadomo, kogo wstawić na zmianę.',
		],
		solutionTitle: 'Najprostsza zmiana: jeden system zamiast pięciu narzędzi',
		solutionIntro:
			'Zamiast Excela i rozproszonych wiadomości warto wdrożyć jeden system do ewidencji czasu pracy i organizacji pracy. W Planopii pracownicy wpisują godziny lub korzystają z telefonu na budowie, a biuro widzi kalendarz, raporty i grafik w jednym miejscu.',
		solutionBridge: 'To samo konto może służyć do codziennej pracy:',
		solutionBullets: [
			'ewidencja i nadgodziny z podglądem miesiąca;',
			'grafiki i urlopy — mniej telefonów „kto dziś wchodzi?”;',
			'tablice zadań (Kanban) — zlecenia, fazy i statusy dla biura i ekip;',
			'czaty zespołowe — ustalenia przy konkretnej budowie zamiast rozjeżdżających się wątków.',
		],
		autoTitle: 'Co daje automatyzacja raportów',
		autoBullets: [
			'Oszczędność czasu biura — mniej przepisywania do arkuszy.',
			'Mniejsze ryzyko pomyłek przy sumowaniu godzin.',
			'PDF i Excel na żądanie — np. pod klienta lub kontrolę wewnętrzną.',
			'Lepsza kontrola nad nadgodzinami dzięki przejrzystemu kalendarzowi.',
		],
		aiTitle: 'AI w praktyce (Asystent w Planopii)',
		aiParas: [
			'Nowoczesne systemy potrafią wspierać analizę danych, które już zbierasz. W Planopii Asystent AI może pomóc m.in. w podsumowaniu miesiąca, szybszym wyłapaniu nadgodzin i przygotowaniu treści raportów — bez ręcznego sklejania wielu widoków.',
		],
		dailyTitle: 'Dlaczego warto myśleć „aplikacja na co dzień”, a nie tylko „do ewidencji”',
		dailyParas: [
			'Firmy, które wygrywają z wdrożeniami HR i operacyjnymi, zwykle wybierają jedno spójne narzędzie: tam, gdzie pracownik i tak spędza czas (zadania, komunikacja), pojawia się też prawidłowo uzupełniany czas pracy. Dlatego w Planopii obok ewidencji są tablice zadań i czaty — żeby zespół nie musiał skakać między pięcioma aplikacjami.',
		],
		crewTitle: 'Brygadzista, ewidencja czasu pracy i pracownicy bez konta',
		crewLead:
			'W wielu firmach budowlanych nie każdy członek ekipy ma smartfon z aplikacją — a i tak trzeba rozliczyć brygadę i mieć raport czasu pracy na budowie. W Planopii kierownik lub brygadzista może dodać pracowników bez dostępu do aplikacji i prowadzić za nich ewidencję (także w planie darmowym).',
		crewBullets: [
			'Rozliczanie brygad bez wymuszania logowania na każdego — jedno konto kierownika zamiast dziesiątek haseł.',
			'Ewidencja pracowników budowlanych w kalendarzu miesięcznym, z nadgodzinami i eksportem PDF/Excel.',
			'Grafiki i urlopy za ekipę — po rozszerzeniu planu, gdy potrzebujesz pełnego HR na budowie.',
		],
		faqTitle: 'Najczęstsze pytania (budowa)',
		faqs: [
			{
				q: 'Czy każdy pracownik musi mieć dostęp do aplikacji?',
				a: 'Nie. Brygadzista lub kierownik może dodać pracowników bez dostępu do aplikacji i samodzielnie prowadzić ich ewidencję czasu pracy — to ułatwia rozliczanie brygad na budowie. W planie darmowym: ewidencja; grafiki i wnioski urlopowe za ekipę — w planie płatnym.',
			},
			{
				q: 'Czy ewidencję na budowie da się prowadzić z telefonu?',
				a: 'Tak — Planopia działa w przeglądarce jako PWA. Brygadzista może wpisywać godziny z placu budowy lub korzystać z Asystenta AI przy podsumowaniach.',
			},
			{
				q: 'Czy Planopia to tylko urlopy?',
				a: 'Nie — to ewidencja, grafiki, tablice zadań, czat i AI w jednym narzędziu. Dla budowlanki szczególnie ważna jest ewidencja brygad i pracowników terenowych.',
			},
		],
		ctaTitle: 'Porządek na budowie i w biurze?',
		ctaBody:
			'30 dni pełnej aplikacji; potem darmowa ewidencja (5 kont) lub plan płatny — urlopy, grafik, czat, AI.',
		ctaButton: 'Załóż zespół — 30 dni gratis',
	},
	en: {
		title: 'How to track time on construction sites (simply, without spreadsheets)',
		intro:
			'Construction time tracking is one of the messiest operational topics for building companies. Hours end up on paper, in texts, or in spreadsheets — which means errors, disputes, and weak audit trails. Here is a simpler approach that also gives your team an everyday tool (not “only for leave”).',
		galleryTitle: 'Planopia in practice — desktop and mobile screenshots',
		videoEyebrow: 'Video tutorials',
		videoTitle: 'Prefer to watch clicks inside the app?',
		videoBody:
			'We publish short Planopia tutorials — for example, how to manually add hours in the time log. Watch on your phone or desktop.',
		videoCta: 'Open Planopia video tutorials',
		videoHref: '/en/blog/video-tutorials',
		problemTitle: 'What it looks like in the real world',
		problemBullets: [
			'No single source of truth for hours — each supervisor keeps their own notes.',
			'Overtime and field work are hard to reconcile fairly.',
			'Weak visibility into who was on site and when.',
			'Leave chaos — nobody knows who can cover the shift.',
		],
		solutionTitle: 'The simplest shift: one system instead of five tools',
		solutionIntro:
			'Instead of spreadsheets and scattered messages, use one system for time tracking and day-to-day operations. In Planopia, people log hours or use their phone on site, while the office sees calendars, reports, and schedules in one place.',
		solutionBridge: 'The same workspace supports everyday work:',
		solutionBullets: [
			'time tracking and overtime with a clear monthly view;',
			'schedules and leave — fewer “who is on today?” calls;',
			'Kanban boards — jobs, phases, and status for office and crews;',
			'team chat — decisions tied to a site instead of random threads.',
		],
		autoTitle: 'What automation changes',
		autoBullets: [
			'Less admin time — fewer copy-paste marathons.',
			'Lower error risk when hours are summed consistently.',
			'PDF and Excel exports when you need a client-ready pack.',
			'Easier overtime control with a transparent calendar.',
		],
		aiTitle: 'AI in practice (Planopia assistant)',
		aiParas: [
			'Modern tools can help analyze data you already collect. Planopia’s AI assistant can support month summaries, spotting overtime patterns, and drafting report text — with less manual stitching across views.',
		],
		dailyTitle: 'Why “an app for every day” beats “only time tracking”',
		dailyParas: [
			'Teams adopt tools that sit where work already happens. When tasks and chat live next to time tracking, data stays fresher and the team jumps between fewer apps. That is why Planopia combines boards and chat with schedules and time tracking.',
		],
		crewTitle: 'Foreman time tracking when not everyone has an app account',
		crewLead:
			'On many sites not every crew member logs in — you still need crew payroll and construction time reporting. In Planopia a foreman or manager adds no-access workers and maintains their timesheets (including on the free plan).',
		crewBullets: [
			'Crew settlement without forcing every worker to install and log in.',
			'Construction worker timesheets in a monthly calendar, with overtime and PDF/Excel exports.',
			'Schedules and leave on behalf of the crew — on paid plans when you need full HR on site.',
		],
		faqTitle: 'FAQ (construction)',
		faqs: [
			{
				q: 'Does every employee need access to the app?',
				a: 'No. A foreman or manager can add no-access workers and maintain their timesheets — ideal for crew time tracking on site. Free plan: timesheets; schedules and leave on their behalf — on paid plans.',
			},
			{
				q: 'Can crews log time from a phone?',
				a: 'Yes — Planopia runs as a browser PWA. Foremen can enter hours on site or use the AI assistant for summaries.',
			},
			{
				q: 'Is Planopia only for leave?',
				a: 'No — time tracking, schedules, boards, chat, and AI in one product. Construction teams especially value crew timesheets without universal logins.',
			},
		],
		ctaTitle: 'Site and office under control?',
		ctaBody:
			'30 days full access; then free time tracking (5 accounts) or a paid plan — leave, schedules, chat, AI.',
		ctaButton: 'Create your team — 30 days free',
	},
}

type Props = { locale: Locale }

export default function BlogConstructionTimeTrackingArticle({ locale }: Props) {
	const c = COPY[locale]
	const urlPl = 'https://planopia.pl/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie'
	const urlEn = 'https://planopia.pl/en/blog/time-tracking-on-construction-sites'
	const url = locale === 'pl' ? urlPl : urlEn
	const landingPath = locale === 'pl' ? '/dla-branzy-budowlanej' : '/en/for-construction-industry'
	const landingLabel = locale === 'pl' ? 'Planopia dla firm budowlanych' : 'Planopia for construction companies'
	const registerHref = 'https://app.planopia.pl/team-registration'

	const blogPostingSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: c.title,
		description: c.intro.slice(0, 220),
		image: ['https://planopia.pl/img/worktimeblog.webp'],
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/planopiaheader.webp' },
		},
		url,
		datePublished: '2026-03-24',
		dateModified: '2026-03-24',
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		wordCount: 1200,
		keywords:
			locale === 'pl'
				? 'ewidencja czasu pracy na budowie, brygadzista ewidencja czasu pracy, rozliczanie brygad, ewidencja pracowników budowlanych, raportowanie czasu pracy na budowie, firma budowlana, Planopia'
				: 'construction time tracking, foreman time tracking, crew payroll, construction workers timesheet, site time reporting, Planopia',
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
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
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white overflow-x-hidden">
				<article className="max-w-4xl mx-auto px-4 pt-10 md:pt-14 pb-4 md:pb-5 blogarticlecontent break-words">
					<header className="mb-8">
						<h1 className="construction-industry-h1 text-gray-900 mb-4 leading-tight">{c.title}</h1>
						<p className="text-gray-600 text-lg leading-relaxed">{c.intro}</p>
					</header>

					<section
						className="construction-video-card mb-10 rounded-2xl border border-blue-100/90 bg-gradient-to-b from-blue-50/90 to-slate-50 px-5 py-6 shadow-sm md:px-7 md:py-7"
						aria-labelledby="blog-construction-video">
						<div className="mx-auto flex max-w-2xl flex-col gap-3 md:gap-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-800/90">{c.videoEyebrow}</p>
							<h2 id="blog-construction-video" className="text-xl font-bold leading-snug text-gray-900 md:text-2xl">
								{c.videoTitle}
							</h2>
							<p className="text-sm leading-relaxed text-gray-600 md:text-base">{c.videoBody}</p>
							<div className="pt-1">
								<Link
									href={c.videoHref}
									className="construction-solid-btn construction-solid-btn--blue inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold shadow-md transition hover:bg-blue-700 sm:w-auto sm:px-6">
									{c.videoCta}
								</Link>
							</div>
						</div>
					</section>

					<section className="mb-10" aria-labelledby="problem-h">
						<h2 id="problem-h" className="text-2xl font-bold text-gray-900 mb-4">
							{c.problemTitle}
						</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							{c.problemBullets.map((b, i) => (
								<li key={i}>{b}</li>
							))}
						</ul>
					</section>

					<section className="mb-10" aria-labelledby="sol-h">
						<h2 id="sol-h" className="text-2xl font-bold text-gray-900 mb-4">
							{c.solutionTitle}
						</h2>
						<p className="text-gray-700 mb-2">{c.solutionIntro}</p>
						<p className="text-gray-700 mb-2 font-medium">{c.solutionBridge}</p>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							{c.solutionBullets.map((b, i) => (
								<li key={i}>{b}</li>
							))}
						</ul>
						<p className="text-gray-700 mt-4">
							<Link href={landingPath} className="text-blue-600 font-semibold hover:underline">
								{landingLabel}
							</Link>
							{locale === 'pl'
								? ' — krótki opis problemów, funkcji i FAQ pod branżę budowlaną.'
								: ' — a short overview with features and FAQs for construction teams.'}
						</p>
					</section>

					<section className="mb-10" aria-labelledby="auto-h">
						<h2 id="auto-h" className="text-2xl font-bold text-gray-900 mb-4">
							{c.autoTitle}
						</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							{c.autoBullets.map((b, i) => (
								<li key={i}>{b}</li>
							))}
						</ul>
					</section>

					<section className="mb-10" aria-labelledby="ai-h">
						<h2 id="ai-h" className="text-2xl font-bold text-gray-900 mb-4">
							{c.aiTitle}
						</h2>
						<div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/40 shadow-sm">
							<ConstructionAiAssistantScreenshot locale={locale} />
						</div>
						<p className="text-gray-700">{c.aiParas[0]}</p>
					</section>

					<section className="mb-10" aria-labelledby="daily-h">
						<h2 id="daily-h" className="text-2xl font-bold text-gray-900 mb-4">
							{c.dailyTitle}
						</h2>
						<p className="text-gray-700">{c.dailyParas[0]}</p>
					</section>

					<section
						className="mb-10 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white px-5 py-6 md:px-7 md:py-7"
						aria-labelledby="crew-h"
					>
						<h2 id="crew-h" className="text-2xl font-bold text-gray-900 mb-3">
							{c.crewTitle}
						</h2>
						<p className="text-gray-700 mb-4 leading-relaxed">{c.crewLead}</p>
						<ul className="list-disc pl-5 space-y-2 text-gray-700 m-0">
							{c.crewBullets.map((b, i) => (
								<li key={i}>{b}</li>
							))}
						</ul>
						<p className="text-gray-700 mt-4 mb-0">
							<Link href={landingPath} className="text-blue-600 font-semibold hover:underline">
								{landingLabel}
							</Link>
							{locale === 'pl' ? ' — pełny opis funkcji i FAQ.' : ' — full feature overview and FAQ.'}
						</p>
					</section>

					<section className="mb-10" aria-labelledby="blog-faq-h">
						<h2 id="blog-faq-h" className="text-2xl font-bold text-gray-900 mb-5">
							{c.faqTitle}
						</h2>
						<div className="space-y-4">
							{c.faqs.map((f, i) => (
								<div
									key={i}
									className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 md:p-6"
								>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
									<p className="text-gray-700 m-0 leading-relaxed">{f.a}</p>
								</div>
							))}
						</div>
					</section>

					<LandingAppScreenshotGallery locale={locale} title={c.galleryTitle} images={LANDING_APP_GALLERY_IMAGES} />

					<section className="mb-0" aria-labelledby="construction-blog-cta-h">
						<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-5 sm:p-8 rounded-2xl shadow-sm">
							<h2
								id="construction-blog-cta-h"
								className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug">
								{c.ctaTitle}
							</h2>
							<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-3xl mx-auto leading-snug sm:leading-relaxed">
								{c.ctaBody}
							</p>
							<Link
								href={registerHref}
								className="inline-block bg-green-600 text-white font-semibold py-3 px-5 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn text-center max-w-full">
								{c.ctaButton}
							</Link>
						</div>
					</section>

					<BlogRelatedLinks
						slug={
							locale === 'pl'
								? 'jak-prowadzic-ewidencje-czasu-pracy-na-budowie'
								: 'time-tracking-on-construction-sites'
						}
						locale={locale}
						className="mt-10"
					/>
				</article>
			</main>
		</>
	)
}
