'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

function ENBlog() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [legalDropdownOpen, setLegalDropdownOpen] = useState(false)
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
						"description": "The official Planopia blog – articles on work time tracking, leave management, and improving HR workflows.",
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
					<nav className="hidden lg:flex space-x-8 navdesktop">
						<Link
							href="/en#aboutapp"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							About the App
						</Link>
						<Link
							href="/en#prices"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Pricing
						</Link>
						<Link
							href="/en#contact"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Contact
						</Link>
						<Link
							href="/en/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Blog
						</Link>
						{/* Dropdown Legal */}
						<div 
							className="relative"
							onMouseEnter={() => setLegalDropdownOpen(true)}
							onMouseLeave={() => setLegalDropdownOpen(false)}
						>
							<button className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition flex items-center">
								Legal
								<svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{legalDropdownOpen && (
								<div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
									<Link
										href="/en/terms"
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										Terms of Service
									</Link>
									<Link
										href="/en/privacy"
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										Privacy Policy
									</Link>
									<Link
										href="/en/dpa"
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										Data Processing Agreement
									</Link>
								</div>
							)}
						</div>
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
							Create a free team
						</Link>
						<Link href="/blog" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="English version" className="w-6 h-6" />
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
				menuItems={[
					{ href: '/en#aboutapp', label: 'About the App' },
					{ href: '/en#prices', label: 'Pricing' },
					{ href: '/en#contact', label: 'Contact' },
					{ href: '/en/blog', label: 'Blog' },
				]}
				legalItems={[
					{ href: '/en/terms', label: 'Terms of Service' },
					{ href: '/en/privacy', label: 'Privacy Policy' },
					{ href: '/en/dpa', label: 'Data Processing Agreement' },
				]}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/blog',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">Blog</h1>
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 py-16 bg-white">
				<div className="max-w-7xl mx-auto">
					<div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						

						{/* Article card - Comprehensive Company Management App */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/worktimeblog.webp"
								alt="Comprehensive Company Management App"
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

						{/* Karta wpisu 3 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/planvacationblog.webp"
								alt="Title img of article 3"
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
								src="/img/worktimeblog.webp"
								alt="Title img of article 4"
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
								src="/img/worktimeblog.webp"
								alt="Title img of article 4"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Free Time Tracking App for Work Hours and Leave Management
							</h3>
							<p className="text-gray-600 flex-1">
							Discover Planopia - a complete, free time tracking app for work hours and leave management. Full functionality for teams up to 6 people without any costs.
							</p>
							<Link
								href="/en/blog/free-time-tracking-app"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Read more
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img
								src="/img/worktimeblog.webp"
								alt="Title img of article 4"
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
								src="/img/planvacationblog.webp"
								alt="Title img of article 3"
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

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default ENBlog
