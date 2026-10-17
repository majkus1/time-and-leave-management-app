import Link from 'next/link'
import type { ComparisonConfig } from './BlogComparisonArticle'
import { CORE_15, CORE_FROM, FREE_USERS, TIERS_LABEL, TRIAL_DAYS, ANNUAL_MONTHS, annualMonthly, pln } from './planopiaPricing'

// Dane konkurencji z oficjalnych stron i cenników z tego dnia — przy aktualizacji wpisu sprawdź je ponownie i zmień obie daty
const VERIFIED_ON = '17 października 2026 r.'
const VERIFIED_ISO = '2026-10-17'

const link = 'text-emerald-700 hover:underline'

export const leaveComparison: ComparisonConfig = {
	slug: 'programy-do-urlopow-porownanie',
	h1: 'Programy do urlopów dla firm — porównanie 2026',
	lead: 'Siedem programów do wniosków urlopowych dostępnych po polsku: ile kosztują, kto zatwierdza wnioski, czy program sam liczy pulę dni i czy obsłuży urlop w godzinach. Wszystkie dane pochodzą ze stron i cenników dostawców.',
	description:
		'Porównanie siedmiu programów do urlopów dostępnych w Polsce: ceny, okresy próbne, wieloetapowa akceptacja, pula urlopowa, urlop w godzinach, plan urlopów i aplikacja mobilna. Dane ze stron dostawców.',
	published: '2026-10-17',
	modified: VERIFIED_ISO,
	verifiedOn: VERIFIED_ON,
	image: { src: '/img/product/pl-leave-plans.webp', width: 1600, height: 778, alt: 'Kalendarz urlopów całego zespołu w Planopii' },
	breadcrumb: { label: 'Urlopy i planowanie', anchor: 'urlopy' },
	shortAnswer: [
		<>
			<strong>Najniższa cena za osobę i najdłuższy test:</strong> jestUrlop — 3,49 zł netto za osobę miesięcznie (3–50 osób, płatność
			roczna) i 60 dni próby.
		</>,
		<>
			<strong>Program sam liczy wymiar urlopu:</strong> HRappka (według umowy, wykształcenia i stażu) i Calamari (według reguł firmy
			i stażu). W pozostałych pulę dni wpisuje kadrowa lub przełożony.
		</>,
		<>
			<strong>Wieloetapowa akceptacja:</strong> HRnest, HRappka i Calamari; jestUrlop i inEwi — dwa etapy.
		</>,
		<>
			<strong>Urlopy razem z ewidencją i grafikiem, cena za zespół:</strong> Planopia — wnioski w dniach i godzinach, ostrzeżenie o
			kolizji z grafikiem i wnioski za pracowników bez konta. Zobacz{' '}
			<Link href="/program-do-urlopow" className={link}>
				program do urlopów Planopii
			</Link>
			.
		</>,
		<>
			<strong>Darmowy plan z wnioskami urlopowymi:</strong> żaden z porównywanych programów nie pokazuje go w cenniku.
		</>,
	],
	tableIntro:
		'Ceny netto. „Cena od” to najniższa kwota za opcję z wnioskami urlopowymi — zwykle przy płatności rocznej. „Nie podano” oznacza, że dostawca nie opisuje tej funkcji na swoich stronach, a nie że jej na pewno nie ma.',
	columns: [
		{ key: 'trial', label: 'Darmowy plan i próba' },
		{ key: 'price', label: 'Cena od' },
		{ key: 'approval', label: 'Akceptacja' },
		{ key: 'balance', label: 'Pula dni' },
		{ key: 'hours', label: 'Urlop w godzinach' },
		{ key: 'calendar', label: 'Kalendarz i plan urlopów' },
		{ key: 'mobile', label: 'Telefon' },
		{ key: 'time', label: 'Ewidencja czasu' },
	],
	vendors: [
		{
			name: 'Planopia',
			source: 'https://planopia.pl/program-do-urlopow',
			cells: {
				trial: `${TRIAL_DAYS} dni pełnej aplikacji, bez karty; darmowy plan bez urlopów`,
				price: `od ${CORE_FROM.monthlyNetPln} zł / mies. za zespół do ${CORE_FROM.maxUsers} osób (Core; ${TIERS_LABEL})`,
				approval: 'Jednoetapowa — Administrator, HR albo przełożony',
				balance: 'Wpisuje HR; po akceptacji odejmuje się sama',
				hours: 'Tak (typy rozliczane w godzinach)',
				calendar: 'Kalendarz zespołu, plany urlopowe, ostrzeżenie o kolizji z grafikiem',
				mobile: 'Aplikacja na telefon (PWA)',
				time: 'Tak, w tym samym planie',
			},
		},
		{
			name: 'jestUrlop',
			source: 'https://jesturlop.pl/cennik/',
			cells: {
				trial: 'Brak w cenniku; 60 dni pełnej wersji, bez karty',
				price: '3,49 zł / osoba / mies. (3–50 osób, płatność roczna); 1–2 osoby: 10 zł / mies. za firmę',
				approval: 'Opcjonalnie dwustopniowa',
				balance: 'Limit wpisywany raz, program go pilnuje',
				hours: 'Nie podano (są typy „1/2 dnia” i „Odbiór godzin”)',
				calendar: 'Kalendarz i plan urlopów',
				mobile: 'Android i iOS',
				time: 'Tak, w tej samej cenie',
			},
		},
		{
			name: 'HRnest',
			source: 'https://hrnest.pl/cennik/',
			cells: {
				trial: 'Brak w cenniku; 14 dni, bez karty',
				price: 'Starter: 99 zł / mies. przy rozliczeniu rocznym (119 zł kwartalnie), do 10 pracowników',
				approval: 'Wieloetapowa',
				balance: 'Limit w dniach lub godzinach, wpisywany ręcznie',
				hours: 'Tak (wnioski cząstkowe, włącza dział kadr)',
				calendar: 'Kalendarz i plany urlopowe',
				mobile: 'Przez przeglądarkę, bez instalacji',
				time: 'Tak (w pakiecie Starter)',
			},
		},
		{
			name: 'HRappka',
			source: 'https://hrappka.pl/oferta/',
			cells: {
				trial: 'Brak w cenniku; 14 dni, bez karty',
				price: '6 zł / pracownik / mies. za moduł Wnioski urlopowe, opłata minimalna jak za 10 osób (cennik PDF dostawcy)',
				approval: 'Wieloetapowa',
				balance: 'Liczona automatycznie według umowy, wykształcenia i stażu',
				hours: 'Wymiar w dniach i godzinach',
				calendar: 'Kalendarz i plan urlopów',
				mobile: 'Tak',
				time: 'Osobny moduł',
			},
		},
		{
			name: 'Calamari',
			source: 'https://www.calamari.pl/cennik',
			cells: {
				trial: 'Brak w cenniku; 14 dni, bez karty',
				price: '7 zł / użytkownik / mies. przy płatności rocznej (8 zł miesięcznie), z opłatą minimalną',
				approval: 'Wieloetapowa',
				balance: 'Naliczana automatycznie według reguł firmy i stażu',
				hours: 'Tak (rozliczanie w dniach i godzinach)',
				calendar: 'Kalendarz nieobecności; plan urlopów — nie podano',
				mobile: 'iOS i Android',
				time: 'Osobny moduł',
			},
		},
		{
			name: 'inEwi',
			source: 'https://inewi.pl/cennik',
			cells: {
				trial: 'Brak w cenniku; 14 dni, bez karty',
				price: '10,95 zł / użytkownik / mies. przy płatności rocznej (12,95 zł miesięcznie), moduł Wnioski Urlopowe',
				approval: 'Dwuetapowa (własne ścieżki w pakiecie Enterprise)',
				balance: 'Program pilnuje salda',
				hours: 'Nie podano',
				calendar: 'Kalendarz; plan urlopów — nie podano',
				mobile: 'iOS i Android',
				time: 'Osobny moduł',
			},
		},
		{
			name: 'Kadromierz',
			source: 'https://kadromierz.pl/cennik/',
			cells: {
				trial: 'Brak w cenniku; 14 dni, bez karty',
				price: '12,99 zł / pracownik / mies. przy płatności rocznej (15,99 zł miesięcznie); wnioski w każdym planie',
				approval: 'Nie podano',
				balance: 'Limity w dniach lub godzinach, ustawiane ręcznie',
				hours: 'Absencję w godzinach dodaje menedżer',
				calendar: 'Kalendarz nieobecności; plan urlopów — nie podano',
				mobile: 'iOS i Android',
				time: 'Ewidencja godzin w cenie; rejestracja wejść od 15,99 zł',
			},
		},
	],
	example: {
		title: 'Ile zapłacisz za urlopy dla 15 osób',
		intro: (
			<>
				Miesięczny koszt dla zespołu 15 osób, który potrzebuje <strong>wniosków urlopowych z akceptacją i kalendarzem</strong>, przy
				płatności rocznej — w najtańszej konfiguracji, która to obejmuje.
			</>
		),
		rows: [
			{ name: 'jestUrlop', monthly: '52,00 zł netto', calc: '624 zł rocznie według kalkulatora dostawcy (15 × 3,49 zł)' },
			{ name: 'HRappka: moduł Wnioski urlopowe', monthly: '90,00 zł netto', calc: '15 × 6 zł (okresu rozliczenia cennik nie podaje)' },
			{
				name: `Planopia Core do ${CORE_15.maxUsers} osób`,
				monthly: `≈ ${pln(annualMonthly(CORE_15.monthlyNetPln))} zł netto`,
				calc: `${CORE_15.monthlyNetPln} zł × ${ANNUAL_MONTHS} miesięcy ÷ 12 — w rozliczeniu rocznym płacisz za ${ANNUAL_MONTHS} miesięcy`,
			},
			{ name: 'Calamari: moduł Nieobecności', monthly: '105,00 zł netto', calc: '15 × 7 zł' },
			{ name: 'inEwi: moduł Wnioski Urlopowe', monthly: '164,25 zł netto', calc: '15 × 10,95 zł' },
			{ name: 'Kadromierz „Planuję czas pracy”', monthly: '194,85 zł netto', calc: '15 × 12,99 zł' },
			{ name: 'HRnest Podstawowy', monthly: '199,00 zł netto', calc: 'pakiet Starter ma limit 10 pracowników, więc dla 15 osób potrzebny jest Podstawowy' },
		],
		note: 'Zakres funkcji w tych konfiguracjach nie jest identyczny: jestUrlop, HRnest i Planopia Core mają w cenie także ewidencję czasu pracy (Planopia — również raporty zespołu i Asystenta AI), a Kadromierz — planowanie grafiku. HRappka, Calamari i inEwi w tej konfiguracji to sam moduł urlopów. Kwoty ze znakiem „≈” to nasze przeliczenia, nie ceny z cenników.',
	},
	criteria: [
		{
			title: 'Kto zatwierdza i w ilu krokach',
			body: 'W małej firmie wystarczy jedna akceptacja — przełożonego albo właściciela. W większej często najpierw decyduje kierownik, potem kadry. Sprawdź, czy program obsługuje taką ścieżkę i kto widzi wnioski którego działu.',
		},
		{
			title: 'Pula urlopowa: ręcznie czy automatycznie',
			body: 'Wymiar urlopu wypoczynkowego to 20 lub 26 dni w zależności od stażu pracy (art. 154 Kodeksu pracy), a do stażu wlicza się m.in. okres nauki. Część programów liczy go sama, w innych pulę wpisuje kadrowa — ważne, żeby po akceptacji wniosku saldo odejmowało się samo.',
		},
		{
			title: 'Urlop w godzinach',
			body: 'Opiekę nad dzieckiem (art. 188 Kodeksu pracy) pracownik może wykorzystać w dniach albo w godzinach. Jeśli w firmie zdarzają się wnioski na kilka godzin, sprawdź, czy program przyjmie je bez obejść.',
		},
		{
			title: 'Kalendarz, zastępstwa i grafik',
			body: 'Kalendarz nieobecności zespołu pokazuje, czy w danym tygodniu ktoś zostaje na miejscu. Jeśli układasz grafik, przydaje się ostrzeżenie, że urlop koliduje z zaplanowaną zmianą.',
		},
		{
			title: 'Cena za osobę, za firmę i opłaty minimalne',
			body: 'Najniższa stawka za osobę nie zawsze wygrywa: część dostawców liczy opłatę minimalną (jak za 10 osób), inni sprzedają pakiety z limitem pracowników. Policz koszt dla swojej liczby osób i potrzebnych modułów.',
		},
	],
	choose: [
		<>
			<strong>Potrzebujesz samych urlopów w małej firmie i liczy się cena</strong> — jestUrlop: najniższa stawka za osobę w zestawieniu
			i 60 dni na sprawdzenie.
		</>,
		<>
			<strong>Chcesz, żeby program sam wyliczał wymiar urlopu</strong> — HRappka albo Calamari. Oba deklarują automatyczne naliczanie
			puli według stażu.
		</>,
		<>
			<strong>Wnioski przechodzą przez kilka osób (np. kierownik, potem kadry)</strong> — HRnest, HRappka albo Calamari; dwa etapy
			obsłużą też jestUrlop i inEwi.
		</>,
		<>
			<strong>Chcesz urlopy razem z ewidencją czasu pracy i grafikiem, z ceną za zespół</strong> — Planopia. Wnioski w dniach i
			godzinach, pula odejmowana po akceptacji, ostrzeżenie o kolizji z grafikiem i wnioski składane za pracowników bez konta. Więcej
			o wyborze w małej firmie:{' '}
			<Link href="/blog/program-do-urlopow-dla-malej-firmy" className={link}>
				program do urlopów dla małej firmy
			</Link>
			.
		</>,
		<>
			<strong>Grafik prowadzisz już w Kadromierzu albo inEwi</strong> — ich wnioski urlopowe działają w tym samym systemie co grafik,
			więc nie potrzebujesz osobnego narzędzia.
		</>,
	],
	weaknesses: [
		'Potrzebujesz wieloetapowej akceptacji — w Planopii wniosek zatwierdza jedna osoba: Administrator, HR albo przełożony.',
		'Chcesz, żeby program sam wyliczał wymiar urlopu z Kodeksu pracy (20 lub 26 dni, proporcje przy zatrudnieniu w trakcie roku) — w Planopii pulę wpisuje HR, a po akceptacji odejmuje się ona sama.',
		'Oczekujesz automatycznego przenoszenia niewykorzystanych dni na kolejny rok — w Planopii saldo poprawia się ręcznie.',
		`Szukasz darmowego programu do urlopów — urlopy w Planopii są w planach płatnych (Core od ${CORE_FROM.monthlyNetPln} zł netto miesięcznie) i przez ${TRIAL_DAYS} dni próby; za darmo zostaje sama ewidencja czasu pracy.`,
	],
	cta: {
		title: 'Sprawdź urlopy w Planopii na własnym zespole',
		body: `${TRIAL_DAYS} dni pełnej aplikacji za darmo, do ${FREE_USERS} osób, bez podawania karty — z wnioskami, akceptacjami i kalendarzem urlopów. Potem plan Core od ${CORE_FROM.monthlyNetPln} zł netto miesięcznie.`,
		primary: { href: 'https://app.planopia.pl/team-registration', label: 'Załóż darmowy zespół' },
		secondary: { href: '/program-do-urlopow', label: 'Zobacz program do urlopów' },
	},
	faq: [
		{
			q: 'Czy jest darmowy program do urlopów?',
			a: `Żaden z porównywanych programów nie pokazuje w cenniku bezterminowego darmowego planu z wnioskami urlopowymi. Najdłużej można testować jestUrlop (60 dni), Planopię — ${TRIAL_DAYS} dni pełnej aplikacji, pozostałe programy — 14 dni. W Planopii po okresie próbnym za darmo zostaje ewidencja czasu pracy do ${FREE_USERS} kont, bez urlopów. Stan na ${VERIFIED_ON}`,
		},
		{
			q: 'Ile kosztuje program do urlopów?',
			a: `Stawki za osobę zaczynają się od 3,49 zł netto miesięcznie (jestUrlop, płatność roczna) i dochodzą do kilkunastu złotych w programach, w których urlopy są częścią większego systemu. Część dostawców sprzedaje pakiety za firmę: HRnest Starter kosztuje 99 zł netto miesięcznie do 10 pracowników, Planopia Core — od ${CORE_FROM.monthlyNetPln} zł netto miesięcznie za zespół do ${CORE_FROM.maxUsers} osób. HRappka i Calamari mają opłatę minimalną.`,
		},
		{
			q: 'Czy program sam policzy, ile dni urlopu przysługuje pracownikowi?',
			a: 'Niektóre tak. HRappka i Calamari deklarują automatyczne wyliczanie wymiaru według stażu i reguł firmy. W Planopii, jestUrlop, HRnest i Kadromierzu pulę wpisuje kadrowa lub przełożony, a program pilnuje salda. Wymiar urlopu wypoczynkowego wynosi 20 dni przy stażu poniżej 10 lat i 26 dni przy stażu co najmniej 10 lat (art. 154 Kodeksu pracy).',
		},
		{
			q: 'Czy można złożyć wniosek urlopowy na kilka godzin?',
			a: 'Tak, jeśli program na to pozwala. W Planopii, HRnest i Calamari wnioski rozliczane w godzinach są opisane wprost; w Kadromierzu absencję w godzinach dodaje menedżer. Najczęściej dotyczy to opieki nad dzieckiem (art. 188 Kodeksu pracy), którą można wykorzystać w dniach albo w godzinach.',
		},
		{
			q: 'Skąd pochodzą dane w tym porównaniu?',
			a: `Z oficjalnych stron, cenników i centrów pomocy każdego dostawcy, sprawdzonych ${VERIFIED_ON} Porównanie przygotował zespół Planopii, która jest jednym z porównywanych programów. Ceny i warunki mogą się zmienić — przed zakupem sprawdź je u dostawcy. Jeśli zauważysz nieaktualną informację, napisz na biuro@planopia.pl, a poprawimy ją.`,
		},
	],
}
