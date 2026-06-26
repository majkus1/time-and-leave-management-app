import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'
import { blogProgramUrlopowCopy } from '@/data/blogProgramUrlopowCopy'

const PROGRAM_HREF = blogProgramUrlopowCopy.programHref

const CRITERIA = [
	{
		title: 'Wnioski i akceptacje online',
		desc: 'Pracownik składa wniosek z telefonu lub komputera, przełożony zatwierdza jednym kliknięciem — bez maili i papierów.',
	},
	{
		title: 'Wspólny kalendarz nieobecności',
		desc: 'Cały zespół widzi, kto i kiedy jest na urlopie. To koniec nakładających się terminów u kluczowych osób.',
	},
	{
		title: 'Historia i salda urlopowe',
		desc: 'Wnioski, statusy i wykorzystane dni w jednym miejscu — zamiast kolejnych wersji pliku Excel.',
	},
	{
		title: 'Powiadomienia',
		desc: 'Przypomnienia o oczekujących wnioskach ograniczają zapomniane akceptacje i nerwy przed sezonem urlopowym.',
	},
	{
		title: 'Eksport do PDF / XLSX',
		desc: 'Raport „na półkę” albo do kontroli — bez ręcznego przepisywania danych.',
	},
	{
		title: 'Proste wdrożenie i cena dla małej firmy',
		desc: 'Najpierw przetestuj za darmo, potem płać tylko za to, czego realnie używasz — bez długich wdrożeń.',
	},
]

const FAQ = [
	{
		q: 'Czy jest darmowy program do urlopów dla małej firmy?',
		a: (
			<>
				W Planopii przez <strong>30 dni masz pełną aplikację za darmo</strong> (do 5 użytkowników), w tym moduł
				urlopowy: wnioski, kalendarz i akceptacje. Po okresie próbnym możesz zostać na{' '}
				<strong>bezpłatnym planie ewidencji czasu pracy</strong> (do 5 aktywnych kont), a pełny moduł urlopowy
				dostępny jest w pakiecie płatnym. Dzięki temu mała firma testuje wszystko bez ryzyka i płaci dopiero, gdy
				urlopy online faktycznie się przydają.
			</>
		),
	},
	{
		q: 'Ile osób obsłuży program w małej firmie?',
		a: (
			<>
				Gotowe pakiety zaczynają się od zespołów do 15 osób i skalują się do 100+. Mała firma zwykle mieści się w
				najniższym pakiecie — szczegóły i kalkulację znajdziesz na stronie{' '}
				<Link href={PROGRAM_HREF} className="font-medium text-emerald-700 underline-offset-2 hover:underline">
					program do urlopów
				</Link>{' '}
				oraz w <Link href="/#cennik" className="font-medium text-emerald-700 underline-offset-2 hover:underline">cenniku</Link>.
			</>
		),
	},
	{
		q: 'Czy muszę rezygnować z Excela od razu?',
		a: (
			<>
				Nie. Wiele małych firm migruje etapami — najpierw porządkuje{' '}
				<Link
					href="/blog/roczny-plan-urlopow-excel-pdf-aplikacja"
					className="font-medium text-emerald-700 underline-offset-2 hover:underline"
				>
					roczny plan urlopów w Excelu/PDF
				</Link>
				, a potem przenosi wnioski i akceptacje do aplikacji, gdy zespół przyzwyczai się do obiegu online.
			</>
		),
	},
	{
		q: 'Czy Planopia to tylko urlopy?',
		a: <>{blogArticleOfferLine.pl}</>,
	},
]

export default function BlogProgramUrlopowArticle() {
	return (
		<main>
			<article className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-14">
				<BlogRelatedLinks slug={blogProgramUrlopowCopy.slug} position="top" />

				<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">
					Dlaczego mała firma w ogóle potrzebuje programu do urlopów?
				</h2>
				<p className="text-gray-700 mb-8 leading-relaxed">
					Przy kilku osobach urlopy ogarnia się „na słowo" i w Excelu — do czasu. Wystarczy sezon wakacyjny, kilka
					wniosków naraz i nakładające się terminy, by pojawił się chaos: kto zatwierdził, kto pamięta, która wersja
					pliku jest aktualna. <strong>Program do urlopów</strong> porządkuje to raz na zawsze: wnioski idą online,
					kalendarz jest wspólny, a akceptacje i salda są w jednym miejscu.
				</p>

				<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">
					Czy istnieje darmowy program do urlopów?
				</h2>
				<p className="text-gray-700 mb-4 leading-relaxed">
					To jedno z najczęstszych pytań — i warto odpowiedzieć uczciwie. W Planopii przez{' '}
					<strong>30 dni korzystasz z pełnej aplikacji za darmo</strong> (do 5 użytkowników), łącznie z modułem
					urlopowym. Po okresie próbnym możesz <strong>bezpłatnie</strong> prowadzić ewidencję czasu pracy (do 5
					aktywnych kont), a pełny <strong>moduł urlopowy z wnioskami i akceptacjami</strong> działa w pakiecie
					płatnym. Dla małej firmy oznacza to jedno: testujesz wszystko bez ryzyka, a płacisz dopiero, gdy urlopy
					online realnie ułatwiają pracę.
				</p>
				<p className="text-gray-700 mb-8 leading-relaxed">
					Pełne zestawienie funkcji i przykładowy koszt znajdziesz na dedykowanej stronie:{' '}
					<Link href={PROGRAM_HREF} className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						program do urlopów — wnioski i kalendarz online
					</Link>
					.
				</p>

				<h2 className="text-2xl font-semibold text-gray-900 mb-5 scroll-mt-24">
					Jak wybrać program do urlopów — 6 kryteriów
				</h2>
				<div className="grid gap-4 sm:grid-cols-2 mb-10">
					{CRITERIA.map((item, i) => (
						<div key={item.title} className="rounded-xl border border-emerald-100/80 bg-emerald-50/40 p-5">
							<div className="flex items-center gap-3 mb-2">
								<span
									className="blog-leave-checklist-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold"
									aria-hidden
								>
									{i + 1}
								</span>
								<h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
							</div>
							<p className="text-sm text-gray-700 leading-relaxed">{item.desc}</p>
						</div>
					))}
				</div>

				<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">Excel czy dedykowany program?</h2>
				<p className="text-gray-700 mb-8 leading-relaxed">
					Arkusz świetnie sprawdza się na start i do <strong>rocznego planu urlopów</strong>, który chcesz
					wydrukować lub wysłać jako PDF. Gorzej, gdy wiele osób edytuje plik naraz albo trzeba szybko zatwierdzić
					wniosek z telefonu. Jeśli zastanawiasz się, kiedy przejść z arkusza na aplikację, zacznij od przewodnika:{' '}
					<Link
						href="/blog/roczny-plan-urlopow-excel-pdf-aplikacja"
						className="font-medium text-emerald-700 underline-offset-2 hover:underline"
					>
						roczny plan urlopów: Excel, PDF czy aplikacja
					</Link>{' '}
					(znajdziesz tam też darmowy szablon Excel do pobrania).
				</p>

				<h2 className="text-2xl font-semibold text-gray-900 mb-3 scroll-mt-24">
					Ile kosztuje program do urlopów dla małej firmy?
				</h2>
				<p className="text-gray-700 mb-8 leading-relaxed">
					W Planopii płacisz za pakiet dopasowany do wielkości zespołu, a moduł urlopowy włączasz, gdy go potrzebujesz
					— bez wieloletnich umów. Mała firma zwykle mieści się w najniższym pakiecie. Aktualne ceny i kalkulację dla
					Twojego zespołu sprawdzisz w{' '}
					<Link href="/#cennik" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						cenniku
					</Link>{' '}
					oraz na stronie{' '}
					<Link href={PROGRAM_HREF} className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						programu do urlopów
					</Link>
					.
				</p>

				<section
					className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm mb-10"
					aria-labelledby="faq-program-urlopow"
				>
					<h2 id="faq-program-urlopow" className="text-2xl font-semibold text-gray-900 mb-5">
						Najczęstsze pytania
					</h2>
					<dl className="space-y-6">
						{FAQ.map(item => (
							<div key={item.q}>
								<dt className="font-semibold text-gray-900">{item.q}</dt>
								<dd className="mt-1 text-gray-700 leading-relaxed">{item.a}</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/30 p-6 md:p-8 shadow-sm ring-1 ring-emerald-100/50 mb-10">
					<h3 className="text-xl md:text-2xl font-bold text-gray-900 m-0">
						Wypróbuj program do urlopów w swojej firmie
					</h3>
					<p className="mt-2 text-gray-600 leading-relaxed mb-6">
						30 dni pełnej aplikacji za darmo (do 5 osób) — sprawdź wnioski, kalendarz i akceptacje w praktyce.
						Zobacz, jak działa dedykowana strona produktu albo od razu załóż darmowy zespół.
					</p>
					<div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
						<Link
							href={PROGRAM_HREF}
							className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold shadow-md transition hover:bg-emerald-700 white-text-btn"
						>
							Zobacz program do urlopów
						</Link>
						<a
							href="https://app.planopia.pl/team-registration"
							className="inline-flex items-center text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline"
						>
							Załóż darmowy zespół →
						</a>
					</div>
				</section>

				<BlogRelatedLinks slug={blogProgramUrlopowCopy.slug} />
			</article>
		</main>
	)
}
