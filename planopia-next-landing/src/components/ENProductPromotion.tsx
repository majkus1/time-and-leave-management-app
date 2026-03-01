'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { API_URL } from '../config'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { enGB } from 'date-fns/locale/en-GB'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import PackageRequestModal from './PackageRequestModal'
import CustomPackageModal from './CustomPackageModal'

function ENProductPromotion() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false) // Separate state for button (changes immediately)
	const [legalDropdownOpen, setLegalDropdownOpen] = useState(false)
	const [packageModalOpen, setPackageModalOpen] = useState(false)
	const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('monthly')
	const [customPackageModalOpen, setCustomPackageModalOpen] = useState(false)
	const menuCloseHandlerRef = useRef<(() => void) | null>(null)
	
	const toggleMenu = () => {
		setMenuOpen(prev => !prev)
		setButtonState(prev => !prev) // Keep button in sync
	}
	
	// Close menu and sync button state
	const closeMenu = () => {
		setMenuOpen(false)
		setButtonState(false) // Always sync button state when closing menu
	}
	
	const handleMenuClick = () => {
		if (menuOpen && menuCloseHandlerRef.current) {
			// Immediately change button state (X -> hamburger) before animation
			setButtonState(false)
			// Use animated close handler for menu animation
			menuCloseHandlerRef.current()
		} else {
			// Open menu normally
			setMenuOpen(true)
			setButtonState(true) // Keep button in sync
		}
	}
	
	// Stable callback that doesn't change on every render
	const handleCloseRequest = useCallback((closeHandler: () => void) => {
		menuCloseHandlerRef.current = closeHandler
	}, [])
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [userMessage, setUserMessage] = useState('')
	const [email2, setEmail2] = useState('')
	const [datetime, setDatetime] = useState<Date | null>(null)
	const [msg2, setMsg2] = useState('')
	registerLocale('en-GB', enGB)

	const minTime = new Date()
	minTime.setHours(8, 0, 0)

	const maxTime = new Date()
	maxTime.setHours(17, 0, 0)

	const minDate = new Date()
	minDate.setHours(0, 0, 0, 0) // Today at midnight

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await axios.post(`${API_URL}/api/public/request-demo`, { email })
			setMessage('Thank you! You will receive access to the demo account shortly.')
			setEmail('')
		} catch {
			setMessage('Error occurred. Please try again later.')
		}
	}

	const handleSubmitMeeting = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!datetime && (!userMessage || userMessage.trim() === '')) {
			alert('Please select a date or enter a message.')
			return
		}

		try {
			await axios.post(`${API_URL}/api/public/schedule-call`, {
				email: email2,
				datetime: datetime?.toISOString(),
				message: userMessage,
			})
			setMsg2('Thank you! Your message has been sent.')
			setEmail2('')
			setDatetime(null)
		} catch {
			setMsg2('An error occurred while sending. Please try again later.')
		}
		console.log({ datetime, email: email2, message })
	}

	return (
		<>
			{/* Schema.org JSON-LD */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						"name": "Planopia",
						"url": "https://planopia.pl/en",
						"applicationCategory": "BusinessApplication",
						"operatingSystem": "Web",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"description": "Comprehensive company management app. Time tracking, leave management, work schedules, chats, task boards — everything in one place. Free for teams up to 4 users. Paid plans include unlimited users, advanced customization, and integrations.",
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "USD",
							"category": "Free",
							"description": "Free plan for teams up to 4 users"
						}
					})
				}}
			/>

			{/* HEADER + MENU */}
			<header className="bg-white top-0 z-50 w-full flex justify-between headerpromotionmenu" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link
						href="/en"
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden lg:flex space-x-8 navdesktop">
						<a
							href="#aboutapp"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							About the App
						</a>
						<a
							href="#prices"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Pricing
						</a>
						<a
							href="#contact"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Contact
						</a>
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
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
							onClick={toggleMenu}>
							Login
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							Create a free team
						</Link>
						<Link href="/" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Wersja Polska" className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={buttonState} onClick={handleMenuClick} />
				</div>
			</header>

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={closeMenu}
				onCloseRequest={handleCloseRequest}
				lang="en"
				menuItems={[
					{ href: '#aboutapp', label: 'About the App' },
					{ href: '#prices', label: 'Pricing' },
					{ href: '#contact', label: 'Contact' },
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
					href: '/',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version'
				}}
			/>

			<main>
			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid md:grid-cols-2 gap-10 items-center">
						<div className="ordering">
							<h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
								Time and leave tracking app – free for up to 4 users
							</h1>
							<h2 className="font-semibold text-gray-800" id="underheader">
								Planopia helps teams and companies organize working hours and leave management.
							</h2>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="bg-green-600 text-white font-semibold py-3 px-4 rounded shadow hover:bg-green-700 transition mt-2"
							>
								Create a free team
							</Link>
						</div>
						<img
							src="/img/headerimage.webp"
							alt="businessman managing calendar in the app"
							className="rounded-xl w-full h-auto aspect-[3/2]"
							loading="eager"
							fetchPriority="high"
							width={800}
							height={533}
						/>
					</div>
				</div>
			</section>

			<section id="aboutapp" className="py-16 bg-white px-4">
				<div className="max-w-7xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-10 items-center">
						{/* Text */}
						<div>
							<h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
								Comprehensive company management app
							</h2>
							<p className="mt-4 text-lg text-gray-600">
								Planopia is a complete company management tool. Time tracking, leave management, work schedules, chats, task boards — everything in one place. Forget Excel sheets and endless emails. Planopia automates processes — faster, clearer, and error-free.
							</p>

							{/* Feature grid */}
							<div className="mt-8 grid sm:grid-cols-2 gap-4">
								{/* 1 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/schedule time works.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Work time tracking</p>
										<p className="text-sm text-gray-600">Calendar, overtime, and work summaries.</p>
									</div>
								</div>
								{/* Timer */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/timer.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Automatic time registration</p>
										<p className="text-sm text-gray-600">QR code check-in/out, task tracking, and monthly work time statistics.</p>
									</div>
								</div>
								{/* 2 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/sunbed.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Leaves and absences</p>
										<p className="text-sm text-gray-600">Requests, approvals, notifications.</p>
									</div>
								</div>
								{/* 3 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/pdf.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Documents</p>
										<p className="text-sm text-gray-600">Generate PDF and Excel: work calendars and leave requests always at hand.</p>
									</div>
								</div>
								{/* 4 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/project.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Work schedules</p>
										<p className="text-sm text-gray-600">Planning and managing work schedules for the entire team.</p>
									</div>
								</div>
								{/* 5 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/chat.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Chats</p>
										<p className="text-sm text-gray-600">Internal communication — team chats and department channels.</p>
									</div>
								</div>
								{/* 6 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/task-list.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Task boards</p>
										<p className="text-sm text-gray-600">Project and task management in clear Kanban boards.</p>
									</div>
								</div>
								{/* 7 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/verified.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Security</p>
										<p className="text-sm text-gray-600">Secure login and encrypted connections protect your company.</p>
									</div>
								</div>
								{/* 8 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/booking.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">PWA & mobile</p>
										<p className="text-sm text-gray-600">Add to your screen and use it like an app.</p>
									</div>
								</div>
								{/* 9 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="/img/technical-support.png" className="icon-landing-about" alt='icon in section' loading="eager" />
									<div>
										<p className="font-semibold text-gray-900">Dedicated support</p>
										<p className="text-sm text-gray-600">Chat and help for your team — whenever you need it.</p>
									</div>
								</div>
							</div>

							<div className="mt-8">
								<p className="text-gray-700 text-lg mb-4">
									Need more features, custom integrations, or a dedicated environment for your company? Have many employees?
								</p>
								<a
									href="#prices"
									className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] pricing-button-text"
								>
									See pricing
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</a>
							</div>
						</div>

						{/* Product mockup */}
						<div className="relative flex justify-center items-center mockup-rotator">
						<div className='desktop-mockup'> 
  <img
    src="/img/desktop-ennew.webp"
    alt="Planopia – widok desktop"
    className="rounded-xl shadow-xl ring-1 ring-black/5"
    loading="eager"
  />
  
  <img
    src="/img/planopia-leaveen.webp"
    alt="Planopia – widok desktop"
    className="rounded-xl shadow-xl ring-1 ring-black/5"
    loading="eager"
  />
  </div>
							<img
								src="/img/mobile-ennew.webp"
								alt="Planopia – mobile view"
								className="rounded-xl shadow-xl ring-1 ring-black/5 mobile-mockup"
								loading="eager"
							/>
						</div>
					</div>
				</div>
			</section>

			<section id="for" className="py-16 bg-gray-50 px-4 for">
				<div className="max-w-7xl mx-auto">
					<div className="mb-10">
						<h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Who is Planopia for?</h3>
						<p className="mt-3 text-lg text-gray-600">
							From just a few to hundreds of employees — Planopia scales with your organization. Choose how you work, and we'll simplify the rest.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 mb-4">
						{/* 1: Small teams */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/group.png" alt="Small teams" className="w-10 h-10 rounded-lg object-contain" />
								<p className="font-semibold text-gray-900">Small teams</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Quick tracking, simple requests, clear calendar. <span className="font-semibold text-green-700">Free for up to 4 users.</span>
							</p>
						</div>

						{/* 2: Companies and organizations */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/enterprise.png" alt="Companies and organizations" className="w-10 h-10 rounded-lg object-contain" />
								<p className="font-semibold text-gray-900">Companies & organizations</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Central control over work time, approvals, and reports. Integrations and role-based permissions included.
							</p>
						</div>

						{/* 3: HR and managers */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/hr-manager.png" alt="HR and managers" className="w-10 h-10 rounded-lg object-contain" />
								<p className="font-semibold text-gray-900">HR & managers</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Efficient request handling, email notifications, and complete documentation for audits and settlements.
							</p>
						</div>
					</div>
				
					<Link
						href="https://app.planopia.pl/team-registration"
						className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition mt-4 for"
					>
						Create a free team
					</Link>
				</div>
			</section>

			{/* PRICING */}
			<section id="prices" className="py-16 px-4">
				<div className="max-w-7xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Pricing</h2>

					<p className="mt-3 text-gray-600 text-left">
						Payment is charged for each user. The app is free for up to 4 users — above this limit, you pay for all active users.
					</p>

					{/* Plan cards */}
					<div className="grid gap-6 md:grid-cols-2 mt-10">
						{/* Monthly plan */}
						<div className="relative bg-gradient-to-br from-green-50 via-white to-green-50/30 shadow-lg hover:shadow-xl transition-all duration-300 p-8 rounded-2xl border border-green-100 overflow-hidden">
							<div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
							<div className="relative">
								<h3 className="text-2xl font-semibold mb-4 text-gray-900">Monthly plan</h3>
								<div className="mb-4">
									<p className="text-4xl font-bold text-green-600">
										$5
									</p>
									<p className="text-sm text-gray-600 mt-1">per user / month</p>
									<p className="text-xs text-gray-500 mt-2">Price includes all app features</p>
								</div>
								<p className="text-gray-700 mb-8 leading-relaxed">Pay monthly, cancel anytime.</p>
								<button
									onClick={() => {
										setSelectedPackage('monthly')
										setPackageModalOpen(true)
									}}
									className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-[1.02]"
								>
									Choose monthly plan
								</button>
							</div>
						</div>

						{/* Yearly plan */}
						<div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/30 shadow-lg hover:shadow-xl transition-all duration-300 p-8 rounded-2xl border border-blue-100 overflow-hidden">
							<div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
							<div className="relative">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-2xl font-semibold text-gray-900">Yearly plan</h3>
									<span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">SAVE</span>
								</div>
								<div className="mb-4">
									<p className="text-4xl font-bold text-blue-600">
										$51
									</p>
									<p className="text-sm text-gray-600 mt-1">per user / year</p>
									<p className="text-xs text-gray-500 mt-2">Price includes all app features</p>
								</div>
								<p className="text-gray-700 mb-8 leading-relaxed">Save with annual payment — pay as for 10 months.</p>
								<button
									onClick={() => {
										setSelectedPackage('yearly')
										setPackageModalOpen(true)
									}}
									className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02]"
								>
									Choose yearly plan
								</button>
							</div>
						</div>
					</div>

					{/* Custom Package */}
					<div className="mt-8">
						<div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50/50 rounded-2xl p-8 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden text-left">
							<div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/20 rounded-full -mr-20 -mt-20 blur-2xl"></div>
							<div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
							<div className="relative">
								<div className="flex items-start gap-4 mb-4">
									
									<div className="flex-1">
										<h3 className="text-2xl font-bold text-gray-900 mb-3">Need only selected features?</h3>
										<p className="text-gray-700 mb-2 leading-relaxed">
											We are flexible! Choose only the features you need, and we'll adjust the price to your needs.
										</p>
										<p className="text-gray-600 mb-6 text-sm">
											Minimum price from <span className="font-semibold text-purple-600">$3 per user</span> when selecting basic features.
										</p>
										<button
											onClick={() => setCustomPackageModalOpen(true)}
											className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02]"
										>
											Create custom package
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Benefits over FREE */}
					<div className="mt-14">
						<h3 className="text-2xl font-bold text-gray-900">What do you get in paid plans?</h3>
						<p className="mt-2 text-gray-600">
							All app features + flexibility and support tailored to your company.
						</p>

						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 text-left">
							{/* More users */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/add-user.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Unlimited users</p>
									<p className="text-sm text-gray-600">Grow without limits — add as many people as you need.</p>
								</div>
							</div>

							{/* Custom branding */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/creativity.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Custom branding</p>
									<p className="text-sm text-gray-600">Your logo, colors, and company style in the app.</p>
								</div>
							</div>

							{/* Custom features */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/settings.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Custom features</p>
									<p className="text-sm text-gray-600">Add-ons and modifications tailored to your processes.</p>
								</div>
							</div>

							{/* Integrations */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/add.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Custom integrations</p>
									<p className="text-sm text-gray-600">RCP, imports, automations — connect Planopia with your systems.</p>
								</div>
							</div>

							{/* Support */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/technical-support.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Dedicated 24/7 support</p>
									<p className="text-sm text-gray-600">Chat and quick help whenever you need it.</p>
								</div>
							</div>

							{/* Dedicated environment */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/database.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">Dedicated environment</p>
									<p className="text-sm text-gray-600">Unique subdomain and isolated database for your company. <span className="font-semibold">+ $7 for dedicated server — optional.</span></p>
								</div>
							</div>

							{/* PWA / Mobile */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="/img/booking.png" className="icon-landing-about" alt='icon in secion about app' loading="eager" />
								<div>
									<p className="font-semibold text-gray-900">PWA & mobile</p>
									<p className="text-sm text-gray-600">Add to your home screen and use it like a mobile app.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="contact" className="py-16 px-4 bg-gray-50">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">Contact</h2>
					<p className="mt-3 text-left text-gray-600">
						Have questions, need an implementation or a demo? Send a message, call, or schedule an online meeting.
					</p>

					<div className="mt-10 grid gap-8 md:grid-cols-2 max-w-7xl mx-auto">
					{/* Left column – contact details */}
					<div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
						<div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
						<div className="relative">
							<div className="flex items-center mb-8">
								<div className="relative flex-shrink-0">
									<div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-400 rounded-full blur-sm opacity-30"></div>
									<img
										src="/img/1709827103942.webp"
										alt="Michał Lipka profile photo"
										className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
									/>
									<div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white shadow-md flex items-center justify-center">
										<div className="w-2 h-2 bg-white rounded-full"></div>
									</div>
								</div>
								<div className="ml-5">
									<p className="text-2xl font-bold text-gray-900 mb-2">Michał Lipka</p>
									<p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
										
										Creator of Planopia • Implementation & Support
									</p>
								</div>
							</div>

							<div className="mt-6 space-y-4 mb-6">
								<a
									href="mailto:michalipka1@gmail.com"
									className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
									<span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">michalipka1@gmail.com</span>
								</a>

								<a 
									href="tel:+48516598792" 
									className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
										<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
									</div>
									<span className="text-gray-800 font-medium group-hover:text-green-600 transition-colors">+48 516 598 792</span>
								</a>

								<a
									href="https://www.linkedin.com/in/michal-lipka-wd/"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
										<img src="/img/linkedin.webp" alt="LinkedIn logo" className="w-5 h-5" />
									</div>
									<span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">LinkedIn</span>
								</a>
							</div>

							<div className="bg-gradient-to-br from-white/80 to-blue-50/50 rounded-xl p-5 border border-blue-100 shadow-sm">
								<p className="text-gray-700 text-sm leading-relaxed font-medium">
									I will implement Planopia in your company and help adapt its features to your processes. Reach out — I'll get back quickly.
								</p>
							</div>
						</div>
					</div>

					{/* Right column – form */}
					<div className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100">
						<div className="absolute top-0 left-0 w-32 h-32 bg-green-200/20 rounded-full -ml-16 -mt-16 blur-2xl"></div>
						<div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -mr-12 -mb-12 blur-2xl"></div>
						<div className="relative">
							<div className="mb-6">
								<div className="flex items-center gap-3 mb-3">
									
									<p className="text-2xl font-bold text-gray-900">Contact form</p>
								</div>
								<p className="text-gray-600">
									Schedule an online meeting or leave a message — I'll get back to you shortly.
								</p>
							</div>

							<form onSubmit={handleSubmitMeeting} className="space-y-4">
								{/* Email */}
								<div>
									<label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
									<input
										id="contact-email"
										type="email"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white"
										placeholder="Your e-mail address"
										value={email2}
										onChange={e => setEmail2(e.target.value)}
										required
									/>
								</div>

								{/* Datepicker */}
								<div>
									<label htmlFor="contact-date" className="block text-sm font-semibold text-gray-700 mb-2">Date and time (optional)</label>
									<DatePicker
										id="contact-date"
										selected={datetime}
										onChange={setDatetime}
										showTimeSelect
										timeIntervals={30}
										minDate={minDate}
										minTime={minTime}
										maxTime={maxTime}
										dateFormat="Pp"
										timeCaption="Time"
										locale="en"
										placeholderText="Pick a date and time"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white"
									/>
								</div>

								{/* Message */}
								<div>
									<label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
									<textarea
										id="contact-message"
										rows={4}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none bg-white/80 hover:bg-white"
										placeholder="Your message"
										value={userMessage}
										onChange={e => setUserMessage(e.target.value)}
									/>
								</div>

								{/* Button */}
								<button
									type="submit"
									className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
								>
									Send
								</button>

								{msg2 && (
									<div className={`p-3 rounded-lg text-sm text-center ${
										msg2.includes('Thank you') || msg2.includes('sent')
											? 'bg-green-50 text-green-700 border border-green-200' 
											: 'bg-red-50 text-red-700 border border-red-200'
									}`}>
										{msg2}
									</div>
								)}
							</form>
						</div>
					</div>
					</div>
				</div>
			</section>

			</main>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }} />
			</footer>

			{/* Package Request Modal */}
			<PackageRequestModal
				isOpen={packageModalOpen}
				onClose={() => setPackageModalOpen(false)}
				packageType={selectedPackage}
				lang="en"
			/>

			{/* Custom Package Modal */}
			<CustomPackageModal
				isOpen={customPackageModalOpen}
				onClose={() => setCustomPackageModalOpen(false)}
				lang="en"
			/>
		</>
	)
}

export default ENProductPromotion
