'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

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
						"description": "Discover Planopia - a free time tracking app for work hours and leave management for teams up to 6 people. Full functionality without any costs.",
						"image": "https://planopia.pl/img/desktopnew.webp"
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
					<nav className="hidden flex space-x-8 navdesktop">
						<Link
							href="/en#aboutapp"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							About App
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
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition"
							onClick={toggleMenu}>
							Blog
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
							Create free team
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
					href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">
								Free Time Tracking App for Work Hours and Leave Management
							</h1>
							<p className="text-xl text-gray-600 text-center max-w-4xl mx-auto mb-8">
								Discover Planopia - a complete, free time tracking app for work hours and leave management. 
								Full functionality for teams up to 6 people without any costs.
							</p>
							<div className="text-center">
								<Link
									href="https://app.planopia.pl/team-registration"
									className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
								>
									Create free team today
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
							Why do you need a free time tracking app?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Time tracking is an obligation for every company, but traditional methods are often inefficient and time-consuming. 
							Excel, paper attendance sheets, or basic HR systems generate errors and consume valuable work hours.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Planopia is a free time tracking app</strong> that solves all these problems. 
							It offers full functionality without hidden fees, time limits, or the need to sign contracts.
						</p>
					</div>

					{/* What is Planopia */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							What is Planopia - free time tracking app?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Planopia is a modern, <strong>free time tracking app for work hours and leave management</strong>, 
							designed for small and medium-sized companies. The app works in a web browser, 
							so it doesn't require software installation on employee computers.
						</p>
						<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
							<p className="text-lg text-blue-800 font-semibold">
								✅ Free time tracking app for teams up to 6 people
							</p>
							<p className="text-blue-700 mt-2">
								No hidden fees, no trial periods, no need to provide credit card information.
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
									<li>• Offline mode</li>
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
										<th className="border border-gray-300 p-4 text-center">Planopia (FREE)</th>
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
							How to start using the free time tracking app?
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center p-6 bg-green-50 rounded-lg">
								<div className="text-4xl font-bold text-green-600 mb-2">1</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Create Team</h3>
								<p className="text-gray-700">
									Click &quot;Create free team&quot; and fill in basic company information.
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
									Is Planopia really free?
								</h3>
								<p className="text-gray-700">
									Yes! Planopia offers full functionality for teams up to 6 people without any fees. 
									No hidden costs, trial periods, or need to provide credit card information.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									How long can I use the free version?
								</h3>
								<p className="text-gray-700">
									No time limits! The free time tracking app Planopia 
									is available forever for teams up to 6 people.
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
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Ready for a free time tracking app?
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							Start managing leave today and streamline planning in your company!
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
						>
							Create free team today
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default ENBlogFour
