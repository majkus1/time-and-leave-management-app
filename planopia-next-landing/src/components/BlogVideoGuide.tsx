'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import { industryMobileConfig, MOBILE_INDUSTRY_INSERT_INDEX } from '../data/landingNav'
import { videoGuideLessons } from '../data/videoGuideLessons'

type Locale = 'pl' | 'en'

const UI: Record<
	Locale,
	{
		jsonLdHeadline: string
		jsonLdDescription: string
		pageUrl: string
		heroTitle: string
		heroLead: string
		tocTitle: string
		tocHint: string
		watchVideo: string
		downloadFallback: string
		backToBlog: string
		ctaTitle: string
		ctaLead: string
		ctaTrial: string
		ctaPricing: string
		homeHref: string
		blogHref: string
		menuItems: { href: string; label: string }[]
		loginLabel: string
		registerLabel: string
		langSwitch: { href: string; flagSrc: string; alt: string }
		navAbout: string
		navAi: string
		navPricing: string
		navContact: string
		navBlog: string
	}
> = {
	pl: {
		jsonLdHeadline: 'Instrukcja wideo — jak korzystać z Planopii',
		jsonLdDescription:
			'Filmy krok po kroku: ewidencja czasu pracy, urlopy i funkcje aplikacji Planopia. Wygodnie na telefonie i komputerze.',
		pageUrl: 'https://planopia.pl/blog/instrukcja-wideo-planopia',
		heroTitle: 'Instrukcja wideo — jak korzystać z Planopii',
		heroLead:
			'Poniżej znajdziesz krótkie nagrania z aplikacji. Odtwarzaj je w dowolnej kolejności — na telefonie możesz rozwinąć film na pełny ekran. Lista będzie rosła wraz z nowymi materiałami.',
		tocTitle: 'Spis nagrań',
		tocHint: 'Skocz do wybranego filmu',
		watchVideo: 'Obejrzyj nagranie',
		downloadFallback: 'Pobierz plik wideo',
		backToBlog: 'Wróć do bloga',
		ctaTitle: 'Wypróbuj Planopię',
		ctaLead:
			'30 dni pełnej aplikacji (do 5 osób); potem darmowa ewidencja czasu pracy do 5 aktywnych kont lub pakiety z urlopami i zespołem.',
		ctaTrial: 'Załóż darmowy zespół',
		ctaPricing: 'Zobacz cennik',
		homeHref: '/',
		blogHref: '/blog',
		menuItems: [
			{ href: '/#oaplikacji', label: 'O Aplikacji' },
			{ href: '/#asystent-ai', label: 'Asystent AI' },
			{ href: '/#cennik', label: 'Cennik' },
			{ href: '/blog', label: 'Blog' },
			{ href: '/#kontakt', label: 'Kontakt' },
		],
		loginLabel: 'Logowanie',
		registerLabel: 'Załóż darmowy zespół',
		langSwitch: {
			href: '/en/blog/video-tutorials',
			flagSrc: '/img/united-kingdom.webp',
			alt: 'English version',
		},
		navAbout: 'O Aplikacji',
		navAi: 'Asystent AI',
		navPricing: 'Cennik',
		navContact: 'Kontakt',
		navBlog: 'Blog',
	},
	en: {
		jsonLdHeadline: 'Video tutorials — how to use Planopia',
		jsonLdDescription:
			'Step-by-step videos: time tracking, leave management, and Planopia features. Works on phone and desktop.',
		pageUrl: 'https://planopia.pl/en/blog/video-tutorials',
		heroTitle: 'Video tutorials — how to use Planopia',
		heroLead:
			'Short screen recordings from the app. Watch in any order — on mobile, use full screen for a clearer view. We will add more videos over time.',
		tocTitle: 'Videos',
		tocHint: 'Jump to a clip',
		watchVideo: 'Watch the video',
		downloadFallback: 'Download video file',
		backToBlog: 'Back to blog',
		ctaTitle: 'Try Planopia',
		ctaLead:
			'30-day full trial (up to 5 users); then free time tracking for up to 5 active accounts, or paid plans with leave and team features.',
		ctaTrial: 'Create your free team',
		ctaPricing: 'See pricing',
		homeHref: '/en',
		blogHref: '/en/blog',
		menuItems: [
			{ href: '/en#aboutapp', label: 'About the App' },
			{ href: '/en#ai-assistant', label: 'AI Assistant' },
			{ href: '/en#prices', label: 'Pricing' },
			{ href: '/en/blog', label: 'Blog' },
			{ href: '/en#contact', label: 'Contact' },
		],
		loginLabel: 'Login',
		registerLabel: 'Create your free team',
		langSwitch: {
			href: '/blog/instrukcja-wideo-planopia',
			flagSrc: '/img/poland.webp',
			alt: 'Polish version',
		},
		navAbout: 'About the App',
		navAi: 'AI Assistant',
		navPricing: 'Pricing',
		navContact: 'Contact',
		navBlog: 'Blog',
	},
}

function guideSectionAnchor(id: string) {
	return `film-${id}`
}

export default function BlogVideoGuide({ locale }: { locale: Locale }) {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen((p) => !p)
	const t = UI[locale]
	const pricingHash = locale === 'pl' ? '/#cennik' : '/en#prices'

	const lessons = videoGuideLessons.map((lesson, index) => ({
		...lesson,
		number: index + 1,
		title: locale === 'pl' ? lesson.titlePl : lesson.titleEn,
		description: locale === 'pl' ? lesson.descriptionPl : lesson.descriptionEn,
		anchor: guideSectionAnchor(lesson.id),
	}))

	const videoObjects = lessons.map((lesson) => ({
		'@type': 'VideoObject',
		name: lesson.title,
		description: lesson.description,
		contentUrl: `https://planopia.pl${lesson.videoSrc}`,
		embedUrl: `https://planopia.pl${lesson.videoSrc}`,
	}))

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'BlogPosting',
						headline: t.jsonLdHeadline,
						description: t.jsonLdDescription,
						image: 'https://planopia.pl/img/worktimeblog.webp',
						author: {
							'@type': 'Person',
							name: 'Michał Lipka',
						},
						publisher: {
							'@type': 'Organization',
							name: 'Planopia',
							logo: {
								'@type': 'ImageObject',
								url: 'https://planopia.pl/img/planopiaheader.webp',
							},
						},
						url: t.pageUrl,
						datePublished: '2026-03-24',
						video: videoObjects,
					}),
				}}
			/>

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div
					className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent"
					style={{ maxWidth: '1350px' }}>
					<Link
						href={t.homeHref}
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="Planopia logo" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href={t.menuItems[0].href}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{t.navAbout}
						</Link>
						<Link
							href={t.menuItems[1].href}
							className="cursor-pointer text-gray-700 font-medium hover:text-indigo-600 transition">
							{t.navAi}
						</Link>
						<Link
							href={t.menuItems[2].href}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{t.navPricing}
						</Link>
						<LandingIndustriesDropdown locale={locale === 'pl' ? 'pl' : 'en'} />
						<Link
							href={t.blogHref}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{t.navBlog}
						</Link>
						<Link
							href={t.menuItems[4].href}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{t.navContact}
						</Link>
						<Link
							href="https://app.planopia.pl/"
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition">
							{t.loginLabel}
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu">
							{t.registerLabel}
						</Link>
						<Link href={t.langSwitch.href} className="flex items-center languagechoose">
							<img src={t.langSwitch.flagSrc} alt={t.langSwitch.alt} className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang={locale}
				menuItems={t.menuItems}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig(locale === 'pl' ? 'pl' : 'en')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={t.langSwitch}
			/>

			<section
				className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100/60"
				id="blog-hero"
				style={{ marginTop: '70px' }}>
				<div className="max-w-7xl mx-auto">
					<div className="max-w-3xl">
						<p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">
							{locale === 'pl' ? 'Materiały wideo' : 'Video'}
						</p>
						<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{t.heroTitle}</h1>
						<p className="text-gray-700 text-base sm:text-lg leading-relaxed">{t.heroLead}</p>
					</div>
				</div>
			</section>

			<div className="bg-slate-50 min-h-[50vh]">
				<div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
					<div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-14">
						{/* TOC — mobile: collapsible; desktop: sticky sidebar */}
						<aside className="lg:w-64 xl:w-72 shrink-0 mb-8 lg:mb-0">
							<div className="lg:sticky lg:top-24 space-y-3">
								{/* Mobile / tablet: zwijany spis */}
								<details className="group lg:hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
									<summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-900 flex items-center justify-between gap-2">
										<span>{t.tocTitle}</span>
										<span
											className="text-blue-600 text-sm font-medium transition-transform group-open:rotate-180"
											aria-hidden>
											▼
										</span>
									</summary>
									<div className="px-2 pb-3 pt-0 border-t border-gray-100">
										<nav aria-label={t.tocTitle} className="flex flex-col gap-1 pt-2">
											{lessons.map((lesson) => (
												<a
													key={lesson.id}
													href={`#${lesson.anchor}`}
													className="text-left text-sm px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors">
													<span className="font-semibold text-blue-600 tabular-nums mr-2">
														{lesson.number}.
													</span>
													{lesson.title}
												</a>
											))}
										</nav>
									</div>
								</details>
								{/* Desktop: zawsze widoczny, przyklejony */}
								<div className="hidden lg:block rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">{t.tocHint}</p>
									<nav aria-label={t.tocTitle} className="flex flex-col gap-1">
										{lessons.map((lesson) => (
											<a
												key={`desk-${lesson.id}`}
												href={`#${lesson.anchor}`}
												className="text-left text-sm px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors">
												<span className="font-semibold text-blue-600 tabular-nums mr-2">{lesson.number}.</span>
												{lesson.title}
											</a>
										))}
									</nav>
								</div>
							</div>
						</aside>

						<main className="min-w-0 flex-1 space-y-8 sm:space-y-10">
							{lessons.map((lesson) => (
								<section
									key={lesson.id}
									id={lesson.anchor}
									className="scroll-mt-28"
									aria-labelledby={`heading-${lesson.anchor}`}>
									<div className="bg-white rounded-2xl border border-gray-200/80 shadow-md shadow-gray-200/50 overflow-hidden">
										<div className="p-5 sm:p-6 md:p-8 border-b border-gray-100 bg-gradient-to-br from-white to-slate-50/80">
											<div className="flex flex-col sm:flex-row sm:items-start gap-4">
												<div
													className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white text-lg font-bold shadow-sm"
													aria-hidden="true">
													{lesson.number}
												</div>
												<div className="min-w-0">
													<h2
														id={`heading-${lesson.anchor}`}
														className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
														{lesson.title}
													</h2>
													<p className="mt-2 text-gray-600 text-sm sm:text-base leading-relaxed">
														{lesson.description}
													</p>
												</div>
											</div>
										</div>
										<div className="p-3 sm:p-4 md:p-6 bg-slate-900/95">
											<p className="sr-only">{t.watchVideo}</p>
											{lesson.videoSrcMobile ? (
												<>
													<div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-inner aspect-video md:hidden">
														<video
															className="absolute inset-0 h-full w-full object-contain"
															controls
															playsInline
															preload="metadata"
															aria-label={lesson.title}>
															<source src={lesson.videoSrcMobile} type="video/mp4" />
															<a href={lesson.videoSrcMobile} className="text-white underline p-4 block">
																{t.downloadFallback}
															</a>
														</video>
													</div>
													<div className="relative mx-auto hidden w-full max-w-4xl overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-inner aspect-video md:block">
														<video
															className="absolute inset-0 h-full w-full object-contain"
															controls
															playsInline
															preload="metadata"
															aria-label={lesson.title}>
															<source src={lesson.videoSrc} type="video/mp4" />
															<a href={lesson.videoSrc} className="text-white underline p-4 block">
																{t.downloadFallback}
															</a>
														</video>
													</div>
												</>
											) : (
												<div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-inner aspect-video">
													<video
														className="absolute inset-0 h-full w-full object-contain"
														controls
														playsInline
														preload="metadata"
														aria-label={lesson.title}>
														<source src={lesson.videoSrc} type="video/mp4" />
														<a href={lesson.videoSrc} className="text-white underline p-4 block">
															{t.downloadFallback}
														</a>
													</video>
												</div>
											)}
										</div>
									</div>
								</section>
							))}

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
								<Link
									href={t.blogHref}
									className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition">
									← {t.backToBlog}
								</Link>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8 text-left">
								<h3 className="text-xl font-semibold text-gray-900 mb-2 flex w-full justify-start text-left">
									{t.ctaTitle}
								</h3>
								<p className="text-gray-700 mb-6 text-left">{t.ctaLead}</p>
								<div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-start items-start sm:items-center">
									<Link
										href="https://app.planopia.pl/team-registration"
										className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition whitespace-nowrap w-full sm:w-auto text-center"
										style={{ color: 'white' }}>
										{t.ctaTrial}
									</Link>
									<Link
										href={pricingHash}
										className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap w-full sm:w-auto text-center"
										style={{ color: 'white' }}>
										{t.ctaPricing}
									</Link>
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>

			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="Planopia logo" style={{ maxWidth: '180px' }} />
			</footer>
		</>
	)
}
