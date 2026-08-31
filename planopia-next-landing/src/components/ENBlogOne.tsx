'use client'

import { useState } from 'react'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import BlogHeroDualCtaCards from './BlogHeroDualCtaCards'

function ENBlogOne() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	return (
		<>
			{/* Schema.org JSON-LD */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BlogPosting",
						"headline": "Online Time Tracking – modern solutions for businesses",
						"description": "Planopia — modern online time tracking: 30-day full trial for up to 5 users, then free time tracking for up to 5 active accounts or paid plans with leave, chat, and AI.",
						"image": "https://planopia.pl/img/desktopnews.webp",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Planopia",
							"logo": {
								"@type": "ImageObject",
								"url": "https://planopia.pl/img/new-logoplanopia.webp"
							}
						},
						"url": "https://planopia.pl/en/blog/time-tracking-online",
						"datePublished": "2025-08-25",
						"dateModified": "2025-08-25"
					})
				}}
			/>

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link
						href="/en"
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href="/en#aboutapp"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							About the App
						</Link>
						<Link
							href="/en#ai-assistant"
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							AI Assistant
						</Link>
						<Link
							href="/en#prices"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Pricing
						</Link>
						<LandingSolutionsDropdown locale="en" />
						<LandingIndustriesDropdown locale="en" />
						<Link
							href="/en/blog"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="/en#contact"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Contact
						</Link>
						<Link
							href="https://app.planopia.pl/"
							onClick={toggleMenu}
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Login
						</Link>

						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							Create your free team
						</Link>
						<Link href="/blog/ewidencja-czasu-pracy-online" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>
			<div className="header-fixed-spacer" aria-hidden="true" />

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang="en"
				menuItems={landingMobileNavItemsEn()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('en')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/blog/ewidencja-czasu-pracy-online',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero">
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="grid xl:grid-cols-2 gap-10 items-center">
						<div>
							<h1 className="text-4xl font-bold mb-6">
								Online Time Tracking – modern solutions for companies
							</h1>
							<p className="text-gray-700 text-lg">
								Accurate <strong>time tracking</strong> is a requirement for every business. 
								Traditional methods like paper timesheets or Excel spreadsheets are often inefficient and error-prone. 
								That's why more and more companies choose <strong>online time tracking apps </strong>  
								 that automate and organize the process.
							</p>
						<BlogHeroDualCtaCards
							locale="en"
							trial={
								<>
									<span className="font-semibold text-emerald-900">30-day free trial</span>
									{' '}
									— full features, up to 5 users
								</>
							}
							enterprise={
								<>
									<span className="font-semibold text-slate-900">For larger companies:</span>{' '}
									unlimited users, more features and flexibility
								</>
							}
							pricingCtaLabel="View pricing"
						/>
					</div>

					<img
						src="/img/desktop-ennews.webp"
						alt="Program do planowania urlopów – Planopia"
						className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
					/>
					<img
						src="/img/mobile-ennews.webp"
						alt="Program do planowania urlopów – Planopia"
						className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
					/>
				</div>
			</div>
		</section>

		<article className="max-w-6xl mx-auto px-6 py-12">
			<h2 className="text-2xl font-semibold mb-3">Why is time tracking so important?</h2>
			<p className="mb-4 text-gray-700">
				Time tracking is not only a legal obligation in many countries but also a crucial 
				tool for better business management. It allows companies to monitor working hours, 
				overtime, absences, and leave, while also simplifying payroll and compliance processes.
			</p>

			<h2 className="text-2xl font-semibold mb-3">Common problems with traditional time tracking</h2>
			<ul className="list-disc pl-6 mb-4 text-gray-700">
				<li>Scattered documents – paper attendance lists are easy to lose.</li>
				<li>Excel mistakes – errors in formulas and manual entries.</li>
				<li>No online access – employees and managers don't see real-time data.</li>
				<li>Difficult reporting – creating summaries and timesheets takes too much time.</li>
			</ul>

			<h2 className="text-2xl font-semibold mb-3">What should a modern time tracking app include?</h2>
			<p className="mb-4 text-gray-700">
				A professional <strong>time tracking software</strong> should be accessible from anywhere, 
				easy to use, and secure. Here are the key features:
			</p>
			<ul className="list-disc pl-6 mb-4 text-gray-700">
				<li>Intuitive work calendar with support for hours and overtime.</li>
				<li>Automatic reports and summaries (export to PDF/XLSX).</li>
				<li>Leave and absence requests with instant notifications.</li>
				<li>Mobile-friendly access (PWA & web app).</li>
				<li>Secure login and encrypted data protection.</li>
			</ul>

			<h2 className="text-2xl font-semibold mb-3">Planopia – modern time tracking and leave management</h2>
			<p className="mb-4 text-gray-700">
				<strong>Planopia</strong> is a simple yet powerful web application that automates 
				employee attendance and leave management. With Planopia, your business gets:
			</p>
			<ul className="list-disc pl-6 mb-4 text-gray-700">
				<li>Full control over working hours and overtime tracking.</li>
				<li>Fast leave requests and approvals.</li>
				<li>Reports and work calendars always available online or in PDF.</li>
				<li><strong>30-day trial</strong> for up to 5 users (full product), then <strong>free time tracking</strong> for up to 5 active accounts or paid plans.</li>
				<li>Scalability and customization options for larger organizations.</li>
			</ul>

			<h2 className="text-2xl font-semibold mb-3">Conclusion</h2>
			<p className="mb-4 text-gray-700">
				Time tracking doesn't have to be complicated. With solutions like 
				<strong> Planopia</strong>, your company saves time, avoids errors, 
				and stays compliant. Whether you run a <strong>small team (trial + free time tracking tier)</strong>
				or manage a large organization – Planopia keeps everything under control.
			</p>

			<aside
				className="blog-end-cta mt-10 md:mt-12 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-sky-50/40 p-6 md:p-8 shadow-sm ring-1 ring-emerald-100/60"
				aria-label="Try Planopia"
			>
				<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700/90 mb-2">
							Start for free
						</p>
						<h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight m-0">
							Try Planopia
						</h3>
						<p className="mt-2 text-sm text-gray-600 leading-relaxed m-0 max-w-xl">
							Create your team — 30-day full trial, then free time tracking for up to 5 active accounts.
						</p>
					</div>
					<div className="shrink-0 w-full sm:w-auto">
						<Link
							href="https://app.planopia.pl/team-registration"
							className="blog-inline-cta-btn inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
						>
							Create your free team
						</Link>
					</div>
				</div>
			</aside>

			<BlogRelatedLinks slug="time-tracking-online" locale="en" className="mt-10" />
		</article>

	</>
)
}

export default ENBlogOne
