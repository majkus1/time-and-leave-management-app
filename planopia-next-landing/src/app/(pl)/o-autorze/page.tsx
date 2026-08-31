import Image from 'next/image'
import Link from 'next/link'
import BlogHeader from '@/components/BlogHeader'
import { LANDING_SELLER } from '@/data/landingFooterData'

const URL = 'https://planopia.pl/o-autorze'

/**
 * Strona autora pod E-E-A-T. Google ocenia wiarygodność treści prawnych między innymi
 * po tym, czy da się ustalić, kto je napisał — anonimowa organizacja jest słabszym
 * sygnałem niż osoba, którą można sprawdzić.
 */
const personSchema = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: 'Michał Lipka',
	url: URL,
	image: 'https://planopia.pl/img/1709827103942.webp',
	jobTitle: 'Twórca i deweloper Planopii',
	worksFor: {
		'@type': 'Organization',
		name: 'ML Devworks Michał Lipka',
		url: 'https://ml-devworks.com/',
	},
	sameAs: ['https://planopia.pl', 'https://ml-devworks.com/'],
	knowsAbout: [
		'ewidencja czasu pracy',
		'urlopy pracownicze',
		'grafiki pracy',
		'oprogramowanie dla małych i średnich firm',
	],
}

const zakres = [
	{
		title: 'Skąd biorą się te teksty',
		body: 'Piszę o tym, z czym firmy przychodzą do Planopii: jak rozliczyć nadgodziny, kto zatwierdza wniosek urlopowy, co musi znaleźć się w karcie ewidencji. Punktem wyjścia jest praktyka wdrożeniowa, a nie przegląd tego, co już jest w internecie.',
	},
	{
		title: 'Na czym się opierają',
		body: 'Twierdzenia dotyczące przepisów opieram na tekstach źródłowych — Kodeksie pracy, rozporządzeniach i stanowiskach Państwowej Inspekcji Pracy. Pod każdym takim artykułem znajdziesz sekcję „Źródła urzędowe" z odnośnikami oraz datę, na którą stan prawny został sprawdzony.',
	},
	{
		title: 'Czego tu nie znajdziesz',
		body: 'Nie jestem prawnikiem ani doradcą kadrowym. Te teksty tłumaczą przepisy i pokazują, jak obsłużyć je w praktyce, ale nie zastępują indywidualnej porady prawnej. W sprawach spornych albo nietypowych warto skonsultować się ze specjalistą.',
	},
	{
		title: 'Co robię poza pisaniem',
		body: 'Buduję i rozwijam Planopię — aplikację do ewidencji czasu pracy, urlopów i grafików dla małych i średnich firm. Zajmuję się też wdrożeniami i wsparciem, więc odpowiedzi na pytania z bloga zwykle mam z pierwszej ręki.',
	},
]

export default function OAutorzePage() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
			<BlogHeader lang="pl" enUrl="/en" plUrl="/o-autorze" />
			<main className="bg-white">
				<article className="mx-auto max-w-3xl px-5 py-12 sm:px-6 md:py-16">
					<header className="flex flex-col gap-6 sm:flex-row sm:items-center">
						<Image
							src="/img/1709827103942.webp"
							alt="Michał Lipka — twórca Planopii"
							width={120}
							height={120}
							className="h-28 w-28 shrink-0 rounded-full border-4 border-white object-cover shadow-lg"
							priority
						/>
						<div>
							<h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">Michał Lipka</h1>
							<p className="mt-2 text-lg text-slate-600">
								Twórca Planopii — aplikacji do ewidencji czasu pracy, urlopów i grafików. Autor tekstów na blogu.
							</p>
						</div>
					</header>

					<div className="mt-10 flex flex-col gap-8">
						{zakres.map(sekcja => (
							<section key={sekcja.title}>
								<h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{sekcja.title}</h2>
								<p className="mt-3 leading-relaxed text-slate-700">{sekcja.body}</p>
							</section>
						))}
					</div>

					<section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
						<h2 className="text-xl font-semibold text-slate-900">Kontakt</h2>
						<p className="mt-3 leading-relaxed text-slate-700">
							Masz pytanie do artykułu albo znalazłeś błąd? Napisz — poprawki i uzupełnienia wprowadzam na bieżąco.
						</p>
						<ul className="mt-4 space-y-2 text-slate-700">
							<li>
								<a
									href={`mailto:${LANDING_SELLER.email}`}
									className="font-medium text-emerald-700 underline-offset-2 hover:underline"
								>
									{LANDING_SELLER.email}
								</a>
							</li>
							<li>
								<a
									href={LANDING_SELLER.phoneHref}
									className="font-medium text-emerald-700 underline-offset-2 hover:underline"
								>
									{LANDING_SELLER.phoneLabel}
								</a>
							</li>
							<li>
								<Link href="/kontakt" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
									Formularz kontaktowy →
								</Link>
							</li>
						</ul>
						<p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">
							{LANDING_SELLER.legalName}, {LANDING_SELLER.addressLines.pl.join(', ')} · NIP {LANDING_SELLER.nip}
						</p>
					</section>

					<p className="mt-10 text-slate-700">
						<Link href="/blog" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
							← Wszystkie artykuły na blogu
						</Link>
					</p>
				</article>
			</main>
		</>
	)
}
