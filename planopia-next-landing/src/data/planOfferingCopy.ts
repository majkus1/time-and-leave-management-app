/**
 * Spójny opis modelu: okres próbny → darmowy plan (ewidencja) → pakiety płatne.
 * Używany w meta, JSON-LD i treściach landing / blog (SEO + zgodność z produktem).
 */
import { landingBundles, landingCoreTiers } from './landingPlanPricing'

/** Ceny z planCatalog (generat: npm run knowledge:build) */
const CORE_FROM = landingCoreTiers[0].monthlyNetPln
const PAID_MAX = Math.max(...landingBundles.map(b => b.monthlyNetPln))

export const planOfferingCopy = {
	pl: {
		metaLong:
			`Planopia: ewidencja czasu pracy online, urlopy, grafiki, raporty PDF/Excel, czaty, tablice zadań i Asystent AI bez Excela i papierowych wniosków. 30 dni za darmo z pełną aplikacją (do 5 użytkowników). Potem możesz zostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wybrać plan Core z urlopami, raportami zespołu i Asystentem AI — od ${CORE_FROM} zł netto miesięcznie.`,
		metaShort:
			'Darmowa ewidencja czasu pracy, urlopy i grafiki bez Excela. 30 dni pełnej aplikacji za darmo, bez karty. Potem ewidencja do 5 osób lub pakiety z modułami i AI.',
		jsonLdOfferDescription:
			`30 dni pełnej aplikacji za darmo; potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub plany płatne od ${CORE_FROM} do ${PAID_MAX} PLN netto miesięcznie (Core, PRO, Business; ponad 100 osób — wycena indywidualna).`,
		heroH1: 'Ewidencja czasu pracy, urlopy i grafiki w jednym systemie',
		// Dwa zdania = dwie linie w hero (LandingHero łamie po \n): plan darmowy jest bezterminowy, 30 dni pełnej wersji to bonus.
		heroSub: 'Darmowy plan bez limitu czasu dla zespołów do 5 osób.\nNa start 30 dni pełnej wersji — z urlopami i grafikami.',
		valueEyebrow: 'Dlaczego nie Excel?',
		valueTitle: 'Excel nie przypilnuje procesu. Planopia tak.',
		valueLead:
			'Excel jest darmowy tylko do momentu, w którym ktoś musi zbierać pliki, przepisywać urlopy i przygotowywać raporty.',
		// Porównanie wiersz w wiersz: po lewej to, co czytelnik zna z Excela, po prawej to samo w Planopii
		valueCompare: {
			excelLabel: 'W Excelu',
			appLabel: 'W Planopii',
			rows: [
				{ excel: 'Zbierasz arkusze od kierowników i scalasz je ręcznie', app: 'Pracownicy wpisują godziny sami, a Ty widzisz cały zespół' },
				{ excel: 'Wnioski urlopowe przychodzą mailem, SMS-em i na kartkach', app: 'Wniosek, akceptacja i powiadomienie w jednym miejscu' },
				{ excel: 'Saldo urlopu liczysz ręcznie i łatwo o pomyłkę', app: 'Saldo urlopu liczy się samo po każdym wniosku' },
				{ excel: 'Grafik żyje w osobnym pliku i kilku wersjach', app: 'Grafik w tej samej aplikacji co ewidencja i urlopy' },
				{ excel: 'Raport na koniec miesiąca składasz godzinami', app: 'Raport PDF lub Excel jednym kliknięciem' },
			],
		},
		// Sekcja #oaplikacji. Nazywa specjalizacje (czas pracy zespolu) zamiast szerokiej
		// kategorii „zarzadzanie firma", ktorej produkt nie obejmuje.
		aboutEyebrow: 'Co znajdziesz w Planopii',
		aboutTitle: 'Wszystko wokół czasu pracy zespołu',
		aboutLead:
			'Planopia porządkuje to, co dzieje się wokół czasu pracy: ewidencję godzin, urlopy i grafik. W tym samym miejscu masz zadania, czat i Asystenta AI, więc wszystko jest w jednym miejscu i zawsze aktualne — a raporty eksportujesz do PDF lub Excela, kiedy potrzebujesz.',
		blogJsonLdExtra:
			' Artykuły o ewidencji czasu pracy i HR; w aplikacji trial 30 dni, potem darmowy plan ewidencji lub pakiety płatne.',
	},
	en: {
		metaLong:
			`Planopia: online time tracking, leave, schedules, PDF/Excel reports, team chat, task boards, and an AI Assistant without scattered spreadsheets or paper requests. 30-day free trial with the full product (up to 5 users). Then stay on a free time tracking plan for up to 5 active accounts, or choose the Core plan with leave, team reports and the AI Assistant — from ${CORE_FROM} PLN net per month.`,
		metaShort:
			'Free time tracking, leave, and schedules without spreadsheets. 30-day full trial, no card. Then free tier for 5 users or paid plans with full modules and AI.',
		jsonLdOfferDescription:
			`30-day full-product trial; then a free time tracking tier for up to 5 active accounts, or paid plans from ${CORE_FROM} to ${PAID_MAX} PLN net per month (Core, PRO, Business; over 100 people — custom quote).`,
		heroH1: 'Time tracking, leave and schedules in one system',
		heroSub: 'A free plan with no time limit for teams of up to 5.\nStart with 30 days of the full version — leave and schedules included.',
		valueEyebrow: 'Why not spreadsheets?',
		valueTitle: 'Spreadsheets do not manage the process. Planopia does.',
		valueLead:
			'Spreadsheets are free until someone has to collect files, rewrite leave requests, and prepare reports.',
		valueCompare: {
			excelLabel: 'In spreadsheets',
			appLabel: 'In Planopia',
			rows: [
				{ excel: 'You collect sheets from managers and merge them by hand', app: 'Employees log their own hours and you see the whole team' },
				{ excel: 'Leave requests arrive by email, text and on paper', app: 'Request, approval and notification in one place' },
				{ excel: 'You calculate leave balances by hand and mistakes happen', app: 'Leave balance updates itself after every request' },
				{ excel: 'The schedule lives in a separate file with several versions', app: 'Schedule in the same app as time tracking and leave' },
				{ excel: 'Month-end reports take hours to put together', app: 'PDF or Excel report in one click' },
			],
		},
		// Blizniak sekcji #oaplikacji — musi mowic to samo co wersja PL.
		aboutEyebrow: 'What you get in Planopia',
		aboutTitle: "Everything around your team's working time",
		aboutLead:
			'Planopia organizes what happens around working time: hours, leave, and schedules. In the same place you get tasks, chat, and the AI Assistant, so everything stays in one place and up to date — and you export reports to PDF or Excel whenever you need them.',
		blogJsonLdExtra:
			' Articles on time tracking and HR workflows; in the app: 30-day trial, then a free time tracking tier or paid plans.',
	},
} as const

/** Skrót do meta artykułów blogowych (import w layout.tsx). */
export const blogArticleOfferLine = {
	pl: '30 dni pełnej aplikacji za darmo (do 5 osób); potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub pakiety płatne z urlopami, grafikami, czatem i AI.',
	en: '30-day full trial (up to 5 users); then free time tracking for up to 5 active accounts, or paid plans with leave, schedules, chat, tasks, and AI.',
} as const
