'use client'

import Link from 'next/link'
import { useState } from 'react'
import { paymentHref } from '@/lib/paymentLinks'

type Locale = 'pl' | 'en'
type Billing = 'monthly' | 'yearly'

/** Indicative rate for EN USD display (PLN per 1 USD). */
const PLN_PER_USD = 3.69

function plnToUsd(pln: number): number {
	return pln / PLN_PER_USD
}

const copy = {
	pl: {
		title: 'Cennik Planopia',
		subtitle:
			'Najpierw 30 dni pełnej aplikacji za darmo. Potem: bezpłatny plan z ewidencją czasu pracy (do 5 aktywnych kont) albo pakiety płatne z pełnymi funkcjami — ceny netto, bez ukrytych opłat.',
		paidPlansIntro: 'Pakiety płatne (subskrypcja)',
		billingLabel: 'Rozliczenie',
		billingMonthly: 'Miesięcznie',
		billingYearly: 'Rocznie',
		billingYearlyBadge: '2 miesiące w cenie',
		billingYearlyHint: 'Płacisz z góry za 10 miesięcy — korzystasz przez pełne 12 miesięcy.',
		trialTitle: '30 dni — pełna aplikacja',
		trialBadge: 'bez karty',
		trialFeatures: [
			'Wszystkie funkcje: ewidencja, urlopy, grafiki, czat, tablice, Asystent AI (w limitach próby)',
			'Asystent AI: 10 wiadomości jednorazowo w okresie próbnym',
			'Do 5 użytkowników w zespole',
			'Bez karty płatniczej i bez zobowiązania',
		],
		trialCta: 'Załóż darmowy zespół',
		freeTitle: 'Darmowa ewidencja czasu pracy — po okresie próbnym',
		freeBadge: '0 zł',
		freeIntro:
			'Bez abonamentu: ewidencja czasu pracy online dla małych zespołów (po okresie próbnym, jeśli nie wykupisz pakietu).',
		freeFeatures: [
			'Do 5 aktywnych kont w zespole',
			'Kalendarze i rejestracja czasu pracy',
		],
		freeCta: 'Zacznij od rejestracji zespołu',
		tiers: [
			{
				id: 'starter',
				name: 'Starter',
				monthlyNet: 99,
				highlight: false,
				features: [
					'Do 10 użytkowników',
					'Wszystkie funkcje',
					'Asystent AI: 10 wiadomości miesięcznie (na firmę)',
				],
				cta: 'Wybierz Starter',
			},
			{
				id: 'pro',
				name: 'Pro',
				monthlyNet: 199,
				highlight: true,
				badge: 'Polecany',
				features: [
					'Do 30 użytkowników',
					'Wszystkie funkcje',
					'Asystent AI: 50 wiadomości miesięcznie (na firmę)',
				],
				cta: 'Wybierz Pro',
			},
			{
				id: 'business',
				name: 'Business',
				monthlyNet: 399,
				highlight: false,
				features: [
					'Do 100 użytkowników',
					'Wszystkie funkcje',
					'Asystent AI: 300 wiadomości miesięcznie (na firmę)',
				],
				cta: 'Wybierz Business',
			},
			{
				id: 'enterprise',
				name: 'Enterprise',
				monthlyNet: 799,
				highlight: false,
				features: [
					'Do 300 użytkowników (lub nielimit — opcja)',
					'Wszystkie funkcje',
					'Asystent AI: 1000+ wiadomości miesięcznie (lub fair use)',
					'Priorytetowe wsparcie',
					'Funkcje na życzenie pod Twój proces',
				],
				cta: 'Wybierz Enterprise',
			},
		],
		addonTitle: 'Pakiety AI (opcjonalne)',
		addonSubtitle: 'Dokup wiadomości Asystenta, gdy zespół potrzebuje więcej.',
		addons: [
			{ id: 'ai50', label: '+50 wiadomości', pricePln: 19, cta: 'Dokup pakiet' },
			{ id: 'ai200', label: '+200 wiadomości', pricePln: 49, cta: 'Dokup pakiet' },
			{ id: 'ai500', label: '+500 wiadomości', pricePln: 99, cta: 'Dokup pakiet' },
		],
		tiersFootnote:
			'* Płatny pakiet możesz anulować w dowolnym momencie — bez długoterminowego zobowiązania.',
		legalTitle: 'Regulaminy',
		legalLinks: [
			{ href: '/terms', label: 'Regulamin' },
			{ href: '/privacy', label: 'Polityka prywatności' },
			{ href: '/dpa', label: 'Umowa DPA' },
			{ href: '/reklamacje', label: 'Reklamacje' },
		],
	},
	en: {
		title: 'Planopia pricing',
		subtitle:
			'Start with a 30-day full-product trial. Then use free time tracking for up to 5 active accounts, or upgrade to paid plans with every feature — net prices, no hidden fees. USD amounts are indicative (1 USD ≈ 3.69 PLN).',
		paidPlansIntro: 'Paid plans (subscription)',
		billingLabel: 'Billing',
		billingMonthly: 'Monthly',
		billingYearly: 'Yearly',
		billingYearlyBadge: '2 months on us',
		billingYearlyHint: 'Pay upfront for 10 months of list price — full 12 months of access.',
		trialTitle: '30 days — full product',
		trialBadge: 'no card',
		trialFeatures: [
			'All features: time tracking, leave, schedules, chat, boards, AI Assistant (trial limits)',
			'AI Assistant: 10 messages one-off during the trial',
			'Up to 5 users in the team',
			'No credit card and no commitment',
		],
		trialCta: 'Create your free team',
		freeTitle: 'Free time tracking — after the trial',
		freeBadge: 'Free',
		freeIntro:
			'No subscription: online time tracking for small teams (after the trial, if you do not buy a paid plan).',
		freeFeatures: ['Up to 5 active accounts', 'Calendars and time records'],
		freeCta: 'Register your team to begin',
		tiers: [
			{
				id: 'starter',
				name: 'Starter',
				monthlyNet: 99,
				highlight: false,
				features: [
					'Up to 10 users',
					'All features',
					'AI Assistant: 10 messages / month (per company)',
				],
				cta: 'Choose Starter',
			},
			{
				id: 'pro',
				name: 'Pro',
				monthlyNet: 199,
				highlight: true,
				badge: 'Recommended',
				features: [
					'Up to 30 users',
					'All features',
					'AI Assistant: 50 messages / month (per company)',
				],
				cta: 'Choose Pro',
			},
			{
				id: 'business',
				name: 'Business',
				monthlyNet: 399,
				highlight: false,
				features: [
					'Up to 100 users',
					'All features',
					'AI Assistant: 300 messages / month (per company)',
				],
				cta: 'Choose Business',
			},
			{
				id: 'enterprise',
				name: 'Enterprise',
				monthlyNet: 799,
				highlight: false,
				features: [
					'Up to 300 users (or unlimited - optional)',
					'All features',
					'AI Assistant: 1000+ messages / month (or fair use)',
					'Priority support',
					'Custom features for your workflows',
				],
				cta: 'Choose Enterprise',
			},
		],
		addonTitle: 'AI add-ons (optional)',
		addonSubtitle: 'Top up AI Assistant messages when your team needs more.',
		addons: [
			{ id: 'ai50', label: '+50 messages', pricePln: 19, cta: 'Add pack' },
			{ id: 'ai200', label: '+200 messages', pricePln: 49, cta: 'Add pack' },
			{ id: 'ai500', label: '+500 messages', pricePln: 99, cta: 'Add pack' },
		],
		tiersFootnote:
			'* You can cancel your paid plan at any time — no long-term commitment. Settlement is in PLN; USD amounts are indicative (1 USD ≈ 3.69 PLN).',
		legalTitle: 'Legal',
		legalLinks: [
			{ href: '/en/terms', label: 'Terms of Service' },
			{ href: '/en/privacy', label: 'Privacy Policy' },
			{ href: '/en/dpa', label: 'Data Processing Agreement' },
			{ href: '/en/complaints', label: 'Complaints' },
		],
	},
} as const

function formatMoney(locale: Locale, amount: number, decimals: number) {
	return amount.toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	})
}

function tierPriceDisplay(
	locale: Locale,
	monthlyNet: number,
	billing: Billing,
): { main: string; period: string; subline: string | null; strike: string | null } {
	if (locale === 'en') {
		const usdFromPln = (pln: number) => formatMoney('en', plnToUsd(pln), 2)
		if (billing === 'monthly') {
			return {
				main: `$${usdFromPln(monthlyNet)}`,
				period: ' / month',
				subline: null,
				strike: null,
			}
		}
		const annualTotalPln = monthlyNet * 10
		const equivMonthlyPln = annualTotalPln / 12
		return {
			main: `$${usdFromPln(equivMonthlyPln)}`,
			period: ' / month, billed annually',
			subline: `Upfront: $${usdFromPln(annualTotalPln)} net / year`,
			strike: `$${usdFromPln(monthlyNet)}`,
		}
	}
	if (billing === 'monthly') {
		return {
			main: `${monthlyNet} zł`,
			period: ' miesięcznie',
			subline: null,
			strike: null,
		}
	}
	const annualTotal = monthlyNet * 10
	const equivMonthly = annualTotal / 12
	const main = `${formatMoney('pl', equivMonthly, 2)} zł`
	const period = ' miesięcznie przy rozliczeniu rocznym'
	const subline = `Płatność z góry: ${formatMoney('pl', annualTotal, 0)} zł netto / rok`
	const strike = `${monthlyNet} zł`
	return { main, period, subline, strike }
}

function FreeTierCard({ locale }: { locale: Locale }) {
	const t = copy[locale] as typeof copy.pl
	return (
		<div className="pricing-free-card h-full flex flex-col text-left rounded-2xl p-5 md:p-6 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border border-slate-200 shadow-sm w-full">
			<div className="flex flex-wrap items-center gap-2 mb-2">
				<h3 className="pricing-free-title text-lg md:text-xl font-bold text-gray-900">{t.freeTitle}</h3>
				<span className="pricing-badge-pill text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-slate-800 text-white shadow-sm">
					{t.freeBadge}
				</span>
			</div>
			<p className="text-gray-600 text-sm mb-3 leading-snug">{t.freeIntro}</p>
			<ul className="grid grid-cols-1 gap-1.5 text-gray-700 text-base shrink-0">
				{t.freeFeatures.map(line => (
					<li key={line} className="flex gap-2 items-start">
						<span className="pricing-feature-check mt-0.5 shrink-0">✓</span>
						<span>{line}</span>
					</li>
				))}
			</ul>
			<div className="mt-auto pt-4 shrink-0">
				<Link
					href="https://app.planopia.pl/team-registration"
					className="pricing-cta pricing-free-team-register-cta inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
				>
					{t.freeCta}
				</Link>
			</div>
		</div>
	)
}

function TrialCard({ locale }: { locale: Locale }) {
	const t = copy[locale]
	return (
		<div className="pricing-trial-card h-full flex flex-col text-left rounded-2xl p-6 md:p-8 bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-100 shadow-sm w-full">
			<div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
				<h3 className="pricing-trial-title text-xl md:text-2xl font-bold text-gray-900">{t.trialTitle}</h3>
				<span className="pricing-badge-pill text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-emerald-600 shadow-sm">
					{t.trialBadge}
				</span>
			</div>
			<ul className="grid grid-cols-1 gap-2 text-gray-700 text-base shrink-0">
				{t.trialFeatures.map(line => (
					<li key={line} className="flex gap-2 items-start">
						<span className="pricing-feature-check mt-0.5">✓</span>
						<span className="pricing-trial-feature-text">{line}</span>
					</li>
				))}
			</ul>
			<div className="mt-auto pt-6 shrink-0">
				<Link
					href="https://app.planopia.pl/team-registration"
					className="pricing-cta pricing-cta--trial inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition"
				>
					{t.trialCta}
				</Link>
			</div>
		</div>
	)
}

export default function LandingPricing({ locale }: { locale: Locale }) {
	const t = copy[locale]
	const [billing, setBilling] = useState<Billing>('monthly')

	return (
		<section id={locale === 'pl' ? 'cennik' : 'prices'} className="landing-pricing py-12 px-4 bg-slate-50/80">
			<div className="max-w-7xl mx-auto">
				<div className="mb-10 text-left w-full">
					<h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{t.title}</h2>
					<p className="mt-3 text-gray-600 text-base md:text-lg">{t.subtitle}</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10 items-stretch">
					<TrialCard locale={locale} />
					<FreeTierCard locale={locale} />
				</div>

				<div className="mb-8 flex flex-col gap-3 items-start" role="group" aria-label={t.billingLabel}>
					<p className="pricing-paid-plans-intro font-semibold text-gray-700 m-0 leading-snug">{t.paidPlansIntro}</p>
					<div className="flex flex-row flex-wrap items-center gap-3">
						<span className="text-sm font-semibold text-gray-800 shrink-0">{t.billingLabel}</span>
						<div className="inline-flex w-fit max-w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
							<button
								type="button"
								className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
									billing === 'monthly'
										? 'bg-slate-900 text-white shadow'
										: 'text-gray-600 hover:text-gray-900'
								}`}
								onClick={() => setBilling('monthly')}
								aria-pressed={billing === 'monthly'}
							>
								{t.billingMonthly}
							</button>
							<button
								type="button"
								className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
									billing === 'yearly'
										? 'bg-slate-900 text-white shadow'
										: 'text-gray-600 hover:text-gray-900'
								}`}
								onClick={() => setBilling('yearly')}
								aria-pressed={billing === 'yearly'}
							>
								{t.billingYearly}
							</button>
						</div>
					</div>
					{billing === 'yearly' && (
						<div className="flex flex-col gap-2.5 items-start max-w-xl rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-4 py-3">
							<span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
								{t.billingYearlyBadge}
							</span>
							<p className="text-sm text-gray-600 leading-relaxed m-0">{t.billingYearlyHint}</p>
						</div>
					)}
				</div>

				<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
					{t.tiers.map(plan => {
						const display = tierPriceDisplay(locale, plan.monthlyNet, billing)
						return (
							<div
								key={plan.id}
								className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition hover:shadow-lg ${plan.highlight ? 'border-indigo-300 bg-white ring-2 ring-indigo-400/30 scale-[1.02] z-[1]' : 'border-gray-200 bg-white'}`}
							>
								{plan.highlight && 'badge' in plan && plan.badge && (
									<span className="pricing-badge-pill pricing-badge-pill--tier absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md max-w-[calc(100%-1.5rem)] text-center whitespace-nowrap">
										{plan.badge}
									</span>
								)}
								<h3 className="pricing-tier-name text-xl font-bold text-gray-900">{plan.name}</h3>
								<div className="mt-4 mb-6">
									{display.strike && (
										<p className="mb-1 text-sm text-gray-400">
											<span className="line-through">{display.strike}</span>
											<span className="sr-only">
												{locale === 'pl' ? 'Cena przy rozliczeniu miesięcznym: ' : 'Monthly list price: '}
											</span>
											<span className="ml-2 text-gray-500 not-italic no-underline">
												{locale === 'pl' ? 'przy płatności miesięcznej' : 'if billed monthly'}
											</span>
										</p>
									)}
									<div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
										<span className="text-3xl md:text-[2rem] font-light tabular-nums text-slate-800">
											{display.main}
										</span>
										<span className="text-gray-600 text-sm font-normal">{display.period}</span>
									</div>
									{display.subline && (
										<p className="mt-2 text-xs text-gray-500 leading-snug">{display.subline}</p>
									)}
								</div>
								<ul className="space-y-2.5 text-sm text-gray-700 flex-1 mb-6">
									{plan.features.map(f => (
										<li key={f} className="flex gap-2.5 items-start">
											<span className="pricing-feature-check mt-0.5 shrink-0 select-none" aria-hidden>
												✓
											</span>
											<span>{f}</span>
										</li>
									))}
								</ul>
								<Link
									href={paymentHref(plan.id, {
										billing: billing === 'yearly' ? 'annual' : 'monthly',
									})}
									className={`pricing-cta mt-auto block text-center w-full py-3 px-4 rounded-xl font-semibold transition shadow-md ${plan.highlight ? 'pricing-cta--gradient bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-95' : 'pricing-cta--dark bg-slate-900 hover:bg-slate-800'}`}
								>
									{plan.cta}
								</Link>
							</div>
						)
					})}
				</div>
				<p className="mt-4 max-w-4xl text-sm text-gray-500 leading-relaxed" role="note">
					{t.tiersFootnote}
				</p>
				<div className="mt-12 rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-fuchsia-50/50 p-6 md:p-8">
					<h3 className="text-lg md:text-xl font-bold text-gray-900">{t.addonTitle}</h3>
					<p className="text-sm text-gray-600 mt-1 mb-6">{t.addonSubtitle}</p>
					<div className="grid sm:grid-cols-3 gap-4">
						{t.addons.map(a => (
							<div
								key={a.id}
								className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white/90 border border-white/80 p-4 shadow-sm"
							>
								<div>
									<p className="font-semibold text-gray-900">{a.label}</p>
									<p className="text-indigo-700 font-bold">
										{locale === 'pl'
											? `${a.pricePln} zł`
											: `$${formatMoney('en', plnToUsd(a.pricePln), 2)}`}
									</p>
								</div>
								<Link
									href={paymentHref('addon', { addon: a.id })}
									className="text-center text-sm font-semibold py-2.5 px-4 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 transition"
								>
									{a.cta}
								</Link>
							</div>
						))}
					</div>
				</div>

				<div className="mt-12 pt-10 border-t border-slate-200 max-w-3xl text-left">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">{t.legalTitle}</h3>
					<nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label={locale === 'pl' ? 'Regulaminy' : 'Legal documents'}>
						{t.legalLinks.map(link => (
							<Link
								key={link.href}
								href={link.href}
								className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2"
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</section>
	)
}
