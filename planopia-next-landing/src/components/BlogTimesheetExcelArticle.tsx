import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import OvertimeCalculator from './OvertimeCalculator'

const URL = 'https://planopia.pl/blog/ewidencja-czasu-pracy-excel-wzor'
const IMAGE = 'https://planopia.pl/img/ewidencja-czasu-pracy-excel-wzor.webp'
const PUBLISHED = '2026-08-19'
const XLSX = '/downloads/ewidencja-czasu-pracy-wzor-planopia.xlsx'
const PDF = '/downloads/ewidencja-czasu-pracy-wzor-planopia.pdf'

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

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return (
		<h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
			{children}
		</h2>
	)
}

export default function BlogTimesheetExcelArticle() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

			<main className="bg-white">
				<article itemScope itemType="https://schema.org/BlogPosting">
					<header className="border-b border-blue-100 bg-[#f4f8ff] px-4 py-10 md:py-14">
						<div className="mx-auto max-w-6xl">
							<nav aria-label="Okruszki" className="mb-5 text-sm text-slate-600">
								<ol className="flex flex-wrap items-center gap-2">
									<li><Link href="/blog" className="hover:text-emerald-700 hover:underline">Blog</Link></li>
									<li aria-hidden>/</li>
									<li><Link href="/blog" className="hover:text-emerald-700 hover:underline">Ewidencja czasu pracy</Link></li>
									<li aria-hidden>/</li>
									<li aria-current="page">Wzór w Excelu</li>
								</ol>
							</nav>

							<div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
								<div>
									<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Ewidencja czasu pracy</p>
									<h1 itemProp="headline" className="m-0 text-3xl font-semibold leading-tight !text-[#102f5e] sm:text-4xl lg:text-5xl">
										Ewidencja czasu pracy Excel — darmowy wzór do pobrania
									</h1>
									<p className="mt-5 text-lg leading-relaxed text-slate-700 md:text-xl">
										Ewidencję czasu pracy prowadzi się <strong>odrębnie dla każdego pracownika</strong> i przechowuje przez <strong>10 lat</strong>. Pobierz gotową kartę: arkusz Excel liczy godziny i nadliczbowe automatycznie, a wersja PDF nadaje się do wydruku. Zakres kolumn odpowiada § 6 rozporządzenia o dokumentacji pracowniczej.
									</p>
									<div className="mt-6 flex flex-wrap gap-3">
										<a href={XLSX} download className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline shadow-sm transition hover:bg-emerald-700">
											Pobierz wzór Excel (XLSX)
										</a>
										<a href={PDF} download className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 bg-white px-6 py-3 font-semibold !text-emerald-700 no-underline transition hover:bg-emerald-50">
											Pobierz wersję PDF
										</a>
									</div>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={PUBLISHED}>Opublikowano i zaktualizowano: 19 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image src="/img/ewidencja-czasu-pracy-excel-wzor.webp" alt="Wzór karty ewidencji czasu pracy w Excelu i PDF" width={1200} height={630} className="h-auto w-full" priority />
								</div>
							</div>
						</div>
					</header>

					<div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 md:py-14">
						<nav className="rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">Spis treści</h2>
							<ol className="mb-0 mt-3 grid gap-x-8 gap-y-2 pl-5 text-slate-700 md:grid-cols-2">
								{toc.map(([href, label]) => (
									<li key={href}><a href={`#${href}`} className="hover:text-emerald-700 hover:underline">{label}</a></li>
								))}
							</ol>
						</nav>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="pobierz">Pobierz wzór ewidencji czasu pracy</SectionHeading>
							<p>Oba pliki są darmowe — bez rejestracji i bez podawania adresu e-mail.</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<a href={XLSX} download className="block rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 no-underline transition hover:border-emerald-400">
									<p className="m-0 text-lg font-semibold text-slate-900">Wzór Excel (XLSX)</p>
									<p className="mb-0 mt-2 text-slate-700">Wpisujesz rok i miesiąc — daty oraz dni tygodnia wypełniają się same. Godziny i nadliczbowe liczą się formułami.</p>
									<p className="mb-0 mt-3 font-semibold text-emerald-700">Pobierz plik →</p>
								</a>
								<a href={PDF} download className="block rounded-lg border border-slate-200 bg-slate-50 p-5 no-underline transition hover:border-emerald-400">
									<p className="m-0 text-lg font-semibold text-slate-900">Wersja PDF do druku</p>
									<p className="mb-0 mt-2 text-slate-700">Pusta karta miesięczna na 31 dni plus strona z oznaczeniami nieobecności.</p>
									<p className="mb-0 mt-3 font-semibold text-emerald-700">Pobierz plik →</p>
								</a>
							</div>
							<p className="text-sm">
								Arkusz jest uniwersalny — działa dla dowolnego roku i miesiąca. Dla kolejnego okresu wystarczy skopiować zakładkę i zmienić numer miesiąca.
							</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="co-musi-zawierac">Co musi zawierać ewidencja czasu pracy</SectionHeading>
							<p>
								Obowiązek prowadzenia ewidencji wynika z <strong>art. 149 § 1 Kodeksu pracy</strong>, a jej zakres z <strong>§ 6 pkt 1 rozporządzenia</strong> Ministra Rodziny, Pracy i Polityki Społecznej z 10 grudnia 2018 r. w sprawie dokumentacji pracowniczej. Karta musi wykazywać:
							</p>
							<ul className="grid list-none gap-2 p-0">
								{wymagane.map(item => (
									<li key={item} className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-3">{item}</li>
								))}
							</ul>
							<p className="border-l-4 border-amber-400 bg-amber-50 px-5 py-4">
								<strong>Ewidencję prowadzi się odrębnie dla każdego pracownika</strong> i przechowuje przez <strong>10 lat</strong>, licząc od końca roku kalendarzowego, w którym stosunek pracy ustał. Dla umów zawartych przed 2019 rokiem okres ten może wynosić 50 lat.
							</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="jak-wypelniac">Jak wypełniać kartę — krok po kroku</SectionHeading>
							<ol className="grid list-none gap-4 p-0">
								{[
									['Uzupełnij nagłówek', 'Wpisz pracownika, stanowisko oraz rok i miesiąc. Daty i dni tygodnia wypełnią się automatycznie, a weekendy podświetlą się same.'],
									['Wpisuj godziny pracy', 'Podaj godzinę rozpoczęcia i zakończenia oraz długość przerwy. Kolumna „Przepracowane" wylicza różnicę i odejmuje przerwę.'],
									['Oznacz nadgodziny i pracę nocną', 'Nadwyżka ponad 8 godzin trafia automatycznie do kolumny nadliczbowych. Obok zaznacz te płatne 100% oraz godziny w porze nocnej.'],
									['Oznacz nieobecności kodem', 'Dla dni wolnych wybierz kod z listy rozwijanej. Przepis wymaga wskazania tytułu udzielenia dnia wolnego — samo „wolne" nie wystarczy.'],
								].map(([title, body], index) => (
									<li key={title} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:grid-cols-[2.5rem_1fr]">
										<span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800" aria-hidden>{index + 1}</span>
										<div>
											<h3 className="m-0 text-lg font-semibold text-slate-900">{title}</h3>
											<p className="mb-0 mt-2">{body}</p>
										</div>
									</li>
								))}
							</ol>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="oznaczenia">Oznaczenia nieobecności</SectionHeading>
							<p>We wzorze kody są dostępne z listy rozwijanej, a arkusz „Podsumowanie" zlicza każdy rodzaj osobno:</p>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left">
									<caption className="sr-only">Kody oznaczeń nieobecności w ewidencji czasu pracy</caption>
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Kod</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Znaczenie</th>
										</tr>
									</thead>
									<tbody>
										{kody.map(([kod, opis]) => (
											<tr key={kod} className="border-b border-slate-200">
												<td className="px-4 py-3 font-semibold text-emerald-800">{kod}</td>
												<td className="px-4 py-3">{opis}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="bledy">Najczęstsze błędy w ewidencji prowadzonej w Excelu</SectionHeading>
							<dl className="grid gap-4">
								{bledy.map(item => (
									<div key={item.title} className="border-l-4 border-rose-400 bg-rose-50/50 px-5 py-4">
										<dt className="font-semibold text-slate-900">{item.title}</dt>
										<dd className="mt-1">{item.body}</dd>
									</div>
								))}
							</dl>
						</section>

						<div className="mt-12">
							<OvertimeCalculator />
						</div>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="excel-czy-aplikacja">Excel czy aplikacja — kiedy arkusz przestaje wystarczać</SectionHeading>
							<p>
								Arkusz sprawdza się przy kilku osobach i stałych godzinach. Kłopot zaczyna się przy zmianowości, nadgodzinach i obowiązku przechowywania danych przez dekadę.
							</p>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left">
									<caption className="sr-only">Porównanie ewidencji w Excelu i w aplikacji</caption>
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Sytuacja</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Excel</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Planopia</th>
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
											<tr key={sytuacja} className="border-b border-slate-200">
												<td className="px-4 py-3 font-semibold text-slate-900">{sytuacja}</td>
												<td className="px-4 py-3">{excel}</td>
												<td className="px-4 py-3 text-emerald-800">{app}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<aside className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 md:p-8" aria-labelledby="planopia-ewidencja-heading">
								<h2 id="planopia-ewidencja-heading" className="m-0 text-xl font-semibold text-slate-900 md:text-2xl">
									Ewidencja, która prowadzi się sama
								</h2>
								<p className="mt-3">
									Pracownik wpisuje godziny lub odbija wejście kodem QR, urlopy wpadają do ewidencji z wniosków, a raport miesięczny pobierasz w PDF lub Excelu. Zespoły do 5 osób korzystają bezpłatnie.
								</p>
								<Link href="/program-do-ewidencji-czasu-pracy" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
									Wypróbuj za darmo
								</Link>
							</aside>
						</section>

						<section id="faq-ewidencja" className="mt-12 scroll-mt-24" aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">FAQ — ewidencja czasu pracy</h2>
							<div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
								{faq.map(item => (
									<details key={item.q} className="group py-1">
										<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
											<span>{item.q}</span>
											<span aria-hidden className="text-xl text-emerald-700 transition group-open:rotate-45">+</span>
										</summary>
										<p className="mb-5 mt-0 whitespace-pre-line leading-relaxed text-slate-700">{item.a}</p>
									</details>
								))}
							</div>
						</section>

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
				</article>
			</main>
		</>
	)
}
