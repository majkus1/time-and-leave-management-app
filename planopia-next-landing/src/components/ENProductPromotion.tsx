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
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import LandingPricing from './LandingPricing'
import LandingVideoGuideTeaser from './LandingVideoGuideTeaser'
import LandingAIHighlight from './LandingAIHighlight'
import AboutAppShowcaseVideos from './AboutAppShowcaseVideos'
import SellerCompanyDetails from './SellerCompanyDetails'
import { planOfferingCopy } from '@/data/planOfferingCopy'
import { LANDING_SITE_FOOTER_CLASS_STACK } from '@/data/landingSiteFooter'

function ENProductPromotion() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false) // Separate state for button (changes immediately)

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
						"description": planOfferingCopy.en.metaLong,
						"offers": {
							"@type": "AggregateOffer",
							"offerCount": "5",
							"lowPrice": "99",
							"highPrice": "799",
							"priceCurrency": "PLN",
							"description": planOfferingCopy.en.jsonLdOfferDescription
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
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<a
							href="#aboutapp"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							About the App
						</a>
						<a
							href="#ai-assistant"
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							AI Assistant
						</a>
						<a
							href="#prices"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Pricing
						</a>
						<LandingIndustriesDropdown locale="en" />
						<Link
							href="/en/blog"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Blog
						</Link>
						<a
							href="#contact"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Contact
						</a>
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
							Create your free team
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
				menuItems={landingMobileNavItemsEn()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('en')}
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
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid md:grid-cols-2 gap-10 items-center">
						<div className="ordering">
							<h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
								{planOfferingCopy.en.heroH1}
							</h1>
							<h2 className="font-semibold text-gray-800 mt-2 max-w-xl" id="underheader">
								{planOfferingCopy.en.heroSub}
							</h2>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-4 shadow hover:bg-green-700 transition mt-4"
							>
								Create your free team
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

			<section id="aboutapp" className="py-12 bg-white px-4">
				<div className="max-w-7xl mx-auto">
					<div
						className="
							grid gap-10
							[grid-template-areas:'features'_'callout'_'video']
							lg:grid-cols-2 lg:gap-x-10 lg:gap-y-10
							lg:[grid-template-areas:'features_video'_'callout_callout']
							lg:items-start
						"
					>
						{/* Text + feature cards */}
						<div className="[grid-area:features] min-w-0">
							<h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
								Comprehensive company management app
							</h2>
							<p className="mt-4 text-lg text-gray-600">
								Planopia is a complete company management tool. Time tracking, leave management, work schedules, chats, task boards, and an AI Assistant - everything in one place. Forget Excel sheets and endless emails. Planopia automates processes - faster, clearer, and error-free.
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
										<p className="text-sm text-gray-600">Add to your home screen and use it like an app — including push notifications for important updates.</p>
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
						</div>

						<aside
							className="[grid-area:callout] w-full rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/95 via-white to-slate-50 p-5 md:p-6 shadow-sm ring-1 ring-indigo-100/70"
							aria-labelledby="planopia-enterprise-offer-heading-en"
						>
							<h3
								id="planopia-enterprise-offer-heading-en"
								className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700 mb-2"
							>
								Building Planopia for your organization
							</h3>
							<p className="text-gray-900 text-base md:text-lg leading-relaxed font-semibold">
								Need more than the standard offering?{' '}
								<span className="text-gray-800">
									We also extend the product for company-specific needs: extra features, integrations aligned with your processes, a dedicated environment, or scaling to a large workforce.
								</span>
							</p>
							<p className="mt-3 text-gray-700 text-sm md:text-base leading-relaxed">
								Compare plans and limits in the{' '}
								<Link
									href="#prices-paid-plans"
									className="font-semibold text-indigo-700 hover:text-indigo-900 underline decoration-indigo-300 underline-offset-[3px] hover:decoration-indigo-500 transition-colors"
								>
									Pricing
								</Link>{' '}
								section further down the page.
							</p>
						</aside>

						{/* Product videos */}
						<div className="[grid-area:video] relative flex min-h-[320px] w-full flex-col justify-center mockup-rotator lg:min-h-0 lg:self-center">
							<AboutAppShowcaseVideos locale="en" />
						</div>
					</div>
				</div>
			</section>

			<LandingAIHighlight locale="en" />

			<section id="for" className="py-12 bg-gray-50 px-4 for">
				<div className="max-w-7xl mx-auto">
					<div className="mb-10">
						<h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Who is Planopia for?</h3>
						<p className="mt-3 text-lg text-gray-600">
							From just a few to hundreds of employees — Planopia scales with your organization. One app for time tracking, leave, schedules, and reports, with the AI Assistant within your plan limits.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 mb-4">
						{/* 1: Small teams */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/groupses.png" alt="Small teams" className="w-10 h-10 rounded-lg object-contain" />
								<p className="font-semibold text-gray-900">Small teams</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Quick tracking, simple requests, a clear calendar. Straightforward roles and permissions — without unnecessary complexity.
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
								Efficient request handling, email and push notifications, and complete documentation for audits and settlements.
							</p>
						</div>
					</div>
				</div>
			</section>

			<LandingPricing locale="en" />

			<LandingVideoGuideTeaser locale="en" />

			<section id="contact" className="py-12 px-4 bg-gray-50">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">Contact & company details</h2>
					<p className="mt-3 text-left text-gray-600">
						Have questions or want a demo? Send a message, call, or schedule an online meeting.
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
									href="mailto:office@ml-devworks.com"
									className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
									<span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">office@ml-devworks.com</span>
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

							<SellerCompanyDetails locale="en" />
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
			<footer className={LANDING_SITE_FOOTER_CLASS_STACK}>
				<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }} />
			</footer>

		</>
	)
}

export default ENProductPromotion





