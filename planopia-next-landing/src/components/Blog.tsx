'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BlogTopicsNav from './BlogTopicsNav'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import MobileMenu from './MobileMenu'
import {
	industryMobileConfig,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import { BLOG_PILLAR_PL } from '@/data/blogInternalLinks'
import { planOfferingCopy } from '@/data/planOfferingCopy'

type BlogCategory = 'all' | 'time' | 'leave' | 'industries' | 'product'

type BlogArticle = {
	href: string
	title: string
	description: string
	image: string
	imageAlt: string
	category: Exclude<BlogCategory, 'all'>
	featured?: boolean
	badge?: string
}

const categories: { value: BlogCategory; label: string }[] = [
	{ value: 'all', label: 'Wszystkie tematy' },
	{ value: 'time', label: 'Ewidencja czasu pracy' },
	{ value: 'leave', label: 'Urlopy i planowanie' },
	{ value: 'industries', label: 'Branże i zastosowania' },
	{ value: 'product', label: 'Planopia i instrukcje' },
]

const categoryLabels: Record<Exclude<BlogCategory, 'all'>, string> = {
	time: 'Ewidencja czasu',
	leave: 'Urlopy i planowanie',
	industries: 'Branże',
	product: 'Planopia',
}

const articles: BlogArticle[] = [
	{
		href: BLOG_PILLAR_PL.href,
		title: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów',
		description: 'Kompletny przewodnik po ewidencji czasu, urlopach i modelu Planopii: 30 dni pełnej aplikacji, a później darmowa ewidencja lub pakiety płatne.',
		image: '/img/ewidencjas.webp',
		imageAlt: 'Darmowa aplikacja do ewidencji czasu pracy Planopia',
		category: 'time',
		featured: true,
		badge: 'Główny przewodnik',
	},
	{
		href: '/blog/jak-zarzadzac-firma-sprzatajaca',
		title: 'Jak zarządzać firmą sprzątającą? Praktyczny poradnik',
		description: 'Obiekty, grafik ekip, nagłe zastępstwa, zadania, kontrola wykonania oraz rozliczenie godzin — proces organizacji pracy krok po kroku.',
		image: '/img/sprzatajaca.webp',
		imageAlt: 'Program dla firmy sprzątającej — grafik ekip i ewidencja czasu',
		category: 'industries',
		badge: 'Nowy poradnik',
	},
	{
		href: '/blog/jak-ulozyc-grafik-pracy-w-restauracji',
		title: 'Jak ułożyć grafik pracy w restauracji? Praktyczny poradnik',
		description: 'Dostępność zespołu, obsada sali i kuchni, zastępstwa, urlopy oraz porównanie grafiku z przepracowanymi godzinami.',
		image: '/img/gastronomia.webp',
		imageAlt: 'Grafik pracy dla gastronomii i restauracji w Planopii',
		category: 'industries',
	},
	{
		href: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
		title: 'Jak prowadzić ewidencję czasu pracy na budowie?',
		description: 'Praktyczny poradnik dla firm budowlanych: godziny brygad, nadgodziny, grafiki, zadania i komunikacja bez kartek oraz rozproszonych arkuszy.',
		image: '/img/budowa2.webp',
		imageAlt: 'Ewidencja czasu pracy na budowie w firmie budowlanej',
		category: 'industries',
	},
	{
		href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
		title: 'Asystent AI w Planopii: ewidencja, urlopy, zadania i grafik',
		description: 'Jak połączyć codzienne procesy zespołu z inteligentnymi podsumowaniami, raportami i odpowiedziami opartymi na danych firmy.',
		image: '/img/aibloga.webp',
		imageAlt: 'Asystent AI w Planopii — ewidencja, urlopy, zadania i grafik',
		category: 'product',
	},
	{
		href: '/blog/instrukcja-wideo-planopia',
		title: 'Instrukcja wideo — jak korzystać z Planopii',
		description: 'Krótkie nagrania pokazujące pracę z aplikacją, w tym dodawanie godzin w ewidencji na telefonie i komputerze.',
		image: '/img/video.webp',
		imageAlt: 'Instrukcja wideo Planopia — poradniki z aplikacji',
		category: 'product',
		badge: 'Wideo',
	},
	{
		href: '/blog/jak-zainstalowac-planopie-jako-pwa',
		title: 'Jak zainstalować Planopię jako aplikację PWA?',
		description: 'Instrukcja instalacji Planopii na iPhonie, Androidzie i komputerze, aby mieć aplikację zawsze pod ręką.',
		image: '/img/pwas.webp',
		imageAlt: 'Instalacja Planopii jako aplikacji PWA na telefonie i komputerze',
		category: 'product',
	},
	{
		href: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		title: 'Roczny plan urlopów: Excel, PDF i aplikacja — co wybrać?',
		description: 'Ograniczenia arkuszy, checklista programu do wniosków i praktyczny sposób przejścia z Excela do uporządkowanego systemu.',
		image: '/img/roczny-plan.webp',
		imageAlt: 'Roczny plan urlopów — kalendarz i wnioski w Planopii',
		category: 'leave',
	},
	{
		href: '/blog/program-do-urlopow-dla-malej-firmy',
		title: 'Program do urlopów dla małej firmy — jak wybrać?',
		description: 'Najważniejsze funkcje, koszty i kryteria wyboru aplikacji urlopowej dla małego lub rozwijającego się zespołu.',
		image: '/img/plans-urlopnew.webp',
		imageAlt: 'Program do urlopów dla małej firmy — Planopia',
		category: 'leave',
	},
	{
		href: '/blog/dni-wolne-2026',
		title: 'Dni wolne 2026 — kalendarz świąt w Polsce',
		description: 'Wszystkie ustawowe dni wolne, długie weekendy i wskazówki pomagające zaplanować urlopy zespołu w 2026 roku.',
		image: '/img/dni wolnes.webp',
		imageAlt: 'Kalendarz dni wolnych 2026 w Polsce',
		category: 'leave',
	},
	{
		href: '/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
		title: 'Aplikacja do zarządzania firmą — wszystko w jednym miejscu',
		description: 'Ewidencja czasu, urlopy, grafiki, zadania, czaty i role w jednym środowisku zamiast kilku niespójnych narzędzi.',
		image: '/img/kompleksowos.webp',
		imageAlt: 'Kompleksowa aplikacja do zarządzania firmą',
		category: 'product',
	},
	{
		href: '/blog/planowanie-urlopow',
		title: 'Planowanie urlopów pracowników — narzędzia i praktyki',
		description: 'Jak ograniczyć konflikty terminów, chaos papierowych wniosków i błędy w arkuszach dzięki wspólnemu kalendarzowi urlopowemu.',
		image: '/img/planowanie urlopows.webp',
		imageAlt: 'Planowanie urlopów pracowników — narzędzia i praktyki',
		category: 'leave',
	},
	{
		href: '/blog/ewidencja-czasu-pracy-online',
		title: 'Ewidencja czasu pracy online — rozwiązania dla firm',
		description: 'Dlaczego firmy zastępują papierowe listy i Excel elektroniczną ewidencją dostępną z telefonu oraz komputera.',
		image: '/img/ewidencjas.webp',
		imageAlt: 'Ewidencja czasu pracy online — nowoczesne rozwiązania dla firm',
		category: 'time',
	},
	{
		href: '/blog/elektroniczna-ewidencja-czasu-pracy',
		title: 'Elektroniczna ewidencja czasu pracy — przewodnik',
		description: 'Najważniejsze informacje o wyborze programu, prowadzeniu danych i przechodzeniu z tradycyjnej dokumentacji na system online.',
		image: '/img/ewidencjas.webp',
		imageAlt: 'Elektroniczna ewidencja czasu pracy — kompletny przewodnik',
		category: 'time',
	},
	{
		href: '/blog/zarzadzanie-urlopami',
		title: 'Zarządzanie urlopami w firmie — kompletny przewodnik',
		description: 'Jak uporządkować składanie wniosków, decyzje, limity i kalendarz nieobecności bez zbędnej pracy administracyjnej.',
		image: '/img/planowanie urlopows.webp',
		imageAlt: 'Zarządzanie urlopami w firmie — kompletny przewodnik',
		category: 'leave',
	},
]

function Blog() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('all')
	const [filterOpen, setFilterOpen] = useState(false)
	const filterRef = useRef<HTMLDivElement>(null)
	const toggleMenu = () => setMenuOpen(previous => !previous)
	const visibleArticles = selectedCategory === 'all'
		? articles
		: articles.filter(article => article.category === selectedCategory)
	const selectedCategoryLabel = categories.find(category => category.value === selectedCategory)?.label ?? categories[0].label

	useEffect(() => {
		if (!filterOpen) return

		const closeOnOutsideClick = (event: PointerEvent) => {
			if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false)
		}
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setFilterOpen(false)
		}

		document.addEventListener('pointerdown', closeOnOutsideClick)
		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('pointerdown', closeOnOutsideClick)
			document.removeEventListener('keydown', closeOnEscape)
		}
	}, [filterOpen])

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'Blog',
						name: 'Blog Planopii',
						url: 'https://planopia.pl/blog',
						description: `Oficjalny blog Planopii — ewidencja czasu pracy online, urlopy, HR, produktywność.${planOfferingCopy.pl.blogJsonLdExtra}`,
						author: { '@type': 'Person', name: 'Michał Lipka' },
					}),
				}}
			/>

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link href="/" className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: 0 }}>
						<Image src="/img/new-logoplanopia.png" alt="Planopia" width={180} height={54} className="h-auto w-[180px]" priority />
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link href="/#oaplikacji" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">O Aplikacji</Link>
						<Link href="/#asystent-ai" className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">Asystent AI</Link>
						<Link href="/#cennik" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">Cennik</Link>
						<LandingIndustriesDropdown locale="pl" />
						<Link href="/blog" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">Blog</Link>
						<Link href="/#kontakt" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">Kontakt</Link>
						<Link href="https://app.planopia.pl/" className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition">Logowanie</Link>
						<Link href="https://app.planopia.pl/team-registration" className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu">Załóż darmowy zespół</Link>
						<Link href="/en/blog" className="flex items-center languagechoose">
							<Image src="/img/united-kingdom.webp" alt="English version" width={24} height={24} />
						</Link>
					</nav>
					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang="pl"
				menuItems={landingMobileNavItemsPl()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('pl')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{ href: '/en/blog', flagSrc: '/img/united-kingdom.webp', alt: 'English version' }}
			/>

			<main className="bg-white">
				<section
					id="blog-index-hero"
					className="border-b border-blue-100 bg-[#f4f8ff] px-4 py-12 md:py-16"
					style={{ marginTop: '70px' }}
					aria-labelledby="blog-heading">
					<div className="mx-auto max-w-7xl">
						<p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-emerald-700">Centrum wiedzy Planopii</p>
						<h1 id="blog-heading" className="m-0 max-w-3xl text-4xl font-bold leading-tight !text-[#102f5e] md:text-5xl">Blog Planopii</h1>
						<p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700 md:text-xl">
							Praktyczne poradniki o czasie pracy, urlopach, grafikach i organizacji zespołu. Konkretnie, bez zbędnej teorii.
						</p>
					</div>
				</section>

				<section className="px-4 py-10 md:py-14" aria-labelledby="articles-heading">
					<div className="mx-auto max-w-7xl">
						<div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h2 id="articles-heading" className="m-0 text-2xl font-bold !text-[#102f5e] md:text-3xl">Artykuły i poradniki</h2>
								<p className="mt-2 text-sm text-slate-600">{visibleArticles.length} {visibleArticles.length === 1 ? 'materiał' : 'materiałów'}</p>
							</div>
							<div ref={filterRef} className="relative w-full sm:w-72">
								<span id="blog-category-label" className="mb-1.5 block text-sm font-semibold text-slate-700">Temat</span>
								<button
									id="blog-category"
									type="button"
									aria-labelledby="blog-category-label blog-category"
									aria-haspopup="listbox"
									aria-expanded={filterOpen}
									onClick={() => setFilterOpen(open => !open)}
									className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-left text-base text-slate-800 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
									<span className="truncate">{selectedCategoryLabel}</span>
									<span className={`text-xs text-slate-500 transition-transform ${filterOpen ? 'rotate-180' : ''}`} aria-hidden>▾</span>
								</button>
								{filterOpen && (
									<div role="listbox" aria-labelledby="blog-category-label" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
										{categories.map(category => {
											const selected = category.value === selectedCategory
											return (
												<button
													key={category.value}
													type="button"
													role="option"
													aria-selected={selected}
													onClick={() => {
														setSelectedCategory(category.value)
														setFilterOpen(false)
													}}
													className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-base transition ${selected ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'}`}>
													<span>{category.label}</span>
													{selected && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />}
												</button>
											)
										})}
									</div>
								)}
							</div>
						</div>

						<div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
							{visibleArticles.map(article => (
								<article key={article.href} className={`group flex min-h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${article.featured ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}>
									<Link href={article.href} className="relative block aspect-[16/9] overflow-hidden bg-slate-100" aria-label={article.title}>
										<Image src={article.image} alt={article.imageAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
									</Link>
									<div className="flex flex-1 flex-col p-5 md:p-6">
										<div className="mb-3 flex min-h-6 flex-wrap items-center gap-2">
											<span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{categoryLabels[article.category]}</span>
											{article.badge && <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{article.badge}</span>}
										</div>
										<h3 className="m-0 text-xl font-semibold leading-snug !text-[#102f5e]">
											<Link href={article.href} className="text-inherit no-underline hover:text-emerald-700">{article.title}</Link>
										</h3>
										<p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-600">{article.description}</p>
										<Link href={article.href} className="mt-5 inline-flex min-h-10 items-center self-start font-semibold text-blue-700 no-underline transition hover:text-emerald-700 hover:underline underline-offset-4">
											Czytaj artykuł <span className="ml-1.5" aria-hidden>→</span>
										</Link>
									</div>
								</article>
							))}
						</div>

						<div className="mt-16 md:mt-20">
							<BlogTopicsNav />
						</div>
					</div>
				</section>
			</main>
		</>
	)
}

export default Blog
