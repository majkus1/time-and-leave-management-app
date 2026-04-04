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

function ENBlogPWA() {
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
						"headline": "How to Install Planopia as a PWA App? Installation Guide",
						"description": "Install Planopia as a PWA on iPhone, Android, or desktop. Quick access to time tracking; 30-day full trial, then free time tracking for up to 5 active accounts or paid plans with leave and AI.",
						"image": "https://planopia.pl/img/pwa1.png",
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
						"url": "https://planopia.pl/en/blog/how-to-install-planopia-as-pwa",
						"datePublished": "2025-01-15"
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
						<Link href="/blog/jak-zainstalowac-planopie-jako-pwa" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
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
					href: '/blog/jak-zainstalowac-planopie-jako-pwa',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero">
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-4xl font-bold mb-6">
							How to Install Planopia as a PWA App? Installation Guide
						</h1>
						<p className="text-gray-700 text-lg">
							Planopia is a <strong>Progressive Web App (PWA)</strong>, which means you can install it directly on your device - both on desktop and mobile. 
							This gives you quick access to the time tracking and leave management app without having to open a browser every time.
						</p>
					</div>
				</div>
			</section>

			<article className="max-w-4xl mx-auto px-6 py-12">
				<h2 className="text-2xl font-semibold mb-4">Why Install Planopia as a PWA?</h2>
				<p className="mb-4 text-gray-700">
					Installing Planopia as a PWA app on your device (desktop or mobile) brings many benefits:
				</p>
				<ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
					<li><strong>Quick access</strong> – the app is always at hand on your home screen</li>
					<li><strong>Works like a native app</strong> – full-screen interface without browser bars</li>
					<li><strong>Automatic updates</strong> – you always have the latest version without manual updates</li>
					<li><strong>Space saving</strong> – doesn't take up much space in phone memory</li>
					<li><strong>Security</strong> – all data is encrypted and secure</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-4">How to Install Planopia as a PWA?</h2>
				<p className="mb-6 text-gray-700">
					Installing Planopia as a PWA app is very simple and takes just a few seconds. 
					The process differs slightly depending on your device:
				</p>

				<div className="space-y-6 mb-8">
					<div className="bg-gray-50 rounded-xl p-6">
						<h3 className="text-xl font-semibold mb-3 text-blue-600">On iOS Devices (iPhone, iPad)</h3>
						<ol className="list-decimal pl-6 space-y-2 text-gray-700">
							<li>Open Safari browser and go to Planopia login page: <strong>app.planopia.pl</strong></li>
							<li>Tap the menu button (three dots) in the bottom right corner of the screen</li>
							<li>Select the <strong>"Share"</strong> option</li>
							<li>Scroll down and select <strong>"Add to Home Screen"</strong></li>
							<li>Confirm installation by tapping <strong>"Add"</strong></li>
						</ol>
					</div>

					<div className="bg-gray-50 rounded-xl p-6">
						<h3 className="text-xl font-semibold mb-3 text-blue-600">On Android Devices</h3>
						<ol className="list-decimal pl-6 space-y-2 text-gray-700">
							<li>Open Chrome browser and go to Planopia login page: <strong>app.planopia.pl</strong></li>
							<li>Tap the browser menu (three dots) in the top right corner</li>
							<li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
							<li>Confirm installation in the dialog window</li>
						</ol>
					</div>

					<div className="bg-gray-50 rounded-xl p-6">
						<h3 className="text-xl font-semibold mb-3 text-blue-600">On Desktop (Chrome, Edge, Opera)</h3>
						<ol className="list-decimal pl-6 space-y-2 text-gray-700">
							<li>Open Chrome, Edge, or Opera browser and go to Planopia login page: <strong>app.planopia.pl</strong></li>
							<li>In the browser address bar (at the top), you'll see an <strong>"Install"</strong> icon on the right side</li>
							<li>Click on this icon or select <strong>"Install Planopia"</strong> from the browser menu</li>
							<li>Confirm installation in the dialog window</li>
							<li>After installation, the app will appear as a separate window that you can launch from the Start menu (Windows) or Launchpad (macOS)</li>
						</ol>
						<p className="mt-3 text-gray-600 text-sm">
							<strong>Note:</strong> The PWA app on desktop works like a native desktop app - you can pin it to the taskbar, open it in a separate window, and use all features without a browser!
						</p>
					</div>
				</div>

				<h2 className="text-2xl font-semibold mb-4">Done! How to Use Planopia as PWA?</h2>
				<p className="mb-4 text-gray-700">
					After installation, you'll find the Planopia icon on your phone's home screen (or in the Start menu/Launchpad on desktop). 
					Click it to open the app – it will work like a native app!
				</p>
				<ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
					<li><strong>Full-screen interface</strong> – without browser bars</li>
					<li><strong>Fast loading</strong> – the app loads faster than in a browser</li>
					<li><strong>Features by plan</strong> – full modules during trial and on paid plans; after trial without a subscription, focus stays on time tracking</li>
					<li><strong>Automatic updates</strong> – you always have the latest version</li>
				</ul>


				{/* CTA at the end */}
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 text-center max-w-3xl mx-auto">
					<h3 className="text-xl font-semibold mb-3 text-gray-800 justify-center">Start Using Planopia Today!</h3>
					<p className="mb-4 text-gray-700">
						Planopia covers time tracking, and — during the trial and on paid plans — leave, schedules, and team tools. 
						30-day full trial; then free time tracking for up to 5 active accounts or a paid plan.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition whitespace-nowrap"
							style={{ color: 'white' }}
						>
							Create your free team
						</Link>
						<Link
							href="/en/#cennik"
							className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition whitespace-nowrap"
							style={{ color: 'white' }}
						>
							View pricing
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
		</>
	)
}

export default ENBlogPWA
