/**
 * Teksty stron produktowych (/program-do-urlopow, /program-do-ewidencji-czasu-pracy, …).
 *
 * Wyciagniete z CommercialSoftwareLanding.tsx: kazdy nowy wariant dokladal ~160 linii
 * do komponentu. Konwencja zgodna z industryGastronomyCopy.ts / industryCleaningCopy.ts.
 */
export type Locale = 'pl' | 'en'
export type Variant = 'leave' | 'time' | 'schedule' | 'attendance' | 'overtime'

export type RelatedLink = { href: string; label: string }

export type Copy = {
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
	/**
	 * Cena do JSON-LD (schema.org Offer). Trzymana per wariant, a nie w warunku w komponencie —
	 * wczesniej nowy wariant dziedziczylby po cichu cene 0 zl z galezi `else`.
	 */
	offerPrice: string
	offerDescription: string
}

export const REGISTER_HREF = 'https://app.planopia.pl/team-registration'
export const PRICING_HREF_PL = '/#cennik'
export const PRICING_HREF_EN = '/en#prices'

export const COPY: Record<Variant, Record<Locale, Copy>> = {
	leave: {
		pl: {
			eyebrow: 'Program do urlopów',
			heroH1: 'Program do urlopów dla firmy — wnioski, kalendarz i akceptacje online',
			heroSub:
				'Zastąp Excela i maile jednym systemem do wniosków urlopowych. Pracownik składa wniosek z telefonu, przełożony akceptuje, a Ty widzisz cały zespół w kalendarzu urlopów. Wypróbuj 30 dni pełnej aplikacji za darmo (do 5 osób).',
			ctaButton: 'Załóż darmowy zespół — 30 dni gratis',
			secondaryLabel: 'Zobacz aplikację',
			secondaryHref: '#commercial-gallery',
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
				'Plan CORE od 59 zł netto / mies. (do 8 osób; 119 zł do 15, 199 zł do 30, 349 zł do 100) — urlopy są w cenie planu.',
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
				'30 dni pełnej aplikacji za darmo. Potem plan z urlopami od 59 zł netto/mies. lub darmowa ewidencja czasu pracy.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/blog/program-do-urlopow-dla-malej-firmy', label: 'Program do urlopów dla małej firmy — jak wybrać' },
				{ href: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja', label: 'Roczny plan urlopów: Excel, PDF, aplikacja' },
				{ href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami w firmie' },
				{ href: '/blog/planowanie-urlopow', label: 'Planowanie urlopów pracowników' },
				{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
				{ href: '/program-do-grafikow-pracy', label: 'Program do grafików pracy' },
				{ href: '/rejestracja-czasu-pracy-qr', label: 'Rejestracja czasu pracy przez QR' },
			],
			heroImageSrc: '/img/plans-urlopnew.webp',
			heroImageAlt: 'Kalendarz urlopów i wnioski urlopowe w aplikacji Planopia',
			breadcrumbName: 'Program do urlopów',
			offerPrice: '59',
			offerDescription:
				'30 dni pełnej aplikacji za darmo; moduł urlopów w planach płatnych (CORE od 59 zł netto/mies. lub pakiet).',
		},
		en: {
			eyebrow: 'Leave management software',
			heroH1: 'Leave management software — requests, calendar, and approvals online',
			heroSub:
				'Replace spreadsheets and email threads with one leave request system. Employees request time off from their phone, managers approve, and you see the whole team in a leave calendar. Try 30 days of the full app for free (up to 5 users).',
			ctaButton: 'Create your free team — 30 days free',
			secondaryLabel: 'See the app',
			secondaryHref: '#commercial-gallery',
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
				'CORE plan from 59 PLN net / month (up to 8 users; 119 up to 15, 199 up to 30, 349 up to 100) — leave is included in the plan.',
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
				'30 days of the full app free. Then a plan with leave from 59 PLN net/month, or free time tracking.',
			relatedTitle: 'Related resources',
			related: [
				{ href: '/en/blog/annual-leave-plan-excel-pdf-app', label: 'Annual leave plan: Excel, PDF, app' },
				{ href: '/en/blog/leave-management', label: 'Leave management guide' },
				{ href: '/en/blog/leave-planning', label: 'Leave planning' },
				{ href: '/en/time-tracking-software', label: 'Time tracking software' },
				{ href: '/en/work-schedule-software', label: 'Work schedule software' },
				{ href: '/en/overtime-tracking', label: 'Overtime tracking' },
			],
			heroImageSrc: '/img/plans-urlopnewen.webp',
			heroImageAlt: 'Leave calendar and leave requests in the Planopia app',
			breadcrumbName: 'Leave management software',
			offerPrice: '59',
			offerDescription:
				'30-day full trial free; leave module on paid plans (CORE from 59 PLN net/month or a package).',
		},
	},
	time: {
		pl: {
			eyebrow: 'Program do ewidencji czasu pracy',
			heroH1: 'Program do ewidencji czasu pracy — online, z raportami PDF i Excel',
			heroSub:
				'Rejestruj godziny, nadgodziny i nieobecności w jednym systemie zamiast w arkuszach. Pracownik wpisuje czas pracy, a Ty masz kalendarz miesięczny, podgląd zespołu i eksport raportów. Zacznij za darmo — po 30 dniach próby zostaje darmowa ewidencja do 5 kont.',
			ctaButton: 'Załóż darmowy zespół',
			secondaryLabel: 'Zobacz aplikację',
			secondaryHref: '#commercial-gallery',
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
				'Większy zespół lub licznik czasu i QR: plan CORE od 59 zł netto/mies. lub pakiet PRO/BUSINESS.',
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
				{ href: '/program-do-grafikow-pracy', label: 'Program do grafików pracy' },
				{ href: '/rejestracja-czasu-pracy-qr', label: 'Rejestracja czasu pracy przez QR' },
				{ href: '/ewidencja-nadgodzin', label: 'Ewidencja nadgodzin' },
			],
			heroImageSrc: '/img/desktopnews.webp',
			heroImageAlt: 'Ewidencja czasu pracy i kalendarz miesięczny w aplikacji Planopia',
			breadcrumbName: 'Program do ewidencji czasu pracy',
			offerPrice: '0',
			offerDescription:
				'30 dni pełnej aplikacji; potem darmowa ewidencja czasu pracy do 5 aktywnych kont lub pakiety płatne.',
		},
		en: {
			eyebrow: 'Time tracking software',
			heroH1: 'Time tracking software — online, with PDF and Excel reports',
			heroSub:
				'Record hours, overtime, and absences in one system instead of spreadsheets. Employees log their time and you get a monthly calendar, team overview, and report exports. Start free — after the 30-day trial, time tracking stays free for up to 5 accounts.',
			ctaButton: 'Create your free team',
			secondaryLabel: 'See the app',
			secondaryHref: '#commercial-gallery',
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
				'Bigger team, or time clock and QR: CORE plan from 59 PLN net/month, or a PRO/BUSINESS package.',
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
				{ href: '/en/work-schedule-software', label: 'Work schedule software' },
				{ href: '/en/qr-time-clocking', label: 'QR time clocking' },
				{ href: '/en/overtime-tracking', label: 'Overtime tracking' },
			],
			heroImageSrc: '/img/desktop-ennews.webp',
			heroImageAlt: 'Time tracking and monthly calendar in the Planopia app',
			breadcrumbName: 'Time tracking software',
			offerPrice: '0',
			offerDescription:
				'30-day full trial; then free time tracking for up to 5 active accounts or paid plans.',
		},
	},
	schedule: {
		pl: {
			eyebrow: 'Program do grafików pracy',
			heroH1: 'Program do tworzenia grafików pracy online',
			heroSub:
				'Ułóż grafik zmianowy dla całego zespołu w jednym miejscu — z uwzględnieniem urlopów, świąt i minimalnej obsady. Planopia potrafi wypełnić grafik automatycznie, a Ty poprawiasz tylko to, co wymaga decyzji.',
			ctaButton: 'Załóż darmowy zespół — 30 dni gratis',
			secondaryLabel: 'Zobacz aplikację',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'Co utrudnia układanie grafiku pracy?',
			problems: [
				'Grafik w Excelu układa się od zera co miesiąc, a urlopy i święta trzeba pamiętać samemu.',
				'Zmiany rozchodzą się wiadomościami, więc część zespołu pracuje na nieaktualnej wersji.',
				'Trudno na bieżąco sprawdzić, czy na każdej zmianie jest wystarczająca obsada.',
			],
			featuresTitle: 'Co potrafi program do grafików pracy w Planopii',
			featuresIntro:
				'Planopia układa grafik na podstawie tego, co już wie o zespole — kto ma urlop, które dni są wolne i ilu ludzi musi być na zmianie.',
			features: [
				'Automatyczne wypełnianie grafiku — pomija weekendy, święta i osoby z zatwierdzonym urlopem.',
				'Zmiany z godzinami i minimalną obsadą — każdą definiujesz osobno, także dla wybranych dni tygodnia.',
				'Wersja robocza i opublikowana — zespół widzi dopiero grafik zatwierdzony, nie szkic.',
				'Podgląd całego zespołu w jednym widoku, bez scalania plików.',
				'Wnioski urlopowe i grafik w jednym systemie — zatwierdzony urlop od razu zwalnia osobę z grafiku.',
				'Działa w przeglądarce i na telefonie jako PWA — zespół sprawdza grafik z dowolnego miejsca.',
			],
			galleryTitle: 'Grafik w Planopii — zrzuty z aplikacji',
			stepsTitle: 'Jak zacząć — 3 kroki',
			steps: [
				'Załóż darmowy zespół (30 dni pełnej aplikacji, do 5 osób).',
				'Zdefiniuj zmiany — godziny i minimalną liczbę osób na każdej z nich.',
				'Wygeneruj grafik, popraw wyjątki i opublikuj go zespołowi.',
			],
			pricingTitle: 'Ile kosztuje program do grafików pracy?',
			pricingIntro:
				'Grafiki są modułem płatnym — bezpłatny plan po okresie próbnym obejmuje wyłącznie ewidencję czasu pracy:',
			pricingBullets: [
				'30 dni pełnej aplikacji za darmo (do 5 osób), z grafikami i bez podawania karty na start.',
				'Po próbie: moduł „Grafiki + AI” do planu CORE za 59 zł netto / mies.',
				'Albo pakiet PRO (239 zł, do 30 osób) lub BUSINESS (479 zł, do 100 osób), gdzie grafiki są w cenie.',
			],
			pricingNote:
				'Grafiki nie wchodzą w skład bezpłatnego planu — tam działa ewidencja czasu pracy do 5 aktywnych kont. Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12.',
			pricingCtaLabel: 'Zobacz pełny cennik',
			faqTitle: 'Najczęstsze pytania',
			faqs: [
				{
					q: 'Czy program sam ułoży grafik pracy?',
					a: 'Tak. Planopia wypełnia grafik automatycznie na podstawie zdefiniowanych zmian, pomijając weekendy, święta oraz osoby, które mają w danym dniu zatwierdzony urlop. Wynik jest punktem wyjścia — każdą pozycję możesz poprawić ręcznie przed publikacją.',
				},
				{
					q: 'Czy grafik uwzględnia urlopy pracowników?',
					a: 'Tak. Wnioski urlopowe i grafik działają w tym samym systemie, więc osoba z zatwierdzonym urlopem nie zostanie wpisana na zmianę. Nie trzeba pilnować tego w osobnym pliku.',
				},
				{
					q: 'Czy pracownik widzi grafik od razu po utworzeniu?',
					a: 'Nie. Grafik ma wersję roboczą i opublikowaną — zespół widzi dopiero tę zatwierdzoną. Dzięki temu nikt nie planuje na podstawie szkicu, który jeszcze się zmieni.',
				},
				{
					q: 'Czy da się ustawić różne zmiany na różne dni tygodnia?',
					a: 'Tak. Każdą zmianę opisujesz godziną rozpoczęcia i zakończenia, minimalną liczbą osób oraz dniami tygodnia, w których obowiązuje.',
				},
				{
					q: 'Czy grafiki są dostępne w planie darmowym?',
					a: 'Nie. Po 30-dniowym okresie próbnym grafiki wymagają modułu „Grafiki + AI” do planu CORE (59 zł netto miesięcznie) albo pakietu PRO lub BUSINESS. W planie bezpłatnym pozostaje ewidencja czasu pracy do 5 aktywnych kont.',
				},
			],
			ctaTitle: 'Ułóż grafik bez arkusza i telefonów',
			ctaNote:
				'30 dni pełnej aplikacji z grafikami, potem moduł do planu CORE od 59 zł netto/mies. albo pakiet PRO/BUSINESS.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/blog/jak-ulozyc-grafik-pracy-w-restauracji', label: 'Jak ułożyć grafik pracy w restauracji' },
				{ href: '/dla-gastronomii', label: 'Grafik pracy dla gastronomii' },
				{ href: '/dla-firm-sprzatajacych', label: 'Grafik ekip sprzątających' },
				{ href: '/dla-branzy-budowlanej', label: 'Grafiki brygad na budowie' },
				{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
			],
			heroImageSrc: '/img/aigrafik.webp',
			heroImageAlt: 'Grafik pracy zespołu w aplikacji Planopia',
			breadcrumbName: 'Program do grafików pracy',
			offerPrice: '118',
			offerDescription:
				'30 dni pełnej aplikacji za darmo; potem najtaniej plan CORE (od 59 zł netto/mies., do 8 osób) z modułem Grafiki + AI (59 zł netto/mies.), razem od 118 zł, albo pakiet PRO od 239 zł.',
		},
		en: {
			eyebrow: 'Work schedule software',
			heroH1: 'Work schedule software — build team rosters online',
			heroSub:
				'Plan shift rosters for the whole team in one place, with leave, public holidays, and minimum staffing already taken into account. Planopia can fill the schedule automatically, so you only adjust what needs a decision.',
			ctaButton: 'Create your free team — 30 days free',
			secondaryLabel: 'See the app',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'What makes work scheduling painful',
			problems: [
				'A spreadsheet roster is rebuilt from scratch every month, and you still track leave and holidays yourself.',
				'Changes travel through chat messages, so part of the team works from an outdated version.',
				'It is hard to tell at a glance whether every shift has enough people on it.',
			],
			featuresTitle: 'What Planopia’s scheduling software does',
			featuresIntro:
				'Planopia builds the roster from what it already knows about your team — who is on leave, which days are off, and how many people each shift needs.',
			features: [
				'Automatic roster fill — skips weekends, public holidays, and anyone with approved leave.',
				'Shifts with hours and minimum staffing — defined separately, and per weekday if needed.',
				'Draft and published versions — the team only sees an approved roster, never a draft.',
				'One view of the whole team instead of merging files.',
				'Leave requests and rosters in one system — approved leave frees the person automatically.',
				'Works in the browser and on phones as a PWA — the team checks the roster anywhere.',
			],
			galleryTitle: 'Scheduling in Planopia — app screenshots',
			stepsTitle: 'How to start — 3 steps',
			steps: [
				'Create your free team (30 days of the full app, up to 5 users).',
				'Define your shifts — hours and the minimum number of people on each.',
				'Generate the roster, fix the exceptions, and publish it to the team.',
			],
			pricingTitle: 'How much does scheduling software cost?',
			pricingIntro:
				'Scheduling is a paid module — the free tier after the trial covers time tracking only:',
			pricingBullets: [
				'30 days of the full app free (up to 5 users), scheduling included, no card required to start.',
				'After the trial: the “Schedules + AI” module on a CORE plan for 59 PLN net/month.',
				'Or a PRO (239 PLN, up to 30 users) or BUSINESS (479 PLN, up to 100 users) package, where scheduling is included.',
			],
			pricingNote:
				'Scheduling is not part of the free tier, which covers time tracking for up to 5 active accounts. Annual billing: you pay for 10 months instead of 12.',
			pricingCtaLabel: 'See full pricing',
			faqTitle: 'Frequently asked questions',
			faqs: [
				{
					q: 'Can the software build the schedule for me?',
					a: 'Yes. Planopia fills the roster automatically from the shifts you define, skipping weekends, public holidays, and anyone with approved leave that day. The result is a starting point — you can adjust any entry before publishing.',
				},
				{
					q: 'Does the schedule account for employee leave?',
					a: 'Yes. Leave requests and rosters live in the same system, so someone with approved leave is never rostered onto a shift. There is no separate file to keep in sync.',
				},
				{
					q: 'Do employees see the schedule as soon as it is created?',
					a: 'No. A roster has a draft and a published version, and the team only sees the published one. Nobody plans around a draft that is still going to change.',
				},
				{
					q: 'Can I set different shifts for different weekdays?',
					a: 'Yes. Each shift is described by its start and end time, the minimum number of people, and the weekdays it applies to.',
				},
				{
					q: 'Is scheduling available on the free tier?',
					a: 'No. After the 30-day trial, scheduling requires the “Schedules + AI” module on a CORE plan (59 PLN net/month) or a PRO or BUSINESS package. The free tier keeps time tracking for up to 5 active accounts.',
				},
			],
			ctaTitle: 'Build the roster without spreadsheets and phone calls',
			ctaNote:
				'30 days of the full app with scheduling, then the module on CORE from 59 PLN net/month or a PRO/BUSINESS package.',
			relatedTitle: 'Related reading',
			related: [
				{ href: '/en/for-construction-industry', label: 'Crew scheduling for construction' },
				{ href: '/en/time-tracking-software', label: 'Time tracking software' },
				{ href: '/en/leave-management-software', label: 'Leave management software' },
			],
			heroImageSrc: '/img/aigrafik-en.webp',
			heroImageAlt: 'Team work schedule in the Planopia app',
			breadcrumbName: 'Work schedule software',
			offerPrice: '118',
			offerDescription:
				'30-day full trial free; the cheapest route is a CORE plan (from 59 PLN net/month, up to 8 users) plus the Schedules + AI module (59 PLN net/month), from 118 PLN together, or a PRO package from 239 PLN.',
		},
	},
	attendance: {
		pl: {
			eyebrow: 'Rejestracja czasu pracy i lista obecności',
			heroH1: 'Rejestracja czasu pracy przez QR i elektroniczna lista obecności',
			heroSub:
				'Zamiast papierowej listy obecności — kod QR w wejściu i licznik czasu w telefonie. Pracownik skanuje kod przy wejściu i wyjściu, a Ty masz gotowe godziny w ewidencji, bez przepisywania z kartki.',
			ctaButton: 'Załóż darmowy zespół — 30 dni gratis',
			secondaryLabel: 'Zobacz aplikację',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'Dlaczego papierowa lista obecności to za mało?',
			problems: [
				'Podpis na liście potwierdza obecność, ale nie godzinę wejścia i wyjścia — a ewidencja czasu pracy wymaga jednego i drugiego.',
				'Godziny z kartki i tak trzeba przepisać do arkusza przed rozliczeniem miesiąca.',
				'Przy kilku obiektach albo ekipach w terenie nikt nie wie na bieżąco, kto już zaczął pracę.',
			],
			featuresTitle: 'Co potrafi rejestracja czasu pracy w Planopii',
			featuresIntro:
				'Każde zeskanowanie zapisuje wejście lub wyjście przy konkretnym kodzie, więc od razu wiadomo nie tylko kiedy, ale i gdzie.',
			features: [
				'Kody QR z nazwą — osobny kod na każdy obiekt, budowę lub wejście; kod można w każdej chwili dezaktywować.',
				'Wejście i wyjście jednym skanem z telefonu — bez czytnika i bez dodatkowego sprzętu.',
				'Licznik czasu pracy z przerwami — alternatywa dla QR, gdy praca odbywa się przy biurku.',
				'Opis wykonanej pracy i powiązanie z zadaniem przy wpisie — przydatne przy rozliczaniu klienta.',
				'Zarejestrowane godziny trafiają do tej samej ewidencji, z której robisz raporty PDF i Excel.',
				'Podgląd dla Admina, HR i przełożonego — kto pracuje teraz, bez dzwonienia po ekipach.',
			],
			galleryTitle: 'Rejestracja czasu w Planopii — zrzuty z aplikacji',
			stepsTitle: 'Jak zacząć — 3 kroki',
			steps: [
				'Załóż darmowy zespół (30 dni pełnej aplikacji, do 5 osób).',
				'Wygeneruj kod QR dla obiektu lub wejścia i wydrukuj go.',
				'Pracownicy skanują kod telefonem, a godziny same trafiają do ewidencji.',
			],
			pricingTitle: 'Ile kosztuje rejestracja czasu pracy przez QR?',
			pricingIntro:
				'Licznik czasu i kody QR to moduł płatny — sama ewidencja czasu pracy działa też w planie bezpłatnym:',
			pricingBullets: [
				'30 dni pełnej aplikacji za darmo (do 5 osób), z QR i licznikiem czasu.',
				'Po próbie: moduł „Timer + QR” do planu CORE za 39 zł netto / mies.',
				'Albo pakiet PRO (239 zł, do 30 osób) lub BUSINESS (479 zł, do 100 osób), gdzie moduł jest w cenie.',
			],
			pricingNote:
				'W planie bezpłatnym zostaje ręczna ewidencja czasu pracy do 5 aktywnych kont — z kalendarzem i eksportem PDF/XLSX, ale bez QR i licznika. Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12.',
			pricingCtaLabel: 'Zobacz pełny cennik',
			faqTitle: 'Najczęstsze pytania',
			faqs: [
				{
					q: 'Czy lista obecności wystarczy zamiast ewidencji czasu pracy?',
					a: 'Nie. Lista obecności potwierdza jedynie stawienie się do pracy. Ewidencja musi dodatkowo wykazywać godzinę rozpoczęcia i zakończenia pracy, godziny nadliczbowe i nocne oraz rodzaj nieobecności. Rejestracja przez QR zapisuje godziny, więc od razu buduje ewidencję, a nie samą listę.',
				},
				{
					q: 'Czy potrzebny jest czytnik kodów albo dodatkowy sprzęt?',
					a: 'Nie. Wystarczy telefon pracownika i wydrukowany kod. Planopia działa w przeglądarce jako aplikacja PWA, więc nie trzeba nic instalować ze sklepu.',
				},
				{
					q: 'Czy mogę mieć osobny kod dla każdego obiektu?',
					a: 'Tak. Kody generujesz z nazwą — na przykład osobny dla każdej budowy, lokalu albo wejścia. Każdy wpis zapisuje się przy konkretnym kodzie, a nieużywany kod możesz dezaktywować.',
				},
				{
					q: 'Co, jeśli pracownik zapomni zeskanować kod?',
					a: 'Administrator, HR lub przełożony może uzupełnić wpis ręcznie w ewidencji. QR przyspiesza rejestrację, ale nie jest jedyną drogą wprowadzenia godzin.',
				},
				{
					q: 'Czy rejestracja przez QR jest w planie darmowym?',
					a: 'Nie. Po 30-dniowym okresie próbnym QR i licznik czasu wymagają modułu „Timer + QR” do planu CORE (39 zł netto miesięcznie) albo pakietu PRO lub BUSINESS. Ręczna ewidencja czasu pracy pozostaje bezpłatna dla maksymalnie 5 aktywnych kont.',
				},
			],
			ctaTitle: 'Zamień papierową listę na skan kodu',
			ctaNote:
				'30 dni pełnej aplikacji z QR i licznikiem, potem moduł do planu CORE od 39 zł netto/mies. albo pakiet PRO/BUSINESS.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/blog/ewidencja-czasu-pracy-excel-wzor', label: 'Wzór ewidencji czasu pracy — Excel i PDF' },
				{ href: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie', label: 'Ewidencja czasu pracy na budowie' },
				{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
				{ href: '/ewidencja-nadgodzin', label: 'Ewidencja nadgodzin' },
				{ href: '/dla-branzy-budowlanej', label: 'Dla firm budowlanych' },
			],
			heroImageSrc: '/img/desktopnews.webp',
			heroImageAlt: 'Rejestracja czasu pracy i lista obecności w aplikacji Planopia',
			breadcrumbName: 'Rejestracja czasu pracy przez QR',
			offerPrice: '98',
			offerDescription:
				'30 dni pełnej aplikacji za darmo; potem najtaniej plan CORE (od 59 zł netto/mies., do 8 osób) z modułem Timer + QR (39 zł netto/mies.), razem od 98 zł, albo pakiet PRO od 239 zł.',
		},
		en: {
			eyebrow: 'Time clocking and attendance',
			heroH1: 'QR time clocking and electronic attendance records',
			heroSub:
				'Replace the paper attendance sheet with a QR code at the entrance and a timer on the phone. People scan in and out, and the hours land in your time records without anyone retyping them.',
			ctaButton: 'Create your free team — 30 days free',
			secondaryLabel: 'See the app',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'Why a paper attendance sheet is not enough',
			problems: [
				'A signature proves someone showed up, but not when they started and finished — proper records need both.',
				'Hours written on paper still have to be retyped into a spreadsheet before payroll.',
				'Across several sites or field crews, nobody knows in real time who has already started.',
			],
			featuresTitle: 'What time clocking in Planopia does',
			featuresIntro:
				'Every scan records an entry or exit against a specific code, so you know not only when, but where.',
			features: [
				'Named QR codes — one per site, project, or entrance; any code can be deactivated at any time.',
				'Clock in and out with a single phone scan — no reader and no extra hardware.',
				'A work timer with breaks — an alternative to QR for desk-based work.',
				'A work description and an optional task link on each entry — useful when billing a client.',
				'Recorded hours feed the same time records you export to PDF and Excel.',
				'A live view for admins, HR, and supervisors — who is working right now, without phoning around.',
			],
			galleryTitle: 'Time clocking in Planopia — app screenshots',
			stepsTitle: 'How to start — 3 steps',
			steps: [
				'Create your free team (30 days of the full app, up to 5 users).',
				'Generate a QR code for a site or entrance and print it.',
				'People scan with their phone, and the hours flow into your records.',
			],
			pricingTitle: 'How much does QR time clocking cost?',
			pricingIntro:
				'The timer and QR codes are a paid module — plain time records also work on the free tier:',
			pricingBullets: [
				'30 days of the full app free (up to 5 users), with QR and the timer included.',
				'After the trial: the “Timer + QR” module on a CORE plan for 39 PLN net/month.',
				'Or a PRO (239 PLN, up to 30 users) or BUSINESS (479 PLN, up to 100 users) package, where it is included.',
			],
			pricingNote:
				'The free tier keeps manual time records for up to 5 active accounts, with the monthly calendar and PDF/XLSX export, but without QR or the timer. Annual billing: you pay for 10 months instead of 12.',
			pricingCtaLabel: 'See full pricing',
			faqTitle: 'Frequently asked questions',
			faqs: [
				{
					q: 'Is an attendance sheet enough instead of time records?',
					a: 'No. An attendance sheet only confirms that someone turned up. Time records also have to show start and end times, overtime and night hours, and the type of any absence. QR clocking captures the hours, so it builds records rather than just a list.',
				},
				{
					q: 'Do I need a scanner or extra hardware?',
					a: 'No. A phone and a printed code are enough. Planopia runs in the browser as a PWA, so there is nothing to install from an app store.',
				},
				{
					q: 'Can I have a separate code for each site?',
					a: 'Yes. Codes are created with a name — one per building site, venue, or entrance. Each entry is saved against a specific code, and unused codes can be deactivated.',
				},
				{
					q: 'What if someone forgets to scan?',
					a: 'An admin, HR, or a supervisor can add the entry manually. QR speeds recording up, but it is not the only way hours get in.',
				},
				{
					q: 'Is QR clocking available on the free tier?',
					a: 'No. After the 30-day trial, QR and the timer require the “Timer + QR” module on a CORE plan (39 PLN net/month) or a PRO or BUSINESS package. Manual time records stay free for up to 5 active accounts.',
				},
			],
			ctaTitle: 'Swap the paper sheet for a scan',
			ctaNote:
				'30 days of the full app with QR and the timer, then the module on CORE from 39 PLN net/month or a PRO/BUSINESS package.',
			relatedTitle: 'Related reading',
			related: [
				{ href: '/en/time-tracking-software', label: 'Time tracking software' },
				{ href: '/en/for-construction-industry', label: 'For construction' },
				{ href: '/en/work-schedule-software', label: 'Work schedule software' },
			],
			heroImageSrc: '/img/desktop-ennews.webp',
			heroImageAlt: 'QR time clocking and attendance in the Planopia app',
			breadcrumbName: 'QR time clocking',
			offerPrice: '98',
			offerDescription:
				'30-day full trial free; the cheapest route is a CORE plan (from 59 PLN net/month, up to 8 users) plus the Timer + QR module (39 PLN net/month), from 98 PLN together, or a PRO package from 239 PLN.',
		},
	},
	overtime: {
		pl: {
			eyebrow: 'Ewidencja nadgodzin',
			heroH1: 'Ewidencja nadgodzin — rozliczanie godzin nadliczbowych online',
			heroSub:
				'Nadgodziny wykazuje się przy konkretnym dniu, a nie ryczałtem na koniec miesiąca. W Planopii dopisujesz je do dziennego wpisu, a raport miesięczny liczy się sam. Ręczna ewidencja działa też w planie bezpłatnym.',
			ctaButton: 'Załóż darmowy zespół — 30 dni gratis',
			secondaryLabel: 'Zobacz aplikację',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'Co najczęściej psuje rozliczanie nadgodzin?',
			problems: [
				'Nadgodziny wpisywane zbiorczo na koniec miesiąca — z takiego zapisu nie wynika, kiedy praca ponad normę faktycznie wystąpiła.',
				'Osobny arkusz na nadgodziny, który rozjeżdża się z ewidencją godzin zwykłych.',
				'Brak bieżącego podglądu, komu narosło już tyle nadgodzin, że trzeba zareagować.',
			],
			featuresTitle: 'Co potrafi ewidencja nadgodzin w Planopii',
			featuresIntro:
				'Nadgodziny są częścią tego samego wpisu dziennego co godziny zwykłe, więc jedno nie może rozjechać się z drugim.',
			features: [
				'Nadgodziny przy konkretnym dniu, w krokach co pół godziny — zgodnie z tym, jak wykazuje się je w dokumentacji.',
				'Walidacja przy zapisie: nadgodziny bez podanych godzin pracy nie przejdą, a wpisana nieobecność je czyści.',
				'Podgląd całego zespołu — widzisz, gdzie nadgodziny narastają, zanim zrobi się problem.',
				'Raporty miesięczne z podsumowaniem godzin i nadgodzin, eksport do PDF i Excela.',
				'Licznik czasu pracy potrafi oznaczyć nadgodziny osobno już w trakcie pracy (moduł płatny).',
				'Nieobecności i urlopy w tym samym systemie — nadgodziny nie doliczą się do dnia wolnego.',
			],
			galleryTitle: 'Nadgodziny w Planopii — zrzuty z aplikacji',
			stepsTitle: 'Jak zacząć — 3 kroki',
			steps: [
				'Załóż darmowy zespół (30 dni pełnej aplikacji, do 5 osób).',
				'Dodaj pracowników — z kontem lub bez dostępu do aplikacji.',
				'Wpisuj godziny i nadgodziny przy dniach, a na koniec miesiąca pobierz raport.',
			],
			pricingTitle: 'Ile kosztuje ewidencja nadgodzin?',
			pricingIntro:
				'Nadgodziny są elementem wpisu dziennego, więc ewidencjonujesz je już w planie bezpłatnym:',
			pricingBullets: [
				'30 dni pełnej aplikacji za darmo (do 5 osób), bez podawania karty na start.',
				'Po próbie: bezpłatna ewidencja czasu pracy i nadgodzin do 5 aktywnych kont.',
				'Większy zespół: plan CORE od 59 zł netto/mies. albo pakiet PRO lub BUSINESS.',
			],
			pricingNote:
				'Automatyczne oznaczanie nadgodzin przez licznik czasu i kody QR to moduł dodatkowy (39 zł netto/mies. na planie CORE) lub część pakietu PRO/BUSINESS. Ręczne wpisy, kalendarz i eksport PDF/XLSX działają w planie bezpłatnym. Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12.',
			pricingCtaLabel: 'Zobacz pełny cennik',
			faqTitle: 'Najczęstsze pytania',
			faqs: [
				{
					q: 'Czy nadgodziny trzeba wykazywać przy konkretnym dniu?',
					a: 'Tak. Karta ewidencji czasu pracy obejmuje liczbę godzin nadliczbowych obok godzin przepracowanych w danym dniu — wynika to z § 6 pkt 1 rozporządzenia Ministra Rodziny, Pracy i Polityki Społecznej z 10 grudnia 2018 r. w sprawie dokumentacji pracowniczej. Wpis zbiorczy na koniec miesiąca nie pozwala ustalić, kiedy praca ponad normę wystąpiła.',
				},
				{
					q: 'Czy ewidencja nadgodzin jest darmowa?',
					a: 'Tak. Nadgodziny wpisujesz razem z godzinami pracy w dziennym wpisie, a ten działa również na bezpłatnym planie z ewidencją czasu pracy dla maksymalnie 5 aktywnych kont. Eksport raportów do PDF i Excela też jest w planie bezpłatnym.',
				},
				{
					q: 'Czy program pilnuje spójności wpisów?',
					a: 'Tak. Nadgodziny bez podanych godzin pracy nie zostaną zapisane, a oznaczenie nieobecności czyści nadgodziny w tym dniu — dzięki temu w ewidencji nie zostaje sprzeczny wpis.',
				},
				{
					q: 'Czy da się rozliczyć nadgodziny za pomocą dnia wolnego?',
					a: 'Sam wybór formy rekompensaty — dodatek do wynagrodzenia albo czas wolny — należy do pracodawcy i zależy od przepisów oraz wniosku pracownika. Planopia dokumentuje godziny i nieobecności, w tym dni wolne udzielone w zamian, ale nie zastępuje decyzji kadrowej.',
				},
				{
					q: 'Czy mogę wyeksportować zestawienie nadgodzin?',
					a: 'Tak — raporty miesięczne z godzinami i nadgodzinami wyeksportujesz do PDF i Excela (XLSX), na przykład dla księgowości.',
				},
			],
			ctaTitle: 'Rozliczaj nadgodziny bez osobnego arkusza',
			ctaNote:
				'30 dni pełnej aplikacji, potem bezpłatna ewidencja czasu pracy i nadgodzin do 5 kont albo pakiet płatny.',
			relatedTitle: 'Powiązane materiały',
			related: [
				{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
				{ href: '/blog/ewidencja-czasu-pracy-excel-wzor', label: 'Wzór ewidencji czasu pracy — Excel i PDF' },
				{ href: '/rejestracja-czasu-pracy-qr', label: 'Rejestracja czasu pracy przez QR' },
				{ href: '/blog/elektroniczna-ewidencja-czasu-pracy', label: 'Elektroniczna ewidencja — Excel czy program?' },
			],
			heroImageSrc: '/img/desktopnews.webp',
			heroImageAlt: 'Ewidencja nadgodzin i godzin pracy w aplikacji Planopia',
			breadcrumbName: 'Ewidencja nadgodzin',
			offerPrice: '0',
			offerDescription:
				'30 dni pełnej aplikacji; potem bezpłatna ewidencja czasu pracy i nadgodzin do 5 aktywnych kont lub pakiety płatne.',
		},
		en: {
			eyebrow: 'Overtime records',
			heroH1: 'Overtime tracking — record and settle overtime hours online',
			heroSub:
				'Overtime belongs to a specific day, not to a lump sum at the end of the month. In Planopia you add it to the daily entry and the monthly report adds itself up. Manual records work on the free tier too.',
			ctaButton: 'Create your free team — 30 days free',
			secondaryLabel: 'See the app',
			secondaryHref: '#commercial-gallery',
			problemsTitle: 'What usually breaks overtime settlement',
			problems: [
				'Overtime entered as one monthly total — you can no longer tell when the extra work actually happened.',
				'A separate overtime spreadsheet that drifts away from the regular hours.',
				'No running view of whose overtime has built up enough to need attention.',
			],
			featuresTitle: 'What overtime tracking in Planopia does',
			featuresIntro:
				'Overtime lives in the same daily entry as regular hours, so the two cannot drift apart.',
			features: [
				'Overtime on a specific day, in half-hour steps.',
				'Validation on save: overtime without work hours is rejected, and marking an absence clears it.',
				'A view across the team — you see overtime building up before it becomes a problem.',
				'Monthly reports totalling hours and overtime, exported to PDF and Excel.',
				'The work timer can flag overtime separately while the work is happening (paid module).',
				'Absences and leave in the same system, so overtime is never added to a day off.',
			],
			galleryTitle: 'Overtime in Planopia — app screenshots',
			stepsTitle: 'How to start — 3 steps',
			steps: [
				'Create your free team (30 days of the full app, up to 5 users).',
				'Add people — with an account or without app access.',
				'Record hours and overtime per day, then download the monthly report.',
			],
			pricingTitle: 'How much does overtime tracking cost?',
			pricingIntro:
				'Overtime is part of the daily entry, so you can record it on the free tier:',
			pricingBullets: [
				'30 days of the full app free (up to 5 users), no card required to start.',
				'After the trial: free time and overtime records for up to 5 active accounts.',
				'A larger team: a CORE plan from 59 PLN net/month, or a PRO or BUSINESS package.',
			],
			pricingNote:
				'Flagging overtime automatically through the work timer and QR codes is a paid module (39 PLN net/month on CORE) or part of a PRO/BUSINESS package. Manual entries, the calendar, and PDF/XLSX export work on the free tier. Annual billing: you pay for 10 months instead of 12.',
			pricingCtaLabel: 'See full pricing',
			faqTitle: 'Frequently asked questions',
			faqs: [
				{
					q: 'Does overtime have to be recorded against a specific day?',
					a: 'Yes. Under Polish record-keeping rules, the time card covers overtime hours alongside the hours worked on that day, so a single monthly total does not show when the extra work took place.',
				},
				{
					q: 'Is overtime tracking free?',
					a: 'Yes. Overtime is entered together with working hours in the daily entry, which also works on the free tier for up to 5 active accounts. PDF and Excel exports are included on the free tier too.',
				},
				{
					q: 'Does the app keep entries consistent?',
					a: 'Yes. Overtime without work hours will not save, and marking an absence clears overtime for that day, so no contradictory entry is left in the records.',
				},
				{
					q: 'Can overtime be settled with time off instead of pay?',
					a: 'Choosing between a pay supplement and time off is an employer decision that depends on local law and the employee’s request. Planopia documents the hours and any days off granted in exchange, but it does not replace that decision.',
				},
				{
					q: 'Can I export an overtime summary?',
					a: 'Yes — monthly reports with hours and overtime export to PDF and Excel (XLSX), for example for payroll.',
				},
			],
			ctaTitle: 'Settle overtime without a separate spreadsheet',
			ctaNote:
				'30 days of the full app, then free time and overtime records for up to 5 accounts or a paid package.',
			relatedTitle: 'Related reading',
			related: [
				{ href: '/en/time-tracking-software', label: 'Time tracking software' },
				{ href: '/en/blog/electronic-time-tracking', label: 'Electronic time tracking' },
				{ href: '/en/work-schedule-software', label: 'Work schedule software' },
			],
			heroImageSrc: '/img/desktop-ennews.webp',
			heroImageAlt: 'Overtime and working hours in the Planopia app',
			breadcrumbName: 'Overtime tracking',
			offerPrice: '0',
			offerDescription:
				'30-day full trial; then free time and overtime records for up to 5 active accounts, or paid plans.',
		},
	},
}

export const CANONICAL: Record<Variant, Record<Locale, string>> = {
	leave: {
		pl: 'https://planopia.pl/program-do-urlopow',
		en: 'https://planopia.pl/en/leave-management-software',
	},
	time: {
		pl: 'https://planopia.pl/program-do-ewidencji-czasu-pracy',
		en: 'https://planopia.pl/en/time-tracking-software',
	},
	schedule: {
		pl: 'https://planopia.pl/program-do-grafikow-pracy',
		en: 'https://planopia.pl/en/work-schedule-software',
	},
	attendance: {
		pl: 'https://planopia.pl/rejestracja-czasu-pracy-qr',
		en: 'https://planopia.pl/en/qr-time-clocking',
	},
	overtime: {
		pl: 'https://planopia.pl/ewidencja-nadgodzin',
		en: 'https://planopia.pl/en/overtime-tracking',
	},
}
