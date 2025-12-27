'use client'

import { useState } from 'react'
import Link from 'next/link'

function ENBlogSix() {
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
						"headline": "Leave Management in a Company - Complete Guide | Planopia",
						"url": "https://planopia.pl/en/blog/leave-management",
						"datePublished": "2024-10-25",
						"dateModified": "2024-10-25",
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
						"description": "Complete guide to leave management in a company. Learn how to effectively plan, track, and approve leave requests. Planopia - free leave management software.",
						"image": "https://planopia.pl/img/desktop.webp"
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
							Create free team
						</Link>
						<Link href="/blog/zarzadzanie-urlopami" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
						</Link>
					</nav>
					<button
						className="lg:hidden text-gray-700 text-3xl focus:outline-none"
						onClick={toggleMenu}
						style={{ fontSize: '36px' }}>
						{menuOpen ? '✕' : '☰'}
					</button>
				</div>
				{menuOpen && (
					<div
						className="navmobile lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 flex flex-col items-start">
						<Link
							href="/en#aboutapp"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							About App
						</Link>
						<Link
							href="/en#prices"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Pricing
						</Link>
						<Link
							href="/en#contact"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Contact
						</Link>
						<Link
							href="/en/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="https://app.planopia.pl"
							onClick={toggleMenu}
							className="w-full text-center bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded mb-4 hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Login
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="ctamenu w-full text-center bg-green-600 text-white font-semibold py-2 px-4 rounded mb-4 shadow hover:bg-green-700 transition"
						>
							Create free team
						</Link>
						<Link href="/blog/zarzadzanie-urlopami" className="flex items-center languagechoose" style={{ marginTop: '15px' }}>
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
						</Link>
					</div>
				)}
			</header>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">
								Leave Management in a Company - Complete Guide
							</h1>
							<p className="text-xl text-gray-600 text-center max-w-4xl mx-auto mb-8">
								Learn how to effectively manage leave in your company, minimizing errors and increasing employee satisfaction.
							</p>
							<div className="text-center">
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
							What is Leave Management in a Company?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Leave management is the process of planning, tracking, and controlling employee absences in a company. 
							It includes not only vacation leave, but also other types of absences such as personal leave, 
							sick leave, parental leave, or unpaid leave.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Effective leave management</strong> is crucial for maintaining work continuity, 
							complying with labor law regulations, and ensuring employee satisfaction.
						</p>
					</div>

					{/* Why important */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Why is Leave Management So Important?
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏢 Work Continuity</h3>
								<p className="text-gray-700">
									Proper leave planning prevents situations where key employees are absent simultaneously, 
									which could disrupt company operations.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚖️ Legal Compliance</h3>
								<p className="text-gray-700">
									Labor law clearly defines leave granting rules. Improper management can result in 
									financial penalties and legal problems.
								</p>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">😊 Employee Satisfaction</h3>
								<p className="text-gray-700">
									Employees appreciate transparent leave policies. Easy access to information and simple 
									request processes increase their satisfaction.
								</p>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Cost Control</h3>
								<p className="text-gray-700">
									Effective leave management allows better control of labor costs, planning replacements 
									and avoiding unplanned overtime.
								</p>
							</div>
						</div>
					</div>

					{/* Traditional methods problems */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Problems with Traditional Leave Management Methods
						</h2>
						<div className="space-y-6">
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Excel Spreadsheets</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Easy to make errors when manually entering data</li>
									<li>• Lack of currency - information quickly becomes outdated</li>
									<li>• Difficult access for employees</li>
									<li>• No version control and backups</li>
								</ul>
							</div>
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Paper Requests</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Time-consuming process of submitting and approving</li>
									<li>• Risk of losing documents</li>
									<li>• Difficulties in archiving and searching</li>
									<li>• No possibility of remote work</li>
								</ul>
							</div>
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Wall Calendars</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Limited availability - only in the office</li>
									<li>• No automatic calculations</li>
									<li>• Difficulties in managing larger teams</li>
									<li>• No integration with other systems</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Modern solutions */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Modern Solutions: Leave Management Software
						</h2>
						<div className="space-y-6">
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Process Automation</h3>
								<p className="text-gray-700">
									Leave management software automates calculating entitled leave, submitting and approving requests, 
									as well as updating balances. This saves time for both employees and HR departments.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Data Centralization</h3>
								<p className="text-gray-700">
									All leave information is stored in one place, accessible to authorized persons 
									at any time and from anywhere.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Transparency and Accessibility</h3>
								<p className="text-gray-700">
									Employees can easily check their leave balance, submit requests and track their status. 
									Managers have full insight into team absence schedules.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Legal Compliance</h3>
								<p className="text-gray-700">
									Good systems comply with applicable labor law regulations, minimizing the risk of errors and penalties.
								</p>
							</div>
						</div>
					</div>

					{/* Planopia section */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Planopia - The Best Leave Management Software
						</h2>
						<div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Why Planopia?</h3>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Full Functionality</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Automatic leave calculation</li>
										<li>• Easy online request submission</li>
										<li>• Approval process with notifications</li>
										<li>• Absence calendar</li>
									</ul>
								</div>
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">💰 Free for Small Companies</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Up to 4 users free</li>
										<li>• Full functionality</li>
										<li>• No hidden costs</li>
										<li>• Technical support</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Types of leave */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Types of Leave Supported by Planopia
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Vacation Leave</h3>
								<p className="text-gray-700">
									Automatic calculation of entitled leave based on work experience, 
									with the ability to carry over unused days to the next year.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Personal Leave</h3>
								<p className="text-gray-700">
									Quick submission of personal leave requests with automatic approval 
									according to company policies.
								</p>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏥 Sick Leave</h3>
								<p className="text-gray-700">
									Tracking of medical certificates with automatic calculation 
									and integration with social security systems.
								</p>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">👶 Childcare Leave</h3>
								<p className="text-gray-700">
									Support for leave related to childcare, including parental leave, 
									care leave, and childcare leave.
								</p>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Frequently Asked Questions About Leave Management
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									How Long Does Leave Management System Implementation Take?
								</h3>
								<p className="text-gray-700">
									Implementing Planopia takes just a few minutes. You can start using the system 
									immediately after team registration and adding employees.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Is Leave Management Software Secure?
								</h3>
								<p className="text-gray-700">
									Planopia offers the highest security standards: data encryption, secure servers, 
									regular backups, and full GDPR compliance.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Can I Export Leave Data?
								</h3>
								<p className="text-gray-700">
									Yes! Planopia allows exporting all leave data to PDF and Excel formats. 
									Your data always remains yours and you can download it at any time.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Does the System Support Different Types of Leave?
								</h3>
								<p className="text-gray-700">
									Yes! Planopia supports all types of leave: vacation, personal, sick, 
									childcare, unpaid, and others according to your company&apos;s needs.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Ready for Effective Leave Management?
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							Join thousands of companies already using Planopia!
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
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default ENBlogSix
