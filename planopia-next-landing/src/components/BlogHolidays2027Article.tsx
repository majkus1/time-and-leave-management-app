import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'

const URL = 'https://planopia.pl/blog/dni-wolne-2027'
const IMAGE = 'https://planopia.pl/img/plan-urlopow-2027-excel-pdf.webp'
const PUBLISHED = '2026-08-31'

/**
 * Daty policzone algorytmem Meeusa i sprawdzone wobec wzoru w arkuszu 2027 —
 * ta sama lista, żeby wpis i plik do pobrania nie mówiły dwóch różnych rzeczy.
 */
const swieta = [
	['1 stycznia', 'piątek', 'Nowy Rok', false],
	['6 stycznia', 'środa', 'Święto Trzech Króli', false],
	['28 marca', 'niedziela', 'Wielkanoc', false],
	['29 marca', 'poniedziałek', 'Poniedziałek Wielkanocny', false],
	['1 maja', 'sobota', 'Święto Pracy', true],
	['3 maja', 'poniedziałek', 'Święto Konstytucji 3 Maja', false],
	['16 maja', 'niedziela', 'Zielone Świątki', false],
	['27 maja', 'czwartek', 'Boże Ciało', false],
	['15 sierpnia', 'niedziela', 'Wniebowzięcie NMP', false],
	['1 listopada', 'poniedziałek', 'Wszystkich Świętych', false],
	['11 listopada', 'czwartek', 'Narodowe Święto Niepodległości', false],
	['24 grudnia', 'piątek', 'Wigilia Bożego Narodzenia', false],
	['25 grudnia', 'sobota', 'Boże Narodzenie', true],
	['26 grudnia', 'niedziela', 'Drugi dzień Bożego Narodzenia', false],
] as const

/** Spójne z sekcją „mosty" we wpisie o wzorze planu urlopów 2027. */
const mosty = [
	['27–30 maja', 'Boże Ciało wypada w czwartek. Wystarczy wziąć piątek 28 maja.', '1 dzień → 4 dni'],
	['11–14 listopada', 'Święto Niepodległości w czwartek, piątek 12 listopada domyka weekend.', '1 dzień → 4 dni'],
	['24 grudnia – 2 stycznia', 'Wigilia (dzień ustawowo wolny) wypada w piątek, święta w weekend. Pięć dni urlopu 27–31 grudnia daje dziesięć dni wolnego.', '5 dni → 10 dni'],
	['1–3 maja', 'Majówka układa się sama: sobota, niedziela i poniedziałek 3 maja.', '0 dni → 3 dni'],
	['27–29 marca', 'Wielkanoc zamyka weekend poniedziałkiem 29 marca.', '0 dni → 3 dni'],
	['30 października – 1 listopada', 'Wszystkich Świętych w poniedziałek.', '0 dni → 3 dni'],
]

const faq = [
	{
		q: 'Ile dni wolnych od pracy jest w 2027 roku?',
		a: 'W 2027 roku przypada 14 dni ustawowo wolnych od pracy. Osiem z nich wypada od poniedziałku do piątku, dwa w sobotę (1 maja i 25 grudnia), a cztery w niedzielę (28 marca, 16 maja, 15 sierpnia i 26 grudnia). Wigilia 24 grudnia jest dniem wolnym od 2025 roku.',
	},
	{
		q: 'Które święta w 2027 roku wypadają w sobotę?',
		a: 'Święto Pracy 1 maja oraz Boże Narodzenie 25 grudnia. Za każde z nich pracodawca musi obniżyć wymiar czasu pracy o 8 godzin i wyznaczyć pracownikowi inny dzień wolny (art. 130 § 2 Kodeksu pracy).',
	},
	{
		q: 'Czy za święto wypadające w niedzielę należy się dodatkowy dzień wolny?',
		a: 'Nie. Zasada obniżenia wymiaru czasu pracy dotyczy świąt przypadających w dniu innym niż niedziela. Niedziela jest już dniem wolnym z tytułu przeciętnie pięciodniowego tygodnia pracy, więc święta z 28 marca, 16 maja, 15 sierpnia i 26 grudnia 2027 r. nie generują dnia do odbioru.',
	},
	{
		q: 'Kto wyznacza termin dnia wolnego za sobotnie święto?',
		a: 'Pracodawca, w obrębie okresu rozliczeniowego, w którym święto wystąpiło. Pracownik nie wybiera tego terminu dowolnie, choć w praktyce często jest on uzgadniany z zespołem i wpisywany do grafiku.',
	},
	{
		q: 'Kiedy trzeba ustalić plan urlopów na 2027 rok?',
		a: 'Do końca roku poprzedzającego, czyli do 31 grudnia 2026 r. Plan ustala pracodawca, biorąc pod uwagę wnioski pracowników i konieczność zapewnienia normalnego toku pracy (art. 163 § 1 Kodeksu pracy). Planem nie obejmuje się 4 dni urlopu na żądanie.',
	},
]

const toc = [
	['kalendarz', 'Kalendarz dni wolnych 2027'],
	['soboty', 'Dwa święta w sobotę — dodatkowe dni wolne'],
	['mosty', 'Długie weekendy i mosty'],
	['planowanie', 'Jak zaplanować urlop na 2027'],
	['faq-2027', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Dni wolne 2027 — kalendarz świąt w Polsce',
	description:
		'Wszystkie 14 dni ustawowo wolnych od pracy w 2027 roku, dwa święta wypadające w sobotę i długie weekendy do wykorzystania.',
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
		{ '@type': 'ListItem', position: 3, name: 'Dni wolne 2027', item: URL },
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

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return (
		<h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
			{children}
		</h2>
	)
}

export default function BlogHolidays2027Article() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white">
				<article>
					<header className="border-b border-slate-200 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/40">
						<div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
							<nav aria-label="Ścieżka nawigacji" className="text-sm text-slate-600">
								<Link href="/blog" className="hover:underline">
									Blog
								</Link>
								<span className="mx-2">/</span>
								<span>Urlopy i planowanie</span>
							</nav>
							<div className="mt-6 grid items-center gap-10 md:grid-cols-2">
								<div>
									<h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
										Dni wolne 2027 — kalendarz świąt w Polsce
									</h1>
									<p className="mt-4 text-lg leading-relaxed text-slate-700">
										Czternaście dni ustawowo wolnych, z czego dwa wypadają w sobotę — a to oznacza dwa dodatkowe
										dni do odbioru. Poniżej pełny kalendarz, zasada rozliczania sobotnich świąt i mosty, które
										warto wpisać do planu urlopów.
									</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={PUBLISHED}>Opublikowano i zaktualizowano: 31 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image
										src="/img/plan-urlopow-2027-excel-pdf.webp"
										alt="Kalendarz dni wolnych 2027 i plan urlopów"
										width={1200}
										height={630}
										className="h-auto w-full"
										priority
									/>
								</div>
							</div>
						</div>
					</header>

					<div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 md:py-14">
						<section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
							<h2 className="m-0 text-lg font-semibold text-slate-900">Odpowiedź w skrócie</h2>
							<p className="mt-3 leading-relaxed text-slate-700">
								W 2027 roku jest <strong>14 dni ustawowo wolnych od pracy</strong>. Osiem przypada w dni robocze,
								dwa w sobotę (1 maja i 25 grudnia) i cztery w niedzielę. Za oba sobotnie święta pracodawca musi
								wyznaczyć dodatkowy dzień wolny; za niedzielne — nie.
							</p>
						</section>

						<nav className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">
								Spis treści
							</h2>
							<ul className="mt-3 space-y-2 leading-relaxed text-slate-700">
								{toc.map(([id, label]) => (
									<li key={id}>
										<a className="text-emerald-700 hover:underline" href={`#${id}`}>
											{label}
										</a>
									</li>
								))}
							</ul>
						</nav>

						<section className="mt-12">
							<SectionHeading id="kalendarz">Kalendarz dni wolnych 2027</SectionHeading>
							<div className="mt-6 overflow-x-auto">
								<table className="w-full border-collapse text-left text-sm">
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th className="p-3 font-semibold text-slate-900">Data</th>
											<th className="p-3 font-semibold text-slate-900">Dzień tygodnia</th>
											<th className="p-3 font-semibold text-slate-900">Święto</th>
										</tr>
									</thead>
									<tbody>
										{swieta.map(([data, dzien, nazwa, sobota]) => (
											<tr
												key={data}
												className={`border-b border-slate-200 ${sobota ? 'bg-amber-50/70' : ''}`}
											>
												<td className="p-3 font-semibold whitespace-nowrap text-slate-900">{data}</td>
												<td className="p-3 whitespace-nowrap text-slate-700">
													{dzien}
													{sobota ? <span className="ml-2 text-amber-800">— dzień do odbioru</span> : null}
												</td>
												<td className="p-3 text-slate-700">{nazwa}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="soboty">Dwa święta w sobotę — dodatkowe dni wolne</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Jeżeli święto przypada w dniu wolnym z tytułu przeciętnie pięciodniowego tygodnia pracy — czyli
								zwykle w sobotę — pracodawca musi obniżyć wymiar czasu pracy o 8 godzin i wyznaczyć inny dzień
								wolny. Wynika to z art. 130 § 2 Kodeksu pracy. W 2027 roku dotyczy to <strong>1 maja</strong> i{' '}
								<strong>25 grudnia</strong>.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Dwie rzeczy, które w praktyce budzą najwięcej wątpliwości. Po pierwsze: święta wypadające w{' '}
								<strong>niedzielę</strong> — 28 marca, 16 maja, 15 sierpnia i 26 grudnia — dodatkowego dnia{' '}
								<strong>nie generują</strong>, bo niedziela i tak jest dniem wolnym. Po drugie: termin odbioru
								wyznacza <strong>pracodawca</strong> w obrębie okresu rozliczeniowego, a nie pracownik według
								uznania.
							</p>
						</section>

						<section className="mt-12">
							<SectionHeading id="mosty">Długie weekendy i mosty</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Rozkład świąt w 2027 roku jest wyjątkowo korzystny na przełomie roku. Poniżej układy, w których
								niewielka liczba dni urlopu daje długą przerwę.
							</p>
							<div className="mt-6 flex flex-col gap-4">
								{mosty.map(([termin, opis, zysk]) => (
									<div
										key={termin}
										className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0">
											<p className="m-0 font-semibold text-slate-900">{termin}</p>
											<p className="mt-1 text-sm leading-relaxed text-slate-700">{opis}</p>
										</div>
										<span className="shrink-0 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800">
											{zysk}
										</span>
									</div>
								))}
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="planowanie">Jak zaplanować urlop na 2027</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Plan urlopów na 2027 rok ustala się do <strong>31 grudnia 2026 r.</strong> Robi to pracodawca,
								biorąc pod uwagę wnioski pracowników i konieczność zapewnienia normalnego toku pracy
								(art. 163 § 1 Kodeksu pracy). Planem nie obejmuje się 4 dni urlopu na żądanie.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Najtrudniejsza część to nie sam kalendarz, tylko kolizje — mosty z tej listy są atrakcyjne dla
								wszystkich naraz, więc wnioski na 28 maja i 12 listopada spłyną z całego zespołu.
							</p>
							<div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
								<p className="text-lg font-semibold text-slate-900">Gotowy wzór planu urlopów 2027</p>
								<p className="mt-2 leading-relaxed text-slate-700">
									Arkusz z automatycznym liczeniem dni roboczych, kompletem 14 dni wolnych i widokiem rocznym,
									który pokazuje kolizje w zespole. Za darmo, bez rejestracji.
								</p>
								<div className="mt-5 flex flex-wrap gap-3">
									<Link
										href="/blog/plan-urlopow-2027-excel-pdf"
										className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline transition hover:bg-emerald-700"
									>
										Pobierz wzór na 2027
									</Link>
									<Link
										href="/program-do-urlopow"
										className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 bg-white px-6 py-3 font-semibold !text-emerald-700 no-underline transition hover:bg-emerald-50"
									>
										Program do urlopów
									</Link>
								</div>
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="faq-2027">Najczęstsze pytania</SectionHeading>
							<div className="mt-6 flex flex-col gap-5">
								{faq.map(item => (
									<div key={item.q} className="rounded-lg border border-slate-200 bg-slate-50/70 p-5">
										<h3 className="text-lg font-semibold text-slate-900">{item.q}</h3>
										<p className="mt-2 leading-relaxed text-slate-700">{item.a}</p>
									</div>
								))}
							</div>
						</section>

						<BlogArticleCredibility
							sources={[
								{
									label: 'Kodeks pracy — tekst jednolity (art. 130 § 2, art. 163)',
									href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf',
								},
								{
									label: 'Ustawa z dnia 18 stycznia 1951 r. o dniach wolnych od pracy — wykaz świąt ustawowo wolnych od pracy',
								},
								{
									label: 'Państwowa Inspekcja Pracy — pytania i odpowiedzi dla pracodawców',
									href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi',
								},
							]}
							verifiedOn="31 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="dni-wolne-2027" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
