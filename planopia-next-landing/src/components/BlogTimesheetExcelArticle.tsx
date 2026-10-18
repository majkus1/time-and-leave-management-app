import Image from 'next/image'
import Link from 'next/link'
import BlogArticleShell, { ArticleCta, ArticleNote } from './blogArticle/BlogArticleShell'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import OvertimeCalculator from './OvertimeCalculator'
import { shot } from '@/data/productShots'
import { LANDING_TRIAL_DAYS, landingCoreTiers, landingTrial } from '@/data/landingPlanPricing'

const URL = 'https://planopia.pl/blog/ewidencja-czasu-pracy-excel-wzor'
const IMAGE = 'https://planopia.pl/img/ewidencja-czasu-pracy-excel-wzor.webp'
const PUBLISHED = '2026-08-19'
const XLSX = '/downloads/ewidencja-czasu-pracy-wzor-planopia.xlsx'
const PDF = '/downloads/ewidencja-czasu-pracy-wzor-planopia.pdf'
const REGISTER = 'https://app.planopia.pl/team-registration'

/** Zakres danych wprost z § 6 pkt 1 rozporządzenia o dokumentacji pracowniczej. */
const wymagane = [
	'liczba przepracowanych godzin oraz godzina rozpoczęcia i zakończenia pracy',
	'liczba godzin przepracowanych w porze nocnej',
	'liczba godzin nadliczbowych',
	'dni wolne od pracy, z oznaczeniem tytułu ich udzielenia',
	'liczba godzin dyżuru oraz godzina jego rozpoczęcia i zakończenia, ze wskazaniem miejsca pełnienia',
	'rodzaj i wymiar zwolnień od pracy',
	'rodzaj i wymiar innych usprawiedliwionych nieobecności w pracy',
	'wymiar nieusprawiedliwionych nieobecności w pracy',
]

const kody = [
	['UW', 'Urlop wypoczynkowy'],
	['UŻ', 'Urlop na żądanie'],
	['UO', 'Urlop okolicznościowy'],
	['UB', 'Urlop bezpłatny'],
	['OP', 'Urlop opiekuńczy'],
	['SW', 'Zwolnienie z powodu siły wyższej'],
	['CH', 'Niezdolność do pracy (L4)'],
	['OD', 'Opieka nad dzieckiem (art. 188 KP)'],
	['DW', 'Dzień wolny za święto lub za nadgodziny'],
	['NN', 'Nieobecność nieusprawiedliwiona'],
	['DE', 'Delegacja / podróż służbowa'],
	['SZ', 'Szkolenie'],
]

const bledy = [
	{
		title: 'Sama lista obecności zamiast ewidencji',
		body: 'Podpis na liście obecności nie jest ewidencją czasu pracy. Ewidencja musi zawierać godziny rozpoczęcia i zakończenia pracy, a nie tylko fakt stawienia się.',
	},
	{
		title: 'Brak oznaczenia tytułu dnia wolnego',
		body: 'Przepis wymaga wskazania, z jakiego tytułu udzielono dnia wolnego. „Wolne" bez kodu to brak wymaganej informacji — dlatego we wzorze jest osobna kolumna i lista oznaczeń.',
	},
	{
		title: 'Nadgodziny wpisywane ryczałtem na koniec miesiąca',
		body: 'Godziny nadliczbowe wykazuje się przy konkretnym dniu. Wpis zbiorczy uniemożliwia ustalenie, kiedy praca ponad normę faktycznie wystąpiła.',
	},
	{
		title: 'Jeden plik dla całego zespołu',
		body: 'Ewidencję prowadzi się odrębnie dla każdego pracownika. Wspólna tabela dla wszystkich utrudnia wydanie kopii dokumentacji na żądanie pracownika.',
	},
	{
		title: 'Nadpisywanie tego samego pliku co miesiąc',
		body: 'Ewidencję przechowuje się 10 lat. Jeden nadpisywany arkusz nie daje historii, a przy kontroli PIP trzeba przedstawić dane za konkretny okres.',
	},
]

const faq = [
	{
		q: 'Czy pracodawca musi prowadzić ewidencję czasu pracy?',
		a: 'Tak. Zgodnie z art. 149 § 1 Kodeksu pracy pracodawca prowadzi ewidencję czasu pracy pracownika do celów prawidłowego ustalenia jego wynagrodzenia i innych świadczeń związanych z pracą. Ewidencję prowadzi się odrębnie dla każdego pracownika.',
	},
	{
		q: 'Co musi zawierać karta ewidencji czasu pracy?',
		a: 'Zakres określa § 6 pkt 1 rozporządzenia Ministra Rodziny, Pracy i Polityki Społecznej z 10 grudnia 2018 r. w sprawie dokumentacji pracowniczej. Karta obejmuje liczbę przepracowanych godzin wraz z godziną rozpoczęcia i zakończenia pracy, godziny nocne, godziny nadliczbowe, dni wolne z oznaczeniem tytułu ich udzielenia, godziny dyżuru, rodzaj i wymiar zwolnień od pracy oraz innych usprawiedliwionych nieobecności, a także wymiar nieobecności nieusprawiedliwionych.',
	},
	{
		q: 'Jak długo trzeba przechowywać ewidencję czasu pracy?',
		a: 'Dokumentację związaną z ewidencjonowaniem czasu pracy przechowuje się przez 10 lat, licząc od końca roku kalendarzowego, w którym stosunek pracy uległ rozwiązaniu lub wygasł. Dla umów sprzed 2019 roku okres ten może wynosić 50 lat.',
	},
	{
		q: 'Czy lista obecności wystarczy zamiast ewidencji czasu pracy?',
		a: 'Nie. Lista obecności potwierdza jedynie stawienie się do pracy. Ewidencja czasu pracy musi dodatkowo wykazywać godzinę rozpoczęcia i zakończenia pracy, godziny nadliczbowe, nocne oraz rodzaj nieobecności. Lista obecności może być elementem pomocniczym, ale go nie zastępuje.',
	},
	{
		q: 'Czy ewidencja czasu pracy może być prowadzona w Excelu?',
		a: 'Tak. Przepisy nie narzucają formy — ewidencja może być papierowa lub elektroniczna, w tym w arkuszu kalkulacyjnym. Musi jednak zawierać komplet wymaganych informacji, być prowadzona odrębnie dla każdego pracownika i możliwa do odtworzenia przez cały okres przechowywania.',
	},
	{
		q: 'Czy pracownik ma prawo wglądu do swojej ewidencji?',
		a: 'Tak. Pracodawca udostępnia ewidencję czasu pracy pracownikowi na jego żądanie (art. 149 § 1 Kodeksu pracy). Na wniosek pracownika wydaje się także kopię całości lub części dokumentacji pracowniczej.',
	},
]

const toc = [
	['pobierz', 'Pobierz wzór ewidencji'],
	['co-musi-zawierac', 'Co musi zawierać ewidencja'],
	['jak-wypelniac', 'Jak wypełniać kartę'],
	['oznaczenia', 'Oznaczenia nieobecności'],
	['bledy', 'Najczęstsze błędy'],
	['kalkulator-nadgodzin', 'Kalkulator dodatku za nadgodziny'],
	['excel-czy-aplikacja', 'Excel czy aplikacja'],
	['faq-ewidencja', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Ewidencja czasu pracy Excel — darmowy wzór do pobrania',
	description:
		'Darmowy wzór karty ewidencji czasu pracy w Excelu i PDF. Zakres zgodny z rozporządzeniem, automatyczne liczenie godzin i nadliczbowych.',
	image: [IMAGE],
	author: { '@type': 'Person', name: 'Michał Lipka', url: 'https://planopia.pl/o-autorze' },
	publisher: {
		'@type': 'Organization',
		name: 'Planopia',
		logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
	},
	mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
	url: URL,
	datePublished: PUBLISHED,
	dateModified: PUBLISHED,
	inLanguage: 'pl-PL',
}

const breadcrumbSchema = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://planopia.pl/blog' },
		{ '@type': 'ListItem', position: 2, name: 'Ewidencja czasu pracy', item: 'https://planopia.pl/blog#ewidencja' },
		{ '@type': 'ListItem', position: 3, name: 'Wzór ewidencji w Excelu', item: URL },
	],
}

const faqSchema = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: faq.map(item => ({
		'@type': 'Question',
		name: item.q,
		acceptedAnswer: { '@type': 'Answer', text: item.a },
	})),
}

const howToSchema = {
	'@context': 'https://schema.org',
	'@type': 'HowTo',
	name: 'Jak wypełnić kartę ewidencji czasu pracy',
	description: 'Uzupełnianie miesięcznej karty ewidencji czasu pracy w arkuszu Excel — krok po kroku.',
	totalTime: 'PT15M',
	step: [
		{ '@type': 'HowToStep', position: 1, name: 'Uzupełnij nagłówek', text: 'Wpisz imię i nazwisko pracownika, stanowisko oraz rok i miesiąc. Daty i dni tygodnia wypełnią się automatycznie.' },
		{ '@type': 'HowToStep', position: 2, name: 'Wpisuj godziny pracy', text: 'Podaj godzinę rozpoczęcia i zakończenia pracy oraz długość przerwy. Liczba przepracowanych godzin wyliczy się sama.' },
		{ '@type': 'HowToStep', position: 3, name: 'Oznacz nadgodziny i pracę nocną', text: 'Nadwyżka ponad 8 godzin trafia do kolumny nadliczbowych. W kolumnie obok zaznacz godziny płatne 100 procent oraz godziny nocne.' },
		{ '@type': 'HowToStep', position: 4, name: 'Oznacz nieobecności kodem', text: 'Dla dni wolnych wybierz kod z listy: UW, CH, UO i pozostałe. Przepis wymaga wskazania tytułu udzielenia dnia wolnego.' },
	],
}

/** /blog/ewidencja-czasu-pracy-excel-wzor — treść bez zmian, oprawa jak strony produktowe (BlogArticleShell). */
export default function BlogTimesheetExcelArticle() {
	const timeCalendar = shot('pl', 'time-calendar')

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

			{/* Hero zostaje przy pobieraniu wzoru — to główna intencja wejścia na tę stronę */}
			<BlogArticleShell
				crumb={{ label: 'Ewidencja czasu pracy', href: '/blog#ewidencja' }}
				pill="Wzór w Excelu"
				h1="Ewidencja czasu pracy Excel — darmowy wzór do pobrania"
				lead={
					<p>
						Ewidencję czasu pracy prowadzi się <strong>odrębnie dla każdego pracownika</strong> i przechowuje przez <strong>10 lat</strong>. Pobierz gotową kartę: arkusz Excel liczy godziny i nadliczbowe automatycznie, a wersja PDF nadaje się do wydruku. Zakres kolumn odpowiada § 6 rozporządzenia o dokumentacji pracowniczej.
					</p>
				}
				primary={{ href: XLSX, label: 'Pobierz wzór Excel (XLSX)', download: true }}
				secondary={{ href: PDF, label: 'Pobierz wersję PDF', download: true }}
				meta={{ iso: PUBLISHED, label: 'Zaktualizowano 19 sierpnia 2026 r. · Michał Lipka' }}
				image={{ src: '/img/ewidencja-czasu-pracy-excel-wzor.webp', alt: 'Wzór karty ewidencji czasu pracy w Excelu i PDF', width: 1200, height: 630 }}
				toc={toc.map(([id, label]) => ({ id, label }))}
				cta={{
					title: 'Ewidencja czasu pracy bez arkusza',
					note: `${LANDING_TRIAL_DAYS} dni pełnej aplikacji za darmo, do ${landingTrial.maxUsers} osób, bez karty. Potem darmowa ewidencja czasu pracy do 5 kont z wydrukiem karty w PDF i Excelu albo plan Core z urlopami od ${landingCoreTiers[0].monthlyNetPln} zł netto miesięcznie.`,
					primary: { href: REGISTER, label: 'Załóż darmowy zespół' },
				}}
			>
				<h2 id="pobierz">Pobierz wzór ewidencji czasu pracy</h2>
				<p>Oba pliki są darmowe — bez rejestracji i bez podawania adresu e-mail.</p>
				<div className="bart-cards">
					<div className="bart-card">
						<p><strong>Wzór Excel (XLSX)</strong></p>
						<p>Wpisujesz rok i miesiąc — daty oraz dni tygodnia wypełniają się same. Godziny i nadliczbowe liczą się formułami.</p>
						<a href={XLSX} download className="pdl-btn pdl-btn--primary">Pobierz plik →</a>
					</div>
					<div className="bart-card">
						<p><strong>Wersja PDF do druku</strong></p>
						<p>Pusta karta miesięczna na 31 dni plus strona z oznaczeniami nieobecności.</p>
						<a href={PDF} download className="pdl-btn bart-btn-outline">Pobierz plik →</a>
					</div>
				</div>
				<p>
					Arkusz jest uniwersalny — działa dla dowolnego roku i miesiąca. Dla kolejnego okresu wystarczy skopiować zakładkę i zmienić numer miesiąca.
				</p>

				<h2 id="co-musi-zawierac">Co musi zawierać ewidencja czasu pracy</h2>
				<p>
					Obowiązek prowadzenia ewidencji wynika z <strong>art. 149 § 1 Kodeksu pracy</strong>, a jej zakres z <strong>§ 6 pkt 1 rozporządzenia</strong> Ministra Rodziny, Pracy i Polityki Społecznej z 10 grudnia 2018 r. w sprawie dokumentacji pracowniczej. Karta musi wykazywać:
				</p>
				<ul>
					{wymagane.map(item => (
						<li key={item}>{item}</li>
					))}
				</ul>
				<ArticleNote tone="paper">
					<p>
						<strong>Ewidencję prowadzi się odrębnie dla każdego pracownika</strong> i przechowuje przez <strong>10 lat</strong>, licząc od końca roku kalendarzowego, w którym stosunek pracy ustał. Dla umów zawartych przed 2019 rokiem okres ten może wynosić 50 lat.
					</p>
				</ArticleNote>

				<h2 id="jak-wypelniac">Jak wypełniać kartę — krok po kroku</h2>
				<ol>
					{[
						['Uzupełnij nagłówek', 'Wpisz pracownika, stanowisko oraz rok i miesiąc. Daty i dni tygodnia wypełnią się automatycznie, a weekendy podświetlą się same.'],
						['Wpisuj godziny pracy', 'Podaj godzinę rozpoczęcia i zakończenia oraz długość przerwy. Kolumna „Przepracowane" wylicza różnicę i odejmuje przerwę.'],
						['Oznacz nadgodziny i pracę nocną', 'Nadwyżka ponad 8 godzin trafia automatycznie do kolumny nadliczbowych. Obok zaznacz te płatne 100% oraz godziny w porze nocnej.'],
						['Oznacz nieobecności kodem', 'Dla dni wolnych wybierz kod z listy rozwijanej. Przepis wymaga wskazania tytułu udzielenia dnia wolnego — samo „wolne" nie wystarczy.'],
					].map(([title, body]) => (
						<li key={title}>
							{/* Nagłówek kroku ma stać w jednej linii z numerem listy, więc bez górnego odstępu h3 */}
							<h3 style={{ marginTop: 0 }}>{title}</h3>
							<p>{body}</p>
						</li>
					))}
				</ol>

				<h2 id="oznaczenia">Oznaczenia nieobecności</h2>
				<p>{'We wzorze kody są dostępne z listy rozwijanej, a arkusz „Podsumowanie" zlicza każdy rodzaj osobno:'}</p>
				<div className="bart-table-wrap">
					<table>
						<caption className="sr-only">Kody oznaczeń nieobecności w ewidencji czasu pracy</caption>
						<thead>
							<tr>
								<th scope="col">Kod</th>
								<th scope="col">Znaczenie</th>
							</tr>
						</thead>
						<tbody>
							{kody.map(([kod, opis]) => (
								<tr key={kod}>
									<td><strong>{kod}</strong></td>
									<td>{opis}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<h2 id="bledy">Najczęstsze błędy w ewidencji prowadzonej w Excelu</h2>
				<dl className="bart-cards">
					{bledy.map(item => (
						<div key={item.title} className="bart-card">
							<dt><strong>{item.title}</strong></dt>
							<dd>{item.body}</dd>
						</div>
					))}
				</dl>

				<ArticleCta
					title="Karta ewidencji bez formuł i kopiowania zakładek"
					text="W darmowym planie Planopii prowadzisz ewidencję czasu pracy do 5 kont i pobierasz kartę każdej osoby w PDF lub Excelu."
					link={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				/>

				<OvertimeCalculator />

				<h2 id="excel-czy-aplikacja">Excel czy aplikacja — kiedy arkusz przestaje wystarczać</h2>
				<p>
					Arkusz sprawdza się przy kilku osobach i stałych godzinach. Kłopot zaczyna się przy zmianowości, nadgodzinach i obowiązku przechowywania danych przez dekadę.
				</p>
				<div className="bart-table-wrap">
					<table>
						<caption className="sr-only">Porównanie ewidencji w Excelu i w aplikacji</caption>
						<thead>
							<tr>
								<th scope="col">Sytuacja</th>
								<th scope="col">Excel</th>
								<th scope="col">Planopia</th>
							</tr>
						</thead>
						<tbody>
							{[
								['Pracownik zgłasza godziny', 'przesyła je przełożonemu', 'wpisuje sam, także z telefonu'],
								['Start i koniec pracy', 'wpisywane z pamięci', 'licznik czasu pracy lub kod QR'],
								['Nieobecności i urlopy', 'przepisywane ręcznie z wniosków', 'wniosek trafia do ewidencji automatycznie'],
								['Raport za miesiąc', 'kopiowanie do osobnego pliku', 'eksport PDF i Excel jednym kliknięciem'],
								['Przechowywanie 10 lat', 'kolejne pliki na dysku', 'pełna historia w jednym miejscu'],
							].map(([sytuacja, excel, app]) => (
								<tr key={sytuacja}>
									<td><strong>{sytuacja}</strong></td>
									<td>{excel}</td>
									<td>{app}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<figure>
					<Image src={timeCalendar.src} alt={timeCalendar.alt} width={timeCalendar.width} height={timeCalendar.height} unoptimized />
					<figcaption>{timeCalendar.caption}</figcaption>
				</figure>

				<ArticleNote tone="mint">
					<h2 id="planopia-ewidencja-heading">Ewidencja, która prowadzi się sama</h2>
					<p>
						Pracownik wpisuje godziny lub odbija wejście kodem QR, urlopy wpadają do ewidencji z wniosków, a raport miesięczny pobierasz w PDF lub Excelu. Zespoły do 5 osób korzystają bezpłatnie.
					</p>
					<p>
						<Link href="/program-do-ewidencji-czasu-pracy" className="pdl-btn pdl-btn--primary">
							Wypróbuj za darmo
						</Link>
					</p>
				</ArticleNote>

				<section id="faq-ewidencja" aria-labelledby="faq-heading">
					<h2 id="faq-heading">FAQ — ewidencja czasu pracy</h2>
					{faq.map(item => (
						<details key={item.q}>
							<summary>
								<strong>{item.q}</strong>
							</summary>
							<p>{item.a}</p>
						</details>
					))}
				</section>

				<div className="bart-extras">
					<BlogArticleCredibility
						sources={[
							{ label: 'Kodeks pracy — tekst jednolity (art. 149)', href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf' },
							{ label: 'Rozporządzenie MRPiPS z 10.12.2018 r. w sprawie dokumentacji pracowniczej', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20180002369' },
							{ label: 'Państwowa Inspekcja Pracy — pytania i odpowiedzi', href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi' },
						]}
						verifiedOn="19 sierpnia 2026 r."
						author="Michał Lipka"
						authorHref="/o-autorze"
					/>

					<BlogRelatedLinks slug="ewidencja-czasu-pracy-excel-wzor" className="mt-12" />
				</div>
			</BlogArticleShell>
		</>
	)
}
