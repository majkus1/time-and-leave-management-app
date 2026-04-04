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
import BlogFreeAppHeroVideo from './BlogFreeAppHeroVideo'

function ENBlogFour() {
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
						"headline": "Free Time Tracking App for Work Hours and Leave Management | Planopia",
						"url": "https://planopia.pl/en/blog/free-time-tracking-app",
						"datePublished": "2024-10-18",
						"dateModified": "2026-03-27",
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
						"description": "Planopia: 30-day full trial for teams up to 5 people, no card required to start; then free time tracking for 5 accounts or paid plans with leave, schedules, chat, and AI.",
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
						<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy" className="flex items-center languagechoose">
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
					href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section
				className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-gradient-to-br from-slate-50 via-blue-50/60 to-emerald-50/30 landing-hero-below-fixed-header"
				id="blog-free-app-welcome">
				<div className="max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto w-full">
					<div className="rounded-2xl md:rounded-3xl border border-blue-100/80 bg-white shadow-md md:shadow-lg px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 text-left md:text-center ring-1 ring-slate-200/60">
						<h1 className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 blogh1 leading-[1.2] tracking-tight max-w-5xl md:mx-auto">
							Free time tracking app — full product for 30 days
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl md:max-w-4xl mx-0 md:mx-auto mb-6 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
							30 days full access for teams of up to 5 people —{' '}
							<strong className="font-semibold text-gray-800">no credit card required to get started</strong>.
							{' '}
							Then <strong className="font-semibold text-gray-800">free time tracking</strong> (5 accounts) or paid plans.{' '}
							<Link href="/en#prices" className="text-blue-600 font-medium hover:underline whitespace-nowrap">
								See pricing
							</Link>
							.
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition text-base sm:text-lg white-text-btn">
							Create your free team today
						</Link>
					</div>
					<BlogFreeAppHeroVideo locale="en" />
				</div>
			</section>

			{/* MAIN CONTENT */}
			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					
					{/* Introduction */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Why choose a time tracking app with a free trial?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Time tracking is an obligation for every company, but traditional methods are often inefficient and time-consuming. 
							Excel, paper attendance sheets, or basic HR systems generate errors and consume valuable work hours.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Planopia</strong> solves these problems with a clear model:{' '}
							<strong>30 days</strong> full product for up to 5 users, then <strong>free time tracking</strong> for up to 5 active accounts or paid plans.
						</p>
					</div>

					{/* What is Planopia */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							What is Planopia?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Planopia is a modern <strong>time tracking and leave management app</strong>,
							designed for small and medium-sized companies. It runs in a web browser —
							no software installation on employee computers.
						</p>
						<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
							<p className="text-lg text-blue-800 font-semibold">
								✅ 30 days full product — then free time tracking for up to 5 active accounts
							</p>
							<p className="text-blue-700 mt-2">
									No credit card during the trial. After 30 days, free time tracking or a paid plan on the{' '}
								<Link href="/en#prices" className="underline font-medium">pricing page</Link>.
							</p>
						</div>
					</div>

					{/* Features */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Free time tracking app features
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Work Hours Tracking</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Real-time work hours registration</li>
									<li>• Automatic overtime calculations</li>
									<li>• Work calendar with visualization</li>
									<li>• Data export to PDF and Excel</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Leave Management</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Online leave requests</li>
									<li>• Supervisor approval system</li>
									<li>• Team leave calendar</li>
									<li>• Email notifications</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Accessibility</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• PWA (Progressive Web App)</li>
									<li>• Works on all devices</li>
									<li>• Real-time synchronization</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Security</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• SSL encrypted connections</li>
									<li>• Secure login</li>
									<li>• Regular backups</li>
									<li>• GDPR compliance</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Comparison */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Why Planopia is the best free time tracking app?
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse border border-gray-300">
								<thead>
									<tr className="bg-gray-100">
										<th className="border border-gray-300 p-4 text-left">Feature</th>
										<th className="border border-gray-300 p-4 text-center">Planopia (trial + free tier)</th>
										<th className="border border-gray-300 p-4 text-center">Competition</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Work Hours Tracking</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Full functionality</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Limited</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Leave Management</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Complete system</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Missing or paid</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">PDF Reports</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Unlimited</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Limited</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Technical Support</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Email + chat</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Paid only</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Updates</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Regular</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Rare</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* How to start */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							How to get started with Planopia (30-day trial)?
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center p-6 bg-green-50 rounded-lg">
								<div className="text-4xl font-bold text-green-600 mb-2">1</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Create your free team</h3>
								<p className="text-gray-700">
									Click &quot;Create your free team&quot; and fill in basic company information.
								</p>
							</div>
							<div className="text-center p-6 bg-blue-50 rounded-lg">
								<div className="text-4xl font-bold text-blue-600 mb-2">2</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Add Employees</h3>
								<p className="text-gray-700">
									Invite team members and assign them appropriate permissions.
								</p>
							</div>
							<div className="text-center p-6 bg-purple-50 rounded-lg">
								<div className="text-4xl font-bold text-purple-600 mb-2">3</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Start Working</h3>
								<p className="text-gray-700">
									Begin time tracking and leave management today!
								</p>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Frequently asked questions about free time tracking app
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Is there a free trial?
								</h3>
								<p className="text-gray-700">
									Yes. You get <strong>30 days</strong> with full features for up to <strong>5 users</strong> (AI Assistant limits apply).
									No credit card required. After the trial, you can keep free time tracking (up to 5 active accounts) or subscribe for full modules.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									How long does the trial last?
								</h3>
								<p className="text-gray-700">
									<strong>30 days</strong> — full access for up to 5 users. Then free time tracking for up to 5 active accounts, or a paid plan with every module.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Is my data secure?
								</h3>
								<p className="text-gray-700">
									Absolutely! All data is encrypted, stored on secure servers 
									and regularly backed up. The app is GDPR compliant.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Can I export my data?
								</h3>
								<p className="text-gray-700">
									Yes! You can export all data to PDF and Excel formats without limitations. 
									Your data always remains yours.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-5 sm:p-8 rounded-2xl shadow-sm">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug">
							Ready for a free time tracking app?
						</h2>
						<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
							Start managing leave today and streamline planning in your company!
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn">
							Create your free team today
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
		</>
	)
}

export default ENBlogFour
