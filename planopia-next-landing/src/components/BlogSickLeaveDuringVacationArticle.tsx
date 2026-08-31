import Image from 'next/image'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'

const URL = 'https://planopia.pl/blog/l4-na-urlopie-wypoczynkowym'
const IMAGE = 'https://planopia.pl/img/l4-na-urlopie-wypoczynkowym.webp'
const PUBLISHED = '2026-08-03'
const UPDATED = '2026-08-31'

const faq = [
	{
		q: 'Czy zwolnienie lekarskie (L4) przerywa urlop wypoczynkowy?',
		a: 'Tak, L4 automatycznie przerywa bieg urlopu wypoczynkowego (art. 166 Kodeksu pracy). Status nieobecności w systemie zmienia się z urlopu na zwolnienie chorobowe, a niewykorzystane dni wolne wracają do Twojej puli i nie przepadają.',
	},
	{
		q: 'Czy pracodawca może odmówić zwrotu dni urlopowych przerwanych przez chorobę?',
		a: 'Nie, pracodawca ma prawny obowiązek udzielenia niewykorzystanych dni urlopu w późniejszym terminie. Przepisy te dotyczą każdego pracownika zatrudnionego na podstawie umowy o pracę.',
	},
	{
		q: 'Czy po zakończeniu L4 urlop automatycznie się przedłuża?',
		a: 'Nie. Odzyskane dni wolne nie dopisują się automatycznie na koniec bieżącego urlopu. Po wygaśnięciu L4 musisz wrócić do pracy i złożyć nowy wniosek urlopowy na inny, uzgodniony z pracodawcą termin (chyba że osobiście uzgodnicie przedłużenie wolnego od razu).',
	},
	{
		q: 'Jakie są formalne kroki do odzyskania urlopu przerywanego przez chorobę?',
		a: 'Uzyskaj e-ZLA: Otrzymaj zwolnienie od lekarza (trafia ono automatycznie do ZUS i pracodawcy).\nZawiadom pracodawcę: Poinformuj zakład pracy o nieobecności najpóźniej w 2. dniu jej trwania (w ciągu 48h).\nWróć do pracy: Staw się w pracy po zakończeniu L4.\nZłóż nowy wniosek: Uzgodnij z przełożonym nowy termin i złóż wniosek o zaległy urlop.',
	},
	{
		q: 'Co zrobić w przypadku choroby na urlopie za granicą?',
		a: 'Za granicą nie działa polski system e-ZLA, dlatego musisz:\nPobrać papierowe zaświadczenie od lokalnego lekarza (z datami, pieczęcią i podpisem).\nWysłać skan/zdjęcie dokumentu pracodawcy w ciągu 48 godzin (np. mailowo).\nDostarczyć oryginał po powrocie do kraju (pracodawca lub ZUS mogą wymagać tłumaczenia na język polski). Dokumenty z państw UE/EFTA oraz z krajów z umową o zabezpieczeniu społecznym nie wymagają tłumaczenia w ogóle.',
	},
]

const steps = [
	{
		title: 'Konsultacja medyczna i wystawienie e-ZLA',
		body: 'Pierwszym krokiem pracownika powinno być podjęcie leczenia i uzyskanie od uprawnionego lekarza elektronicznego zaświadczenia o czasowej niezdolności do pracy. Dokument zostaje automatycznie przekazany do ZUS oraz systemu pracodawcy.',
	},
	{
		title: 'Zawiadomienie pracodawcy w terminie 48 godzin',
		body: 'Pracownik ma obowiązek poinformowania zakładu pracy o przyczynie nieobecności oraz przewidywanym czasie jej trwania najpóźniej w drugim dniu jej wystąpienia.',
	},
	{
		title: 'Stawiennictwo w pracy po zakończeniu L4',
		body: 'Po wygaśnięciu okresu niezdolności do pracy pracownik powraca do wykonywania obowiązków służbowych, chyba że strony uzgodnią przedłużenie wolnego o niewykorzystane dni.',
	},
	{
		title: 'Złożenie wniosku o nowy termin urlopu',
		body: 'Odzyskane dni wolne nie dopisują się automatycznie na koniec bieżącego urlopu. Pracownik zobowiązany jest do złożenia nowego wniosku urlopowego na uzgodniony z pracodawcą termin.',
	},
]

const toc = [
	['artykul-166', 'Kiedy L4 przerywa urlop'],
	['procedura', 'Cztery procedury formalne'],
	['choroba-za-granica', 'Choroba podczas wyjazdu zagranicznego'],
	['ochrona-prawna', 'Ochrona prawa do wypoczynku'],
	['faq-l4-urlop', 'Najczęstsze pytania'],
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'L4 na urlopie wypoczynkowym: Jak skutecznie odzyskać stracone dni wolne',
	description: 'L4 podczas urlopu wypoczynkowego przerywa urlop. Sprawdź procedurę odzyskania niewykorzystanych dni i zasady choroby za granicą.',
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
	dateModified: UPDATED,
	inLanguage: 'pl-PL',
}

const breadcrumbSchema = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://planopia.pl/blog' },
		{ '@type': 'ListItem', position: 2, name: 'Urlopy i planowanie', item: 'https://planopia.pl/blog#urlopy' },
		{ '@type': 'ListItem', position: 3, name: 'L4 na urlopie', item: URL },
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
	return <h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">{children}</h2>
}

export default function BlogSickLeaveDuringVacationArticle() {
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
									<li><Link href="/blog" className="hover:text-emerald-700 hover:underline">Blog</Link></li>
									<li aria-hidden>/</li>
									<li><Link href="/blog#urlopy" className="hover:text-emerald-700 hover:underline">Urlopy i planowanie</Link></li>
									<li aria-hidden>/</li>
									<li aria-current="page">L4 na urlopie</li>
								</ol>
							</nav>

							<div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
								<div>
									<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Prawo pracy</p>
									<h1 itemProp="headline" className="m-0 text-3xl font-semibold leading-tight !text-[#102f5e] sm:text-4xl lg:text-5xl">L4 na urlopie wypoczynkowym: Jak skutecznie odzyskać stracone dni wolne</h1>
									<p className="mt-5 text-lg leading-relaxed text-slate-700 md:text-xl">Zwolnienie lekarskie wystawione w trakcie urlopu wypoczynkowego automatycznie przerywa jego bieg, nakładając na pracodawcę obowiązek udzielenia niewykorzystanych dni wakacji w późniejszym terminie. Przepisy te dotyczą każdego pracownika zatrudnionego na podstawie umowy o pracę i obowiązują w oparciu o regulacje Kodeksu pracy.</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={UPDATED}>Opublikowano: 3 sierpnia 2026 r. · Zaktualizowano: 31 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image src="/img/l4-na-urlopie-wypoczynkowym.webp" alt="Kalendarz urlopowy pokazujący przerwanie urlopu przez zwolnienie lekarskie" width={1200} height={630} className="h-auto w-full" priority />
								</div>
							</div>
						</div>
					</header>

					<div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 md:py-14">
						<nav className="rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">Spis treści</h2>
							<ol className="mb-0 mt-3 grid gap-x-8 gap-y-2 pl-5 text-slate-700 md:grid-cols-2">
								{toc.map(([href, label]) => <li key={href}><a href={`#${href}`} className="hover:text-emerald-700 hover:underline">{label}</a></li>)}
							</ol>
						</nav>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="artykul-166">Automatyczne przerwanie urlopu wypoczynkowego: Co mówi artykuł 166 Kodeksu pracy?</SectionHeading>
							<p>Każdemu pracownikowi w Polsce przysługuje urlop wypoczynkowy, którego głównym celem jest regeneracja sił fizycznych i psychicznych oraz odzyskanie pełnej zdolności do wykonywania codziennych obowiązków służbowych. Ma to kluczowe znaczenie z punktu widzenia wystąpienia w czasie jego trwania choroby. W sytuacji, gdy w trakcie zaplanowanego wolnego dochodzi do nagłego pogorszenia stanu zdrowia, nadrzędna funkcja wypoczynku nie może zostać zrealizowana.</p>
							<p>Zgodnie z art. 166 Kodeksu pracy, czasowa niezdolność do pracy wywołana chorobą, izolacją z powodu choroby zakaźnej, odbywaniem ćwiczeń wojskowych czy urlopem macierzyńskim obligatoryjnie przerywa urlop wypoczynkowy. W praktyce oznacza to, że pracodawca nie ma możliwości odmowy przywrócenia niewykorzystanych dni wolnych.</p>
							<p>W momencie zarejestrowania w systemie elektronicznego zaświadczenia lekarskiego (e-ZLA), status nieobecności zatrudnionego ulega natychmiastowej zmianie z urlopu wypoczynkowego na zwolnienie chorobowe. Dni objęte L4 nie przepadają – zyskują status dni do wykorzystania w przyszłości.</p>
							<p className="text-sm"><a href="https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/czy-oddanie-krwi-przesuwa-urlop-wypoczynkowy" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">Sprawdź wyjaśnienie Państwowej Inspekcji Pracy dotyczące art. 166 Kodeksu pracy</a>.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="procedura">Cztery procedury formalne: Jak krok po kroku odzyskać przerwany przez L4 urlop wypoczynkowy</SectionHeading>
							<p>Skuteczne skorzystanie z ochrony przewidzianej przez przepisy prawa pracy wymaga przestrzegania procedur. W praktyce oznacza to konieczność działa zgodnie z poniższymi wskazówkami:</p>
							<ol className="grid list-none gap-4 p-0">
								{steps.map((step, index) => (
									<li key={step.title} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:grid-cols-[2.5rem_1fr]">
										<span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800" aria-hidden>{index + 1}</span>
										<div><h3 className="m-0 text-lg font-semibold text-slate-900">{step.title}</h3><p className="mb-0 mt-2">{step.body}</p></div>
									</li>
								))}
							</ol>

							<div className="grid gap-4 md:grid-cols-2">
								<aside className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
									<h3 className="m-0 text-lg font-semibold text-slate-900">Przykład 1</h3>
									<p className="mb-0 mt-3">Pan Tomasz zaplanował 8 dni urlopu wypoczynkowego od 1 do 10 lipca. W trzecim dniu wyjazdu uległ ostremu zatruciu pokarmowemu i otrzymał L4 na okres od 3 do 10 lipca (6 dni roboczych). W efekcie wykorzystał jedynie 2 dni urlopu wypoczynkowego. Pozostałe 6 dni podlega anulowaniu jako urlop i przechodzi na konto do późniejszego wykorzystania.</p>
								</aside>
								<aside className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
									<h3 className="m-0 text-lg font-semibold text-slate-900">Przykład 2</h3>
									<p className="mb-0 mt-3">Pani Karolina zaplanowała 2-tygodniowe wakacje od 1 do 14 kwietnia. W tym celu wykorzystała 10 dni z puli urlopu wypoczynkowego. W ósmym dniu urlopu (8 kwietnia) uległa bolesnej kontuzji kolana i uzyskała od lekarza e-ZLA na 7 dni – do 14 kwietnia. Następnego dnia rano (w ciągu wymaganych 48 godzin) poinformowała przełożonego mailowo o zaistniałej sytuacji. Ponieważ okres L4 skończył się dokładnie w dniu planowanego końca urlopu, Pani Karolina 15 kwietnia stawiła się normalnie do pracy. Z zaplanowanych 10 dni urlopu faktycznie wykorzystała jedynie 5 dni (1–3 i 6–7 kwietnia). Pozostałe 5 dni roboczych powróciło do jej puli urlopowej. Po uzgodnieniu nowego terminu z przełożonym Pani Karolina złożyła wniosek i odebrała zaległe 5 dni wolnego w listopadzie.</p>
								</aside>
							</div>

							<aside className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 md:p-8" aria-labelledby="planopia-l4-heading">
								<h2 id="planopia-l4-heading" className="m-0 text-xl font-semibold text-slate-900 md:text-2xl">Wnioski i limity po przerwaniu urlopu w jednym miejscu</h2>
								<p className="mt-3">Planopia nie pobiera e-ZLA i nie przywraca limitu automatycznie. Administrator lub HR może skorygować limit pracownika, zachować historię wniosków i rozpatrzyć nowy termin wykorzystania urlopu.</p>
								<Link href="/program-do-urlopow" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Uporządkuj wnioski i limity urlopowe w Planopii</Link>
							</aside>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="choroba-za-granica">Choroba podczas zagranicznego wyjazdu: Jak zabezpieczyć dokumentację medyczną?</SectionHeading>
							<p>Zachorowanie lub nieszczęśliwy wypadek poza granicami Polski nakłada na pracownika dodatkowe wymogi formalne. Powód jest prosty – poza Polską system e-ZLA nie funkcjonuje, co wymaga pozyskania tradycyjnej dokumentacji papierowej.</p>
							<p>Co w takiej sytuacji powinien zrobić pracownik? W przypadku zachorowania za granicą kluczowe jest podjęcie następujących kroków:</p>
							<dl className="grid gap-4">
								<div className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4"><dt className="font-semibold text-slate-900">Kompletne zaświadczenie papierowe</dt><dd className="mt-1">Pracownik powinien uzyskać od lokalnego lekarza zaświadczenie zawierające dokładne daty niezdolności do pracy, dane osobowe, pieczęć placówki medycznej oraz czytelny podpis lekarza.</dd></div>
								<div className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4"><dt className="font-semibold text-slate-900">Niezwłoczne przekazanie informacji</dt><dd className="mt-1">Skan lub czytelne zdjęcie dokumentu należy przesłać pracodawcy pocztą elektroniczną lub komunikatorem w ciągu 48 godzin, żeby zgłosić przerwę w urlopie.</dd></div>
								<div className="border-l-4 border-blue-400 bg-blue-50/50 px-5 py-4"><dt className="font-semibold text-slate-900">Tłumaczenie przysięgłe dokumentu</dt><dd className="mt-1">Pracodawca oraz ZUS mają prawo zażądać dostarczenia oryginału dokumentu wraz z tłumaczeniem na język polski po powrocie pracownika do kraju. Dokumenty z państw UE/EFTA oraz z krajów, z którymi Polska ma umowę o zabezpieczeniu społecznym, nie wymagają tłumaczenia w ogóle.</dd></div>
							</dl>
							<aside className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
								<h3 className="m-0 text-lg font-semibold text-slate-900">Przykład</h3>
								<p className="mb-0 mt-3">Pani Anna podczas urlopu w Wietnamie skręciła nogę. Lokalny szpital wystawił papierowe zaświadczenie o niezdolności do pracy na 5 dni. Pani Anna niezwłocznie wysłała skan dokumentu przełożonemu e-mailem. Po powrocie przekazała dokument działowi kadr. Pracodawca zaliczył okres choroby jako L4 i przywrócił 5 dni urlopu wypoczynkowego.</p>
							</aside>
							<p className="text-sm"><a href="https://www.zus.pl/en/swiadczenia/zasilki/opis-spraw-zasilki/-/asset_publisher/viJMtnk9lwIB/content/id/10635131?_com_liferay_asset_publisher_web_portlet_INSTANCE_viJMtnk9lwIB_languageId=pl_PL" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">Sprawdź aktualne wymagania ZUS dla zaświadczenia wystawionego za granicą</a>.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="ochrona-prawna">Pełna ochrona prawna pracowników na urlopie wypoczynkowym</SectionHeading>
							<p>Prawo pracy chroni pracownika przed utratą prawa do wypoczynku z przyczyn zdrowotnych. Znajomość art. 166 Kodeksu pracy oraz sprawne dopełnienie formalności związanych z dostarczeniem zaświadczenia lekarskiego pozwalają na bezproblemowe odzyskanie niewykorzystanych dni wolnych i zaplanowanie ich w nowym, dogodnym terminie.</p>
						</section>

						<section id="faq-l4-urlop" className="mt-12 scroll-mt-24" aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">FAQ – najważniejsze informacje o L4 na urlopie wypoczynkowym</h2>
							<div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
								{faq.map(item => (
									<details key={item.q} className="group py-1">
										<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
											<span>{item.q}</span><span aria-hidden className="text-xl text-emerald-700 transition group-open:rotate-45">+</span>
										</summary>
										<p className="mb-5 mt-0 whitespace-pre-line leading-relaxed text-slate-700">{item.a}</p>
									</details>
								))}
							</div>
						</section>

						<BlogArticleCredibility
							sources={[
								{ label: 'Kodeks pracy — tekst jednolity', href: 'https://eli.gov.pl/api/acts/DU/2025/277/text/T/D20250277L.pdf' },
								{ label: 'Państwowa Inspekcja Pracy: okoliczności przerywające urlop', href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/czy-oddanie-krwi-przesuwa-urlop-wypoczynkowy' },
								{ label: 'PIP: zawiadomienie pracodawcy o nieobecności', href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/w-jaki-sposob-pracownik-powinien-usprawiedliwic-swoja-nieobecnosc-w-pracy?tmpl=pdf%3Ftmpl%3Dpdf' },
								{ label: 'ZUS: dokumenty dla niezdolności do pracy orzeczonej za granicą', href: 'https://www.zus.pl/en/swiadczenia/zasilki/opis-spraw-zasilki/-/asset_publisher/viJMtnk9lwIB/content/id/10635131?_com_liferay_asset_publisher_web_portlet_INSTANCE_viJMtnk9lwIB_languageId=pl_PL' },
							]}
							verifiedOn="31 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="l4-na-urlopie-wypoczynkowym" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
