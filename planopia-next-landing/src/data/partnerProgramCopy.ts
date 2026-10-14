// Program partnerski — treść podstrony /program-partnerski (PL). Warunki muszą zgadzać się z aplikacją:
// domyślne stawki partnera w panelu admina (client/src/components/admin/AdminPartners.jsx), cookie ?ref (90 dni,
// pierwsze polecenie — src/lib/referral.ts) i baza wiedzy server/constants/productKnowledge/partners.js.
import { landingBundles, landingCoreTiers, LANDING_TRIAL_DAYS, landingTrial } from '@/data/landingPlanPricing'
import { PARTNER_COMPANY_RANGES, PARTNER_ROLES } from '@/lib/validations/partnerApplication'

export const PARTNER_PAGE_PATH = '/program-partnerski'
export const PARTNER_PAGE_URL = `https://planopia.pl${PARTNER_PAGE_PATH}`
export const PARTNER_PANEL_URL = 'https://app.planopia.pl/partner'

/** Standardowe warunki — takie same jak domyślne w panelu partnerów */
export const PARTNER_TERMS = {
	initialRate: 0.25,
	initialMonths: 12,
	laterRate: 0.1,
	referralDays: 90,
}

const pct = (rate: number) => `${Math.round(rate * 100)}%`
export const TERMS_LABEL = {
	initial: pct(PARTNER_TERMS.initialRate),
	later: pct(PARTNER_TERMS.laterRate),
}

type PlanRef = { id: string; monthlyNetPln: number; maxUsers: number }
function plan(list: readonly PlanRef[], id: string): PlanRef {
	const found = list.find(p => p.id === id)
	// Ceny tylko z katalogu (plik generowany) — brak planu to błąd budowania, nie cichy zły kalkulator
	if (!found) throw new Error(`Brak planu ${id} w landingPlanPricing`)
	return found
}

export type CalculatorPlan = { id: string; label: string; detail: string; monthlyNetPln: number }

/** Plany do kalkulatora zarobku — typowe dla firm, które polecają biura */
export const CALCULATOR_PLANS: CalculatorPlan[] = [
	{ ...pick(landingCoreTiers, 'base_s', 'Core'), detail: 'ewidencja i urlopy' },
	{ ...pick(landingBundles, 'pro_15', 'PRO'), detail: 'pełny pakiet' },
	{ ...pick(landingBundles, 'pro', 'PRO'), detail: 'pełny pakiet' },
	{ ...pick(landingBundles, 'pro_50', 'PRO'), detail: 'pełny pakiet' },
]
function pick(list: readonly PlanRef[], id: string, name: string) {
	const p = plan(list, id)
	return { id, label: `${name} · do ${p.maxUsers} osób`, monthlyNetPln: p.monthlyNetPln }
}
export const CALCULATOR_DEFAULT_PLAN = 'pro_15'
export const CALCULATOR_DEFAULT_COMPANIES = 10

export const TRIAL = { days: LANDING_TRIAL_DAYS, freeUsers: landingTrial.maxUsers }

export const HERO = {
	eyebrow: 'Program partnerski Planopia',
	titleLead: 'Polecasz Planopię.',
	titleAccent: 'Zarabiasz co miesiąc.',
	lead: `${TERMS_LABEL.initial} od każdej płatności poleconej firmy przez pierwszy rok, potem ${TERMS_LABEL.later} — tak długo, jak firma korzysta z Planopii. Dla biur rachunkowych, kadrowych i każdego, kto zna firmy z zespołami.`,
	primaryCta: 'Zostań partnerem',
	secondaryCta: 'Policz swój zarobek',
	checks: ['Bez opłat i bez targetów', 'Prowizje widoczne w panelu', 'Rozliczenie co miesiąc'],
	panelLink: 'Masz już konto partnera?',
	panelLinkCta: 'Przejdź do panelu',
}

export const TERMS_STRIP = [
	{ value: TERMS_LABEL.initial, title: 'przez pierwsze 12 miesięcy', text: 'od każdej płatności netto firmy, licząc od jej pierwszej płatności' },
	{ value: TERMS_LABEL.later, title: 'potem bez limitu czasu', text: 'dopóki polecona firma korzysta z Planopii i płaci' },
	{ value: `${PARTNER_TERMS.referralDays} dni`, title: 'ważności polecenia', text: 'firma może założyć konto z Twojego linku nawet po kilku tygodniach' },
	{ value: '0 zł', title: 'kosztu po Twojej stronie', text: 'konto partnera i panel prowizji są bezpłatne' },
]

export const AUDIENCES = {
	eyebrow: 'Dla kogo',
	title: 'Dwa powody, żeby polecać Planopię',
	offices: {
		tag: 'Biura rachunkowe i kadrowe',
		title: 'Klienci prowadzą ewidencję w Planopii. Ty masz ich dane pod ręką.',
		points: [
			'Panel biura: godziny, nadgodziny, urlopy i salda pracowników wszystkich klientów w jednym miejscu',
			'Eksport miesiąca do Excela i PDF — gotowy do naliczenia wynagrodzeń',
			'Widzisz, kto potwierdził ewidencję miesiąca — koniec z ponaglaniem mailami',
			'Dostęp tylko za zgodą klienta, wyłącznie do odczytu, z historią wejść',
		],
		bonus: `Do tego ${TERMS_LABEL.initial} prowizji od każdej poleconej firmy`,
	},
	referrers: {
		tag: 'Doradcy, handlowcy, firmy IT',
		title: 'Znasz firmy, które mają pracowników? Wystarczy jeden link',
		points: [
			'Własny link polecający i panel z prowizjami w Planopii',
			`Firma testuje pełną wersję ${TRIAL.days} dni za darmo — łatwo ją przekonać`,
			'Prowizja od każdej płatności, a nie jednorazowa premia',
			'Co miesiąc zestawienie PDF, na podstawie którego wystawiasz fakturę',
		],
		bonus: `Po roku nadal ${TERMS_LABEL.later} od każdej płatności — bez limitu czasu`,
	},
}

export const CALCULATOR = {
	eyebrow: 'Kalkulator',
	title: 'Ile możesz zarobić?',
	lead: 'Przesuń suwak i wybierz typowy plan Twoich klientów. Liczymy na prawdziwych cenach z cennika Planopii.',
	companiesLabel: 'Ile firm polecisz?',
	planLabel: 'Typowy plan poleconej firmy',
	perMonthNet: 'netto / mies.',
	perFirm: 'Za jedną firmę na tym planie',
	perFirmFirst: `/ mies. przez pierwsze ${PARTNER_TERMS.initialMonths} miesięcy`,
	perFirmLater: '/ mies. później, bez limitu czasu',
	firstYear: 'Twoja prowizja w 1. roku',
	monthly: 'miesięcznie',
	nextYears: 'każdy kolejny rok',
	threeYears: 'łącznie przez 3 lata',
	chartYear: 'Rok',
	note: 'Kwoty netto. Przykład zakłada, że wszystkie firmy płacą co miesiąc od tego samego miesiąca. Prowizja naliczana jest od płatności, które faktycznie wpłyną.',
}

export const STEPS = {
	eyebrow: 'Jak to działa',
	title: 'Cztery kroki od zgłoszenia do pierwszej wypłaty',
	items: [
		{ title: 'Zgłaszasz się', text: 'Wypełniasz krótki formularz. Oddzwonimy, odpowiemy na pytania i założymy konto partnera.' },
		{ title: 'Dostajesz link i panel', text: 'W Planopii widzisz swój link polecający, polecone firmy, prowizje i zestawienia do pobrania.' },
		{ title: 'Polecasz', text: `Wysyłasz link klientom. Firma zakłada konto i testuje Planopię ${TRIAL.days} dni za darmo — bez karty i bez zobowiązań.` },
		{ title: 'Zarabiasz co miesiąc', text: 'Po zamknięciu miesiąca wystawiasz fakturę na kwotę z zestawienia, a my robimy przelew.' },
	],
}

export const OFFICE_PANEL = {
	eyebrow: 'Dla biur rachunkowych',
	title: 'Panel biura rachunkowego: wszyscy klienci w jednym miejscu',
	lead: 'Koniec zbierania Exceli od klientów. Firma udostępnia Ci dane jednym kliknięciem w ustawieniach. Ty widzisz gotowe podsumowanie miesiąca dla każdego pracownika — i eksportujesz je do płac.',
	features: [
		{ title: 'Miesiąc per pracownik', text: 'Dni pracy, godziny, nadgodziny, urlopy i inne nieobecności — policzone tak jak w ewidencji firmy.' },
		{ title: 'Salda urlopów', text: 'Ile urlopu wypoczynkowego zostało każdemu pracownikowi, bez dopytywania.' },
		{ title: 'Potwierdzenia miesiąca', text: 'Od razu widać, kto zatwierdził swoją ewidencję, a kogo trzeba przypomnieć.' },
		{ title: 'Bezpiecznie i za zgodą', text: 'Tylko odczyt, dostęp na podstawie zgody klienta i umowy powierzenia; klient widzi historię wejść biura.' },
	],
}

export const PROOF = {
	eyebrow: 'Co polecasz',
	title: 'Planopia, którą łatwo polecić',
	lead: 'Firmy przechodzą na Planopię z Excela i papierowych list obecności. Ty polecasz narzędzie, które realnie oszczędza im czas.',
	features: [
		{ label: 'Ewidencja czasu pracy', href: '/program-do-ewidencji-czasu-pracy' },
		{ label: 'Urlopy i salda', href: '/program-do-urlopow' },
		{ label: 'Grafiki pracy', href: '/program-do-grafikow-pracy' },
		{ label: 'Rejestracja przez QR', href: '/rejestracja-czasu-pracy-qr' },
		{ label: 'Ewidencja nadgodzin', href: '/ewidencja-nadgodzin' },
	],
	facts: [
		{ value: `${TRIAL.days} dni`, text: 'pełnej wersji za darmo' },
		{ value: `${TRIAL.freeUsers} osób`, text: 'w darmowym planie na stałe' },
		{ value: 'PL', text: 'polskie prawo pracy i święta' },
	],
}

export const FAQ: { q: string; a: string }[] = [
	{
		q: 'Ile kosztuje udział w programie partnerskim?',
		a: 'Nic. Konto partnera, link polecający i panel z prowizjami są bezpłatne. Nie ma też żadnych targetów ani minimalnej liczby poleceń.',
	},
	{
		q: 'Od czego liczona jest prowizja?',
		a: `Od kwot netto, które polecona firma płaci za plan Planopii — kartą, przez Przelewy24 albo przelewem na fakturę. Przez pierwsze ${PARTNER_TERMS.initialMonths} miesięcy od pierwszej płatności firmy dostajesz ${TERMS_LABEL.initial}, później ${TERMS_LABEL.later}, dopóki firma płaci.`,
	},
	{
		q: 'Co jeśli firma zrezygnuje po kilku miesiącach?',
		a: 'Prowizja jest zawsze od płatności, które faktycznie wpłynęły. Gdy firma przestaje płacić, prowizja od niej się kończy. Jeśli płatność zostanie zwrócona, prowizja od niej jest cofana.',
	},
	{
		q: 'Czy polecona firma płaci przez to więcej?',
		a: 'Nie. Firma płaci standardowe ceny z cennika Planopii, a prowizja jest po naszej stronie.',
	},
	{
		q: 'Jak firma trafia do mnie jako polecona?',
		a: `Zakłada konto z Twojego linku. Zapamiętujemy polecenie przez ${PARTNER_TERMS.referralDays} dni, więc firma nie musi rejestrować się od razu. Liczy się pierwsze polecenie, z którego firma przyszła.`,
	},
	{
		q: 'Kiedy i jak dostaję wypłatę?',
		a: 'Rozliczamy się co miesiąc. Po zamknięciu miesiąca w panelu partnera widzisz kwotę do wypłaty i pobierasz zestawienie PDF. Na tę kwotę wystawiasz fakturę, a my robimy przelew.',
	},
	{
		q: 'Czy muszę prowadzić biuro rachunkowe?',
		a: 'Nie. Program jest otwarty dla doradców, handlowców, firm IT i każdego, kto zna firmy z zespołami. Biura rachunkowe i kadrowe dostają dodatkowo panel danych swoich klientów.',
	},
	{
		q: 'Czy biuro widzi dane klienta bez jego zgody?',
		a: 'Nie. Klient sam udostępnia dane biuru w ustawieniach Planopii, po zapoznaniu się z zakresem danych i umową powierzenia. Biuro ma dostęp tylko do odczytu, a klient może go odebrać w każdej chwili.',
	},
	{
		q: 'A firmy, które już korzystają z Planopii?',
		a: 'Prowizja dotyczy firm, które założą konto z Twojego linku. Biuro może jednak połączyć z panelem biura również obecnych klientów Planopii — za ich zgodą, przez zaproszenie e-mailem albo kod biura.',
	},
]

export const APPLY = {
	eyebrow: 'Dołącz',
	title: 'Zostań partnerem Planopii',
	lead: 'Zostaw kontakt — oddzwonimy, ustalimy szczegóły i założymy Ci konto partnera. Zwykle odpowiadamy w ciągu 1–2 dni roboczych.',
	altContact: 'Wolisz od razu porozmawiać?',
	fields: {
		name: 'Imię i nazwisko',
		email: 'E-mail',
		phone: 'Telefon',
		company: 'Nazwa biura lub firmy',
		role: 'Kim jesteś?',
		companies: 'Ile firm możesz polecić?',
		message: 'Wiadomość (opcjonalnie)',
		messagePlaceholder: 'Np. obsługujemy 40 firm, głównie gastronomię i usługi',
	},
	roles: PARTNER_ROLES,
	companyRanges: PARTNER_COMPANY_RANGES,
	consent: 'Wysyłając formularz, zgadzasz się na kontakt w sprawie programu partnerskiego. Zasady przetwarzania danych:',
	privacy: 'polityka prywatności',
	submit: 'Wyślij zgłoszenie',
	sending: 'Wysyłanie…',
	successTitle: 'Dziękujemy za zgłoszenie!',
	successText: 'Odezwiemy się wkrótce — zwykle w ciągu 1–2 dni roboczych.',
	error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie albo napisz na',
}

export const META = {
	title: 'Program partnerski — 25% prowizji dla biur | Planopia',
	description:
		'Polecaj Planopię i zarabiaj: 25% od płatności poleconych firm przez rok, potem 10% bez limitu. Biura rachunkowe dostają panel danych klientów.',
	ogTitle: 'Program partnerski Planopia — zarabiaj na poleceniach',
	ogDescription: 'Prowizja 25% przez rok, potem 10% bez limitu czasu. Dla biur rachunkowych, kadrowych, doradców i firm IT.',
}
