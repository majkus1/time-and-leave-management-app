import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'

const URL = 'https://planopia.pl/blog/plan-urlopow-2027-excel-pdf'
const IMAGE = 'https://planopia.pl/img/plan-urlopow-2027-excel-pdf.webp'
const PUBLISHED = '2026-08-19'
const XLSX = '/downloads/roczny-plan-urlopow-2027-planopia.xlsx'
const PDF = '/downloads/roczny-plan-urlopow-2027-planopia.pdf'

/** Dni ustawowo wolne w 2027 r. — dwa wypadają w sobotę, co daje 2 dodatkowe dni wolne. */
const swieta = [
	['1 stycznia', 'Nowy Rok', 'piątek', false],
	['6 stycznia', 'Święto Trzech Króli', 'środa', false],
	['28 marca', 'Wielkanoc', 'niedziela', false],
	['29 marca', 'Poniedziałek Wielkanocny', 'poniedziałek', false],
	['1 maja', 'Święto Pracy', 'sobota', true],
	['3 maja', 'Święto Konstytucji 3 Maja', 'poniedziałek', false],
	['16 maja', 'Zielone Świątki', 'niedziela', false],
	['27 maja', 'Boże Ciało', 'czwartek', false],
	['15 sierpnia', 'Wniebowzięcie NMP', 'niedziela', false],
	['1 listopada', 'Wszystkich Świętych', 'poniedziałek', false],
	['11 listopada', 'Narodowe Święto Niepodległości', 'czwartek', false],
	['25 grudnia', 'Boże Narodzenie', 'sobota', true],
	['26 grudnia', 'Drugi dzień Bożego Narodzenia', 'niedziela', false],
] as const

/** Mosty: 1 dzień urlopu zamieniony na dłuższą przerwę. */
const mosty = [
	['27–30 maja', 'Boże Ciało wypada w czwartek — wystarczy wziąć piątek 28 maja, żeby mieć 4 dni wolnego.', '1 dzień → 4 dni'],
	['11–14 listopada', '11 listopada to czwartek — piątek 12 listopada daje długi weekend do niedzieli.', '1 dzień → 4 dni'],
	['1–3 maja', 'Majówka układa się sama: sobota, niedziela i poniedziałek 3 maja.', '0 dni → 3 dni'],
	['30 października – 1 listopada', 'Wszystkich Świętych w poniedziałek zamyka weekend.', '0 dni → 3 dni'],
]

const kroki = [
	{
		title: 'Zbierz limity urlopowe pracowników',
		body: 'W arkuszu „Pracownicy" wpisz imię i nazwisko, zespół oraz przysługujący wymiar urlopu — 20 dni przy stażu krótszym niż 10 lat, 26 dni przy stażu co najmniej 10-letnim. Kolumny „Wykorzystane" i „Pozostało" przeliczą się same.',
	},
	{
		title: 'Zbierz wnioski i wpisz terminy',
		body: 'W arkuszu „Wnioski_urlopowe" dodaj datę od i do, typ urlopu oraz status. Kolumna „Dni robocze" liczy się automatycznie funkcją NETWORKDAYS i pomija soboty, niedziele oraz wszystkie 14 świąt z arkusza „Święta".',
	},
	{
		title: 'Sprawdź kolizje w widoku rocznym',
		body: 'Arkusz „Plan_roczny" rozkłada dni na miesiące, więc od razu widać, kiedy w jednym dziale planuje wolne zbyt wiele osób. To moment na uzgodnienia, a nie grudzień.',
	},
	{
		title: 'Zatwierdź plan do 31 grudnia 2026 r.',
		body: 'Plan urlopów ustala pracodawca, biorąc pod uwagę wnioski pracowników i konieczność zapewnienia normalnego toku pracy (art. 163 § 1 Kodeksu pracy). Termin to koniec roku poprzedzającego.',
	},
]

const faq = [
	{
		q: 'Do kiedy trzeba ustalić plan urlopów na 2027 rok?',
		a: 'Plan urlopów na 2027 rok powinien zostać ustalony do 31 grudnia 2026 r., czyli do końca roku poprzedzającego. Wynika to z art. 163 § 1 Kodeksu pracy: pracodawca ustala plan, biorąc pod uwagę wnioski pracowników i konieczność zapewnienia normalnego toku pracy.',
	},
	{
		q: 'Ile dni ustawowo wolnych od pracy jest w 2027 roku?',
		a: 'W 2027 roku jest 14 dni ustawowo wolnych od pracy — od 2025 roku dniem wolnym jest także Wigilia 24 grudnia. Dwa z nich — 1 maja i 25 grudnia — wypadają w sobotę, więc pracodawca musi oddać za nie dodatkowe dni wolne. Siedem świąt przypada na dni robocze od poniedziałku do piątku.',
	},
	{
		q: 'Co oznacza święto wypadające w sobotę?',
		a: 'Jeżeli święto przypada w dniu wolnym od pracy z tytułu przeciętnie pięciodniowego tygodnia pracy, czyli zwykle w sobotę, pracodawca musi obniżyć wymiar czasu pracy o 8 godzin i wyznaczyć inny dzień wolny (art. 130 § 2 Kodeksu pracy). W 2027 roku dotyczy to 1 maja i 25 grudnia.',
	},
	{
		q: 'Czy każdy pracodawca musi tworzyć plan urlopów?',
		a: 'Nie. Pracodawca nie ustala planu urlopów, jeżeli zakładowa organizacja związkowa wyraziła na to zgodę albo gdy taka organizacja u niego nie działa. Wtedy terminy urlopów uzgadnia się indywidualnie z pracownikami (art. 163 § 1¹ Kodeksu pracy).',
	},
	{
		q: 'Czy plan urlopów musi obejmować urlop na żądanie?',
		a: 'Nie. Planem nie obejmuje się 4 dni urlopu na żądanie, o których mowa w art. 167² Kodeksu pracy. Te dni pracownik zgłasza najpóźniej w dniu rozpoczęcia urlopu i pozostają poza harmonogramem.',
	},
	{
		q: 'Jak liczyć dni urlopu w planie — kalendarzowe czy robocze?',
		a: 'Urlopu udziela się w dni, które są dla pracownika dniami pracy, w wymiarze godzinowym odpowiadającym dobowemu wymiarowi czasu pracy (art. 154² Kodeksu pracy). W praktyce liczą się dni robocze, a nie kalendarzowe — dlatego w naszym wzorze kolumna „Dni robocze" pomija weekendy i święta.',
	},
]

const toc = [
	['pobierz', 'Pobierz wzór na 2027'],
	['co-zawiera', 'Co zawiera wzór'],
	['jak-przygotowac', 'Jak przygotować plan krok po kroku'],
	['dni-wolne-2027', 'Dni wolne w 2027 roku'],
	['dlugie-weekendy', 'Długie weekendy i mosty'],
	['excel-czy-aplikacja', 'Excel czy aplikacja'],
	['faq-plan-2027', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Plan urlopów 2027 — darmowy wzór Excel i PDF',
	description:
		'Darmowy roczny plan urlopów 2027 w Excelu i PDF. Automatyczne liczenie dni roboczych, lista 14 dni wolnych i terminy wynikające z Kodeksu pracy.',
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
		{ '@type': 'ListItem', position: 2, name: 'Urlopy i planowanie', item: 'https://planopia.pl/blog#urlopy' },
		{ '@type': 'ListItem', position: 3, name: 'Plan urlopów 2027', item: URL },
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
	name: 'Jak przygotować plan urlopów na 2027 rok',
	description: 'Cztery kroki od zebrania limitów urlopowych do zatwierdzenia planu przed 31 grudnia 2026 r.',
	totalTime: 'PT45M',
	step: kroki.map((k, i) => ({
		'@type': 'HowToStep',
		position: i + 1,
		name: k.title,
		text: k.body,
	})),
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return (
		<h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
			{children}
		</h2>
	)
}

export default function BlogLeavePlan2027Article() {
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
									<li><Link href="/blog#urlopy" className="hover:text-emerald-700 hover:underline">Urlopy i planowanie</Link></li>
									<li aria-hidden>/</li>
									<li aria-current="page">Plan urlopów 2027</li>
								</ol>
							</nav>

							<div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
								<div>
									<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Urlopy i planowanie</p>
									<h1 itemProp="headline" className="m-0 text-3xl font-semibold leading-tight !text-[#102f5e] sm:text-4xl lg:text-5xl">
										Plan urlopów 2027 — darmowy wzór Excel i PDF
									</h1>
									<p className="mt-5 text-lg leading-relaxed text-slate-700 md:text-xl">
										Plan urlopów na 2027 rok trzeba ustalić <strong>do 31 grudnia 2026 r.</strong> Pobierz gotowy wzór: arkusz Excel liczy dni robocze automatycznie, a wersja PDF nadaje się do wydruku i wypełnienia ręcznie. Oba pliki mają już wpisane wszystkie 14 dni ustawowo wolnych.
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
									<Image src="/img/plan-urlopow-2027-excel-pdf.webp" alt="Roczny plan urlopów 2027 — wzór w Excelu i PDF" width={1200} height={630} className="h-auto w-full" priority />
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
							<SectionHeading id="pobierz">Plan urlopów 2027 — pobierz wzór</SectionHeading>
							<p>
								Oba pliki są darmowe, bez rejestracji i bez podawania adresu e-mail. Zawierają już komplet dni ustawowo wolnych od pracy w 2027 roku, więc nie trzeba ich wpisywać ręcznie.
							</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<a href={XLSX} download className="block rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 no-underline transition hover:border-emerald-400">
									<p className="m-0 text-lg font-semibold text-slate-900">Wzór Excel (XLSX)</p>
									<p className="mb-0 mt-2 text-slate-700">Sześć arkuszy z formułami: dni robocze liczą się same, saldo urlopowe przelicza się automatycznie.</p>
									<p className="mb-0 mt-3 font-semibold text-emerald-700">Pobierz plik →</p>
								</a>
								<a href={PDF} download className="block rounded-lg border border-slate-200 bg-slate-50 p-5 no-underline transition hover:border-emerald-400">
									<p className="m-0 text-lg font-semibold text-slate-900">Wersja PDF do druku</p>
									<p className="mb-0 mt-2 text-slate-700">Dwie strony A4 poziomo: siatka na 17 pracowników i tabela dni wolnych 2027.</p>
									<p className="mb-0 mt-3 font-semibold text-emerald-700">Pobierz plik →</p>
								</a>
							</div>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="co-zawiera">Co zawiera wzór planu urlopów</SectionHeading>
							<p>Arkusz Excel składa się z sześciu zakładek, które łączą się formułami — wystarczy uzupełnić dwie pierwsze:</p>
							<dl className="grid gap-4">
								{[
									['Instrukcja', 'Krótki opis, jak korzystać z pliku i o czym pamiętać przy planie na 2027 rok.'],
									['Święta', 'Wszystkie 14 dni ustawowo wolnych z datami i dniami tygodnia. To z tej listy korzystają formuły liczące dni robocze.'],
									['Pracownicy', 'Lista zespołu z limitem dni. Kolumny „Wykorzystane" i „Pozostało" liczą się automatycznie.'],
									['Wnioski_urlopowe', 'Sto gotowych wierszy na terminy. Typ i status wybierasz z listy rozwijanej, dni robocze wyliczają się same.'],
									['Plan_roczny', 'Rozkład dni urlopu na dwanaście miesięcy — widok, w którym od razu widać kolizje w zespole.'],
									['Podsumowanie', 'Łączny limit, dni zaplanowane i pozostałe oraz rozkład urlopów na miesiące.'],
								].map(([nazwa, opis]) => (
									<div key={nazwa} className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4">
										<dt className="font-semibold text-slate-900">{nazwa}</dt>
										<dd className="mt-1">{opis}</dd>
									</div>
								))}
							</dl>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="jak-przygotowac">Jak przygotować plan urlopów na 2027 — krok po kroku</SectionHeading>
							<ol className="grid list-none gap-4 p-0">
								{kroki.map((step, index) => (
									<li key={step.title} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:grid-cols-[2.5rem_1fr]">
										<span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800" aria-hidden>{index + 1}</span>
										<div>
											<h3 className="m-0 text-lg font-semibold text-slate-900">{step.title}</h3>
											<p className="mb-0 mt-2">{step.body}</p>
										</div>
									</li>
								))}
							</ol>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="dni-wolne-2027">Dni ustawowo wolne od pracy w 2027 roku</SectionHeading>
							<p>
								W 2027 roku przypada <strong>14 dni ustawowo wolnych</strong> od pracy. Dwa z nich wypadają w sobotę — <strong>1 maja i 25 grudnia</strong> — więc pracodawca musi oddać za nie dodatkowe dni wolne, zgodnie z art. 130 § 2 Kodeksu pracy.
							</p>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left">
									<caption className="sr-only">Dni ustawowo wolne od pracy w 2027 roku</caption>
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Data</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Święto</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Dzień tygodnia</th>
										</tr>
									</thead>
									<tbody>
										{swieta.map(([data, nazwa, dzien, sobota]) => (
											<tr key={String(data)} className={`border-b border-slate-200 ${sobota ? 'bg-amber-50' : ''}`}>
												<td className="px-4 py-3 font-semibold text-slate-900">{data}</td>
												<td className="px-4 py-3">{nazwa}</td>
												<td className="px-4 py-3">
													{dzien}
													{sobota && <span className="ml-2 font-semibold text-amber-800">— dodatkowy dzień wolny</span>}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="dlugie-weekendy">Długie weekendy i mosty w 2027 roku</SectionHeading>
							<p>Układ świąt w 2027 roku jest korzystny — kilka dłuższych przerw można zbudować jednym dniem urlopu:</p>
							<div className="grid gap-4 sm:grid-cols-2">
								{mosty.map(([termin, opis, zysk]) => (
									<aside key={termin} className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
										<p className="m-0 font-semibold text-slate-900">{termin}</p>
										<p className="mb-0 mt-2 text-sm">{opis}</p>
										<p className="mb-0 mt-3 font-semibold text-emerald-700">{zysk}</p>
									</aside>
								))}
							</div>
							<p className="text-sm">
								To właśnie te terminy zapełniają się w zespole najszybciej — dlatego warto zebrać wnioski zawczasu, a nie w grudniu.
							</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="excel-czy-aplikacja">Excel czy aplikacja — kiedy arkusz przestaje wystarczać</SectionHeading>
							<p>
								Arkusz sprawdza się przy kilku osobach i planie ustalanym raz w roku. Problemy zaczynają się wtedy, gdy plan zaczyna żyć: ktoś przesuwa termin, ktoś choruje, ktoś składa urlop na żądanie.
							</p>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left">
									<caption className="sr-only">Porównanie arkusza i aplikacji</caption>
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Sytuacja</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Excel</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Planopia</th>
										</tr>
									</thead>
									<tbody>
										{[
											['Pracownik składa wniosek', 'mailem lub na papierze', 'w aplikacji, trafia do przełożonego'],
											['Saldo po zatwierdzeniu', 'trzeba poprawić ręcznie', 'przelicza się samo'],
											['Kolizja terminów w zespole', 'widać, jeśli ktoś sprawdzi', 'system ostrzega przy składaniu'],
											['Historia zmian', 'kolejne wersje pliku', 'pełna historia wniosków'],
											['L4 w trakcie urlopu', 'ręczna korekta w kilku miejscach', 'wniosek i limit w jednym miejscu'],
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

							<aside className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 md:p-8" aria-labelledby="planopia-2027-heading">
								<h2 id="planopia-2027-heading" className="m-0 text-xl font-semibold text-slate-900 md:text-2xl">
									Ten sam plan, ale bez pilnowania arkusza
								</h2>
								<p className="mt-3">
									W Planopii pracownik składa wniosek, przełożony zatwierdza, a pula urlopowa pomniejsza się sama. Zespoły do 5 osób korzystają bezpłatnie.
								</p>
								<Link href="/program-do-urlopow" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
									Wypróbuj za darmo
								</Link>
							</aside>
						</section>

						<section id="faq-plan-2027" className="mt-12 scroll-mt-24" aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">FAQ — plan urlopów 2027</h2>
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
								{ label: 'Kodeks pracy — tekst jednolity (art. 130, 154², 163, 167²)', href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf' },
								{ label: 'Państwowa Inspekcja Pracy — pytania i odpowiedzi dla pracodawców', href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi' },
							]}
							verifiedOn="19 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="plan-urlopow-2027-excel-pdf" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
