import Link from 'next/link'
import type { ComparisonConfig } from './BlogComparisonArticle'
import { CORE_15, CORE_FROM, FREE_USERS, MAX_TIER, TIERS_LABEL, TRIAL_DAYS, ANNUAL_MONTHS, annualMonthly, moduleNet, pln } from './planopiaPricing'

// Dane konkurencji z oficjalnych cenników z tego dnia — przy aktualizacji wpisu sprawdź je ponownie i zmień obie daty
const VERIFIED_ON = '17 października 2026 r.'
const VERIFIED_ISO = '2026-10-17'

const link = 'text-emerald-700 hover:underline'

export const timeTrackingComparison: ComparisonConfig = {
	slug: 'programy-do-ewidencji-czasu-pracy-porownanie',
	h1: 'Programy do ewidencji czasu pracy — porównanie 2026',
	lead: 'Sześć programów dostępnych po polsku, porównanych na tych samych zasadach: czy jest darmowy plan, ile trwa okres próbny, za co naprawdę płacisz i czy urlopy oraz grafik są w cenie. Wszystkie dane pochodzą z cenników dostawców.',
	description:
		'Porównanie sześciu programów do ewidencji czasu pracy dostępnych w Polsce: darmowe plany, okresy próbne, ceny, urlopy, grafiki i rejestracja czasu. Dane z cenników dostawców.',
	published: '2026-10-17',
	modified: VERIFIED_ISO,
	verifiedOn: VERIFIED_ON,
	image: { src: '/img/product/pl-time-calendar.webp', width: 1600, height: 1017, alt: 'Kalendarz ewidencji czasu pracy w aplikacji Planopia' },
	breadcrumb: { label: 'Ewidencja czasu pracy', anchor: 'ewidencja' },
	shortAnswer: [
		<>
			<strong>Za darmo, bez limitu czasu:</strong> Registo (rejestracja czasu bez limitu pracowników) i Planopia (ewidencja do{' '}
			{FREE_USERS} osób — zobacz, co obejmuje{' '}
			<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy" className={link}>
				darmowa aplikacja do ewidencji czasu pracy
			</Link>
			). Pozostałe dają 14 dni próby.
		</>,
		<>
			<strong>Najniższa cena za osobę:</strong> RCPonline — od 4,50 zł netto miesięcznie w pakiecie do 10 pracowników.
		</>,
		<>
			<strong>Jedna cena za całą firmę:</strong> Registo PRO (cena stała) i Planopia (cena za próg wielkości zespołu, z urlopami i
			Asystentem AI w planie Core).
		</>,
		<>
			<strong>Rozbudowany grafik zmianowy:</strong> Kadromierz i inEwi — oba deklarują sprawdzanie grafiku pod kątem przepisów prawa
			pracy.
		</>,
	],
	tableIntro:
		'Ceny netto, chyba że zaznaczono inaczej. „Cena od” to najniższa kwota z cennika — zwykle przy płatności rocznej i z najmniejszym zakresem funkcji.',
	columns: [
		{ key: 'free', label: 'Darmowy plan' },
		{ key: 'trial', label: 'Okres próbny' },
		{ key: 'price', label: 'Cena od' },
		{ key: 'model', label: 'Za co płacisz' },
		{ key: 'leave', label: 'Urlopy' },
		{ key: 'schedules', label: 'Grafiki' },
		{ key: 'clocking', label: 'Rejestracja czasu' },
	],
	vendors: [
		{
			name: 'Planopia',
			source: 'https://planopia.pl/#cennik',
			cells: {
				free: `Tak — ewidencja do ${FREE_USERS} kont, bez limitu czasu`,
				trial: `${TRIAL_DAYS} dni pełnej aplikacji, bez karty`,
				price: `od ${CORE_FROM.monthlyNetPln} zł netto / mies. za zespół do ${CORE_FROM.maxUsers} osób (Core)`,
				model: `za zespół (${TIERS_LABEL})`,
				leave: 'Tak (Core)',
				schedules: `Tak (moduł ${moduleNet('schedules_ai')} zł lub pakiet PRO)`,
				clocking: `Kod QR i licznik czasu (moduł ${moduleNet('timer_qr')} zł), aplikacja na telefon (PWA)`,
			},
		},
		{
			name: 'inEwi',
			source: 'https://inewi.pl/cennik',
			cells: {
				free: 'Nie',
				trial: '14 dni, bez karty',
				price: 'od 10,95 zł netto / użytkownik / mies. (1 moduł, płatność roczna)',
				model: 'za użytkownika i liczbę modułów',
				leave: 'Tak (moduł Wnioski Urlopowe)',
				schedules: 'Tak (moduł Grafik Pracy)',
				clocking: 'Rejestrator z kodem QR, aplikacja iOS i Android',
			},
		},
		{
			name: 'Kadromierz',
			source: 'https://kadromierz.pl/cennik/',
			cells: {
				free: 'Nie',
				trial: '14 dni, bez karty',
				price: 'od 12,99 zł netto / pracownik / mies. (płatność roczna, plan do planowania grafiku)',
				model: 'za pracownika',
				leave: 'Tak',
				schedules: 'Tak',
				clocking: 'QR, PIN, GPS i zdjęcie — w planach z rejestracją czasu (od 15,99 zł)',
			},
		},
		{
			name: 'Registo',
			source: 'https://registo.pl/cennik',
			cells: {
				free: 'Tak — wersja podstawowa bez limitu pracowników',
				trial: '30 dni wersji PRO, bez karty',
				price: 'PRO: 99 zł brutto za 30 dni albo 599 zł brutto za rok — za całą firmę',
				model: 'za firmę, niezależnie od liczby osób',
				leave: 'Tylko w PRO',
				schedules: 'Tylko w PRO',
				clocking: 'Kod QR i PIN (także w wersji darmowej), aplikacja mobilna',
			},
		},
		{
			name: 'RCPonline',
			source: 'https://rcponline.pl/cennik/',
			cells: {
				free: 'Nie',
				trial: '14 dni, bez karty',
				price: 'od 4,50 zł netto / pracownik / mies. (MINI do 10 osób, płatność roczna)',
				model: 'za pracownika',
				leave: 'Tak',
				schedules: 'Tak (w MINI jeden harmonogram)',
				clocking: 'Aplikacja mobilna; czytnik QR jako płatny dodatek',
			},
		},
		{
			name: 'Calamari',
			source: 'https://calamari.pl/cennik',
			cells: {
				free: 'Nie',
				trial: '14 dni, bez karty',
				price: 'od 7 zł netto / pracownik / mies. za moduł (płatność roczna)',
				model: 'za pracownika i moduł',
				leave: 'Tak (moduł Nieobecności)',
				schedules: 'Tak (moduł Grafik pracy)',
				clocking: 'Kiosk z kodami QR i kartami NFC, aplikacje iOS i Android',
			},
		},
	],
	example: {
		title: 'Ile zapłacisz za zespół 15 osób',
		intro: (
			<>
				Najniższa kwota z nagłówka cennika rzadko jest tą, którą zapłacisz. Poniżej miesięczny koszt dla zespołu 15 osób, który
				potrzebuje <strong>ewidencji czasu pracy i wniosków urlopowych</strong>, przy płatności rocznej — w najtańszej konfiguracji,
				która to obejmuje.
			</>
		),
		rows: [
			{ name: 'Registo PRO', monthly: '≈ 40,58 zł netto', calc: '599 zł brutto za rok ÷ 1,23 ÷ 12 — jedna cena dla całej firmy' },
			{ name: 'RCPonline STANDARD', monthly: '97,50 zł netto', calc: '15 × 6,50 zł (pakiet MINI obejmuje do 10 osób)' },
			{
				name: `Planopia Core do ${CORE_15.maxUsers} osób`,
				monthly: `≈ ${pln(annualMonthly(CORE_15.monthlyNetPln))} zł netto`,
				calc: `${CORE_15.monthlyNetPln} zł × ${ANNUAL_MONTHS} miesięcy ÷ 12 — w rozliczeniu rocznym płacisz za ${ANNUAL_MONTHS} miesięcy`,
			},
			{ name: 'Calamari: Czas pracy + Nieobecności', monthly: '210,00 zł netto', calc: '15 × (7 zł + 7 zł)' },
			{ name: 'Kadromierz „Planuję i rozliczam”', monthly: '239,85 zł netto', calc: '15 × 15,99 zł (najtańszy plan z rejestracją czasu)' },
			{ name: 'inEwi: 2 moduły (RCP + Wnioski Urlopowe)', monthly: '269,25 zł netto', calc: '15 × 17,95 zł' },
		],
		note: 'Zakres funkcji w tych konfiguracjach nie jest identyczny: Planopia Core ma w cenie także raporty zespołu i Asystenta AI, Kadromierz — planowanie grafiku, a Registo PRO — grafik i bank godzin. Kwoty ze znakiem „≈” to nasze przeliczenia, nie ceny z cenników.',
	},
	criteria: [
		{
			title: 'Cena za osobę czy za zespół',
			body: 'Większość programów liczy opłatę od każdego pracownika i każdego modułu. Przy kilku osobach to korzystne, przy kilkunastu rachunek rośnie szybko. Registo i Planopia liczą cenę za firmę lub za próg wielkości zespołu.',
		},
		{
			title: 'Darmowy plan czy okres próbny',
			body: 'Okres próbny (zwykle 14 dni) pozwala sprawdzić program, ale potem trzeba płacić. Darmowy plan bez limitu czasu mają w tym zestawieniu tylko Registo i Planopia — w obu bez urlopów i grafiku.',
		},
		{
			title: 'Czy urlopy i grafik są w cenie',
			body: 'W wielu programach ewidencja, wnioski urlopowe i grafik to osobne moduły. Porównuj cenę konfiguracji, której naprawdę potrzebujesz, a nie najniższą kwotę z nagłówka cennika.',
		},
		{
			title: 'Jak pracownicy rejestrują czas',
			body: 'Telefon, kod QR, kiosk z kartą, a może wpis przez przełożonego? Na budowie i w ekipach sprzątających część osób nie ma telefonu służbowego — sprawdź, czy program przewiduje pracowników bez konta.',
		},
		{
			title: 'Polskie realia',
			body: 'Polskie święta (od 2025 r. także 24 grudnia), wymiar urlopu 20 lub 26 dni, wnioski w dniach lub godzinach i wydruk ewidencji dla kadr. Program po polsku to nie tylko język interfejsu.',
		},
	],
	choose: [
		<>
			<strong>Potrzebujesz tylko rejestrować godziny, za darmo, w większym zespole</strong> — Registo: wersja podstawowa nie ma limitu
			pracowników. Planopia za darmo obsłuży zespół do {FREE_USERS} osób.
		</>,
		<>
			<strong>Masz do 10 osób i liczy się najniższa cena za pracownika</strong> — RCPonline MINI.
		</>,
		<>
			<strong>Chcesz ewidencję, urlopy i grafik w jednym miejscu, z ceną za zespół</strong> — Planopia. Szczególnie gdy część zespołu
			nie ma telefonu służbowego: przełożony wpisuje godziny za pracowników bez konta, a kod QR na tablecie zmienia się co 30 sekund,
			więc zdjęcie kodu nie wystarczy do odbicia się. Zobacz{' '}
			<Link href="/program-do-ewidencji-czasu-pracy" className={link}>
				program do ewidencji czasu pracy
			</Link>{' '}
			i{' '}
			<Link href="/dla-branzy-budowlanej" className={link}>
				ewidencję na budowie
			</Link>
			.
		</>,
		<>
			<strong>Układasz rozbudowany grafik zmianowy dla dużego zespołu</strong> — Kadromierz albo inEwi. Oba deklarują weryfikację
			grafiku z przepisami prawa pracy.
		</>,
		<>
			<strong>Rozliczasz różne formy zatrudnienia i potrzebujesz kilku języków</strong> — Calamari (interfejs m.in. po polsku,
			angielsku i niemiecku, reguły urlopów dla UoP, UZ i B2B).
		</>,
	],
	weaknesses: [
		`Potrzebujesz darmowej rejestracji czasu dla więcej niż ${FREE_USERS} osób — darmowy plan Planopii ma limit ${FREE_USERS} aktywnych kont.`,
		'Wymagasz aplikacji ze sklepu App Store lub Google Play — Planopia działa w przeglądarce i instaluje się na ekranie telefonu jako aplikacja webowa (PWA).',
		'Chcesz kiosku z kartami NFC albo rozpoznawaniem twarzy — Planopia rejestruje wejścia kodem QR i licznikiem czasu.',
		`Masz ponad ${MAX_TIER} osób — gotowe progi cenowe kończą się na ${MAX_TIER} osobach, większe zespoły dostają wycenę indywidualną.`,
	],
	cta: {
		title: 'Sprawdź Planopię na własnym zespole',
		body: `${TRIAL_DAYS} dni pełnej aplikacji za darmo, do ${FREE_USERS} osób, bez podawania karty. Potem darmowa ewidencja albo plan Core od ${CORE_FROM.monthlyNetPln} zł netto miesięcznie.`,
		primary: { href: 'https://app.planopia.pl/team-registration', label: 'Załóż darmowy zespół' },
		secondary: { href: '/#cennik', label: 'Policz cenę dla swojego zespołu' },
	},
	faq: [
		{
			q: 'Który program do ewidencji czasu pracy jest darmowy?',
			a: `Bezterminowy darmowy plan mają m.in. Registo (wersja podstawowa bez limitu pracowników, z rejestracją przez kod QR, bez urlopów i grafiku) i Planopia (ewidencja czasu pracy do ${FREE_USERS} kont z wydrukiem PDF i Excel, bez urlopów). inEwi, Kadromierz, RCPonline i Calamari dają 14-dniowe okresy próbne. Stan na ${VERIFIED_ON}`,
		},
		{
			q: 'Ile kosztuje program do ewidencji czasu pracy?',
			a: `Ceny za osobę zaczynają się od 4,50 zł netto miesięcznie (RCPonline MINI, do 10 osób) i sięgają kilkunastu złotych za pracownika w planach z rejestracją czasu i grafikiem. Programy z ceną za firmę: Registo PRO kosztuje 599 zł brutto rocznie, Planopia — od ${CORE_FROM.monthlyNetPln} zł netto miesięcznie za zespół do ${CORE_FROM.maxUsers} osób. Zawsze licz cenę dla swojej liczby osób i potrzebnych modułów.`,
		},
		{
			q: 'Czy firma musi prowadzić ewidencję czasu pracy w programie?',
			a: 'Nie. Kodeks pracy (art. 149) wymaga prowadzenia ewidencji czasu pracy, ale nie narzuca jej formy — może być papierowa, w arkuszu albo w programie. Program skraca pracę i ogranicza pomyłki, a odpowiedzialność za poprawność ewidencji zostaje po stronie pracodawcy.',
		},
		{
			q: 'Co się bardziej opłaca: cena za pracownika czy za zespół?',
			a: 'Przy 2–5 osobach tanie plany za pracownika często wygrywają. Przy kilkunastu osobach i kilku modułach (ewidencja, urlopy, grafik) cena za zespół zwykle wychodzi korzystniej. W przykładzie dla 15 osób z ewidencją i urlopami różnica między najtańszą a najdroższą konfiguracją przekracza 200 zł miesięcznie.',
		},
		{
			q: 'Skąd pochodzą dane w tym porównaniu?',
			a: `Z oficjalnych cenników i stron produktów każdego dostawcy, sprawdzonych ${VERIFIED_ON} Porównanie przygotował zespół Planopii, która jest jednym z porównywanych programów. Ceny i warunki mogą się zmienić — przed zakupem sprawdź je u dostawcy. Jeśli zauważysz nieaktualną informację, napisz na biuro@planopia.pl, a poprawimy ją.`,
		},
	],
}
