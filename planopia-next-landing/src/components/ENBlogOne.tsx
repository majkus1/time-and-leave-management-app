'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

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
						"description": "Planopia is a modern online time tracking app for businesses. Track working hours, overtime, and leaves in a simple way. Free version available for up to 6 users.",
						"image": "https://planopia.pl/img/desktopnew.webp",
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
						"url": "https://planopia.pl/en/blog/time-tracking-online",
						"datePublished": "2025-08-25"
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
					<nav className="hidden flex space-x-8 navdesktop">
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
							Create a free team
						</Link>
						<Link href="/blog/ewidencja-czasu-pracy-online" className="flex items-center languagechoose">
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
					href: '/blog/ewidencja-czasu-pracy-online',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero" style={{ marginTop: '70px' }}>
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
						{/* CTA boxy */}
					<div className="mt-6 grid sm:grid-cols-2 gap-4 cta-blog">
							<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
								<p className="text-gray-800 mb-3">
								👉 <strong>Free time tracking app</strong>  
								<br />for teams up to 6 users
								</p>
								<Link
									href="https://app.planopia.pl/team-registration"
									className="inline-block first-cta bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
								>
									Create a free team
								</Link>
							</div>
							<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
								<p className="text-gray-800 mb-3">
								👉 <strong>For larger companies: </strong>  
								unlimited users, more features and flexibility
								</p>
								<Link
									href="/en#prices"
									className="inline-block sec-cta bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
								>
									View pricing
								</Link>
							</div>
						</div>
					</div>

					<img
						src="/img/desktop-ennew.webp"
						alt="Program do planowania urlopów – Planopia"
						className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
					/>
					<img
						src="/img/mobile-ennew.webp"
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
				<li>A <strong>free plan for up to 6 users</strong>.</li>
				<li>Scalability and customization options for larger organizations.</li>
			</ul>

			<h2 className="text-2xl font-semibold mb-3">Conclusion</h2>
			<p className="mb-4 text-gray-700">
				Time tracking doesn't have to be complicated. With solutions like 
				<strong> Planopia</strong>, your company saves time, avoids errors, 
				and stays compliant. Whether you run a <strong>small team up to 6 users</strong> 
				or manage a large organization – Planopia keeps everything under control.
			</p>

			<p className="mt-8 font-medium text-blue-600">
				Try Planopia – <Link href="https://app.planopia.pl/team-registration" className="underline">create your free team today</Link>.
			</p>
		</article>

		{/* FOOTER */}
		<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
			<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
		</footer>
	</>
)
}

export default ENBlogOne
