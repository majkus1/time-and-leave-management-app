import Link from 'next/link'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
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
		summaryTitle: string
		summaryPara: string
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
		summaryTitle: 'Podsumowanie',
		summaryPara:
			'Ewidencja czasu pracy na budowie nie musi oznaczać wieczorów z Excelem. Wystarczy spójny system: zbiór danych w jednym miejscu, raporty na kliknięcie i — jeśli chcesz — wsparcie AI przy analizie miesiąca. Zobacz też dedykowany opis pod branżę budowlaną na stronie ',
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
		summaryTitle: 'Summary',
		summaryPara:
			'Site time tracking does not have to mean spreadsheet evenings. A coherent system — one place for data, exports on demand, and optional AI for monthly analysis — is enough to get control without friction. See the construction-focused overview on ',
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
				? 'ewidencja czasu pracy na budowie, firma budowlana, nadgodziny, Planopia, grafik brygad, Kanban, czat zespołowy'
				: 'construction time tracking, building company, overtime, Planopia, crew schedule, Kanban, team chat',
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: locale === 'pl' ? 'Czy ewidencję na budowie da się prowadzić z telefonu?' : 'Can crews log time from a phone?',
				acceptedAnswer: {
					'@type': 'Answer',
					text:
						locale === 'pl'
							? 'Tak — Planopia działa w przeglądarce jako PWA, więc na placu budowy można wygodnie wpisywać czas lub korzystać z podpowiedzi Asystenta AI.'
							: 'Yes — Planopia runs as a browser PWA, so people can log time on site or use the AI assistant where it helps.',
				},
			},
			{
				'@type': 'Question',
				name: locale === 'pl' ? 'Czy Planopia to tylko urlopy?' : 'Is Planopia only for leave?',
				acceptedAnswer: {
					'@type': 'Answer',
					text:
						locale === 'pl'
							? 'Nie — to także tablice zadań, czaty, grafiki i ewidencja czasu w jednym narzędziu dla firmy.'
							: 'No — it also includes boards, chat, schedules, and time tracking in one product.',
				},
			},
		],
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white overflow-x-hidden">
				<article className="max-w-4xl mx-auto px-4 py-10 md:py-14 blogarticlecontent break-words">
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

					<LandingAppScreenshotGallery locale={locale} title={c.galleryTitle} images={LANDING_APP_GALLERY_IMAGES} />

					<section className="mb-10 rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-6" aria-labelledby="sum-h">
						<h2 id="sum-h" className="text-2xl font-bold text-gray-900 mb-3">
							{c.summaryTitle}
						</h2>
						<p className="text-gray-700 m-0">
							{c.summaryPara}
							<Link href={landingPath} className="text-blue-600 font-semibold hover:underline">
								{landingLabel}
							</Link>
							{locale === 'pl' ? ', a następnie ' : ', then '}
							<a href={registerHref} className="text-green-700 font-semibold hover:underline">
								{locale === 'pl'
									? 'załóż zespół — 30 dni próby, potem darmowa ewidencja do 5 kont'
									: 'create your team — 30-day trial, then free time tracking (5 accounts)'}
							</a>
							{locale === 'pl' ? ' w Planopii.' : ' in Planopia.'}
						</p>
					</section>
				</article>
			</main>

			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<Link href={locale === 'pl' ? '/blog' : '/en/blog'}>
					<img src="/img/new-logoplanopia.webp" alt="Planopia" style={{ maxWidth: '180px' }} />
				</Link>
			</footer>
		</>
	)
}
