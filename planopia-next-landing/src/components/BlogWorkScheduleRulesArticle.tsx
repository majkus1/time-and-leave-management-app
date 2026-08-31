import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import WorkingTimeNormCalculator from './WorkingTimeNormCalculator'

const URL = 'https://planopia.pl/blog/jak-ulozyc-grafik-pracy'
const IMAGE = 'https://planopia.pl/img/aigrafik.webp'
const PUBLISHED = '2026-08-31'

/** Trzy limity, które rozstrzygają, czy grafik w ogóle może tak wyglądać. */
const limity = [
	{
		nazwa: 'Odpoczynek dobowy',
		wartosc: 'min. 11 godzin',
		opis: 'Nieprzerwany odpoczynek w każdej dobie pracowniczej. Zmiana kończąca się o 22:00 wyklucza rozpoczęcie kolejnej przed 9:00.',
		podstawa: 'art. 132 § 1 KP',
	},
	{
		nazwa: 'Odpoczynek tygodniowy',
		wartosc: 'min. 35 godzin',
		opis: 'Nieprzerwany odpoczynek w każdym tygodniu, obejmujący 11 godzin odpoczynku dobowego. W praktyce: pełna doba wolnego plus wieczór i poranek wokół niej.',
		podstawa: 'art. 133 § 1 KP',
	},
	{
		nazwa: 'Norma czasu pracy',
		wartosc: '8 h na dobę, przeciętnie 40 h w tygodniu',
		opis: 'W przeciętnie pięciodniowym tygodniu pracy, w przyjętym okresie rozliczeniowym — co do zasady nie dłuższym niż 4 miesiące.',
		podstawa: 'art. 129 § 1 KP',
	},
]

const bledy = [
	{
		title: 'Traktowanie doby pracowniczej jak kalendarzowej',
		body: 'Doba pracownicza to 24 kolejne godziny liczone od godziny rozpoczęcia pracy zgodnie z obowiązującym rozkładem — a nie od północy. Jeśli pracownik zaczął w poniedziałek o 8:00, jego doba trwa do wtorku 8:00. Ponowne wezwanie go do pracy we wtorek o 6:00 oznacza pracę w tej samej dobie, a nie „nowy dzień".',
	},
	{
		title: 'Zaplanowanie zmiany łamiącej 11 godzin odpoczynku',
		body: 'Klasyczny przypadek to zmiana kończąca się późnym wieczorem i kolejna zaczynająca się rano. To nie jest kwestia zgody pracownika — limit obowiązuje niezależnie od tego, czy ktoś „chce" pracować.',
	},
	{
		title: 'Brak wolnej niedzieli przy pracy w niedziele',
		body: 'Pracownik pracujący w niedziele powinien korzystać co najmniej raz na 4 tygodnie z niedzieli wolnej od pracy. W grafiku układanym z miesiąca na miesiąc łatwo to przeoczyć.',
	},
	{
		title: 'Grafik ustalany na ostatnią chwilę',
		body: 'Rozkład czasu pracy sporządza się na okres co najmniej jednego miesiąca i przekazuje pracownikowi co najmniej na tydzień przed jego rozpoczęciem. Grafik wywieszony w piątek na poniedziałek to nie jest formalność, którą można pominąć.',
	},
	{
		title: 'Pominięcie świąt przy liczeniu wymiaru',
		body: 'Każde święto przypadające w innym dniu niż niedziela obniża wymiar czasu pracy o 8 godzin. Grafik zbudowany na „standardowym" miesiącu przekroczy normę w miesiącu ze świętem.',
	},
]

const faq = [
	{
		q: 'Czym jest doba pracownicza?',
		a: 'Doba pracownicza to 24 kolejne godziny, poczynając od godziny, w której pracownik rozpoczyna pracę zgodnie z obowiązującym go rozkładem czasu pracy. Nie pokrywa się z dobą kalendarzową — jeśli pracownik zaczyna o 8:00, jego doba pracownicza trwa do 8:00 dnia następnego. Ponowne rozpoczęcie pracy w tej samej dobie co do zasady oznacza pracę w godzinach nadliczbowych.',
	},
	{
		q: 'Ile godzin odpoczynku musi mieć pracownik między zmianami?',
		a: 'Co najmniej 11 godzin nieprzerwanego odpoczynku w każdej dobie (art. 132 § 1 Kodeksu pracy). Wyjątki dotyczą między innymi pracowników zarządzających zakładem w imieniu pracodawcy oraz przypadków konieczności prowadzenia akcji ratowniczej — wtedy przysługuje równoważny okres odpoczynku.',
	},
	{
		q: 'Na jaki okres trzeba ułożyć grafik i kiedy go przekazać?',
		a: 'Rozkład czasu pracy sporządza się w formie pisemnej lub elektronicznej, na okres co najmniej jednego miesiąca, i przekazuje pracownikowi co najmniej na tydzień przed rozpoczęciem pracy w okresie, na który został sporządzony (art. 129 § 3 Kodeksu pracy).',
	},
	{
		q: 'Czy pracownik może zrzec się odpoczynku dobowego?',
		a: 'Nie. Normy odpoczynku wynikają z przepisów o czasie pracy i nie podlegają swobodnej dyspozycji stron. Zgoda pracownika nie legalizuje grafiku, który narusza 11-godzinny odpoczynek.',
	},
	{
		q: 'Jak święto wpływa na wymiar czasu pracy w grafiku?',
		a: 'Każde święto występujące w okresie rozliczeniowym i przypadające w innym dniu niż niedziela obniża wymiar czasu pracy o 8 godzin (art. 130 § 2 Kodeksu pracy). Grafik trzeba zaplanować na obniżony wymiar, inaczej powstaną nadgodziny.',
	},
	{
		q: 'Czy program do grafików sam pilnuje tych limitów?',
		a: 'Planopia automatycznie pomija w grafiku weekendy, święta i osoby z zatwierdzonym urlopem, a zmiany definiujesz z godzinami i minimalną obsadą. Ostateczna odpowiedzialność za zgodność rozkładu z przepisami pozostaje po stronie pracodawcy — narzędzie skraca pracę i ogranicza pomyłki, ale nie zastępuje decyzji kadrowej.',
	},
]

const toc = [
	['doba-pracownicza', 'Doba pracownicza — punkt wyjścia'],
	['limity', 'Trzy limity, które musi spełnić grafik'],
	['okres-rozliczeniowy', 'Wymiar czasu pracy i okres rozliczeniowy'],
	['kalkulator-wymiaru', 'Kalkulator wymiaru czasu pracy'],
	['bledy', 'Pięć najczęstszych błędów'],
	['w-praktyce', 'Jak to wygląda w Planopii'],
	['faq-grafik', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Jak ułożyć grafik pracy zgodnie z Kodeksem pracy',
	description:
		'Doba pracownicza, 11 godzin odpoczynku dobowego, 35 godzin tygodniowego i okres rozliczeniowy — zasady, które rozstrzygają, czy grafik jest zgodny z przepisami.',
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
		{ '@type': 'ListItem', position: 2, name: 'Grafiki i harmonogramy', item: 'https://planopia.pl/blog#grafiki' },
		{ '@type': 'ListItem', position: 3, name: 'Jak ułożyć grafik pracy', item: URL },
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

export default function BlogWorkScheduleRulesArticle() {
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
								<span>Grafiki i harmonogramy</span>
							</nav>
							<div className="mt-6 grid items-center gap-10 md:grid-cols-2">
								<div>
									<h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
										Jak ułożyć grafik pracy zgodnie z Kodeksem pracy
									</h1>
									<p className="mt-4 text-lg leading-relaxed text-slate-700">
										Większość sporów o grafik nie dotyczy tego, kto ma pracować w sobotę, tylko trzech liczb:
										11 godzin odpoczynku dobowego, 35 godzin tygodniowego i wymiaru czasu pracy w okresie
										rozliczeniowym. Poniżej: co je wyznacza, gdzie najczęściej pęka grafik i jak sprawdzić to
										przed publikacją, a nie po skardze.
									</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={PUBLISHED}>Opublikowano i zaktualizowano: 31 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image
										src="/img/aigrafik.webp"
										alt="Grafik pracy zespołu w aplikacji Planopia"
										width={1898}
										height={910}
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
								Grafik jest zgodny z przepisami, gdy jednocześnie: każda doba pracownicza zawiera co najmniej
								11 godzin nieprzerwanego odpoczynku, każdy tydzień co najmniej 35 godzin, a suma zaplanowanych
								godzin nie przekracza wymiaru czasu pracy w okresie rozliczeniowym — obniżonego o 8 godzin za
								każde święto przypadające poza niedzielą. Rozkład przekazuje się pracownikowi co najmniej
								na tydzień przed początkiem okresu, na który został sporządzony.
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
							<SectionHeading id="doba-pracownicza">Doba pracownicza — punkt wyjścia</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Najczęstsze nieporozumienie przy układaniu grafiku bierze się z założenia, że „dzień pracy" kończy
								się o północy. W prawie pracy jednostką jest <strong>doba pracownicza</strong>: 24 kolejne godziny,
								liczone od godziny, o której pracownik rozpoczyna pracę zgodnie z obowiązującym go rozkładem.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Konsekwencja jest praktyczna. Pracownik, który w poniedziałek zaczął o 8:00, pozostaje w tej samej
								dobie do wtorku do 8:00. Wezwanie go we wtorek na 6:00 to nie jest początek nowego dnia — to praca
								w tej samej dobie, a więc co do zasady godziny nadliczbowe. Grafik ułożony „po kalendarzu" wygląda
								poprawnie i mimo to generuje nadgodziny, których nikt nie planował.
							</p>
						</section>

						<section className="mt-12">
							<SectionHeading id="limity">Trzy limity, które musi spełnić grafik</SectionHeading>
							<div className="mt-6 overflow-x-auto">
								<table className="w-full border-collapse text-left text-sm">
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th className="p-3 font-semibold text-slate-900">Limit</th>
											<th className="p-3 font-semibold text-slate-900">Wartość</th>
											<th className="p-3 font-semibold text-slate-900">Co to znaczy w praktyce</th>
											<th className="p-3 font-semibold text-slate-900">Podstawa</th>
										</tr>
									</thead>
									<tbody>
										{limity.map(limit => (
											<tr key={limit.nazwa} className="border-b border-slate-200 align-top">
												<td className="p-3 font-semibold text-slate-900">{limit.nazwa}</td>
												<td className="p-3 whitespace-nowrap text-emerald-800">{limit.wartosc}</td>
												<td className="p-3 leading-relaxed text-slate-700">{limit.opis}</td>
												<td className="p-3 whitespace-nowrap text-slate-600">{limit.podstawa}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<p className="mt-5 leading-relaxed text-slate-700">
								Odpoczynek tygodniowy warto liczyć uważnie: 35 godzin <em>obejmuje</em> 11 godzin odpoczynku
								dobowego, a nie dokłada się do nich. W praktyce oznacza to pełną dobę wolnego plus wieczór przed
								nią i poranek po niej.
							</p>
						</section>

						<section className="mt-12">
							<SectionHeading id="okres-rozliczeniowy">Wymiar czasu pracy i okres rozliczeniowy</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Normy dobowa i tygodniowa nie działają w oderwaniu od kalendarza. Rozliczasz je w{' '}
								<strong>okresie rozliczeniowym</strong> — co do zasady nie dłuższym niż 4 miesiące. Dopiero w jego
								ramach sprawdza się, czy przeciętnie wyszło 40 godzin tygodniowo.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Wymiar czasu pracy w danym okresie liczy się w trzech krokach: mnożysz 40 godzin przez liczbę pełnych
								tygodni, dodajesz 8 godzin za każdy dzień pozostały do końca okresu przypadający od poniedziałku do
								piątku, a następnie <strong>odejmujesz 8 godzin za każde święto</strong> przypadające w innym dniu
								niż niedziela.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Ten trzeci krok jest najczęściej pomijany. Miesiąc ze świętem wypadającym w środku tygodnia ma po
								prostu mniejszy wymiar — grafik zbudowany na „zwykłym" miesiącu przekroczy go i wygeneruje
								nadgodziny. Więcej o samym rozliczaniu:{' '}
								<Link href="/ewidencja-nadgodzin" className="text-emerald-700 hover:underline">
									ewidencja nadgodzin
								</Link>
								.
							</p>
						</section>

						<div className="mt-10">
							<WorkingTimeNormCalculator />
						</div>

						<section className="mt-12">
							<SectionHeading id="bledy">Pięć najczęstszych błędów</SectionHeading>
							<div className="mt-6 flex flex-col gap-5">
								{bledy.map((blad, index) => (
									<div key={blad.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
										<h3 className="text-lg font-semibold text-slate-900">
											<span className="mr-2 text-emerald-700">{index + 1}.</span>
											{blad.title}
										</h3>
										<p className="mt-2 leading-relaxed text-slate-700">{blad.body}</p>
									</div>
								))}
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="w-praktyce">Jak to wygląda w Planopii</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Część tych warunków da się sprawdzić maszynowo, zanim grafik trafi do zespołu. Planopia układa
								rozkład na podstawie zdefiniowanych zmian i przy automatycznym wypełnianiu pomija weekendy, święta
								oraz osoby, które mają w danym dniu zatwierdzony urlop. Każdą zmianę opisujesz godzinami oraz
								minimalną liczbą osób, a grafik ma wersję roboczą i opublikowaną — zespół widzi dopiero tę
								zatwierdzoną.
							</p>
							<p className="mt-4 leading-relaxed text-slate-700">
								Trzeba to powiedzieć wprost: program skraca pracę i ogranicza liczbę pomyłek, ale{' '}
								<strong>nie przejmuje odpowiedzialności za zgodność rozkładu z przepisami</strong>. Decyzja o tym,
								kto pracuje kiedy — i czy mieści się to w normach — pozostaje po stronie pracodawcy.
							</p>
							<div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
								<p className="text-lg font-semibold text-slate-900">Ułóż grafik bez arkusza</p>
								<p className="mt-2 leading-relaxed text-slate-700">
									30 dni pełnej aplikacji za darmo, do 5 osób, bez podawania karty.
								</p>
								<div className="mt-5 flex flex-wrap gap-3">
									<Link
										href="/program-do-grafikow-pracy"
										className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline transition hover:bg-emerald-700"
									>
										Zobacz program do grafików
									</Link>
									<Link
										href="/blog/jak-ulozyc-grafik-pracy-w-restauracji"
										className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 bg-white px-6 py-3 font-semibold !text-emerald-700 no-underline transition hover:bg-emerald-50"
									>
										Grafik w restauracji — przykład
									</Link>
								</div>
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="faq-grafik">Najczęstsze pytania</SectionHeading>
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
									label: 'Kodeks pracy — tekst jednolity (art. 128, 129, 130, 132, 133)',
									href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf',
								},
								{
									label: 'Państwowa Inspekcja Pracy — czas pracy, pytania i odpowiedzi',
									href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi',
								},
							]}
							verifiedOn="31 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="jak-ulozyc-grafik-pracy" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
