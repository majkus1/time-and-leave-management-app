import Image from 'next/image'
import Link from 'next/link'
import AnnualLeaveCalculator from './AnnualLeaveCalculator'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import LeaveEquivalentCalculator from './LeaveEquivalentCalculator'

const URL = 'https://planopia.pl/blog/urlop-wypoczynkowy-ile-dni'
const IMAGE = 'https://planopia.pl/img/urlop-wypoczynkowy-ile-dni.webp'
const PUBLISHED = '2026-08-02'

const faq = [
	{
		q: 'Ile dni urlopu wypoczynkowego przysługuje w 2026 roku?',
		a: 'Pracownikowi zatrudnionemu na pełny etat przysługuje 20 dni urlopu przy stażu urlopowym krótszym niż 10 lat albo 26 dni przy stażu wynoszącym co najmniej 10 lat. Przy części etatu wymiar oblicza się proporcjonalnie.',
	},
	{
		q: 'Ile urlopu przysługuje na pół etatu?',
		a: 'Przy stażu krótszym niż 10 lat jest to 10 dni rocznie, a przy stażu co najmniej 10 lat — 13 dni. Urlopu udziela się godzinowo zgodnie z rozkładem pracy pracownika.',
	},
	{
		q: 'Czy studia wliczają się do stażu urlopowego?',
		a: 'Tak. Ukończenie szkoły wyższej oznacza zaliczenie 8 lat do stażu urlopowego. Okresów nauki nie sumuje się, a nauki i zatrudnienia przypadających w tym samym czasie nie liczy się podwójnie.',
	},
	{
		q: 'Czy umowa zlecenie i B2B wliczają się do stażu?',
		a: 'Od 1 stycznia 2026 roku w sektorze publicznym i od 1 maja 2026 roku w sektorze prywatnym określone okresy zlecenia, działalności gospodarczej i współpracy mogą zwiększać staż pracowniczy po ich udokumentowaniu.',
	},
	{
		q: 'Jak udokumentować zlecenie lub działalność?',
		a: 'Sposób potwierdzenia zależy od rodzaju aktywności. Ustawa przewiduje między innymi zaświadczenia ZUS, a w określonych sytuacjach także inne dokumenty. W razie wątpliwości warto sprawdzić aktualne wyjaśnienia PIP, ZUS lub MRPiPS.',
	},
	{
		q: 'Czy po osiągnięciu 10 lat przysługuje urlop uzupełniający?',
		a: 'Jeżeli pracownik w trakcie roku osiągnie staż uprawniający do 26 dni, pracodawca ponownie ustala wymiar. Pracownik może nabyć prawo do urlopu uzupełniającego w wysokości różnicy między wyższym a wcześniej przysługującym wymiarem.',
	},
	{
		q: 'Czy niewykorzystany urlop przechodzi na następny rok?',
		a: 'Tak. Niewykorzystany urlop staje się urlopem zaległym i co do zasady powinien zostać udzielony najpóźniej do 30 września następnego roku kalendarzowego.',
	},
]

const blogPostingSchema = {
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline: 'Urlop wypoczynkowy – ile dni przysługuje? Wymiar, nowe przepisy i kalkulator',
	description: 'Urlop wypoczynkowy w 2026 roku: wymiar 20 lub 26 dni, niepełny etat, staż oraz prosty kalkulator urlopu.',
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
		{ '@type': 'ListItem', position: 3, name: 'Urlop wypoczynkowy', item: URL },
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

const tableRows = [
	['Pełny etat', '20 dni', '26 dni'],
	['3/4 etatu', '15 dni', '20 dni'],
	['1/2 etatu', '10 dni', '13 dni'],
	['1/4 etatu', '5 dni', '7 dni'],
	['1/8 etatu', '3 dni', '4 dni'],
]

const toc = [
	['kalkulator-urlopu', 'Kalkulator wymiaru urlopu'],
	['wymiar-20-26', 'Kiedy przysługuje 20 lub 26 dni'],
	['niepelny-etat', 'Urlop przy niepełnym etacie'],
	['staz-urlopowy', 'Wykształcenie i staż urlopowy'],
	['nowe-przepisy-2026', 'Nowe przepisy w 2026 roku'],
	['urlop-uzupelniajacy', 'Zmiana pracodawcy i urlop uzupełniający'],
	['kalkulator-ekwiwalentu', 'Kalkulator ekwiwalentu za urlop'],
	['planopia-urlopy', 'Jak uporządkować limity w Planopii'],
	['faq-urlop', 'Najczęstsze pytania'],
]

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return <h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">{children}</h2>
}

export default function BlogAnnualLeaveEntitlementArticle() {
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
									<li aria-current="page">Urlop wypoczynkowy</li>
								</ol>
							</nav>

							<div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
								<div>
									<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Prawo pracy 2026</p>
									<h1 itemProp="headline" className="m-0 text-3xl font-semibold leading-tight !text-[#102f5e] sm:text-4xl lg:text-5xl">
										Urlop wypoczynkowy – ile dni przysługuje? Wymiar, nowe przepisy i kalkulator
									</h1>
									<p className="mt-5 text-lg leading-relaxed text-slate-700 md:text-xl">
										Sprawdź, od czego zależy 20 lub 26 dni urlopu, jak policzyć wymiar przy części etatu i co zmieniły przepisy o stażu pracy w 2026 roku.
									</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={PUBLISHED}>Opublikowano i zaktualizowano: 2 sierpnia 2026 r.</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image src="/img/urlop-wypoczynkowy-ile-dni.webp" alt="Kalendarz z wymiarem 20 i 26 dni oraz kalkulatorem urlopu" width={1200} height={630} className="h-auto w-full" priority />
								</div>
							</div>
						</div>
					</header>

					<div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 md:py-14">
						<aside className="border-l-4 border-emerald-500 bg-emerald-50/60 px-5 py-5" aria-labelledby="answer-summary">
							<h2 id="answer-summary" className="m-0 text-xl font-semibold text-slate-900">Odpowiedź w skrócie</h2>
							<ul className="mb-0 mt-3 space-y-2 pl-5 leading-relaxed text-slate-700">
								<li><strong>20 dni</strong> przysługuje przy stażu urlopowym krótszym niż 10 lat.</li>
								<li><strong>26 dni</strong> przysługuje przy stażu wynoszącym co najmniej 10 lat.</li>
								<li>Przy części etatu wymiar liczy się proporcjonalnie, a niepełny dzień zaokrągla w górę.</li>
								<li>Nowe okresy stażowe obowiązują od 1 stycznia 2026 r. w sektorze publicznym i od 1 maja 2026 r. w sektorze prywatnym.</li>
							</ul>
						</aside>

						<nav className="my-8 rounded-lg border border-slate-200 bg-slate-50 p-5" aria-labelledby="toc-heading">
							<h2 id="toc-heading" className="m-0 text-lg font-semibold text-slate-900">Spis treści</h2>
							<ol className="mb-0 mt-3 grid gap-x-8 gap-y-2 pl-5 text-slate-700 md:grid-cols-2">
								{toc.map(([href, label]) => <li key={href}><a href={`#${href}`} className="hover:text-emerald-700 hover:underline">{label}</a></li>)}
							</ol>
						</nav>

						<AnnualLeaveCalculator />

						<p className="mt-4 text-center text-sm text-slate-600">
							Po ustaleniu prawidłowego wymiaru możesz <Link href="/program-do-urlopow" className="font-semibold text-emerald-700 hover:underline">uporządkować limity i wnioski urlopowe w Planopii</Link>.
						</p>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="wymiar-20-26">Ile dni urlopu wypoczynkowego przysługuje pracownikowi?</SectionHeading>
							<p>Roczny wymiar urlopu pracownika pełnoetatowego wynosi <strong>20 dni</strong>, jeżeli jego staż urlopowy jest krótszy niż 10 lat, albo <strong>26 dni</strong>, jeżeli staż wynosi co najmniej 10 lat. Podstawę stanowi art. 154 Kodeksu pracy.</p>
							<p>Do stażu urlopowego wlicza się nie tylko zatrudnienie u obecnego pracodawcy. Znaczenie mogą mieć wcześniejsze okresy zatrudnienia, ukończona szkoła oraz — po zmianach z 2026 roku — także udokumentowane okresy określonych form aktywności zawodowej.</p>

							<h3 className="text-xl font-semibold text-slate-900">Pierwszy urlop w pierwszym roku pracy</h3>
							<p>Osoba podejmująca pierwszą pracę nabywa prawo do urlopu z upływem każdego miesiąca pracy, w wymiarze <strong>1/12 rocznego urlopu</strong>. Zasada ta wynika z art. 153 §1 Kodeksu pracy. W kolejnych latach prawo do urlopu nabywa się z góry 1 stycznia.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="niepelny-etat">Jak obliczyć urlop przy niepełnym etacie?</SectionHeading>
							<p>Przy części etatu podstawę 20 lub 26 dni mnoży się przez wymiar etatu. Jeżeli wynik obejmuje niepełny dzień, zaokrągla się go w górę do pełnego dnia.</p>
							<div className="overflow-x-auto rounded-lg border border-slate-200">
								<table className="w-full min-w-[620px] border-collapse text-left">
									<caption className="bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">Roczny wymiar urlopu przy stałym wymiarze etatu przez cały rok</caption>
									<thead className="bg-[#f4f8ff] text-slate-900"><tr><th scope="col" className="px-4 py-3">Wymiar etatu</th><th scope="col" className="px-4 py-3">Staż poniżej 10 lat</th><th scope="col" className="px-4 py-3">Staż co najmniej 10 lat</th></tr></thead>
									<tbody>{tableRows.map(row => <tr key={row[0]} className="border-t border-slate-200"><th scope="row" className="px-4 py-3 font-medium text-slate-900">{row[0]}</th><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3">{row[2]}</td></tr>)}</tbody>
								</table>
							</div>
							<p><strong>Przykład:</strong> pracownik na 3/4 etatu ze stażem co najmniej 10 lat ma 26 × 3/4 = 19,5 dnia. Po zaokrągleniu jego roczny wymiar wynosi 20 dni.</p>
							<p>Wymiar ustala się w dniach, ale urlopu udziela się godzinowo zgodnie z rozkładem pracy. Jeden dzień urlopu odpowiada co do zasady 8 godzinom. Dlatego pracownik na pół etatu może wykorzystać urlop w sposób odpowiadający liczbie godzin zaplanowanych w konkretnych dniach.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="staz-urlopowy">Co wlicza się do stażu urlopowego?</SectionHeading>
							<p>Staż urlopowy obejmuje okresy uwzględniane przy ustalaniu prawa do 20 albo 26 dni urlopu. Przy wykształceniu bierze się pod uwagę najwyższy ukończony poziom, a okresów nauki nie sumuje się.</p>
							<dl className="grid gap-3 sm:grid-cols-2">
								<div className="border-b border-slate-200 py-2"><dt className="font-semibold text-slate-900">Zasadnicza szkoła zawodowa</dt><dd>do 3 lat</dd></div>
								<div className="border-b border-slate-200 py-2"><dt className="font-semibold text-slate-900">Średnia szkoła zawodowa</dt><dd>do 5 lat</dd></div>
								<div className="border-b border-slate-200 py-2"><dt className="font-semibold text-slate-900">Średnia szkoła ogólnokształcąca</dt><dd>4 lata</dd></div>
								<div className="border-b border-slate-200 py-2"><dt className="font-semibold text-slate-900">Szkoła policealna</dt><dd>6 lat</dd></div>
								<div className="border-b border-slate-200 py-2 sm:col-span-2"><dt className="font-semibold text-slate-900">Szkoła wyższa</dt><dd>8 lat</dd></div>
							</dl>
							<p>Jeżeli nauka i zatrudnienie przypadały na ten sam okres, pracownik wybiera rozwiązanie korzystniejsze. Tego samego czasu nie dolicza się dwa razy.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="nowe-przepisy-2026">Nowe przepisy o stażu pracy w 2026 roku</SectionHeading>
							<p>Od <strong>1 stycznia 2026 r.</strong> w sektorze publicznym i od <strong>1 maja 2026 r.</strong> w sektorze prywatnym do stażu pracowniczego mogą być zaliczane również udokumentowane okresy wskazane w nowych przepisach, między innymi niektóre umowy zlecenia, prowadzenie działalności gospodarczej i współpraca z osobą prowadzącą działalność.</p>
							<p>Takich okresów nie dolicza się automatycznie. Pracownik musi je udokumentować. W zależności od rodzaju aktywności może służyć temu zaświadczenie ZUS albo inny dokument dopuszczony przez przepisy. Ustawa przewiduje <strong>24-miesięczny okres przejściowy</strong> na przedstawienie dokumentów dotyczących wcześniejszych okresów.</p>
							<aside className="border-l-4 border-blue-500 bg-blue-50 px-5 py-4"><p className="m-0"><strong>Pokrywające się okresy:</strong> jeżeli dwie aktywności zawodowe przypadały na ten sam czas, nie sumuje się ich podwójnie. Uwzględnia się jeden okres — najkorzystniejszy dla pracownika.</p></aside>
							<p><strong>Przykład:</strong> pracownik ma 4 lata zaliczane z tytułu szkoły średniej, 3 lata zatrudnienia i 4 lata udokumentowanego, niepokrywającego się z nimi zlecenia. Po uznaniu dokumentów jego staż może wynieść 11 lat, co wymaga ponownego ustalenia wymiaru urlopu.</p>
						</section>

						<section className="mt-12 space-y-4 leading-relaxed text-slate-700">
							<SectionHeading id="urlop-uzupelniajacy">Zmiana pracodawcy i urlop uzupełniający</SectionHeading>
							<p>Po zmianie pracodawcy wymiar urlopu ustala się z uwzględnieniem urlopu wykorzystanego wcześniej w tym samym roku. Informacja o wykorzystanym urlopie znajduje się w świadectwie pracy.</p>
							<p>Gdy pracownik osiąga 10-letni staż w trakcie roku albo dokumenty zwiększające staż zostaną uznane, pracodawca powinien ponownie obliczyć wymiar. Jeżeli spełnione są warunki, pracownik nabywa prawo do <strong>urlopu uzupełniającego</strong>, czyli różnicy pomiędzy wyższym a dotychczasowym wymiarem.</p>
							<h3 className="text-xl font-semibold text-slate-900">Czy pracodawca może przyznać więcej urlopu?</h3>
							<p>Tak. Firma może wprowadzić korzystniejszy wymiar urlopu w umowie, regulaminie albo polityce benefitowej. Jest to dobrowolne rozwiązanie korzystniejsze dla pracownika, a nie ustawowy obowiązek.</p>
						</section>

						<div className="mt-12">
							<LeaveEquivalentCalculator />
						</div>

						<section id="planopia-urlopy" className="mt-12 scroll-mt-24 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 md:p-8">
							<h2 className="m-0 text-2xl font-semibold text-slate-900 md:text-3xl">Jak Planopia pomaga zarządzać ustalonym limitem?</h2>
							<p className="mt-4 leading-relaxed text-slate-700">Planopia nie ustala stażu urlopowego na podstawie dokumentów. Gdy firma prawidłowo określi limit pracownika, Administrator lub HR może przypisać go w aplikacji i prowadzić dalszy proces w jednym miejscu.</p>
							<ul className="mb-0 mt-4 space-y-2 pl-5 leading-relaxed text-slate-700">
								<li>pracownik składa wniosek urlopowy online,</li>
								<li>uprawniona osoba rozpatruje wniosek i zachowuje historię decyzji,</li>
								<li>zespół widzi wykorzystanie limitu oraz zaplanowane nieobecności.</li>
							</ul>
							<Link href="/program-do-urlopow" className="blog-annual-leave-cta mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white no-underline shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Zobacz program do urlopów Planopia</Link>
						</section>

						<section id="faq-urlop" className="mt-12 scroll-mt-24" aria-labelledby="faq-heading">
							<h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 md:text-3xl">Najczęściej zadawane pytania</h2>
							<dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
								{faq.map(item => <div key={item.q} className="py-5"><dt className="font-semibold text-slate-900">{item.q}</dt><dd className="mt-2 leading-relaxed text-slate-700">{item.a}</dd></div>)}
							</dl>
						</section>

						<BlogArticleCredibility
							sources={[
								{ label: 'Państwowa Inspekcja Pracy: urlopy pracownicze', href: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/urlopy-pracownicze?tmpl=pdf%3Ftmpl%3Dpdf%3Ftmpl%3Dpdf' },
								{ label: 'PIP: działalność i zlecenie a staż pracowniczy', href: 'https://www.pip.gov.pl/aktualnosci/prowadzenie-dzialalnosci-i-praca-na-zlecenie-zwieksza-staz-pracowniczy' },
								{ label: 'PIP: zasady dla pokrywających się okresów', href: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/jak-ustalic-staz-pracy-gdy-pracownik-przedstawi-dwa-okresy-aktywnosci-zawodowej-ktore-czesciowo-sie-pokrywaja-np-umowe-zlecenia-i-umowe-o-prace?tmpl=pdf' },
								{ label: 'MRPiPS: staż pracy — pytania i odpowiedzi', href: 'https://www.gov.pl/web/rodzina/staz-pracy-qa' },
							]}
							verifiedOn="2 sierpnia 2026 r."
							author="Michał Lipka"
							authorHref="/o-autorze"
						/>

						<BlogRelatedLinks slug="urlop-wypoczynkowy-ile-dni" className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
