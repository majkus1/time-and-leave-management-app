'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import BlogHeroDualCtaCards from './BlogHeroDualCtaCards'
import { LANDING_SITE_FOOTER_CLASS } from '@/data/landingSiteFooter'

function ENBlogThree() {
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
						"headline": "Employee Leave Planning – Best Tools and Practices",
						"description": "Leave planning with Planopia: 30-day full trial (up to 5 users), then free time tracking for up to 5 active accounts or paid plans with online leave calendar, approvals, and HR reports.",
						"image": "https://planopia.pl/img/plans-urlopnewen.webp",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Planopia",
							"logo": {
								"@type": "ImageObject",
								"url": "https://planopia.pl/img/planopiaheader.webp"
							}
						},
						"url": "https://planopia.pl/en/blog/leave-planning",
						"datePublished": "2025-08-25"
					})
				}}
			/>

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link href="/en" className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: '0px' }}>
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
						<Link href="/blog/planowanie-urlopow" className="flex items-center languagechoose">
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
					href: '/blog/planowanie-urlopow',
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
								Employee leave planning – best tools and practices
							</h1>
							<p className="text-gray-700 text-lg">
								<strong>Leave planning</strong> is one of the most common challenges for HR departments and team managers.  
								Traditional methods – paper requests or Excel – often lead to chaos and mistakes.  
								Discover how an <strong>online leave calendar</strong> and apps like Planopia  
								make absence management simple and effective.
							</p>

							<BlogHeroDualCtaCards
								locale="en"
								trial={
									<>
										<span className="font-semibold text-emerald-900">Free time tracking after trial</span>
										{' '}
										— 30-day full app; then free time tracking (5 accounts) or paid leave module
									</>
								}
								enterprise={
									<>
										<span className="font-semibold text-slate-900">For larger companies:</span>{' '}
										unlimited users, flexible features.
									</>
								}
								pricingCtaLabel="View pricing"
							/>
						</div>

						<img
							src="/img/plans-urlopnewen.webp"
							alt="Leave planning software – Planopia"
							className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
						/>
						<img
							src="/img/planurlopblogen.webp"
							alt="Leave planning app – Planopia"
							className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
						/>
					</div>
				</div>
			</section>

			<article className="max-w-6xl mx-auto px-6 py-12">
				<h2 className="text-2xl font-semibold mb-3">Why is leave planning critical?</h2>
				<p className="mb-4 text-gray-700">
					Lack of visibility into planned absences causes conflicts, staffing gaps, and lower productivity. 
					A <strong>central online leave calendar</strong> keeps operations running smoothly and prevents multiple key people 
					being off at the same time. Good leave management also supports morale and employee satisfaction.
				</p>

				<h2 className="text-2xl font-semibold mb-3">The most common leave management problems</h2>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>No shared team leave calendar</li>
					<li>Manual requests in Excel or on paper—error-prone and hard to track</li>
					<li>No automatic notifications or approval workflow</li>
					<li>Overlapping vacations of key employees</li>
					<li>No leave history and limited access to reports</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">How to improve leave planning</h2>
				<p className="mb-4 text-gray-700">
					Implementing a modern <strong>leave management system</strong> (PTO tracker) solves most of these issues. With Planopia you can:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Provide a shared, real-time <strong>online leave calendar</strong> for the whole team</li>
					<li>Send automatic notifications to managers and HR</li>
					<li>Use role-based permissions and a simple <strong>approval workflow</strong></li>
					<li>Prevent conflicts thanks to full visibility of team availability</li>
					<li>Export data to <strong>PDF/XLSX</strong> for reporting and compliance</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Planopia – leave planning made simple</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> combines <strong>time tracking</strong> with powerful <strong>leave management</strong>. 
					The 30-day trial works for teams of up to 5 users with full features. Paid plans add scalability, 
					custom branding, and integrations with your existing systems.
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Employees submit <strong>leave requests online</strong></li>
					<li>Managers approve requests with a single click</li>
					<li>Approved leave appears instantly in the team calendar</li>
					<li>Complete leave history and reports in one place</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Conclusion</h2>
				<p className="mb-4 text-gray-700">
					<strong>Online leave planning</strong> brings order, clarity, and less stress to day-to-day operations. 
					With Planopia you'll avoid scheduling conflicts, speed up approvals, 
					and keep full control over team availability. Start with a <strong>30-day full trial (up to 5 users)</strong>, then use <strong>free time tracking</strong> or upgrade for full <strong>leave management</strong>.
				</p>

				<p className="mt-8 font-medium text-blue-600">
					Try Planopia — <Link href="https://app.planopia.pl/team-registration" className="underline">create your team: 30-day trial, then free time tracking or paid leave tools</Link>.
				</p>
			</article>

			{/* FOOTER */}
			<footer className={LANDING_SITE_FOOTER_CLASS}>
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default ENBlogThree
