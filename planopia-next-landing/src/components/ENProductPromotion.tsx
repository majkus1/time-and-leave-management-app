'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { landingHomeFaqs } from '@/data/landingHomeFaqs'
import { planOfferingCopy } from '@/data/planOfferingCopy'
import LandingFeatureTiles from './LandingFeatureTiles'

const LandingVideoGuideTeaser = dynamic(() => import('./LandingVideoGuideTeaser'), {
	loading: () => <div className="min-h-[120px] w-full" aria-hidden />,
})

const LandingChatSection = dynamic(() => import('./LandingChatSection'), {
	loading: () => <div className="min-h-[520px] w-full" aria-hidden />,
})

const LandingAIHighlight = dynamic(() => import('./LandingAIHighlight'), {
	loading: () => <div className="min-h-[200px] w-full" aria-hidden />,
})

const AboutAppShowcaseVideos = dynamic(() => import('./AboutAppShowcaseVideos'), {
	loading: () => (
		// Placeholder trzyma DOKLADNIE te sama wysokosc co gotowy komponent,
		// zeby hydracja nie przesunela sekcji pod spodem.
		<div className="about-app-mockup-wrap w-full" aria-hidden>
			<div className="w-full max-w-[1000px]">
				<div className="hidden flex-col gap-5 lg:flex">
					<div className="w-full rounded-xl bg-gray-100" style={{ aspectRatio: '1902 / 912' }} />
					<div className="w-full rounded-xl bg-gray-100" style={{ aspectRatio: '1902 / 912' }} />
				</div>
				<div className="lg:hidden">
					<div
						className="mx-auto rounded-xl bg-gray-100"
						style={{ aspectRatio: '358 / 780', height: 'min(600px, 70vh)' }}
					/>
					{/* Odpowiednik rzedu kropek w gotowym komponencie (mt-3 + h-1.5) */}
					<div className="mt-3 h-1.5" />
				</div>
			</div>
		</div>
	),
})

const LandingPricing = dynamic(() => import('./LandingPricing'))

const LandingContactSection = dynamic(() => import('./LandingContactSection'))

const faqs = landingHomeFaqs.en

function ENProductPromotion() {
	return (
		<>
			<section className="landing-value-proof-section px-4" aria-labelledby="planopia-value-proof-heading-en">
				<div className="landing-value-proof max-w-7xl mx-auto">
					<div className="landing-value-proof__header">
						<p className="landing-value-proof__eyebrow landing-section-eyebrow">{planOfferingCopy.en.valueEyebrow}</p>
						<h2 id="planopia-value-proof-heading-en" className="landing-value-proof__title">
							{planOfferingCopy.en.valueTitle}
						</h2>
						<p className="landing-value-proof__lead">{planOfferingCopy.en.valueLead}</p>
					</div>
					<div className="landing-value-proof__grid">
						{planOfferingCopy.en.valueCards.map(card => (
							<article className="landing-value-proof__card" key={card.title}>
								<h3>{card.title}</h3>
								<p>{card.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section id="aboutapp" className="py-12 bg-white px-4">
				<div className="max-w-7xl mx-auto">
					<div className="landing-about-heading-block mb-8">
						<p className="landing-about-heading-eyebrow landing-section-eyebrow">
							{planOfferingCopy.en.aboutEyebrow}
						</p>
						<h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">
							{planOfferingCopy.en.aboutTitle}
						</h2>
						<p className="landing-about-intro mt-4 text-lg text-gray-600">
							{planOfferingCopy.en.aboutLead}
						</p>
					</div>
					<div
						className="
							grid gap-10
							[grid-template-areas:'features'_'callout'_'video']
							lg:grid-cols-2 lg:gap-x-10 lg:gap-y-10
							lg:[grid-template-areas:'features_video'_'callout_callout']
							lg:items-start
						"
					>
						<div className="[grid-area:features] min-w-0">
							<LandingFeatureTiles locale="en" />
						</div>

						<aside
							className="landing-enterprise-callout [grid-area:callout] w-full rounded-xl p-5 md:p-6"
							aria-labelledby="planopia-enterprise-offer-heading-en"
						>
							<h3
								id="planopia-enterprise-offer-heading-en"
								className="landing-enterprise-callout__eyebrow text-xs font-semibold uppercase tracking-[0.12em] mb-2"
							>
								Building Planopia for your organization
							</h3>
							<p className="landing-enterprise-callout__lead text-base md:text-lg leading-relaxed font-semibold">
								Need more than the standard offering?{' '}
								<span>
									We also extend the product for company-specific needs: extra features, integrations aligned with your processes, a dedicated environment, or scaling to a large workforce.
								</span>
							</p>
							<p className="landing-enterprise-callout__text mt-3 text-sm md:text-base leading-relaxed">
								Compare plans and limits in the{' '}
								<Link
									href="#prices-paid-plans"
									className="landing-enterprise-callout__link font-semibold underline underline-offset-[3px] transition-colors"
								>
									Pricing
								</Link>{' '}
								section further down the page.
							</p>
						</aside>

						<div className="[grid-area:video] relative flex min-h-[320px] w-full flex-col justify-center mockup-rotator lg:min-h-0 lg:self-center">
							<AboutAppShowcaseVideos locale="en" />
						</div>
					</div>
				</div>
			</section>

			<LandingAIHighlight locale="en" />

			<LandingChatSection locale="en" />

			<section id="for" className="py-12 bg-gray-50 px-4 for">
				<div className="max-w-7xl mx-auto">
					<div className="landing-audience-heading mb-10">
						<p className="landing-about-heading-eyebrow landing-section-eyebrow">One app, many possibilities</p>
						<h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">Who is Planopia for?</h2>
						<p className="landing-about-intro mt-4 text-lg text-gray-600">
							From just a few to hundreds of employees — Planopia scales with your organization. One app for time tracking, leave, schedules, and reports, with the AI Assistant and no message limit on every paid plan.
						</p>
					</div>

					<div className="landing-audience-cards grid md:grid-cols-3 gap-6">
						<div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/groupses.png" alt="Small teams 1-15 people" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
								<p className="font-semibold text-gray-900">Small teams (1-15 people)</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Replace spreadsheets with one simple app for time tracking, leave, and schedules.
							</p>
						</div>

						<div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/enterprise.png" alt="Growing companies 15-100+ people" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
								<p className="font-semibold text-gray-900">Growing companies (15-100+ people)</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Organize HR processes, reporting, and team management in one system.
							</p>
						</div>

						<div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
							<div className="flex items-center gap-3">
								<img src="/img/hr-manager.png" alt="HR and team leads" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
								<p className="font-semibold text-gray-900">HR & team leads</p>
							</div>
							<p className="mt-3 text-gray-600 text-sm">
								Less manual work, more automation, reports, and control over the team.
							</p>
						</div>
					</div>
				</div>
			</section>

			<LandingPricing locale="en" />

			<LandingVideoGuideTeaser locale="en" />

			<LandingContactSection locale="en" />

			<section id="faq" className="landing-faq-section py-12 px-4 bg-gray-50" aria-labelledby="landing-faq-heading-en">
				<div className="max-w-7xl mx-auto">
					<div className="landing-contact-heading mb-8">
						<p className="landing-contact-eyebrow landing-section-eyebrow">Have questions?</p>
						<h2 id="landing-faq-heading-en" className="landing-contact-title text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
					</div>
					<div className="space-y-4 md:space-y-5">
						{faqs.map((f, i) => (
							<div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm ring-1 ring-gray-100/80">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
								<p className="text-gray-700 m-0 leading-relaxed">{f.a}</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</>
	)
}

export default ENProductPromotion
