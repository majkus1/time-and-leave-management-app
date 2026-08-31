import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'

const URL = 'https://planopia.pl/blog/urlopy-i-dni-wolne-dla-pracownikow'
const IMAGE = 'https://planopia.pl/img/urlopy-i-dni-wolne-pracownikow.webp'
const PUBLISHED = '2026-08-18'

const faq = [
	{
		q: 'Ile dni urlopu wypoczynkowego przysługuje pracownikowi?',
		a: 'Wymiar urlopu wypoczynkowego zależy od stażu pracy i wynosi 20 dni przy łącznym stażu krótszym niż 10 lat oraz 26 dni przy stażu wynoszącym co najmniej 10 lat. Do stażu wliczają się zarówno okresy zatrudnienia, jak i ukończona edukacja.',
	},
	{
		q: 'Czy lata nauki wliczają się do stażu urlopowego?',
		a: 'Tak, ale poszczególne etapy edukacji nie sumują się — pod uwagę bierze się wyłącznie najkorzystniejszy dla pracownika wariant. Zasadnicza szkoła zawodowa to do 3 lat, średnia szkoła zawodowa do 5 lat, liceum ogólnokształcące 4 lata, szkoła policealna 6 lat, a studia wyższe 8 lat.',
	},
	{
		q: 'Ile dni wolnych na poszukiwanie pracy przysługuje w okresie wypowiedzenia?',
		a: 'Gdy to pracodawca wypowiada umowę z zachowaniem co najmniej 2-tygodniowego okresu wypowiedzenia, pracownikowi przysługują 2 dni robocze przy wypowiedzeniu 2-tygodniowym lub 1-miesięcznym oraz 3 dni robocze przy wypowiedzeniu 3-miesięcznym. Za ten czas zachowuje prawo do 100% wynagrodzenia (art. 37 Kodeksu pracy).',
	},
	{
		q: 'Czy urlop szkoleniowy pomniejsza pulę urlopu wypoczynkowego?',
		a: 'Nie. Urlop szkoleniowy jest dodatkowym, w pełni płatnym wolnym i nie pomniejsza puli urlopu wypoczynkowego. Przysługuje 6 dni na przygotowanie się do egzaminów zawodowych lub maturalnych oraz 21 dni na napisanie pracy dyplomowej i przygotowanie do egzaminu dyplomowego.',
	},
	{
		q: 'Ile dni urlopu okolicznościowego przysługuje pracownikowi?',
		a: '2 dni przysługują na własny ślub, narodziny dziecka oraz śmierć małżonka, dziecka, rodziców, ojczyma lub macochy. 1 dzień przysługuje na ślub dziecka oraz śmierć rodzeństwa, teściów, dziadków lub osoby będącej na utrzymaniu pracownika.',
	},
	{
		q: 'Czy zwolnienie z powodu siły wyższej jest płatne?',
		a: 'Tak, ale w obniżonej wysokości. Pracownikowi przysługuje 2 dni lub 16 godzin w roku w pilnych sprawach rodzinnych, na przykład przy wypadku lub nagłej chorobie bliskiego, a za ten czas otrzymuje 50% wynagrodzenia.',
	},
]

const educationRows = [
	['Zasadnicza szkoła zawodowa', 'do 3 lat'],
	['Średnia szkoła zawodowa', 'do 5 lat (lub 5 lat po ukończeniu szkoły zasadniczej)'],
	['Liceum ogólnokształcące', '4 lata'],
	['Szkoła policealna', '6 lat'],
	['Studia wyższe (licencjackie, inżynierskie, magisterskie)', '8 lat'],
]

const otherLeaves = [
	{
		title: 'Zwolnienie od pracy z powodu siły wyższej',
		body: '2 dni lub 16 godzin w roku w przypadku pilnych spraw rodzinnych (np. wypadek, nagła choroba bliskiego). W tym czasie pracownikowi przysługuje 50% wynagrodzenia.',
	},
	{
		title: 'Urlop opiekuńczy',
		body: '5 dni w roku na osobistą opiekę nad krewnym (syn, córka, matka, ojciec, małżonek) lub osobą zamieszkującą w tym samym gospodarstwie z poważnych względów medycznych (urlop bezpłatny).',
	},
	{
		title: 'Dni dla krwiodawców',
		body: '2 dni wolne za każdą donację krwi.',
	},
	{
		title: 'Urlop bezpłatny',
		body: 'Udzielany na pisemny wniosek pracownika, bez określonych ram czasowych (za zgodą pracodawcy).',
	},
]

const occasionalLeaves = [
	{
		days: '1 dzień',
		body: 'ślub dziecka, śmierć rodzeństwa, teściów, dziadków lub osoby będącej na utrzymaniu.',
	},
	{
		days: '2 dni',
		body: 'własny ślub, narodziny dziecka, śmierć małżonka, dziecka, rodziców, ojczyma lub macochy.',
	},
]

const toc = [
	['nie-tylko-wypoczynkowy', 'Nie tylko urlop wypoczynkowy'],
	['wymiar-urlopu', 'Wymiar urlopu: 20 czy 26 dni'],
	['edukacja-a-staz', 'Jak edukacja wpływa na wymiar'],
	['poszukiwanie-pracy', 'Dni wolne na poszukiwanie pracy'],
	['urlop-szkoleniowy', 'Urlop szkoleniowy'],
	['pozostale-urlopy', 'Pozostałe urlopy i zwolnienia'],
	['podsumowanie', 'Podsumowanie'],
	['faq-urlopy-dni-wolne', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Urlopy i dni wolne przysługujące pracownikom',
	description:
		'Urlop wypoczynkowy to jedno z wielu uprawnień pracownika. Sprawdź wymiar urlopu, urlop szkoleniowy, okolicznościowy, opiekuńczy i dni wolne na poszukiwanie pracy.',
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
		{ '@type': 'ListItem', position: 3, name: 'Urlopy i dni wolne pracownika', item: URL },
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

export default function BlogEmployeeLeaveTypesArticle() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white">
				<article itemScope itemType="https://schema.org/BlogPosting">
					<header className="border-b border-blue-100 bg-[#f4f8ff] px-4 py-10 md:py-14">
						<div className="mx-auto max-w-6xl">
							<nav aria-label="Okruszki" className="mb-5 text-sm text-slate-600">
								<ol className="flex flex-wrap items-center gap-2">
									<li>
										<Link href="/blog" className="hover:text-emerald-700 hover:underline">Blog</Link>
									</li>
									<li aria-hidden>/</li>
									<li>
										<Link href="/blog#urlopy" className="hover:text-emerald-700 hover:underline">Urlopy i planowanie</Link>
									</li>
									<li aria-hidden>/</li>
									<li aria-current="page">Urlopy i dni wolne</li>
								</ol>
							</nav>

							<div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
								<div>
									<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Prawo pracy</p>
									<h1 itemProp="headline" className="m-0 text-3xl font-semibold leading-tight !text-[#102f5e] sm:text-4xl lg:text-5xl">
										Urlopy i dni wolne przysługujące pracownikom
									</h1>
									<p className="mt-5 text-lg leading-relaxed text-slate-700 md:text-xl">
										Urlop wypoczynkowy to tylko jedno z wielu uprawnień przysługujących pracownikom etatowym w Polsce. Co jeszcze im się należy? Między innymi urlop na żądanie, szkoleniowy i okolicznościowy oraz dni wolne na poszukiwanie pracy i zwolnienie z powodu siły wyższej. Wyjaśniamy, jakie urlopy i dni wolne przysługują pracownikom oraz kto może z nich skorzystać.
									</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={PUBLISHED}>Opublikowano i zaktualizowano: 18 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image
										src="/img/urlopy-i-dni-wolne-pracownikow.webp"
										alt="Urlopy i dni wolne przysługujące pracownikom — kalendarz i wnioski urlopowe"
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
						<nav className="rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">Spis treści</h2>
							<ol className="mb-0 mt-3 grid gap-x-8 gap-y-2 pl-5 text-slate-700 md:grid-cols-2">
								{toc.map(([href, label]) => (
									<li key={href}>
										<a href={`#${href}`} className="hover:text-emerald-700 hover:underline">{label}</a>
									</li>
								))}
							</ol>
						</nav>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="nie-tylko-wypoczynkowy">
								Urlopy i dni wolne dla pracowników. Nie tylko urlop wypoczynkowy przysługuje na etacie
							</SectionHeading>
							<p>
								Pracownik zatrudniony w Polsce na podstawie umowy o pracę ma prawo nie tylko do urlopu wypoczynkowego, ale również do szeregu innych urlopów i dni wolnych, które mają umożliwić pogodzenie życia zawodowego z prywatnym, opiekę nad bliskimi, podnoszenie kwalifikacji czy załatwienie ważnych spraw osobistych. Część z tych uprawnień jest w pełni płatna, część wiąże się z obniżonym wynagrodzeniem lub ma charakter bezpłatny.
							</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="wymiar-urlopu">Wymiar urlopu wypoczynkowego: 20 czy 26 dni? Od czego zależy?</SectionHeading>
							<p>
								Każdemu pracownikowi w Polsce przysługuje urlop wypoczynkowy. Jego wymiar zależy od stażu pracy, na który składają się zarówno okresy zatrudnienia, jak i ukończona edukacja. Ile dni wolnych przysługuje podwładnym na wypoczynek? Podstawowy wymiar urlopu wynosi:
							</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
									<p className="m-0 text-3xl font-semibold text-emerald-800">20 dni</p>
									<p className="mb-0 mt-2">przy łącznym stażu pracy krótszym niż 10 lat</p>
								</div>
								<div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
									<p className="m-0 text-3xl font-semibold text-emerald-800">26 dni</p>
									<p className="mb-0 mt-2">przy łącznym stażu pracy wynoszącym co najmniej 10 lat</p>
								</div>
							</div>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="edukacja-a-staz">Jak edukacja wpływa na wymiar urlopu wypoczynkowego?</SectionHeading>
							<p>
								Lata nauki wliczają się do stażu pracowniczego, ale poszczególne etapy edukacji nie sumują się. W praktyce oznacza to, że pod uwagę bierze się wyłącznie najkorzystniejszy dla pracownika wariant:
							</p>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-left">
									<caption className="sr-only">Okresy nauki wliczane do stażu urlopowego</caption>
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Etap edukacji</th>
											<th scope="col" className="px-4 py-3 font-semibold text-slate-900">Wliczany okres</th>
										</tr>
									</thead>
									<tbody>
										{educationRows.map(([level, years]) => (
											<tr key={level} className="border-b border-slate-200">
												<td className="px-4 py-3">{level}</td>
												<td className="px-4 py-3 font-semibold text-slate-900">{years}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<aside className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
								<h3 className="m-0 text-lg font-semibold text-slate-900">Przykład</h3>
								<p className="mb-0 mt-3">
									Pan Jan przepracował po studiach 3 lata na umowie zleceniu, a następnie przez 2 lata prowadził jednoosobową działalność gospodarczą. Ukończył również studia wyższe. Jego staż pracy wynosi: 8 lat (za studia) + 3 lata (zlecenie) + 2 lata (JDG) = 13 lat. Dzięki temu przysługuje mu pełne 26 dni urlopu.
								</p>
							</aside>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="poszukiwanie-pracy">Płatne dni wolne na poszukiwanie pracy (art. 37 Kodeksu pracy)</SectionHeading>
							<p>
								Gdy pracodawca wypowiada umowę o pracę z zachowaniem co najmniej 2-tygodniowego okresu wypowiedzenia, pracownikowi przysługuje płatny czas na poszukiwanie pracy. Ich liczba zależy od długości okresu wypowiedzenia i wynosi:
							</p>
							<ul className="grid list-none gap-3 p-0">
								<li className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4">
									<strong className="font-semibold text-slate-900">2 dni robocze</strong> – przy 2-tygodniowym lub 1-miesięcznym okresie wypowiedzenia,
								</li>
								<li className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4">
									<strong className="font-semibold text-slate-900">3 dni robocze</strong> – przy 3-miesięcznym okresie wypowiedzenia.
								</li>
							</ul>
							<p>Warto pamiętać, że za ten czas pracownik zachowuje prawo do 100% wynagrodzenia.</p>
							<aside className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
								<h3 className="m-0 text-lg font-semibold text-slate-900">Przykład</h3>
								<p className="mb-0 mt-3">
									Pani Anna otrzymała wypowiedzenie umowy z 3-miesięcznym okresem. W tym czasie postanowiła wykorzystać 3 dni robocze na poszukiwanie nowej pracy (zgodnie z art. 37 KP). Pracodawca nie może odmówić udzielenia tego zwolnienia ani obniżyć jej pensji za te dni.
								</p>
							</aside>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="urlop-szkoleniowy">Urlop szkoleniowy</SectionHeading>
							<p>
								Jakie jeszcze urlopy przysługują pracownikom? Zatrudnieni podnoszący kwalifikacje z inicjatywy pracodawcy lub za jego zgodą mają prawo do dodatkowego, w pełni płatnego wolnego. Co ważne, dni na podniesienie kompetencji nie pomniejszają puli urlopu wypoczynkowego. Ile wolnego mogą dostać pracownicy?
							</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
									<p className="m-0 text-2xl font-semibold text-slate-900">6 dni</p>
									<p className="mb-0 mt-2">na przygotowanie się do egzaminów zawodowych lub maturalnych</p>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
									<p className="m-0 text-2xl font-semibold text-slate-900">21 dni</p>
									<p className="mb-0 mt-2">na napisanie pracy dyplomowej i przygotowanie do egzaminu dyplomowego</p>
								</div>
							</div>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="pozostale-urlopy">Pozostałe formy płatnych i bezpłatnych urlopów i zwolnień od pracy</SectionHeading>
							<p>Kodeks pracy oraz przepisy szczególne przewidują także na legalną nieobecność w firmie również w innych okolicznościach. Jakich?</p>
							<dl className="grid gap-4">
								{otherLeaves.map(item => (
									<div key={item.title} className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4">
										<dt className="font-semibold text-slate-900">{item.title}</dt>
										<dd className="mt-1">{item.body}</dd>
									</div>
								))}
							</dl>

							<h3 className="mt-8 text-xl font-semibold text-slate-900">Urlop okolicznościowy</h3>
							<p>Pracownikom przysługują również dni wolne z uwagi na wystąpienie pewnych okoliczności. W wymiarze:</p>
							<ul className="grid list-none gap-3 p-0">
								{occasionalLeaves.map(item => (
									<li key={item.days} className="border-l-4 border-emerald-400 bg-emerald-50/50 px-5 py-4">
										<strong className="font-semibold text-slate-900">{item.days}:</strong> {item.body}
									</li>
								))}
							</ul>

							<aside className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 md:p-8" aria-labelledby="planopia-urlopy-heading">
								<h2 id="planopia-urlopy-heading" className="m-0 text-xl font-semibold text-slate-900 md:text-2xl">
									Wszystkie rodzaje wniosków w jednym miejscu
								</h2>
								<p className="mt-3">
									Urlop wypoczynkowy, okolicznościowy, opiekuńczy czy zwolnienie z powodu siły wyższej — w Planopii każdy typ wniosku ma własny limit i własny obieg akceptacji. Pracownik składa wniosek, przełożony zatwierdza, a limity zliczają się same.
								</p>
								<Link
									href="/program-do-urlopow"
									className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
								>
									Zobacz program do urlopów
								</Link>
							</aside>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="podsumowanie">Inne urlopy i dni wolne w Kodeksie pracy – podsumowanie</SectionHeading>
							<p>
								Oprócz urlopu wypoczynkowego Kodeks pracy gwarantuje pracownikom szeroki wachlarz świadczeń, takich jak płatny urlop szkoleniowy, okolicznościowy czy zwolnienie z powodu siły wyższej. Dodatkowe dni wolne przysługują także w przypadku opieki nad bliskimi, oddawania krwi lub w okresie wypowiedzenia na poszukiwanie nowego zatrudnienia. Znajomość urlopów i dni wolnych pozwala optymalnie łączyć obowiązki zawodowe z życiem prywatnym.
							</p>
						</section>

						<section id="faq-urlopy-dni-wolne" className="mt-12 scroll-mt-24" aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">
								FAQ – urlopy i dni wolne przysługujące pracownikom
							</h2>
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
								{ label: 'Kodeks pracy — tekst jednolity', href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf' },
								{ label: 'Państwowa Inspekcja Pracy: pytania i odpowiedzi dla pracowników', href: 'https://www.pip.gov.pl/dla-pracownikow/pytania-i-odpowiedzi' },
							]}
							verifiedOn="18 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="urlopy-i-dni-wolne-dla-pracownikow" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
