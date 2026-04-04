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

function ENBlogFive() {
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
						"@type": "Article",
						"headline": "Electronic Time Tracking - Complete Guide | Planopia",
						"url": "https://planopia.pl/en/blog/electronic-time-tracking",
						"datePublished": "2024-10-18",
						"dateModified": "2024-10-18",
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
						"description": "Electronic time tracking guide: how to choose software for your company. Planopia offers a 30-day full trial, then free time tracking for up to 5 active accounts or paid plans with leave, chat, and AI.",
						"image": "https://planopia.pl/img/desktopnews.webp"
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
						<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }}/>
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href="/en#aboutapp"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							About App
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
							href="https://app.planopia.pl"
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
						<Link href="/blog/elektroniczna-ewidencja-czasu-pracy" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
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
					href: '/blog/elektroniczna-ewidencja-czasu-pracy',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering text-left md:text-center">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 mt-4">
								Electronic Time Tracking - Complete Guide
							</h1>
							<p className="text-xl text-gray-600 max-w-4xl mx-0 md:mx-auto mb-8">
								Learn everything about electronic time tracking. Complete guide to choosing the best time tracking software for your company.
							</p>
							<div>
								<Link
									href="https://app.planopia.pl/team-registration"
									className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
								>
									Try Planopia for free
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* MAIN CONTENT */}
			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					
					{/* Introduction */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							What is Electronic Time Tracking?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Electronic time tracking is a modern system for recording employee work hours using specialized software. 
							It replaces traditional methods like paper timesheets or Excel spreadsheets.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Time tracking software</strong> automatically calculates work hours, overtime, days off and generates reports, 
							which significantly streamlines the work time management process in companies.
						</p>
					</div>

					{/* Benefits */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Benefits of Electronic Time Tracking
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Process Automation</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Automatic work hours calculation</li>
									<li>• Elimination of human errors</li>
									<li>• Faster data processing</li>
									<li>• HR systems integration</li>
								</ul>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">💰 Cost Savings</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Reduction of administrative time</li>
									<li>• Fewer calculation errors</li>
									<li>• Automatic reports</li>
									<li>• Legal compliance</li>
								</ul>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Better Reporting</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Detailed time reports</li>
									<li>• Productivity analysis</li>
									<li>• Project monitoring</li>
									<li>• Export to various formats</li>
								</ul>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Data Security</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Encrypted data storage</li>
									<li>• Access control</li>
									<li>• Regular backups</li>
									<li>• GDPR compliance</li>
								</ul>
							</div>
						</div>
					</div>

					{/* How to choose */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							How to Choose the Best Time Tracking Software?
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">1. Identify Company Needs</h3>
								<p className="text-gray-700">
									Before choosing time tracking software, consider your company&apos;s specifics. 
									Do you need a simple system for a small team, or an advanced solution for a large organization?
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">2. Check Functionality</h3>
								<p className="text-gray-700">
									The best time tracking software should offer: real-time time registration, 
									automatic overtime calculation, HR systems integration, reporting and data export.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">3. Pay Attention to Ease of Use</h3>
								<p className="text-gray-700">
									Electronic time tracking should be intuitive for all employees. 
									Check if the interface is user-friendly and doesn&apos;t require long training.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">4. Check Security and Compliance</h3>
								<p className="text-gray-700">
									Time tracking software must comply with labor law and GDPR. 
									Check if it offers data encryption and regular backups.
								</p>
							</div>
						</div>
					</div>

					{/* Planopia section */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Planopia - The Best Electronic Time Tracking Software
						</h2>
						<div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Why Planopia?</h3>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">✅ Full Functionality</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Electronic time tracking</li>
										<li>• Leave management</li>
										<li>• Automatic reports</li>
										<li>• Calendar integration</li>
									</ul>
								</div>
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">✅ Free for Small Companies</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• 30-day full trial; then free time tracking (5 accounts) or paid plans</li>
										<li>• Full functionality</li>
										<li>• No hidden costs</li>
										<li>• Technical support</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Frequently Asked Questions About Electronic Time Tracking
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Is Electronic Time Tracking Mandatory?
								</h3>
								<p className="text-gray-700">
									Yes, according to labor law, every employer must keep track of their employees&apos; work time. 
									Electronic time tracking is a fully valid method of fulfilling this obligation.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									How Long Does Time Tracking Software Implementation Take?
								</h3>
								<p className="text-gray-700">
									Implementing electronic time tracking in Planopia takes just a few minutes. 
									You can start using the system immediately after team registration.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Is Time Tracking Software Secure?
								</h3>
								<p className="text-gray-700">
									Planopia offers the highest security standards: data encryption, secure servers, 
									regular backups and full GDPR compliance.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Can I Export Data from Time Tracking Software?
								</h3>
								<p className="text-gray-700">
									Yes! Planopia allows exporting all data to PDF and Excel formats. 
									Your data always remains yours and you can download it at any time.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Ready for Electronic Time Tracking?
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							30-day full trial, then free time tracking for up to 5 active accounts — or upgrade for every HR module.
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
						>
							Try Planopia for free
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
		</>
	)
}

export default ENBlogFive
