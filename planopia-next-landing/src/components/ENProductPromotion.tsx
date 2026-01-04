'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { API_URL } from '../config'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { enGB } from 'date-fns/locale/en-GB'

function ENProductPromotion() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [userMessage, setUserMessage] = useState('')
	const [email2, setEmail2] = useState('')
	const [datetime, setDatetime] = useState<Date | null>(null)
	const [msg2, setMsg2] = useState('')
	registerLocale('en-GB', enGB)

	const minTime = new Date()
	minTime.setHours(7, 0, 0)

	const maxTime = new Date()
	maxTime.setHours(23, 0, 0)

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
						"description": "Comprehensive company management app. Time tracking, leave management, work schedules, chats, task boards — everything in one place. Free for teams up to 6 users. Paid plans include unlimited users, advanced customization, and integrations.",
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "USD",
							"category": "Free",
							"description": "Free plan for teams up to 6 users"
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
					<nav className="hidden flex space-x-8 navdesktop">
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
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition"
							onClick={toggleMenu}>
							Blog
						</Link>
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

					<button
						className="lg:hidden text-gray-700 text-3xl focus:outline-none"
						onClick={toggleMenu}
						style={{ fontSize: '36px' }}>
						{menuOpen ? '✕' : '☰'}
					</button>
				</div>

				{menuOpen && (
					<div className="navmobile lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 flex flex-col items-start">
						<a
							href="#aboutapp"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							About the App
						</a>
						<a
							href="#prices"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Pricing
						</a>
						<a
							href="#contact"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Contact
						</a>
						<Link
							href="/en/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="https://app.planopia.pl/"
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
							Create a free team
						</Link>
						<Link href="/" className="flex items-center languagechoose mt-4">
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
						</Link>
					</div>
				)}
			</header>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid md:grid-cols-2 gap-10 items-center">
						<div className="ordering">
							<h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
								Time and leave tracking app – free for up to 6 users
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
									<img src="img/schedule time works.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Work time tracking</p>
										<p className="text-sm text-gray-600">Calendar, overtime, and work summaries.</p>
									</div>
								</div>
								{/* 2 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/sunbed.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Leaves and absences</p>
										<p className="text-sm text-gray-600">Requests, approvals, notifications.</p>
									</div>
								</div>
								{/* 3 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/pdf.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Documents</p>
										<p className="text-sm text-gray-600">Generate PDF and Excel: work calendars and leave requests always at hand.</p>
									</div>
								</div>
								{/* 4 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/project.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Work schedules</p>
										<p className="text-sm text-gray-600">Planning and managing work schedules for the entire team.</p>
									</div>
								</div>
								{/* 5 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/chat.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Chats</p>
										<p className="text-sm text-gray-600">Internal communication — team chats and department channels.</p>
									</div>
								</div>
								{/* 6 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/task-list.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Task boards</p>
										<p className="text-sm text-gray-600">Project and task management in clear Kanban boards.</p>
									</div>
								</div>
								{/* 7 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/verified.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Security</p>
										<p className="text-sm text-gray-600">Secure login and encrypted connections protect your company.</p>
									</div>
								</div>
								{/* 8 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/booking.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">PWA & mobile</p>
										<p className="text-sm text-gray-600">Add to your screen and use it like an app.</p>
									</div>
								</div>
								{/* 9 */}
								<div className="flex gap-3 p-4 rounded-xl border border-gray-200">
									<img src="img/technical-support.png" className="icon-landing-about" alt='icon in section' />
									<div>
										<p className="font-semibold text-gray-900">Dedicated support</p>
										<p className="text-sm text-gray-600">Chat and help for your team — whenever you need it.</p>
									</div>
								</div>
							</div>

							<div className="mt-8 flex flex-wrap items-center gap-4">
								<p className="text-gray-600">
									Need more features, custom integrations, or a dedicated environment for your company?
								</p>
								<a
									href="#prices"
									className="text-blue-600 font-medium hover:underline"
								>
									See pricing →
								</a>
							</div>
						</div>

						{/* Product mockup */}
						<div className="relative flex justify-center items-center mockup-rotator">
							<img
								src="img/desktop-ennew.webp"
								alt="Planopia – desktop view"
								className="rounded-xl shadow-xl ring-1 ring-black/5 desktop-mockup"
							/>
							<img
								src="img/mobile-ennew.webp"
								alt="Planopia – mobile view"
								className="rounded-xl shadow-xl ring-1 ring-black/5 mobile-mockup"
							/>
						</div>
					</div>
				</div>
			</section>

			<section id="for" className="py-16 bg-gray-50 px-4 for">
				<div className="max-w-7xl mx-auto">
					<div className="max-w-3xl mb-10">
						<h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Who is Planopia for?</h3>
						<p className="mt-3 text-lg text-gray-600">
							From just a few to hundreds of employees — Planopia scales with your organization. Choose how you work, and we'll simplify the rest.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 mb-4">
						{/* 1: Small teams */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700 font-semibold">👥</span>
								<p className="font-semibold text-gray-900">Small teams</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Quick tracking, simple requests, clear calendar. <span className="font-semibold text-green-700">Free for up to 6 users.</span>
							</p>
						</div>

						{/* 2: Companies and organizations */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-semibold">🏢</span>
								<p className="font-semibold text-gray-900">Companies & organizations</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Central control over work time, approvals, and reports. Integrations and role-based permissions included.
							</p>
						</div>

						{/* 3: HR and managers */}
						<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-semibold">👩‍💼</span>
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

					<p className="mt-3 text-gray-600 max-w-3xl">
						The free plan includes up to 6 active users.<br />
						Once this limit is exceeded, the entire organization switches to a paid plan 
						and the fee applies to all active users.
					</p>

					<p className="mt-3 text-gray-600">
						Same functionality, different billing options.
					</p>

					{/* Plan cards */}
					<div className="grid gap-6 md:grid-cols-2 mt-10">
						{/* Monthly plan */}
						<div className="bg-white shadow p-8 rounded-2xl border border-gray-200">
							<h3 className="text-2xl font-semibold mb-4">Monthly plan</h3>
							<p className="text-4xl font-bold text-green-600 mb-2">
								$4.80 <span className="text-lg font-normal text-gray-700">/user/month</span>
							</p>
							<p className="text-gray-600 mb-8">Pay monthly, cancel anytime.</p>
							<button
								onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
								className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-medium shadow hover:bg-green-700 transition"
							>
								Choose monthly plan
							</button>
						</div>

						{/* Yearly plan */}
						<div className="bg-white shadow p-8 rounded-2xl border border-gray-200">
							<h3 className="text-2xl font-semibold mb-4">Yearly plan</h3>
							<p className="text-4xl font-bold text-blue-600 mb-2">
								$48 <span className="text-lg font-normal text-gray-700">/user/year</span>
							</p>
							<p className="text-gray-600 mb-8">Save with annual payment — pay as for 10 months.</p>
							<button
								onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
								className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700 transition"
							>
								Choose yearly plan
							</button>
						</div>
					</div>

					{/* Benefits over FREE */}
					<div className="mt-14">
						<h4 className="text-2xl font-bold text-gray-900">What do you get in paid plans?</h4>
						<p className="mt-2 text-gray-600">
							Everything from the free version + flexibility and support tailored to your company.
						</p>

						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 text-left">
							{/* More users */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/add-user.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Unlimited users</p>
									<p className="text-sm text-gray-600">Grow without limits — add as many people as you need.</p>
								</div>
							</div>

							{/* Custom branding */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/creativity.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Custom branding</p>
									<p className="text-sm text-gray-600">Your logo, colors, and company style in the app.</p>
								</div>
							</div>

							{/* Custom features */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/settings.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Custom features</p>
									<p className="text-sm text-gray-600">Add-ons and modifications tailored to your processes.</p>
								</div>
							</div>

							{/* Integrations */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/add.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Custom integrations</p>
									<p className="text-sm text-gray-600">RCP, imports, automations — connect Planopia with your systems.</p>
								</div>
							</div>

							{/* Support */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/technical-support.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Dedicated 24/7 support</p>
									<p className="text-sm text-gray-600">Chat and quick help whenever you need it.</p>
								</div>
							</div>

							{/* Dedicated environment */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/database.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">Dedicated environment</p>
									<p className="text-sm text-gray-600">Unique subdomain and isolated database for your company. <span className="font-semibold">+ $7 for dedicated server — optional.</span></p>
								</div>
							</div>

							{/* PWA / Mobile */}
							<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
								<img src="img/booking.png" className="icon-landing-about" alt='icon in secion about app' />
								<div>
									<p className="font-semibold text-gray-900">PWA & mobile</p>
									<p className="text-sm text-gray-600">Add to your home screen and use it like a mobile app.</p>
								</div>
							</div>
						</div>
					</div>

					{/* Price negotiation note */}
					<div className="mt-10 mx-auto">
						<p className="text-gray-600">
							<span className="font-semibold">Note:</span> If some features from the app are not needed in your company, the price can be negotiated. Contact us to discuss your individual needs.
						</p>
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
						<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
							<div className="flex items-center">
								<img
									src="/img/1709827103942.webp"
									alt="Michał Lipka profile photo"
									className="w-16 h-16 rounded-full object-cover"
								/>
								<div className="ml-4">
									<p className="text-lg font-semibold text-gray-900 mb-0">Michał Lipka</p>
									<p className="text-sm text-gray-600">Creator of Planopia • Implementation & Support</p>
								</div>
							</div>

							<div className="mt-6 space-y-3 mb-4">
								<a
									href="mailto:michalipka1@gmail.com"
									className="flex items-center gap-3 text-gray-800 hover:underline"
								>
									<svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none">
										<path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/>
										<path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									</svg>
									michalipka1@gmail.com
								</a>

								<a href="tel:+48516598792" className="flex items-center gap-3 text-gray-800 hover:underline">
									<svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none">
										<path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 12 19.8 19.8 0 0 1 .08 3.69 2 2 0 0 1 2.06 1.5h2A2 2 0 0 1 6 3.09c.12.9.35 1.77.68 2.6.2.5.06 1.07-.32 1.44l-1 1a16 16 0 0 0 6.4 6.4l1-1c.37-.38.94-.52 1.44-.32.83.33 1.7.56 2.6.68A2 2 0 0 1 20 16.92z" stroke="currentColor" strokeWidth="1.5"/>
									</svg>
									+48 516 598 792
								</a>

								<a
									href="https://www.linkedin.com/in/michal-lipka-wd/"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 text-blue-600 hover:underline"
								>
									<img src="/img/linkedin.webp" alt="LinkedIn logo" className="w-5 h-5" />
									LinkedIn
								</a>
							</div>

							<p className="mt-6 text-gray-600 text-sm">
								I will implement Planopia in your company and help adapt its features to your processes. Reach out — I'll get back quickly.
							</p>
						</div>

						{/* Right column – form */}
						<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
							<p className="text-2xl font-bold mb-2 text-gray-900">Contact form</p>
							<p className="mb-6 text-gray-600">
								Schedule an online meeting or leave a message — I'll get back to you shortly.
							</p>

							<form onSubmit={handleSubmitMeeting} className="space-y-3">
								{/* Email */}
								<div>
									<label htmlFor="contact-email" className="sr-only">E-mail</label>
									<input
										id="contact-email"
										type="email"
										className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
										placeholder="Your e-mail address"
										value={email2}
										onChange={e => setEmail2(e.target.value)}
										required
									/>
								</div>

								{/* Datepicker */}
								<div>
									<label htmlFor="contact-date" className="sr-only">Date and time</label>
									<DatePicker
										id="contact-date"
										selected={datetime}
										onChange={setDatetime}
										showTimeSelect
										timeIntervals={30}
										minTime={minTime}
										maxTime={maxTime}
										dateFormat="Pp"
										timeCaption="Time"
										locale="en"
										placeholderText="Pick a date and time (optional)"
										className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
								</div>

								{/* Message */}
								<div>
									<label htmlFor="contact-message" className="sr-only">Message</label>
									<textarea
										id="contact-message"
										rows={4}
										className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
										placeholder="Your message"
										value={userMessage}
										onChange={e => setUserMessage(e.target.value)}
									/>
								</div>

								{/* Button */}
								<button
									type="submit"
									className="w-full bg-green-600 text-white rounded-md hover:bg-green-700 px-6 py-3 font-medium transition"
								>
									Send
								</button>

								{msg2 && <p className="mt-2 text-sm text-center text-gray-700">{msg2}</p>}
							</form>
						</div>
					</div>
				</div>
			</section>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }} />
			</footer>
		</>
	)
}

export default ENProductPromotion
