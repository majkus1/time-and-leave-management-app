'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { API_URL } from '@/config'
import { landingContactCopy } from '@/data/landingContactCopy'
import { trackEvent } from '@/lib/analytics'
import { FOOTER_UI, LANDING_SELLER } from '@/data/landingFooterData'

const LandingContactDatePicker = dynamic(() => import('./LandingContactDatePicker'), {
	ssr: false,
})

type Locale = 'pl' | 'en'

/**
 * Na stronie glownej sekcja jest jedna z wielu, wiec naglowek to h2.
 * Na osobnej stronie /kontakt to jest glowny temat strony — wtedy h1,
 * inaczej strona nie ma zadnego h1.
 */
export default function LandingContactSection({
	locale,
	headingLevel = 'h2',
}: {
	locale: Locale
	headingLevel?: 'h1' | 'h2'
}) {
	const Heading = headingLevel
	const t = landingContactCopy[locale]
	const companyUi = FOOTER_UI[locale]
	const [email2, setEmail2] = useState('')
	const [companyName, setCompanyName] = useState('')
	const [phone, setPhone] = useState('')
	const [teamSize, setTeamSize] = useState('')
	const [datetime, setDatetime] = useState<Date | null>(null)
	const [userMessage, setUserMessage] = useState('')
	const [msg2, setMsg2] = useState('')
	const [datePickerActive, setDatePickerActive] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const dateInputClassName =
		'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white'

	const activateDatePicker = () => setDatePickerActive(true)

	const handleSubmitMeeting = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!datetime && (!userMessage || userMessage.trim() === '')) {
			alert(t.alert)
			return
		}
		if (submitting) return
		setSubmitting(true)
		try {
			await axios.post(`${API_URL}/api/public/schedule-call`, {
				email: email2,
				companyName,
				phone,
				teamSize,
				datetime: datetime?.toISOString(),
				message: userMessage,
			})
			// Druga sciezka konwersji obok begin_sign_up — bez tego zdarzenia nie da sie ocenic,
			// czy kontakt z czlowiekiem w ogole dziala.
			trackEvent('generate_lead', {
				method: datetime ? 'schedule_call' : 'contact_form',
				has_company: companyName.trim() !== '',
				has_phone: phone.trim() !== '',
			})
			setMsg2(t.success)
			setEmail2('')
			setCompanyName('')
			setPhone('')
			setTeamSize('')
			setDatetime(null)
			setUserMessage('')
		} catch {
			setMsg2(t.error)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<section id={t.sectionId} className="landing-contact-section py-12 px-4 bg-gray-50">
			<div className="max-w-7xl mx-auto">
				<div className="landing-contact-heading">
					<p className="landing-contact-eyebrow landing-section-eyebrow">{t.eyebrow}</p>
					<Heading className="landing-contact-title text-3xl md:text-4xl font-bold">{t.title}</Heading>
				</div>
				<p className="landing-contact-lead mt-3 text-left">{t.lead}</p>

				<div className="mt-10 grid gap-8 md:grid-cols-2 max-w-7xl mx-auto">
					<div className="landing-contact-card landing-contact-card--person relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl" />
						<div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200/20 rounded-full -ml-12 -mb-12 blur-2xl" />
						<div className="relative">
							<div className="flex items-center mb-8">
								<div className="relative flex-shrink-0">
									<div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-400 rounded-full blur-sm opacity-30" />
									<img
										src="/img/1709827103942.webp"
										alt={t.profileAlt}
										className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
										width={96}
										height={96}
									/>
									<div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white shadow-md flex items-center justify-center">
										<div className="w-2 h-2 bg-white rounded-full" />
									</div>
								</div>
								<div className="ml-5">
									<p className="text-2xl font-bold text-gray-900 mb-2">Michał Lipka</p>
									<p className="text-sm text-gray-600 font-semibold flex items-center gap-2">{t.role}</p>
								</div>
							</div>

							<div className="mt-6 space-y-4 mb-6">
								<a
									href="mailto:biuro@planopia.pl"
									className="landing-contact-link flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
										<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">biuro@planopia.pl</span>
								</a>

								<a
									href="tel:+48516598792"
									className="landing-contact-link flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
								>
									<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
										<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
									</div>
									<span className="text-gray-800 font-medium group-hover:text-green-600 transition-colors">+48 516 598 792</span>
								</a>

							</div>

							<div className="pt-5 mt-2 border-t border-gray-200/70">
								<p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 mb-3">
									{t.companyLabel}
								</p>
								<address className="not-italic text-sm leading-relaxed text-gray-600 space-y-0.5">
									<span className="block font-medium text-gray-800">{LANDING_SELLER.legalName}</span>
									{LANDING_SELLER.addressLines[locale].map(line => (
										<span key={line} className="block">
											{line}
										</span>
									))}
									<span className="block pt-2 text-gray-600">
										{companyUi.nipLabel}: {LANDING_SELLER.nip}
										<span className="mx-2 text-gray-300" aria-hidden>
											·
										</span>
										{companyUi.regonLabel}: {LANDING_SELLER.regon}
									</span>
								</address>
							</div>
						</div>
					</div>

					<div className="landing-contact-card landing-contact-card--form relative bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100">
						<div className="absolute top-0 left-0 w-32 h-32 bg-green-200/20 rounded-full -ml-16 -mt-16 blur-2xl" />
						<div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -mr-12 -mb-12 blur-2xl" />
						<div className="relative">
							<div className="mb-6">
								<p className="landing-contact-form-title text-2xl font-bold text-gray-900">{t.formTitle}</p>
								<p className="text-gray-600 mt-3">{t.formLead}</p>
							</div>

							<form onSubmit={handleSubmitMeeting} className="space-y-4">
								<div>
									<label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-2">
										{t.emailLabel}
									</label>
									<input
										id="contact-email"
										type="email"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white"
										placeholder={t.emailPlaceholder}
										value={email2}
										onChange={e => setEmail2(e.target.value)}
										required
									/>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label htmlFor="contact-company" className="block text-sm font-semibold text-gray-700 mb-2">
											{t.companyLabelForm}
										</label>
										<input
											id="contact-company"
											type="text"
											className={dateInputClassName}
											placeholder={t.companyPlaceholder}
											value={companyName}
											onChange={e => setCompanyName(e.target.value)}
										/>
									</div>
									<div>
										<label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-700 mb-2">
											{t.phoneLabel}
										</label>
										<input
											id="contact-phone"
											type="tel"
											className={dateInputClassName}
											placeholder={t.phonePlaceholder}
											value={phone}
											onChange={e => setPhone(e.target.value)}
										/>
									</div>
								</div>

								<div>
									<label htmlFor="contact-team-size" className="block text-sm font-semibold text-gray-700 mb-2">
										{t.teamSizeLabel}
									</label>
									<input
										id="contact-team-size"
										type="text"
										className={dateInputClassName}
										placeholder={t.teamSizePlaceholder}
										value={teamSize}
										onChange={e => setTeamSize(e.target.value)}
									/>
								</div>

								<div>
									<label htmlFor="contact-date" className="block text-sm font-semibold text-gray-700 mb-2">
										{t.dateLabel}
									</label>
									{datePickerActive ? (
										<LandingContactDatePicker
											id="contact-date"
											locale={locale}
											selected={datetime}
											onChange={setDatetime}
											placeholder={t.datePlaceholder}
											timeCaption={t.timeCaption}
											className={dateInputClassName}
											autoOpen
										/>
									) : (
										<input
											id="contact-date"
											type="text"
											readOnly
											placeholder={t.datePlaceholder}
											onFocus={activateDatePicker}
											onClick={activateDatePicker}
											className={dateInputClassName}
											aria-label={t.dateLabel}
										/>
									)}
								</div>

								<div>
									<label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-2">
										{t.messageLabel}
									</label>
									<textarea
										id="contact-message"
										rows={4}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none bg-white/80 hover:bg-white"
										placeholder={t.messagePlaceholder}
										value={userMessage}
										onChange={e => setUserMessage(e.target.value)}
									/>
								</div>

								<button
									type="submit"
									disabled={submitting}
									className="landing-contact-submit w-full text-white rounded-lg px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
								>
									{t.submit}
								</button>

								{msg2 && (
									<div
										className={`p-3 rounded-lg text-sm text-center ${
											msg2 === t.success
												? 'bg-green-50 text-green-700 border border-green-200'
												: 'bg-red-50 text-red-700 border border-red-200'
										}`}
									>
										{msg2}
									</div>
								)}
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
