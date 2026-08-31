'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import { planOfferingCopy } from '@/data/planOfferingCopy'
function ENBlog() {
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
						"@type": "Blog",
						"name": "Planopia Blog",
						"url": "https://planopia.pl/en/blog",
						"description": `The official Planopia blog — time tracking, leave management, and HR productivity.${planOfferingCopy.en.blogJsonLdExtra}`,
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						}
					})
				}}
			/>

			{/* HEADER + MENU */}
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
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
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
						<Link href="/blog" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Wersja polska" className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

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
					href: '/blog',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 pt-6 pb-3 md:py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-0 md:mb-6 blogh1 text-center mt-2 md:mt-4">Blog</h1>
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 pt-5 pb-12 md:py-16 bg-white">
				<div className="max-w-7xl mx-auto">
					<div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						

						{/* Article — Planopia AI Assistant */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-indigo-100/90">
							<img
								src="/img/aibloga.webp"
								alt="Planopia AI Assistant — time tracking, leave, tasks, and schedules"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Planopia AI Assistant: time tracking, leave, tasks, and schedules in one system
							</h3>
							<p className="text-gray-600 flex-1">
								How to connect time tracking, leave, Kanban-style tasks, and schedules with intelligent summaries — team and HR automation without juggling five separate tools.
							</p>
							<Link
								href="/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Article — construction time tracking */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-amber-100/80">
							<img
								src="/img/budowa1.webp"
								alt="Time tracking on construction sites — building companies"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								How to track time on construction sites (simply, without spreadsheets)
							</h3>
							<p className="text-gray-600 flex-1">
								A practical guide for building companies: one system instead of paper and spreadsheets, overtime and crew schedules — plus Kanban boards and chat so the team gets an everyday tool, not “only leave management.”
							</p>
							<Link
								href="/en/blog/time-tracking-on-construction-sites"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Article card — video tutorials */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-blue-100/80">
							<div className="relative rounded-md mb-4 h-48 overflow-hidden bg-slate-900">
								<img
									src="/img/video.webp"
									alt="Planopia video tutorials from the app"
									className="h-full w-full object-cover opacity-90"
								/>
								<span className="boxvideo absolute bottom-3 left-3 inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
									Video
								</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Video tutorials — how to use Planopia
							</h3>
							<p className="text-gray-600 flex-1">
								Short screen recordings from the app — for example, how to manually add work hours in the time log. Watch on your phone or desktop; we will keep adding new clips over time.
							</p>
							<Link
								href="/en/how-to-use"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Article card - How to Install Planopia as PWA */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/pwas.webp"
								alt="Installing Planopia as a PWA on phone and desktop"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							How to Install Planopia as a PWA App? Step-by-Step Guide
							</h3>
							<p className="text-gray-600 flex-1">
							Learn how to add Planopia as a PWA on iPhone, iPad, Android phones, and in desktop browsers such as Chrome. A short guide to installing the time tracking and leave management app on your home screen, app menu, or desktop.
							</p>
							<Link
								href="/en/blog/how-to-install-planopia-as-pwa"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Article card - Comprehensive Company Management App */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/kompleksowos.webp"
								alt="Comprehensive company management app — Planopia"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Comprehensive Company Management App – Everything in One Place
							</h3>
							<p className="text-gray-600 flex-1">
							Planopia is not just a time tracking and leave management app. It's a comprehensive tool combining time tracking, leave management, work schedules, team chats, task boards, and flexible role configuration. Everything in one place.
							</p>
							<Link
								href="/en/blog/comprehensive-company-management-app"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Article — annual leave Excel/PDF vs app */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-emerald-100/90">
							<img
								src="/img/roczny-plan.webp"
								alt="Annual leave calendar and leave requests in Planopia"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Annual leave plan: Excel, PDF, and an app — what to pick in 2026?
							</h3>
							<p className="text-gray-600 flex-1">
								Spreadsheets and PDF exports for a snapshot view; a checklist for leave request software; how overtime and time tracking connect to planning — and when to move from Excel to approvals in one system.
							</p>
							<Link
								href="/en/blog/annual-leave-plan-excel-pdf-app"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						{/* Karta wpisu 3 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/planowanie urlopows.webp"
								alt="Employee leave planning — calendar and tools"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Employee leave planning – best tools and practices
							</h3>
							<p className="text-gray-600 flex-1">
							Leave planning is one of the most common HR challenges. Traditional methods—paper forms or spreadsheets—lead to chaos and errors. Learn how an online leave calendar and leave management software like Planopia make absence management simple, transparent, and fast.
							</p>
							<Link
								href="/en/blog/leave-planning"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/ewidencjas.webp"
								alt="Online time tracking for teams"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Online Time Tracking – modern solutions for companies
							</h3>
							<p className="text-gray-600 flex-1">
							Accurate time tracking is a requirement for every business. Traditional methods like paper timesheets or Excel spreadsheets are often inefficient and error-prone. That's why more and more companies choose online time tracking appsthat automate and organize the process.
							</p>
							<Link
								href="/en/blog/time-tracking-online"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/ewidencjas.webp"
								alt="Free time tracking app — Planopia"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Free Time Tracking App for Work Hours and Leave Management
							</h3>
							<p className="text-gray-600 flex-1">
							30-day full trial, then free time tracking for up to 5 active accounts — or paid plans with every module.
							</p>
							<Link
								href="/en/blog/free-time-tracking-app"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/ewidencjas.webp"
								alt="Electronic time tracking in the company"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Electronic Time Tracking - Complete Guide
							</h3>
							<p className="text-gray-600 flex-1">
							Learn everything about electronic time tracking. Complete guide to choosing the best time tracking software for your company.
							</p>
							<Link
								href="/en/blog/electronic-time-tracking"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/planowanie urlopows.webp"
								alt="Leave management — team calendar"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Leave Management in a Company - Complete Guide
							</h3>
							<p className="text-gray-600 flex-1">
							Learn how to effectively manage leave in your company, minimizing errors and increasing employee satisfaction.
							</p>
							<Link
								href="/en/blog/leave-management"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>
					</div>
				</div>
			</section>

		</>
	)
}

export default ENBlog
