import Link from 'next/link'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import { LANDING_APP_GALLERY_IMAGES } from '../data/landingAppGallery'

type Locale = 'pl' | 'en'
type Variant = 'leave' | 'time'

type RelatedLink = { href: string; label: string }

type Copy = {
	eyebrow: string
	heroH1: string
	heroSub: string
	ctaButton: string
	secondaryLabel: string
	secondaryHref: string
	problemsTitle: string
	problems: string[]
	featuresTitle: string
	featuresIntro: string
	features: string[]
	galleryTitle: string
	stepsTitle: string
	steps: string[]
	pricingTitle: string
	pricingIntro: string
	pricingBullets: string[]
	pricingNote: string
	pricingCtaLabel: string
	faqTitle: string
	faqs: { q: string; a: string }[]
	ctaTitle: string
	ctaNote: string
	relatedTitle: string
	related: RelatedLink[]
	heroImageSrc: string
	heroImageAlt: string
	breadcrumbName: string
}

const REGISTER_HREF = 'https://app.planopia.pl/team-registration'
const PRICING_HREF_PL = '/#cennik'
const PRICING_HREF_EN = '/en#prices'

const COPY: Record<Variant, Record<Locale, Copy>> = {
	leave: {
		pl: {
			eyebrow: 'Program do urlopów',
			heroH1: 'Program do urlopów dla firmy — wnioski, kalendarz i akceptacje online',
			heroSub:
				'Zastąp Excela i maile jednym systemem do wniosków urlopowych. Pracownik składa wniosek z telefonu, przełożony akceptuje, a Ty widzisz cały zespół w kalendarzu urlopów. Wypróbuj 30 dni pełnej aplikacji za darmo (do 5 osób).',
			ctaButton: 'Załóż darmowy zespół — 30 dni gratis',
			secondaryLabel: 'Zobacz: roczny plan urlopów (Excel, PDF, aplikacja)',
			secondaryHref: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
			problemsTitle: 'Dlaczego Excel i maile do urlopów przestają wystarczać?',
			problems: [
				'Wnioski rozproszone w mailach i wiadomościach — łatwo o przeoczoną akceptację.',
				'Brak jednego kalendarza: trudno zobaczyć, kto i kiedy jest na urlopie oraz uniknąć kolizji w zespole.',
				'Ręczne liczenie dni i sald urlopowych w arkuszu, który szybko traci aktualność.',
			],
			featuresTitle: 'Co potrafi program do urlopów w Planopii',
			featuresIntro:
				'Planopia prowadzi cały obieg wniosku — od złożenia, przez akceptację, po zapis w kalendarzu urlopów i ewidencji.',
			features: [
				'Wnioski urlopowe online — pracownik składa wniosek w aplikacji lub przez telefon (PWA), ze statusem: oczekuje / zaakceptowany / odrzucony.',
				'Konfigurowalne typy nieobecności — wybierasz, które wymagają akceptacji, a które są zapisywane od razu.',
				'Akceptacja przez Admina, HR lub przełożonego — z uprawnieniami dopasowanymi do struktury zespołu.',
				'Kalendarz urlopów zespołu i działów — jeden widok zamiast scalania plików.',
				'Spójność z ewidencją czasu pracy — urlopy i nieobecności widoczne w tym samym koncie zespołu.',
				'Eksport do PDF i Excela — kopia do archiwum lub kontroli.',
			],
			galleryTitle: 'Urlopy w Planopii — zrzuty z aplikacji',
			stepsTitle: 'Jak zacząć — 3 kroki',
			steps: [
				'Załóż darmowy zespół (30 dni pełnej aplikacji, do 5 osób).',
				'Skonfiguruj typy wniosków i osoby akceptujące (Admin / HR / przełożony).',
				'Pracownicy składają wnioski, a Ty zarządzasz urlopami z poziomu kalendarza.',
			],
			pricingTitle: 'Ile kosztuje moduł urlopów?',
			pricingIntro:
				'Wnioski urlopowe i kalendarz urlopów to część pełnej aplikacji. Masz je przez 30 dni okresu próbnego, a potem w dowolnym planie płatnym:',
			pricingBullets: [
				'30 dni za darmo — pełna aplikacja z urlopami dla zespołu do 5 osób.',
				'Plan CORE od 119 zł netto / mies. (do 15 osób; 199 zł do 30, 349 zł do 100) — urlopy są w cenie planu.',
				'Pakiety PRO (239 zł, do 30 osób) i BUSINESS (479 zł, do 100 osób) — urlopy plus wszystkie pozostałe moduły i Asystent AI.',
			],
			pricingNote:
				'Uwaga: bezpłatny plan po okresie próbnym obejmuje wyłącznie ewidencję czasu pracy (do 5 aktywnych kont). Moduł urlopów działa w okresie próbnym i w planach płatnych. Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12.',
			pricingCtaLabel: 'Zobacz pełny cennik',
			faqTitle: 'Najczęstsze pytania',
			faqs: [
				{
					q: 'Czy program do urlopów jest darmowy?',
					a: 'Przez 30 dni korzystasz z pełnej aplikacji (z urlopami) za darmo, dla zespołu do 5 osób. Po okresie próbnym możesz zostać na bezpłatnym planie z ewidencją czasu pracy (do 5 aktywnych kont) albo wykupić plan płatny, który zawiera moduł urlopów — CORE od 119 zł netto miesięcznie lub pakiet PRO/BUSINESS.',
				},
				{
					q: 'Czy pracownik może złożyć wniosek z telefonu?',
					a: 'Tak. Planopia działa w przeglądarce jako aplikacja PWA — można dodać skrót na ekran telefonu i składać wnioski oraz sprawdzać status w terenie.',
				},
				{
					q: 'Kto akceptuje wnioski urlopowe?',
					a: 'Wnioski akceptuje Admin, HR lub przełożony z odpowiednim uprawnieniem. Część typów nieobecności możesz ustawić tak, aby nie wymagały akceptacji i były zapisywane od razu.',
				},
				{
					q: 'Czy mogę wyeksportować urlopy do Excela lub PDF?',
					a: 'Tak — dane o urlopach i nieobecnościach wyeksportujesz do PDF i Excela (XLSX), np. do archiwum lub rozliczeń.',
				},
				{
					q: 'Czy urlopy łączą się z ewidencją czasu pracy?',
					a: 'Tak. Urlopy, nieobecności i ewidencja czasu pracy są w jednym koncie zespołu, więc nie prowadzisz dwóch osobnych miejsc.',
				},
			],
			ctaTitle: 'Uporządkuj urlopy w firmie',
			ctaNote:
				'30 dni pełnej aplikacji za darmo. Potem plan z urlopami od 119 zł netto/mies. lub darmowa ewidencja czasu pracy.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/blog/program-do-urlopow-dla-malej-firmy', label: 'Program do urlopów dla małej firmy — jak wybrać' },
				{ href: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja', label: 'Roczny plan urlopów: Excel, PDF, aplikacja' },
				{ href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami w firmie' },
				{ href: '/blog/planowanie-urlopow', label: 'Planowanie urlopów pracowników' },
				{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
			],
			heroImageSrc: '/img/plans-urlopnew.webp',
			heroImageAlt: 'Kalendarz urlopów i wnioski urlopowe w aplikacji Planopia',
			breadcrumbName: 'Program do urlopów',
		},
		en: {
			eyebrow: 'Leave management software',
			heroH1: 'Leave management software — requests, calendar, and approvals online',
			heroSub:
				'Replace spreadsheets and email threads with one leave request system. Employees request time off from their phone, managers approve, and you see the whole team in a leave calendar. Try 30 days of the full app for free (up to 5 users).',
			ctaButton: 'Create your free team — 30 days free',
			secondaryLabel: 'See: annual leave plan (Excel, PDF, app)',
			secondaryHref: '/en/blog/annual-leave-plan-excel-pdf-app',
			problemsTitle: 'Why Excel and email stop working for leave',
			problems: [
				'Requests scattered across email and chat — approvals get missed.',
				'No single calendar: hard to see who is off and avoid clashes in the team.',
				'Manual day and balance counting in a spreadsheet that goes stale fast.',
			],
			featuresTitle: 'What Planopia’s leave software does',
			featuresIntro:
				'Planopia runs the full request flow — from submission, through approval, to the leave calendar and time records.',
			features: [
				'Online leave requests — employees submit in the app or on a phone (PWA), with status: pending / approved / rejected.',
				'Configurable absence types — choose which require approval and which are recorded immediately.',
				'Approvals by Admin, HR, or a supervisor — with permissions that match your team structure.',
				'Team and department leave calendar — one view instead of merging files.',
				'Aligned with time tracking — leave and absences live in the same team account.',
				'Export to PDF and Excel — a copy for archives or audits.',
			],
			galleryTitle: 'Leave in Planopia — in-app screenshots',
			stepsTitle: 'Get started in 3 steps',
			steps: [
				'Create your free team (30-day full trial, up to 5 users).',
				'Set up absence types and approvers (Admin / HR / supervisor).',
				'Employees submit requests and you manage leave from the calendar.',
			],
			pricingTitle: 'How much does the leave module cost?',
			pricingIntro:
				'Leave requests and the leave calendar are part of the full app. You get them during the 30-day trial and then on any paid plan:',
			pricingBullets: [
				'30 days free — full app with leave for a team of up to 5 users.',
				'CORE plan from 119 PLN net / month (up to 15 users; 199 up to 30, 349 up to 100) — leave is included in the plan.',
				'PRO (239 PLN, up to 30 users) and BUSINESS (479 PLN, up to 100 users) — leave plus all other modules and the AI Assistant.',
			],
			pricingNote:
				'Note: the free tier after the trial covers time tracking only (up to 5 active accounts). The leave module works during the trial and on paid plans. Annual billing: pay for 10 months instead of 12.',
			pricingCtaLabel: 'See full pricing',
			faqTitle: 'FAQ',
			faqs: [
				{
					q: 'Is the leave software free?',
					a: 'You get the full app (including leave) free for 30 days, for a team of up to 5 users. After the trial you can stay on the free time tracking tier (up to 5 active accounts) or buy a paid plan that includes the leave module — CORE from 119 PLN net per month, or a PRO/BUSINESS package.',
				},
				{
					q: 'Can employees request leave from a phone?',
					a: 'Yes. Planopia runs in the browser as a PWA — add it to your home screen and submit requests or check status in the field.',
				},
				{
					q: 'Who approves leave requests?',
					a: 'Admin, HR, or a supervisor with the right permission. Some absence types can be set to require no approval and be recorded immediately.',
				},
				{
					q: 'Can I export leave to Excel or PDF?',
					a: 'Yes — leave and absence data export to PDF and Excel (XLSX), for archives or payroll.',
				},
				{
					q: 'Is leave linked to time tracking?',
					a: 'Yes. Leave, absences, and time tracking sit in one team account, so you do not maintain two separate places.',
				},
			],
			ctaTitle: 'Bring order to company leave',
			ctaNote:
				'30 days of the full app free. Then a plan with leave from 119 PLN net/month, or free time tracking.',
			relatedTitle: 'Related resources',
			related: [
				{ href: '/en/blog/annual-leave-plan-excel-pdf-app', label: 'Annual leave plan: Excel, PDF, app' },
				{ href: '/en/blog/leave-management', label: 'Leave management guide' },
				{ href: '/en/blog/leave-planning', label: 'Leave planning' },
				{ href: '/en/time-tracking-software', label: 'Time tracking software' },
			],
			heroImageSrc: '/img/plans-urlopnewen.webp',
			heroImageAlt: 'Leave calendar and leave requests in the Planopia app',
			breadcrumbName: 'Leave management software',
		},
	},
	time: {
		pl: {
			eyebrow: 'Program do ewidencji czasu pracy',
			heroH1: 'Program do ewidencji czasu pracy — online, z raportami PDF i Excel',
			heroSub:
				'Rejestruj godziny, nadgodziny i nieobecności w jednym systemie zamiast w arkuszach. Pracownik wpisuje czas pracy, a Ty masz kalendarz miesięczny, podgląd zespołu i eksport raportów. Zacznij za darmo — po 30 dniach próby zostaje darmowa ewidencja do 5 kont.',
			ctaButton: 'Załóż darmowy zespół',
			secondaryLabel: 'Zobacz: elektroniczna ewidencja — Excel czy program?',
			secondaryHref: '/blog/elektroniczna-ewidencja-czasu-pracy',
			problemsTitle: 'Co psuje ewidencję czasu pracy w Excelu?',
			problems: [
				'Wpisy rozrzucone między pliki, kartki i wiadomości — trudno o spójny raport miesiąca.',
				'Brak szybkiego podglądu nadgodzin i braków w godzinach całego zespołu.',
				'Ręczne scalanie arkuszy przed rozliczeniem — czasochłonne i podatne na błędy.',
			],
			featuresTitle: 'Co potrafi program do ewidencji czasu pracy w Planopii',
			featuresIntro:
				'Planopia zbiera czas pracy w jednym miejscu — z kalendarzem miesięcznym, raportami i eksportem do biura lub klienta.',
			features: [
				'Wpisy dzienne — godziny, nadgodziny, nieobecności i notatki w kalendarzu miesięcznym.',
				'Podgląd zespołu dla Admina, HR i przełożonego — bez ręcznego scalania plików.',
				'Pracownicy bez dostępu do aplikacji — brygadzista lub HR może prowadzić ewidencję za ekipę (przydatne w terenie i budowlance).',
				'Eksport raportów do PDF i Excela (XLSX) — gotowe zestawienia miesiąca.',
				'Działa w przeglądarce i na telefonie jako PWA — wygodne wpisy z dowolnego miejsca.',
				'Opcjonalnie licznik czasu i kody QR (moduł płatny) — rejestracja wejść i wyjść.',
			],
			galleryTitle: 'Ewidencja w Planopii — zrzuty z aplikacji',
			stepsTitle: 'Jak zacząć — 3 kroki',
			steps: [
				'Załóż darmowy zespół (30 dni pełnej aplikacji, do 5 osób).',
				'Dodaj pracowników — z kontem lub bez dostępu do aplikacji.',
				'Uruchom ewidencję czasu pracy i pobieraj raporty PDF/Excel.',
			],
			pricingTitle: 'Ile kosztuje ewidencja czasu pracy?',
			pricingIntro:
				'Ewidencja czasu pracy jest dostępna już w planie darmowym — to najtańszy sposób, by zacząć:',
			pricingBullets: [
				'30 dni pełnej aplikacji za darmo (do 5 osób), bez podawania karty na start.',
				'Po próbie: darmowa ewidencja czasu pracy do 5 aktywnych kont — bez opłat.',
				'Większy zespół lub licznik czasu i QR: plan CORE od 119 zł netto/mies. lub pakiet PRO/BUSINESS.',
			],
			pricingNote:
				'Licznik czasu i kody QR to moduł dodatkowy (na planie CORE od 39 zł netto/mies.) lub element pakietu PRO/BUSINESS. Ręczna ewidencja, kalendarz i eksport PDF/XLSX działają także w planie darmowym. Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12.',
			pricingCtaLabel: 'Zobacz pełny cennik',
			faqTitle: 'Najczęstsze pytania',
			faqs: [
				{
					q: 'Czy program do ewidencji czasu pracy jest darmowy?',
					a: 'Tak — po 30-dniowym okresie próbnym z pełną aplikacją możesz zostać na bezpłatnym planie z ewidencją czasu pracy dla maksymalnie 5 aktywnych kont. Ręczne wpisy, kalendarz miesięczny i eksport PDF/Excel są w planie darmowym.',
				},
				{
					q: 'Czy każdy pracownik musi mieć konto?',
					a: 'Nie. Admin, HR lub brygadzista może dodać pracowników bez dostępu do aplikacji i prowadzić ich ewidencję — to wygodne w pracy terenowej i w budowlance.',
				},
				{
					q: 'Czy mogę eksportować ewidencję do Excela lub PDF?',
					a: 'Tak — raporty miesięczne wyeksportujesz do PDF i Excela (XLSX), np. do rozliczeń lub przekazania klientowi.',
				},
				{
					q: 'Czy jest licznik czasu i kody QR?',
					a: 'Tak — licznik czasu pracy oraz rejestracja wejść/wyjść przez QR są dostępne jako moduł dodatkowy na planie CORE lub w pakietach PRO/BUSINESS. W planie darmowym dostępna jest ręczna ewidencja.',
				},
				{
					q: 'Czy działa na telefonie?',
					a: 'Tak. Planopia działa w przeglądarce jako PWA — możesz dodać skrót na ekran telefonu i wpisywać godziny z dowolnego miejsca.',
				},
			],
			ctaTitle: 'Zacznij prowadzić ewidencję bez Excela',
			ctaNote:
				'30 dni pełnej aplikacji, potem darmowa ewidencja czasu pracy do 5 kont lub pakiet płatny z urlopami i AI.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/blog/elektroniczna-ewidencja-czasu-pracy', label: 'Elektroniczna ewidencja: Excel czy program?' },
				{ href: '/blog/ewidencja-czasu-pracy-online', label: 'Ewidencja czasu pracy online' },
				{ href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy', label: 'Darmowa aplikacja do ewidencji' },
				{ href: '/program-do-urlopow', label: 'Program do urlopów' },
			],
			heroImageSrc: '/img/desktopnews.webp',
			heroImageAlt: 'Ewidencja czasu pracy i kalendarz miesięczny w aplikacji Planopia',
			breadcrumbName: 'Program do ewidencji czasu pracy',
		},
		en: {
			eyebrow: 'Time tracking software',
			heroH1: 'Time tracking software — online, with PDF and Excel reports',
			heroSub:
				'Record hours, overtime, and absences in one system instead of spreadsheets. Employees log their time and you get a monthly calendar, team overview, and report exports. Start free — after the 30-day trial, time tracking stays free for up to 5 accounts.',
			ctaButton: 'Create your free team',
			secondaryLabel: 'See: electronic time tracking — Excel or software?',
			secondaryHref: '/en/blog/electronic-time-tracking',
			problemsTitle: 'What breaks time tracking in Excel?',
			problems: [
				'Entries scattered across files, paper, and chat — no consistent monthly report.',
				'No quick view of overtime and missing hours across the team.',
				'Manual merging of spreadsheets before payroll — slow and error-prone.',
			],
			featuresTitle: 'What Planopia’s time tracking software does',
			featuresIntro:
				'Planopia keeps time records in one place — with a monthly calendar, reports, and exports for the office or client.',
			features: [
				'Daily entries — hours, overtime, absences, and notes in a monthly calendar.',
				'Team overview for Admin, HR, and supervisors — no manual file merging.',
				'Employees without app access — a foreman or HR can keep records for the crew (great for field work and construction).',
				'Export reports to PDF and Excel (XLSX) — ready monthly summaries.',
				'Runs in the browser and on phones as a PWA — convenient entries from anywhere.',
				'Optional time clock and QR codes (paid module) — clock-in/clock-out tracking.',
			],
			galleryTitle: 'Time tracking in Planopia — in-app screenshots',
			stepsTitle: 'Get started in 3 steps',
			steps: [
				'Create your free team (30-day full trial, up to 5 users).',
				'Add employees — with an account or without app access.',
				'Turn on time tracking and export PDF/Excel reports.',
			],
			pricingTitle: 'How much does time tracking cost?',
			pricingIntro:
				'Time tracking is available on the free tier — the cheapest way to start:',
			pricingBullets: [
				'30 days of the full app free (up to 5 users), no card required to start.',
				'After the trial: free time tracking for up to 5 active accounts — at no cost.',
				'Bigger team, or time clock and QR: CORE plan from 119 PLN net/month, or a PRO/BUSINESS package.',
			],
			pricingNote:
				'The time clock and QR codes are an add-on module (on CORE from 39 PLN net/month) or part of a PRO/BUSINESS package. Manual time tracking, calendar, and PDF/XLSX export also work on the free tier. Annual billing: pay for 10 months instead of 12.',
			pricingCtaLabel: 'See full pricing',
			faqTitle: 'FAQ',
			faqs: [
				{
					q: 'Is the time tracking software free?',
					a: 'Yes — after the 30-day full-app trial you can stay on a free tier with time tracking for up to 5 active accounts. Manual entries, the monthly calendar, and PDF/Excel export are included on the free tier.',
				},
				{
					q: 'Does every employee need an account?',
					a: 'No. An Admin, HR, or foreman can add employees without app access and keep their records — handy for field work and construction.',
				},
				{
					q: 'Can I export records to Excel or PDF?',
					a: 'Yes — monthly reports export to PDF and Excel (XLSX), for payroll or to share with a client.',
				},
				{
					q: 'Is there a time clock and QR codes?',
					a: 'Yes — a time clock and QR clock-in/clock-out are available as an add-on module on CORE or in PRO/BUSINESS packages. The free tier includes manual time tracking.',
				},
				{
					q: 'Does it work on phones?',
					a: 'Yes. Planopia runs in the browser as a PWA — add it to your home screen and log hours from anywhere.',
				},
			],
			ctaTitle: 'Start tracking time without Excel',
			ctaNote:
				'30 days of the full app, then free time tracking for up to 5 accounts or a paid plan with leave and AI.',
			relatedTitle: 'Related resources',
			related: [
				{ href: '/en/blog/electronic-time-tracking', label: 'Electronic time tracking: Excel or software?' },
				{ href: '/en/blog/time-tracking-online', label: 'Online time tracking' },
				{ href: '/en/blog/free-time-tracking-app', label: 'Free time tracking app' },
				{ href: '/en/leave-management-software', label: 'Leave management software' },
			],
			heroImageSrc: '/img/desktop-ennews.webp',
			heroImageAlt: 'Time tracking and monthly calendar in the Planopia app',
			breadcrumbName: 'Time tracking software',
		},
	},
}

const CANONICAL: Record<Variant, Record<Locale, string>> = {
	leave: {
		pl: 'https://planopia.pl/program-do-urlopow',
		en: 'https://planopia.pl/en/leave-management-software',
	},
	time: {
		pl: 'https://planopia.pl/program-do-ewidencji-czasu-pracy',
		en: 'https://planopia.pl/en/time-tracking-software',
	},
}

type Props = { variant: Variant; locale: Locale }

export default function CommercialSoftwareLanding({ variant, locale }: Props) {
	const c = COPY[variant][locale]
	const canonical = CANONICAL[variant][locale]
	const pricingHref = locale === 'pl' ? PRICING_HREF_PL : PRICING_HREF_EN
	const siteOrigin = 'https://planopia.pl'

	// Strona o urlopach: najtańszy dostęp do modułu = CORE 119 zł; ewidencja ma plan darmowy (0 zł).
	const offer =
		variant === 'leave'
			? {
					'@type': 'Offer',
					price: '119',
					priceCurrency: 'PLN',
					description:
						locale === 'pl'
							? '30 dni pełnej aplikacji za darmo; moduł urlopów w planach płatnych (CORE od 119 zł netto/mies. lub pakiet).'
							: '30-day full trial free; leave module on paid plans (CORE from 119 PLN net/month or a package).',
				}
			: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'PLN',
					description:
						locale === 'pl'
							? '30 dni pełnej aplikacji; potem darmowa ewidencja czasu pracy do 5 aktywnych kont lub pakiety płatne.'
							: '30-day full trial; then free time tracking for up to 5 active accounts or paid plans.',
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
									<img
										src={c.heroImageSrc}
										alt={c.heroImageAlt}
										className="rounded-xl w-full h-auto aspect-[3/2] object-cover"
										loading="eager"
										fetchPriority="high"
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

						<div className="rounded-2xl border border-gray-100/90 bg-gradient-to-b from-gray-50/80 to-white p-5 md:p-7 shadow-sm ring-1 ring-gray-100/70">
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
