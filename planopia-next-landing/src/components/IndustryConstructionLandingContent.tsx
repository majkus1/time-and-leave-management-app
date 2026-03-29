import Link from 'next/link'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import { LANDING_APP_GALLERY_IMAGES } from '../data/landingAppGallery'

type Locale = 'pl' | 'en'

const COPY: Record<
	Locale,
	{
		heroH1: string
		heroSub: string
		galleryTitle: string
		videoEyebrow: string
		videoTitle: string
		videoBody: string
		videoCta: string
		videoHref: string
		problemsTitle: string
		problems: string[]
		solutionTitle: string
		solutionIntro: string
		features: string[]
		aiTitle: string
		aiBullets: string[]
		stepsTitle: string
		steps: string[]
		faqTitle: string
		faqs: { q: string; a: string }[]
		ctaTitle: string
		ctaButton: string
		ctaNote: string
		blogLinkLabel: string
	}
> = {
	pl: {
		heroH1: 'Ewidencja czasu pracy na budowie i grafiki dla firm budowlanych',
		heroSub:
			'Jedna aplikacja na co dzień: czas pracy, urlopy, grafiki brygad, zadania na tablicach i czat zespołu — bez Excela i chaosu w wiadomościach. Najpierw 30 dni pełnej aplikacji; potem darmowy plan ewidencji do 5 osób lub pakiety płatne z pełnymi modułami.',
		galleryTitle: 'Jak wygląda Planopia w praktyce — zrzuty z aplikacji',
		videoEyebrow: 'Instrukcja wideo',
		videoTitle: 'Zobacz Planopię w działaniu',
		videoBody:
			'Krótkie nagrania prosto z aplikacji — m.in. jak dodać godziny w ewidencji czasu pracy. Świetny start zaraz po założeniu zespołu.',
		videoCta: 'Otwórz instrukcję wideo',
		videoHref: '/blog/instrukcja-wideo-planopia',
		problemsTitle: 'Co najczęściej psuje rozliczenia na budowie?',
		problems: [
			'Chaos w godzinach i nadgodzinach — dane rozrzucone między kartki, SMS-y i arkusze.',
			'Brak jednego widoku: kto był na jakiej budowie i ile faktycznie przepracował.',
			'Urlopy i nieobecności „na słowo” — trudno zaplanować brygady i uniknąć kolizji.',
		],
		solutionTitle: 'Planopia dla budowlanki — porządek w jednym miejscu',
		solutionIntro:
			'Planopia to nie tylko urlopy i ewidencja — to narzędzie, z którego zespół korzysta codziennie: planuje pracę, komunikuje się i domyka zadania.',
		features: [
			'Ewidencja czasu pracy — szybkie wpisy, kalendarz miesięczny, raporty i eksport PDF / Excel.',
			'Grafiki i zmiany — planowanie pracy brygad i podgląd obłożenia.',
			'Urlopy i nieobecności — wnioski i akceptacje w systemie, zamiast łańcuchów wiadomości.',
			'QR i telefon — wygodne rejestrowanie czasu z placu budowy (PWA w przeglądarce).',
			'Tablice zadań (Kanban) — zlecenia, checklisty i status prac dla biura i terenu.',
			'Czaty zespołowe — ustalenia, dokumenty i dopytywanie bez rozjechania wątków w komunikatorze.',
		],
		aiTitle: 'Asystent AI — mniej ręcznego liczenia',
		aiBullets: [
			'Podsumowanie miesiąca pracy zespołu i budów.',
			'Szybsze wychwycenie nadgodzin i luk w grafiku.',
			'Wsparcie przy raportach — mniej przeklejania do arkuszy.',
		],
		stepsTitle: 'Jak zacząć — 3 krótkie kroki',
		steps: [
			'Załóż darmowy zespół w Planopii (do 5 osób w okresie próbnym).',
			'Dodaj pracowników i ustal role (kto wpisuje czas, kto akceptuje urlopy).',
			'Uruchom ewidencję, grafik i — jeśli chcesz — tablice zadań oraz czaty pod konkretne budowy.',
		],
		faqTitle: 'Częste pytania',
		faqs: [
			{
				q: 'Czy działa na telefonie na budowie?',
				a: 'Tak. Planopia działa w przeglądarce jako PWA — możesz dodać skrót na ekran telefonu i korzystać wygodnie w terenie.',
			},
			{
				q: 'Czy mogę eksportować dane?',
				a: 'Tak — m.in. raporty w PDF i Excel, żeby przekazać dane do biura lub klienta.',
			},
			{
				q: 'Czy da się kontrolować nadgodziny?',
				a: 'Tak — masz przejrzysty podgląd przepracowanych godzin i nadgodzin w kalendarzu i raportach.',
			},
			{
				q: 'Czy to tylko do urlopów?',
				a: 'Nie. Planopia łączy ewidencję czasu, grafiki, urlopy, tablice zadań i czaty — żeby firma miała jedno spójne narzędzie na co dzień.',
			},
		],
		ctaTitle: 'Gotowi uporządkować budowę i biuro?',
		ctaButton: 'Załóż darmowy zespół — 30 dni bez opłat',
		ctaNote:
			'30 dni z pełnymi funkcjami; następnie darmowy plan ewidencji (do 5 kont) albo pakiet płatny z urlopami, grafikami, czatem i AI.',
		blogLinkLabel: 'Przeczytaj artykuł: ewidencja czasu na budowie',
	},
	en: {
		heroH1: 'Construction time tracking and crew scheduling for building companies',
		heroSub:
			'One app for everyday work: time tracking, leave, crew schedules, Kanban tasks, and team chat — without spreadsheets or scattered messages. Start with a 30-day full trial, then free time tracking for up to 5 active accounts or paid plans.',
		galleryTitle: 'What Planopia looks like — in-app screenshots',
		videoEyebrow: 'Video tutorials',
		videoTitle: 'See Planopia in action',
		videoBody:
			'Short clips recorded inside the app — for example, how to add hours in the time log. A great first step right after you create a team.',
		videoCta: 'Open video tutorials',
		videoHref: '/en/blog/video-tutorials',
		problemsTitle: 'What usually breaks construction payroll and planning?',
		problems: [
			'Chaotic hours and overtime — data split across paper, SMS, and spreadsheets.',
			'No single view of who was on which site and how many hours they worked.',
			'Leave and absences agreed “verbally” — hard to staff crews and avoid clashes.',
		],
		solutionTitle: 'Planopia for construction — one place for the team',
		solutionIntro:
			'Planopia is not only leave and time tracking — it is a tool your team uses daily to plan work, communicate, and close out jobs.',
		features: [
			'Time tracking — fast entries, monthly calendar, reports, PDF / Excel export.',
			'Schedules and shifts — plan crews and see coverage at a glance.',
			'Leave and absences — requests and approvals in the app instead of message threads.',
			'QR and mobile — log time from the site using a phone browser (PWA).',
			'Kanban boards — jobs, checklists, and status for office and field.',
			'Team chat — decisions and files without losing context in a personal messenger.',
		],
		aiTitle: 'AI assistant — less manual crunching',
		aiBullets: [
			'Summaries of the month across crews and sites.',
			'Faster spotting of overtime and schedule gaps.',
			'Help preparing reports with less copy-paste.',
		],
		stepsTitle: 'Get started in three steps',
		steps: [
			'Create your free team — 30 days with every module, then a free time tracking tier for up to 5 active accounts or an upgrade.',
			'Add people and roles (who logs time, who approves leave).',
			'Turn on time tracking and schedules — and optionally boards and chats per site.',
		],
		faqTitle: 'FAQ',
		faqs: [
			{
				q: 'Does it work on phones on site?',
				a: 'Yes. Planopia runs in the browser as a PWA — add it to your home screen and use it comfortably in the field.',
			},
			{
				q: 'Can I export data?',
				a: 'Yes — including PDF and Excel reports for the office or your client.',
			},
			{
				q: 'Can we control overtime?',
				a: 'Yes — you get a clear view of worked hours and overtime in the calendar and reports.',
			},
			{
				q: 'Is it only for leave management?',
				a: 'No. Planopia combines time tracking, schedules, leave, Kanban tasks, and chat — one coherent tool for daily operations.',
			},
		],
		ctaTitle: 'Ready to align site and office?',
		ctaButton: 'Create your free team — 30 days free',
		ctaNote:
			'Full features for 30 days; afterwards free time tracking (up to 5 accounts) or a paid plan with leave, schedules, chat, and AI.',
		blogLinkLabel: 'Read the article: time tracking on construction sites',
	},
}

type Props = { locale: Locale }

export default function IndustryConstructionLandingContent({ locale }: Props) {
	const c = COPY[locale]
	const canonical =
		locale === 'pl' ? 'https://planopia.pl/dla-branzy-budowlanej' : 'https://planopia.pl/en/for-construction-industry'
	const blogPath =
		locale === 'pl'
			? '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie'
			: '/en/blog/time-tracking-on-construction-sites'
	const registerHref = 'https://app.planopia.pl/team-registration'

	const siteOrigin = 'https://planopia.pl'
	const webPageId = `${canonical}#webpage`
	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': webPageId,
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
			image: `${siteOrigin}/img/worktimeblog.webp`,
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'PLN',
				description:
					locale === 'pl'
						? '30 dni pełnej aplikacji; potem darmowy plan ewidencji do 5 kont lub pakiety płatne'
						: '30-day full trial; then free time tracking (5 accounts) or paid plans',
			},
		},
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: locale === 'pl' ? 'Planopia' : 'Planopia',
				item: locale === 'pl' ? siteOrigin : `${siteOrigin}/en`,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: locale === 'pl' ? 'Budownictwo' : 'Construction',
				item: canonical,
			},
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
				<article className="max-w-4xl mx-auto px-4 py-10 md:py-14 break-words">
					<header className="mb-10 text-center md:text-left">
						<p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">
							{locale === 'pl' ? 'Branża: budownictwo' : 'Industry: construction'}
						</p>
						<h1 className="construction-industry-h1 text-gray-900 mb-4 leading-tight">{c.heroH1}</h1>
						<p className="text-lg text-gray-600 max-w-3xl">{c.heroSub}</p>
						<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
							<a
								href={registerHref}
								className="construction-solid-btn construction-solid-btn--green order-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-center text-base font-semibold shadow-md transition hover:bg-green-700">
								{c.ctaButton}
							</a>
							<Link
								href={blogPath}
								className="order-2 inline-flex min-h-[48px] items-center justify-center px-1 text-center text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline sm:px-2">
								{c.blogLinkLabel}
							</Link>
						</div>
					</header>

					<section
						className="construction-video-card mb-10 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 px-5 py-6 shadow-sm md:px-7 md:py-7"
						aria-labelledby="construction-video-teaser">
						<div className="mx-auto flex max-w-2xl flex-col gap-3 md:gap-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">{c.videoEyebrow}</p>
							<h2 id="construction-video-teaser" className="text-xl font-bold leading-snug text-gray-900 md:text-2xl">
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

					<section className="mb-12" aria-labelledby="problems-heading">
						<h2 id="problems-heading" className="text-2xl font-bold text-gray-900 mb-4">
							{c.problemsTitle}
						</h2>
						<ul className="list-none space-y-3 m-0 p-0">
							{c.problems.map((p, i) => (
								<li key={i} className="flex gap-3 rounded-lg border border-red-100 bg-red-50/60 px-4 py-3 text-gray-800">
									<span className="font-bold text-red-600 shrink-0">!</span>
									<span>{p}</span>
								</li>
							))}
						</ul>
					</section>

					<section className="mb-12" aria-labelledby="solution-heading">
						<h2 id="solution-heading" className="text-2xl font-bold text-gray-900 mb-3">
							{c.solutionTitle}
						</h2>
						<p className="text-gray-700 mb-4">{c.solutionIntro}</p>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							{c.features.map((f, i) => (
								<li key={i}>{f}</li>
							))}
						</ul>
					</section>

					<LandingAppScreenshotGallery locale={locale} title={c.galleryTitle} images={LANDING_APP_GALLERY_IMAGES} />

					<section className="mb-12 rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-6 overflow-hidden" aria-labelledby="ai-heading">
						<h2 id="ai-heading" className="text-xl font-bold text-gray-900 mb-3">
							{c.aiTitle}
						</h2>
						<div className="mb-5 overflow-hidden rounded-lg border border-indigo-200/80 bg-white shadow-sm">
							<ConstructionAiAssistantScreenshot locale={locale} />
						</div>
						<ul className="list-none space-y-2 m-0 p-0 text-gray-700">
							{c.aiBullets.map((b, i) => (
								<li key={i} className="flex gap-2">
									<span className="text-indigo-600 font-bold">✓</span>
									<span>{b}</span>
								</li>
							))}
						</ul>
					</section>

					<section className="mb-12" aria-labelledby="steps-heading">
						<h2 id="steps-heading" className="text-2xl font-bold text-gray-900 mb-4">
							{c.stepsTitle}
						</h2>
						<ol className="list-decimal pl-5 space-y-3 text-gray-700">
							{c.steps.map((s, i) => (
								<li key={i}>{s}</li>
							))}
						</ol>
					</section>

					<section className="mb-12" aria-labelledby="faq-heading">
						<h2 id="faq-heading" className="text-2xl font-bold text-gray-900 mb-6">
							{c.faqTitle}
						</h2>
						<div className="space-y-6">
							{c.faqs.map((f, i) => (
								<div key={i}>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
									<p className="text-gray-700 m-0">{f.a}</p>
								</div>
							))}
						</div>
					</section>

					<section
						className="construction-final-cta rounded-2xl px-6 py-12 shadow-lg md:px-10 md:py-14"
						aria-labelledby="cta-heading">
						<div className="mx-auto flex w-full flex-col items-center gap-5 text-center">
							<h2 id="cta-heading" className="construction-final-cta__title text-2xl font-bold leading-tight md:text-3xl">
								{c.ctaTitle}
							</h2>
							<p className="construction-final-cta__note m-0 text-base leading-relaxed md:text-lg">{c.ctaNote}</p>
							<a
								href={registerHref}
								className="construction-final-cta__button inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl px-6 py-3.5 text-center text-base font-semibold shadow-md transition sm:w-auto">
								{c.ctaButton}
							</a>
						</div>
					</section>
				</article>
			</main>

			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<Link href={locale === 'pl' ? '/' : '/en'}>
					<img src="/img/new-logoplanopia.webp" alt="Planopia" style={{ maxWidth: '180px' }} />
				</Link>
			</footer>
		</>
	)
}
