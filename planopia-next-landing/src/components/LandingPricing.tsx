'use client'

import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useMemo, useState } from 'react'
import { PAYMENT_BASE_URL, paymentHref } from '@/lib/paymentLinks'
import {
	LANDING_ANNUAL_MONTHS_CHARGED,
	landingAddons,
	landingBundles,
	landingCoreMinMonthlyNetPln,
	landingCoreTiers,
	landingModules,
	landingTrial,
	type CorePlanId,
	type ModuleId,
} from '@/data/landingPlanPricing'
import '@/styles/landingPackagesLikeApp.css'

type Locale = 'pl' | 'en'
type Billing = 'monthly' | 'yearly'

const PLN_PER_USD = 3.69

function plnToUsd(pln: number): number {
	return pln / PLN_PER_USD
}

function formatMoney(locale: Locale, amount: number, decimals: number) {
	return amount.toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	})
}

const MODULE_LABELS: Record<ModuleId, { pl: string; en: string }> = {
	timer_qr: { pl: 'Timer + QR', en: 'Timer + QR' },
	schedules_ai: { pl: 'Grafiki + AI', en: 'Schedules + AI' },
	tasks: { pl: 'Zadania (Kanban)', en: 'Tasks (Kanban)' },
	chat: { pl: 'Czat zespołowy', en: 'Team chat' },
	ai_assistant: { pl: 'Asystent AI', en: 'AI Assistant' },
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
		const annualTotalPln = monthlyNet * LANDING_ANNUAL_MONTHS_CHARGED
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
	const annualTotal = monthlyNet * LANDING_ANNUAL_MONTHS_CHARGED
	const equivMonthly = annualTotal / 12
	const main = `${formatMoney('pl', equivMonthly, 2)} zł`
	const period = ' miesięcznie przy rozliczeniu rocznym'
	const subline = `Płatność z góry: ${formatMoney('pl', annualTotal, 0)} zł netto / rok`
	const strike = `${monthlyNet} zł`
	return { main, period, subline, strike }
}

function FreeTierCard({ locale }: { locale: Locale }) {
	const t = copy[locale]
	return (
		<div className="pricing-free-card h-full flex flex-col text-left rounded-2xl p-5 md:p-6 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border border-slate-200 shadow-sm w-full">
			<div className="flex flex-wrap items-center gap-2 mb-2">
				<h3 className="pricing-free-title text-lg md:text-xl font-bold text-gray-900">{t.freeTitle}</h3>
				<span className="pricing-badge-pill pricing-badge-pill--hero font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-slate-800 text-white shadow-sm">
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

function TrialCard({ locale, lines }: { locale: Locale; lines: string[] }) {
	const t = copy[locale]
	return (
		<div className="pricing-trial-card h-full flex flex-col text-left rounded-2xl p-6 md:p-8 bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-100 shadow-sm w-full">
			<div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
				<h3 className="pricing-trial-title text-xl md:text-2xl font-bold text-gray-900">{t.trialTitle}</h3>
				<span className="pricing-badge-pill pricing-badge-pill--hero font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-emerald-600 shadow-sm">
					{t.trialBadge}
				</span>
			</div>
			<ul className="grid grid-cols-1 gap-2 text-gray-700 text-base shrink-0">
				{lines.map(line => (
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

const copy = {
	pl: {
		title: 'Cennik Planopia',
		subtitle:
			'Najpierw 30 dni pełnej aplikacji za darmo. Potem: bezpłatny plan z ewidencją czasu pracy (do 5 aktywnych kont) albo pakiety płatne — ceny netto jak w aplikacji w sekcji „Pakiety i rozliczenia”.',
		paidPlansIntro: 'Pakiety płatne (subskrypcja)',
		billingLabel: 'Rozliczenie',
		billingMonthly: 'Miesięcznie',
		billingYearly: 'Rocznie',
		billingYearlyBadge: '2 miesiące w cenie',
		billingYearlyHint: 'Płacisz z góry za 10 miesięcy — korzystasz przez pełne 12 miesięcy.',
		trialTitle: '30 dni — pełna aplikacja',
		trialBadge: 'bez karty',
		trialCta: 'Załóż darmowy zespół',
		freeTitle: 'Darmowa ewidencja czasu pracy — po okresie próbnym',
		freeBadge: '0 zł',
		freeIntro:
			'Bez abonamentu: ewidencja czasu pracy online dla małych zespołów (po okresie próbnym, jeśli nie wykupisz pakietu).',
		freeFeatures: ['Do 5 aktywnych kont w zespole', 'Kalendarze i rejestracja czasu pracy'],
		freeCta: 'Zacznij od rejestracji zespołu',
		fromWord: 'od',
		recommended: 'Polecany',
		heroCoreTitle: 'Core',
		heroCoreLead: 'Dla firm, które potrzebują ewidencji czasu pracy i urlopów.',
		heroCoreTeamHint: 'Dla zespołów do 100 użytkowników.',
		heroCoreFeat1: 'Ewidencja czasu pracy',
		heroCoreFeat2: 'Urlopy i nieobecności',
		heroCoreFeat3: 'Możliwość rozszerzenia o moduły',
		heroCoreCta: 'Wybierz Core',
		heroProLead: 'Najlepszy wybór dla większości firm. Wszystko w jednym pakiecie.',
		heroBusinessLead: 'Więcej miejsca na zespół, wyższe limity i wsparcie.',
		proBulletModules: 'Wszystkie moduły',
		proBulletAi: 'AI (50 wiadomości / miesięcznie na zespół)',
		proBulletUsers: 'Do 30 użytkowników',
		businessBulletModules: 'Wszystkie moduły',
		businessBulletAi: 'AI (300 wiadomości / miesięcznie, zespół)',
		businessBulletUsers: 'Do 100 użytkowników',
		businessBulletPriority: 'Priorytetowe wsparcie',
		businessBulletIntegrations: 'Dodatkowe funkcje i integracje na życzenie pod Twój biznes',
		payBundleCta: 'Przejdź do płatności w aplikacji',
		enterpriseStripTitle: 'Indywidualna wycena i podejście',
		enterpriseStripBody: 'Gdy gotowe pakiety to za mało — napisz w formularzu, wrócimy z propozycją.',
		enterpriseCta: 'Formularz — opisz potrzebę',
		addonTitle: 'Pakiety AI (opcjonalne)',
		addonSubtitle: 'Dokup wiadomości Asystenta przy aktywnej płatnej subskrypcji — jak w aplikacji.',
		addonOpenPackages: 'Otwórz Pakiety',
		tiersFootnote:
			'* Płatny pakiet możesz anulować w dowolnym momencie. Przyciski prowadzą do sekcji „Pakiety i rozliczenia” w aplikacji — dokończ zakup po zalogowaniu.',
		coreModalTitle: 'Konfiguracja Core',
		coreModalHint: 'Wybierz wielkość zespołu, opcjonalnie moduły — suma poniżej.',
		coreStep1: 'Ile osób w zespole?',
		coreStep2: 'Dodaj moduły (opcjonalnie)',
		coreStep3: 'Podsumowanie',
		coreSeatShort: 'do {{max}} użytkowników',
		coreAiFootnote: '* AI: 50 wiadomości / miesięcznie na zespół.',
		coreTotalLabel: 'Razem',
		coreUpsellPro:
			'Przy tej konfiguracji pakiet PRO (239 zł / miesięcznie) może być korzystniejszy — rozważ przejście na PRO.',
		coreUpsellProCta: 'Zobacz PRO w aplikacji',
		coreContinueCta: 'Kontynuuj zakup w aplikacji',
		corePayFootnote:
			'Core miesięczny: subskrypcja kartą albo BLIK/przelew (także z modułami). Core roczny: tylko BLIK/przelew. Płatność uruchomi się po zalogowaniu.',
		cancel: 'Anuluj',
		netPerMonthShort: 'netto / miesięcznie',
	},
	en: {
		title: 'Planopia pricing',
		subtitle:
			'Start with a 30-day full-product trial. Then use free time tracking for up to 5 active accounts, or upgrade to paid plans — net prices match the in-app Packages & billing page. USD amounts are indicative (1 USD ≈ 3.69 PLN).',
		paidPlansIntro: 'Paid plans (subscription)',
		billingLabel: 'Billing',
		billingMonthly: 'Monthly',
		billingYearly: 'Yearly',
		billingYearlyBadge: '2 months on us',
		billingYearlyHint: 'Pay upfront for 10 months of list price — full 12 months of access.',
		trialTitle: '30 days — full product',
		trialBadge: 'no card',
		trialCta: 'Create your free team',
		freeTitle: 'Free time tracking — after the trial',
		freeBadge: 'Free',
		freeIntro:
			'No subscription: online time tracking for small teams (after the trial, if you do not buy a paid plan).',
		freeFeatures: ['Up to 5 active accounts', 'Calendars and time records'],
		freeCta: 'Register your team to begin',
		fromWord: 'from',
		recommended: 'Recommended',
		heroCoreTitle: 'Core',
		heroCoreLead: 'For companies that need time tracking and leave.',
		heroCoreTeamHint: 'For teams up to 100 users.',
		heroCoreFeat1: 'Time & attendance',
		heroCoreFeat2: 'Leave / absences',
		heroCoreFeat3: 'Option to expand with add-on modules',
		heroCoreCta: 'Choose Core',
		heroProLead: 'Best choice for most companies. Everything in one package.',
		heroBusinessLead: 'More room for your team, higher limits, and support.',
		proBulletModules: 'All modules',
		proBulletAi: 'AI (50 messages / month, team)',
		proBulletUsers: 'Up to 30 users',
		businessBulletModules: 'All modules',
		businessBulletAi: 'AI (300 messages / month, team)',
		businessBulletUsers: 'Up to 100 users',
		businessBulletPriority: 'Priority support',
		businessBulletIntegrations: 'Extra features and integrations tailored to your business',
		payBundleCta: 'Continue to checkout in the app',
		enterpriseStripTitle: 'Individual pricing & approach',
		enterpriseStripBody:
			'When off-the-shelf plans are not enough — tell us in the form; we’ll reply with a proposal.',
		enterpriseCta: 'Open form — describe your needs',
		addonTitle: 'AI add-ons (optional)',
		addonSubtitle: 'Top up AI Assistant messages on an active paid subscription — same as in the app.',
		addonOpenPackages: 'Open Packages',
		tiersFootnote:
			'* You can cancel a paid plan at any time. Buttons take you to Packages & billing in the app — complete your purchase after signing in.',
		coreModalTitle: 'Configure Core',
		coreModalHint: 'Pick team size, optionally add modules — totals below.',
		coreStep1: 'How many people on the team?',
		coreStep2: 'Add modules (optional)',
		coreStep3: 'Summary',
		coreSeatShort: 'Up to {{max}} users',
		coreAiFootnote: '* AI: 50 messages / month, team.',
		coreTotalLabel: 'Total',
		coreUpsellPro:
			'At this configuration, the PRO bundle (239 PLN / month) may be better value — consider upgrading to PRO.',
		coreUpsellProCta: 'Open PRO in the app',
		coreContinueCta: 'Continue purchase in the app',
		corePayFootnote:
			'Core monthly: card subscription or BLIK/transfer (with modules too). Core yearly: BLIK/transfer only. Checkout starts after you sign in.',
		cancel: 'Cancel',
		netPerMonthShort: 'net per month',
	},
} as const

export default function LandingPricing({ locale }: { locale: Locale }) {
	const t = copy[locale]
	const [billing, setBilling] = useState<Billing>('monthly')
	const [coreModalOpen, setCoreModalOpen] = useState(false)
	const [corePlan, setCorePlan] = useState<CorePlanId>('base_s')
	const [coreMods, setCoreMods] = useState<ModuleId[]>([])

	const billingCycleParam = billing === 'yearly' ? 'annual' : 'monthly'

	const trialLines = useMemo(() => {
		const maxU = landingTrial.maxUsers
		const ai = landingTrial.aiTrialOneOffTotal
		if (locale === 'en') {
			return [
				'All features: time tracking, leave, schedules, chat, boards, AI Assistant (trial limits)',
				`AI Assistant: ${ai} messages one-off during the trial`,
				`Up to ${maxU} users in the team`,
				'No credit card and no commitment',
			]
		}
		return [
			'Wszystkie funkcje: ewidencja, urlopy, grafiki, czat, tablice, Asystent AI (w limitach próby)',
			`Asystent AI: ${ai} wiadomości jednorazowo w okresie próbnym`,
			`Do ${maxU} użytkowników w zespole`,
			'Bez karty płatniczej i bez zobowiązania',
		]
	}, [locale])

	const coreHeroDisplay = useMemo(
		() => tierPriceDisplay(locale, landingCoreMinMonthlyNetPln, billing),
		[locale, billing],
	)

	const coreEstimatedMonthly = useMemo(() => {
		const tier = landingCoreTiers.find(x => x.id === corePlan)
		const base = tier?.monthlyNetPln ?? 0
		let m = 0
		for (const id of coreMods) {
			m += landingModules.find(mod => mod.id === id)?.monthlyNetPln ?? 0
		}
		return base + m
	}, [corePlan, coreMods])

	const proBundle = landingBundles.find(b => b.id === 'pro')
	const selectedCoreTier = landingCoreTiers.find(t => t.id === corePlan)
	const coreUpsellVsPro = Boolean(
		proBundle &&
			selectedCoreTier &&
			selectedCoreTier.maxUsers <= proBundle.maxUsers &&
			coreEstimatedMonthly > proBundle.monthlyNetPln,
	)
	const summaryDisplay = useMemo(() => tierPriceDisplay(locale, coreEstimatedMonthly, billing), [locale, coreEstimatedMonthly, billing])

	const checkoutHref = paymentHref(corePlan, {
		billing: billingCycleParam,
		modules: coreMods.length ? coreMods : undefined,
		checkout: true,
	})

	const modalNode =
		coreModalOpen &&
		createPortal(
			<div className="landing-pricing-app-clone">
				<div
					className="packages-modal-overlay packages-modal-overlay--scroll"
					role="dialog"
					aria-modal="true"
					aria-labelledby="landing-core-modal-title"
					onClick={() => setCoreModalOpen(false)}
				>
					<div className="packages-modal packages-modal--wide" onClick={e => e.stopPropagation()}>
					<h4 id="landing-core-modal-title">{t.coreModalTitle}</h4>
					<p className="packages-modal__fallback-intro packages-modal__fallback-intro--compact">{t.coreModalHint}</p>

					<div className="packages-core-step">
						<div className="packages-core-step__head">
							<span className="packages-core-step__num" aria-hidden>
								1
							</span>
							<p className="packages-core-step__title">{t.coreStep1}</p>
						</div>
						<fieldset className="packages-core-fieldset">
							<legend className="packages-core-legend packages-core-legend--vh">{t.coreStep1}</legend>
							{landingCoreTiers.map(ct => (
								<label key={ct.id} className="packages-core-radio">
									<input
										type="radio"
										name="landingCorePlan"
										checked={corePlan === ct.id}
										onChange={() => setCorePlan(ct.id)}
									/>
									<span>
										{t.coreSeatShort.replace('{{max}}', String(ct.maxUsers))} — {ct.monthlyNetPln}{' '}
										{locale === 'pl' ? 'zł / miesięcznie (netto)' : 'PLN / month (net)'}
									</span>
								</label>
							))}
						</fieldset>
					</div>

					<div className="packages-core-step">
						<div className="packages-core-step__head">
							<span className="packages-core-step__num" aria-hidden>
								2
							</span>
							<p className="packages-core-step__title">{t.coreStep2}</p>
						</div>
						<fieldset className="packages-core-fieldset">
							<legend className="packages-core-legend packages-core-legend--vh">{t.coreStep2}</legend>
							{landingModules.map(m => (
								<label key={m.id} className="packages-core-check">
									<input
										type="checkbox"
										checked={coreMods.includes(m.id)}
										onChange={() => {
											setCoreMods(prev =>
												prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id],
											)
										}}
									/>
									<span>
										{MODULE_LABELS[m.id][locale]} (+{m.monthlyNetPln} PLN)
									</span>
								</label>
							))}
						</fieldset>
						<p className="packages-core-module-footnote" role="note">
							{t.coreAiFootnote}
						</p>
					</div>

					<div className="packages-core-step packages-core-step--summary">
						<div className="packages-core-step__head">
							<span className="packages-core-step__num" aria-hidden>
								3
							</span>
							<p className="packages-core-step__title">{t.coreStep3}</p>
						</div>
						<div className="packages-core-total" role="status">
							<div className="packages-core-total__row">
								<strong>{t.coreTotalLabel}</strong>{' '}
								<span className="packages-core-total__amount">{summaryDisplay.main}</span>
								{billing === 'monthly' && (
									<span className="packages-core-total-note">
										{' '}
										{t.netPerMonthShort}
									</span>
								)}
							</div>
							{billing === 'yearly' && summaryDisplay.subline && (
								<p className="packages-core-total-annual-note">{summaryDisplay.subline}</p>
							)}
						</div>
						{coreUpsellVsPro && (
							<div className="packages-core-upsell" role="status">
								{t.coreUpsellPro}
							</div>
						)}
					</div>

					<div className="packages-modal__actions packages-modal__actions--stack packages-modal__actions--pay">
						<a className="packages-pay-btn packages-pay-btn--primary" href={checkoutHref}>
							{t.coreContinueCta}
						</a>
						{coreUpsellVsPro && (
							<a
								className="packages-pay-btn packages-pay-btn--upsell"
								href={paymentHref('pro', { billing: billingCycleParam, checkout: true })}
							>
								{t.coreUpsellProCta}
							</a>
						)}
						<button type="button" className="packages-pay-btn packages-pay-btn--ghost" onClick={() => setCoreModalOpen(false)}>
							{t.cancel}
						</button>
					</div>
					<p className="packages-core-payment-footnote" role="note">
						{t.corePayFootnote}
					</p>
					</div>
				</div>
			</div>,
			document.body,
		)

	return (
		<section id={locale === 'pl' ? 'cennik' : 'prices'} className="landing-pricing py-12 px-4 bg-slate-50/80">
			{modalNode}
			<div className="max-w-7xl mx-auto">
				<div className="mb-10 text-left w-full">
					<h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{t.title}</h2>
					<p className="mt-3 text-gray-600 text-base md:text-lg">{t.subtitle}</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10 items-stretch">
					<TrialCard locale={locale} lines={trialLines} />
					<FreeTierCard locale={locale} />
				</div>

				<div className="mb-8 flex flex-col gap-3 items-start" role="group" aria-label={t.billingLabel}>
					<p
						id={locale === 'pl' ? 'cennik-pakiety-platne' : 'prices-paid-plans'}
						className="pricing-paid-plans-intro font-semibold text-gray-700 m-0 leading-snug scroll-mt-24"
					>
						{t.paidPlansIntro}
					</p>
					<div className="flex flex-row flex-wrap items-center gap-3">
						<span className="text-sm font-semibold text-gray-800 shrink-0">{t.billingLabel}</span>
						<div className="inline-flex w-fit max-w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
							<button
								type="button"
								className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
									billing === 'monthly' ? 'bg-slate-900 text-white shadow' : 'text-gray-600 hover:text-gray-900'
								}`}
								onClick={() => setBilling('monthly')}
								aria-pressed={billing === 'monthly'}
							>
								{t.billingMonthly}
							</button>
							<button
								type="button"
								className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
									billing === 'yearly' ? 'bg-slate-900 text-white shadow' : 'text-gray-600 hover:text-gray-900'
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

				<div className="landing-pricing-app-clone">
					<div className="packages-grid packages-grid--hero">
						<div className="packages-tier packages-tier--core-summary">
							<h3>{t.heroCoreTitle}</h3>
							{coreHeroDisplay.strike && (
								<p className="mb-1 text-sm text-gray-400 m-0">
									<span className="line-through">{coreHeroDisplay.strike}</span>
									<span className="ml-2 text-gray-500 not-italic no-underline">
										{locale === 'pl' ? 'przy płatności miesięcznej' : 'if billed monthly'}
									</span>
								</p>
							)}
							<div className="packages-tier__price">
								{t.fromWord} {coreHeroDisplay.main}
							</div>
							<div className="packages-tier__price-sub">
								{billing === 'yearly' ? coreHeroDisplay.subline : t.netPerMonthShort}
							</div>
							<p className="packages-tier__lead">{t.heroCoreLead}</p>
							<ul className="packages-tier__features">
								<li className="packages-tier__feature">
									<span className="packages-tier__feature-check" aria-hidden>
										✓
									</span>
									<span className="packages-tier__feature-text">
										<strong>{t.heroCoreFeat1}</strong>
									</span>
								</li>
								<li className="packages-tier__feature">
									<span className="packages-tier__feature-check" aria-hidden>
										✓
									</span>
									<span className="packages-tier__feature-text">
										<strong>{t.heroCoreFeat2}</strong>
									</span>
								</li>
								<li className="packages-tier__feature">
									<span className="packages-tier__feature-check" aria-hidden>
										✓
									</span>
									<span className="packages-tier__feature-text">{t.heroCoreFeat3}</span>
								</li>
							</ul>
							<p className="packages-tier__hint">{t.heroCoreTeamHint}</p>
							<button
								type="button"
								className="packages-tier__cta"
								onClick={() => {
									setCorePlan('base_s')
									setCoreMods([])
									setCoreModalOpen(true)
								}}
							>
								{t.heroCoreCta}
							</button>
						</div>

						{landingBundles.map(bundle => {
							const isPro = bundle.id === 'pro'
							const d = tierPriceDisplay(locale, bundle.monthlyNetPln, billing)
							return (
								<div key={bundle.id} className={`packages-tier${isPro ? ' packages-tier--highlight' : ''}`}>
									{isPro && <span className="packages-tier__badge">{t.recommended}</span>}
									<h3>{bundle.id === 'pro' ? 'PRO' : 'Business'}</h3>
									{d.strike && (
										<p className="mb-1 text-sm text-gray-400 m-0">
											<span className="line-through">{d.strike}</span>
											<span className="ml-2 text-gray-500 not-italic no-underline">
												{locale === 'pl' ? 'przy płatności miesięcznej' : 'if billed monthly'}
											</span>
										</p>
									)}
									<div className="packages-tier__price">{d.main}</div>
									<div className="packages-tier__price-sub">{billing === 'yearly' ? d.subline : t.netPerMonthShort}</div>
									{bundle.id === 'pro' ? (
										<p className="packages-tier__lead">{t.heroProLead}</p>
									) : (
										<p className="packages-tier__lead">{t.heroBusinessLead}</p>
									)}
									<ul className="packages-tier__features">
										{bundle.id === 'pro' ? (
											<>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">
														<strong>{t.proBulletModules}</strong>
													</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">{t.proBulletAi}</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">{t.proBulletUsers}</span>
												</li>
											</>
										) : (
											<>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">
														<strong>{t.businessBulletModules}</strong>
													</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">{t.businessBulletAi}</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">{t.businessBulletUsers}</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">
														<strong>{t.businessBulletPriority}</strong>
													</span>
												</li>
												<li className="packages-tier__feature">
													<span className="packages-tier__feature-check" aria-hidden>
														✓
													</span>
													<span className="packages-tier__feature-text">
														<strong>{t.businessBulletIntegrations}</strong>
													</span>
												</li>
											</>
										)}
									</ul>
									<a
										className="packages-tier__bundle-cta"
										href={paymentHref(bundle.id, { billing: billingCycleParam, checkout: true })}
									>
										{t.payBundleCta}
									</a>
								</div>
							)
						})}
					</div>

					<section className="packages-enterprise-strip" aria-labelledby="landing-enterprise-heading">
						<div className="packages-enterprise-strip__main">
							<h3 id="landing-enterprise-heading">{t.enterpriseStripTitle}</h3>
							<p className="packages-enterprise-strip__body">{t.enterpriseStripBody}</p>
						</div>
						<div className="packages-enterprise-strip__cta">
							<Link className="packages-enterprise-strip__btn" href={locale === 'pl' ? '/#kontakt' : '/en#contact'}>
								{t.enterpriseCta}
							</Link>
						</div>
					</section>

					<div className="mt-12 rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-fuchsia-50/50 p-6 md:p-8">
						<h3 className="text-lg md:text-xl font-bold text-gray-900">{t.addonTitle}</h3>
						<p className="text-sm text-gray-600 mt-1 mb-6">{t.addonSubtitle}</p>
						<div className="grid sm:grid-cols-3 gap-4">
							{landingAddons.map(a => (
								<div
									key={a.id}
									className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white/90 border border-white/80 p-4 shadow-sm"
								>
									<div>
										<p className="font-semibold text-gray-900">
											{locale === 'pl' ? `+${a.messages} wiadomości` : `+${a.messages} messages`}
										</p>
										<p className="pricing-addon-price text-indigo-700 font-bold">
											{locale === 'pl' ? `${a.pricePlnNet} zł` : `$${formatMoney('en', plnToUsd(a.pricePlnNet), 2)}`}
										</p>
									</div>
									<Link
										href={paymentHref('addon', { addon: a.id, billing: billingCycleParam })}
										className="text-center text-sm font-semibold py-2.5 px-4 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 transition shrink-0"
									>
										{t.addonOpenPackages}
									</Link>
								</div>
							))}
						</div>
					</div>
				</div>

				<p className="mt-4 text-sm text-gray-500 leading-relaxed" role="note">
					{t.tiersFootnote}{' '}
					<Link href={PAYMENT_BASE_URL} className="text-indigo-700 underline font-medium">
						{PAYMENT_BASE_URL.replace('https://', '')}
					</Link>
				</p>
			</div>
		</section>
	)
}
