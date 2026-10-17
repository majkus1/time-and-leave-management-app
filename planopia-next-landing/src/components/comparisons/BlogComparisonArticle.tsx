import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import BlogRelatedLinks from '../BlogRelatedLinks'

/**
 * Wspólny układ wpisów porównawczych (ewidencja, urlopy). Treść i dane konkurencji żyją w plikach konfiguracji obok —
 * tu tylko wygląd, JSON-LD i spis treści, żeby kolejne porównanie nie było kopią kilkuset linii.
 */

export type ComparisonVendor = { name: string; source: string; cells: Record<string, string> }

export type ComparisonConfig = {
	slug: string
	h1: string
	lead: string
	/** Opis do JSON-LD (BlogPosting) */
	description: string
	published: string
	modified: string
	/** Data sprawdzenia danych konkurencji słownie, np. „17 października 2026 r.” */
	verifiedOn: string
	image: { src: string; width: number; height: number; alt: string }
	breadcrumb: { label: string; anchor: string }
	shortAnswer: ReactNode[]
	tableIntro: ReactNode
	columns: { key: string; label: string }[]
	vendors: ComparisonVendor[]
	example?: { title: string; intro: ReactNode; rows: { name: string; monthly: string; calc: string }[]; note: ReactNode }
	criteria: { title: string; body: string }[]
	choose: ReactNode[]
	weaknesses: ReactNode[]
	cta: { title: string; body: string; primary: { href: string; label: string }; secondary: { href: string; label: string } }
	faq: { q: string; a: string }[]
}

const URL_BASE = 'https://planopia.pl/blog/'

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return (
		<h2 id={id} className="scroll-mt-24 text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
			{children}
		</h2>
	)
}

export default function BlogComparisonArticle({ config: c }: { config: ComparisonConfig }) {
	const url = `${URL_BASE}${c.slug}`
	const imageUrl = `https://planopia.pl${c.image.src}`

	const toc: [string, string][] = [
		['tabela', 'Porównanie w tabeli'],
		...(c.example ? ([['przyklad-kosztow', c.example.title]] as [string, string][]) : []),
		['jak-wybrac', 'Na co patrzeć przy wyborze'],
		['ktory-wybrac', 'Który program do jakiej firmy'],
		['planopia-slabsze-strony', 'Kiedy Planopia nie będzie najlepszym wyborem'],
		['zrodla', 'Źródła i metoda'],
		['faq-porownanie', 'Najczęstsze pytania'],
	]

	const blogPostingSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: c.h1,
		description: c.description,
		image: [imageUrl],
		author: { '@type': 'Person', name: 'Michał Lipka', url: 'https://planopia.pl/o-autorze' },
		publisher: {
			'@type': 'Organization',
			'@id': 'https://planopia.pl/#organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		url,
		datePublished: c.published,
		dateModified: c.modified,
		inLanguage: 'pl-PL',
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://planopia.pl/blog' },
			{ '@type': 'ListItem', position: 2, name: c.breadcrumb.label, item: `https://planopia.pl/blog#${c.breadcrumb.anchor}` },
			{ '@type': 'ListItem', position: 3, name: c.h1, item: url },
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: c.faq.map(item => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a },
		})),
	}

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
								<Link href={`/blog#${c.breadcrumb.anchor}`} className="hover:underline">
									{c.breadcrumb.label}
								</Link>
							</nav>
							<div className="mt-6 grid items-center gap-10 md:grid-cols-2">
								<div>
									<h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{c.h1}</h1>
									<p className="mt-4 text-lg leading-relaxed text-slate-700">{c.lead}</p>
									<div className="mt-5 text-sm text-slate-600">
										<time dateTime={c.modified}>Opublikowano i sprawdzono: {c.verifiedOn}</time>
									</div>
								</div>
								<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
									<Image src={c.image.src} alt={c.image.alt} width={c.image.width} height={c.image.height} className="h-auto w-full" priority />
								</div>
							</div>
						</div>
					</header>

					<div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 md:py-14">
						<section className="rounded-lg border border-amber-200 bg-amber-50/70 p-5">
							<h2 className="m-0 text-lg font-semibold text-slate-900">Kto to napisał</h2>
							<p className="mt-3 leading-relaxed text-slate-700">
								Porównanie przygotował zespół Planopii — Planopia jest jednym z porównywanych programów. Dlatego
								podajemy źródło każdej informacji, wskazujemy sytuacje, w których inny program będzie lepszy, i
								piszemy, gdzie Planopia jest słabsza. Dane sprawdziliśmy {c.verifiedOn}
							</p>
						</section>

						<section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
							<h2 className="m-0 text-lg font-semibold text-slate-900">Odpowiedź w skrócie</h2>
							<ul className="mt-3 space-y-2 leading-relaxed text-slate-700">
								{c.shortAnswer.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
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
							<SectionHeading id="tabela">Porównanie w tabeli</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">{c.tableIntro}</p>
							<div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
								<table className="w-full min-w-[960px] border-collapse text-left text-sm">
									<thead>
										<tr className="border-b border-slate-300 bg-slate-50">
											<th className="p-3 font-semibold text-slate-900">Program</th>
											{c.columns.map(col => (
												<th key={col.key} className="p-3 font-semibold text-slate-900">
													{col.label}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{c.vendors.map(vendor => (
											<tr key={vendor.name} className="border-b border-slate-200 align-top">
												<td className="p-3 font-semibold text-slate-900">{vendor.name}</td>
												{c.columns.map(col => (
													<td key={col.key} className="p-3 leading-relaxed text-slate-700">
														{vendor.cells[col.key] ?? 'nie podano'}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						{c.example ? (
							<section className="mt-12">
								<SectionHeading id="przyklad-kosztow">{c.example.title}</SectionHeading>
								<p className="mt-4 leading-relaxed text-slate-700">{c.example.intro}</p>
								<div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
									<table className="w-full border-collapse text-left text-sm">
										<thead>
											<tr className="border-b border-slate-300 bg-slate-50">
												<th className="p-3 font-semibold text-slate-900">Konfiguracja</th>
												<th className="p-3 font-semibold text-slate-900">Miesięcznie</th>
												<th className="p-3 font-semibold text-slate-900">Jak policzone</th>
											</tr>
										</thead>
										<tbody>
											{c.example.rows.map(row => (
												<tr key={row.name} className="border-b border-slate-200 align-top">
													<td className="p-3 font-semibold text-slate-900">{row.name}</td>
													<td className="p-3 whitespace-nowrap text-emerald-800">{row.monthly}</td>
													<td className="p-3 leading-relaxed text-slate-700">{row.calc}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<p className="mt-4 leading-relaxed text-slate-700">{c.example.note}</p>
							</section>
						) : null}

						<section className="mt-12">
							<SectionHeading id="jak-wybrac">Na co patrzeć przy wyborze</SectionHeading>
							<div className="mt-6 flex flex-col gap-5">
								{c.criteria.map((item, index) => (
									<div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
										<h3 className="text-lg font-semibold text-slate-900">
											<span className="mr-2 text-emerald-700">{index + 1}.</span>
											{item.title}
										</h3>
										<p className="mt-2 leading-relaxed text-slate-700">{item.body}</p>
									</div>
								))}
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="ktory-wybrac">Który program do jakiej firmy</SectionHeading>
							<ul className="mt-6 space-y-4 leading-relaxed text-slate-700">
								{c.choose.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						</section>

						<section className="mt-12">
							<SectionHeading id="planopia-slabsze-strony">Kiedy Planopia nie będzie najlepszym wyborem</SectionHeading>
							<ul className="mt-6 space-y-3 leading-relaxed text-slate-700">
								{c.weaknesses.map((item, i) => (
									<li key={i}>• {item}</li>
								))}
							</ul>
							<div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
								<p className="text-lg font-semibold text-slate-900">{c.cta.title}</p>
								<p className="mt-2 leading-relaxed text-slate-700">{c.cta.body}</p>
								<div className="mt-5 flex flex-wrap gap-3">
									<Link
										href={c.cta.primary.href}
										className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold !text-white no-underline transition hover:bg-emerald-700"
									>
										{c.cta.primary.label}
									</Link>
									<Link
										href={c.cta.secondary.href}
										className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 bg-white px-6 py-3 font-semibold !text-emerald-700 no-underline transition hover:bg-emerald-50"
									>
										{c.cta.secondary.label}
									</Link>
								</div>
							</div>
						</section>

						<section className="mt-12">
							<SectionHeading id="zrodla">Źródła i metoda</SectionHeading>
							<p className="mt-4 leading-relaxed text-slate-700">
								Dane pochodzą wyłącznie z oficjalnych cenników i stron produktów, sprawdzonych {c.verifiedOn} bez
								logowania. Gdy dostawca podaje cenę brutto, oznaczamy to wprost. Ceny i warunki mogą się zmienić —
								przed zakupem sprawdź je u dostawcy. Nieaktualną informację zgłoś na{' '}
								<a href="mailto:biuro@planopia.pl" className="text-emerald-700 hover:underline">
									biuro@planopia.pl
								</a>
								.
							</p>
							<ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
								{c.vendors.map(vendor => (
									<li key={vendor.name}>
										{vendor.name}:{' '}
										{vendor.source.startsWith('https://planopia.pl') ? (
											// Własna strona bez nofollow — to link wewnętrzny
											<Link href={vendor.source.replace('https://planopia.pl', '') || '/'} className="text-emerald-700 hover:underline">
												{vendor.source.replace('https://', '')}
											</Link>
										) : (
											<a href={vendor.source} className="break-all text-emerald-700 hover:underline" rel="nofollow noopener noreferrer" target="_blank">
												{vendor.source.replace('https://', '')}
											</a>
										)}
									</li>
								))}
							</ul>
						</section>

						<section className="mt-12">
							<SectionHeading id="faq-porownanie">Najczęstsze pytania</SectionHeading>
							<div className="mt-6 flex flex-col gap-5">
								{c.faq.map(item => (
									<div key={item.q} className="rounded-lg border border-slate-200 bg-slate-50/70 p-5">
										<h3 className="text-lg font-semibold text-slate-900">{item.q}</h3>
										<p className="mt-2 leading-relaxed text-slate-700">{item.a}</p>
									</div>
								))}
							</div>
						</section>

						<BlogRelatedLinks slug={c.slug} className="mt-12" />
					</div>
				</article>
			</main>
		</>
	)
}
