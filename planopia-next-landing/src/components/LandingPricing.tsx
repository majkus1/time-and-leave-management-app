'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { paymentHref } from '@/lib/paymentLinks'
import { recommendPlan, type CalculatorNeeds, type PricingData } from '@/lib/pricingCalculator'
import {
	LANDING_ANNUAL_MONTHS_CHARGED,
	LANDING_TRIAL_DAYS,
	landingBundles,
	landingCoreTiers,
	landingFeatures,
	landingModules,
	landingTrial,
	type FeatureId,
	type ModuleId,
} from '@/data/landingPlanPricing'
import { FEATURE_COPY, MODULE_COPY, PLAN_NAME, PRICING_FEATURE_EVENT, type Locale } from '@/data/landingFeatureCopy'
import '@/styles/landingFeaturesPricing.css'

type Billing = 'monthly' | 'annual'
type NeedKey = 'leave' | 'reports' | 'ai' | ModuleId

const REGISTER_URL = 'https://app.planopia.pl/team-registration'
/** Kwoty w USD na wersji EN są orientacyjne — rozliczamy w PLN */
const PLN_PER_USD = 3.69
const USERS_MAX_SLIDER = 120
const DEFAULT_USERS = 8

const PRICING: PricingData = {
	freeMaxUsers: landingTrial.maxUsers,
	coreTiers: landingCoreTiers,
	bundles: landingBundles,
	modules: landingModules,
}

/** Pola „czego potrzebujesz” — te same nazwy co kafelki „O aplikacji” */
const NEED_FIELDS: { feature: FeatureId; need: NeedKey }[] = [
	{ feature: 'leave', need: 'leave' },
	{ feature: 'team_reports', need: 'reports' },
	{ feature: 'ai_assistant', need: 'ai' },
	{ feature: 'timer_qr', need: 'timer_qr' },
	{ feature: 'schedules', need: 'schedules_ai' },
	{ feature: 'tasks_chat', need: 'tasks_chat' },
]

/** Plakietka z kafelka → pole kalkulatora. Przegląd zespołu i powiadomienia są w Core, więc wystarczy dowolna funkcja Core. */
const FEATURE_TO_NEED: Partial<Record<FeatureId, NeedKey>> = {
	leave: 'leave',
	team_overview: 'reports',
	team_reports: 'reports',
	ai_assistant: 'ai',
	notifications: 'leave',
	timer_qr: 'timer_qr',
	schedules: 'schedules_ai',
	tasks_chat: 'tasks_chat',
}

const ALWAYS_INCLUDED: FeatureId[] = ['timesheet', 'timesheet_print', 'mobile']

const COPY = {
	pl: {
		eyebrow: 'Cennik',
		title: 'Policz cenę dla swojego zespołu',
		subtitle: `Zacznij od ${LANDING_TRIAL_DAYS} dni pełnej aplikacji za darmo, bez karty. Potem wybierasz plan — albo zostajesz w darmowym planie, jeśli macie do ${landingTrial.maxUsers} osób.`,
		people: 'Ile osób w zespole?',
		always: 'Zawsze w cenie',
		needs: 'Czego jeszcze potrzebujesz?',
		needInCore: 'w planie Core',
		needModule: (price: string) => `moduł + ${price} / mies.`,
		billingGroup: 'Sposób rozliczenia',
		monthly: 'Miesięcznie',
		annual: 'Rocznie',
		annualSave: '2 miesiące gratis',
		recommended: 'Polecamy dla Was',
		perMonth: 'netto / mies.',
		perYear: 'netto / rok',
		annualEquivalent: (x: string) => `czyli ${x} netto miesięcznie`,
		freeName: 'Darmowy',
		freePrice: '0 zł',
		freePeriod: 'bez limitu czasu',
		freeWhy: `Do ${landingTrial.maxUsers} osób ewidencja czasu i wydruk ewidencji są za darmo.`,
		freeIncludes: 'W cenie: ewidencja czasu, wydruk ewidencji każdej osoby (PDF, Excel), aplikacja na telefon.',
		freeAlt: (plan: string, price: string) => `Urlopy, raporty zespołu i asystent AI są w planie ${plan} — ${price}`,
		customName: 'Ponad 100 osób',
		customPrice: 'Wycena indywidualna',
		customWhy: 'Napisz do nas — dopasujemy plan i warunki do wielkości firmy.',
		customCta: 'Napisz do nas',
		whyBundleCheaper: (core: string) => `Z tymi funkcjami ten plan wychodzi taniej niż Core z modułami (${core}).`,
		whyBundleSame: 'Tyle samo co Core z wybranymi modułami, a masz wszystkie funkcje.',
		whyBundleNudge: (diff: string) => `Tylko ${diff} więcej niż Core z wybranymi modułami, a masz wszystkie funkcje.`,
		whyCoreModules: 'Płacisz tylko za moduły, których potrzebujesz.',
		whyCore: 'Wszystko, czego zespół potrzebuje na co dzień.',
		whyOverFree: (n: number) =>
			`Darmowy plan obejmuje do ${landingTrial.maxUsers} osób — przy ${n} osobach to najtańszy plan.`,
		includesCore: 'W cenie: ewidencja czasu, urlopy, przegląd i raporty zespołu, powiadomienia, asystent AI bez limitu',
		includesBundle:
			'Wszystko w cenie: ewidencja czasu, urlopy, przegląd i raporty zespołu, powiadomienia, asystent AI, Timer i QR, grafik pracy, zadania i czat.',
		includesBusinessExtra: ' Priorytetowe wsparcie.',
		cta: `Załóż zespół — ${LANDING_TRIAL_DAYS} dni za darmo`,
		ctaExisting: 'Masz już konto? Wybierz ten plan w aplikacji',
		altOr: (plan: string, price: string) => `Albo ${plan} — ${price}`,
		altAll: (plan: string, price: string) => `Wszystkie funkcje: ${plan} — ${price}`,
		trialNote: `Okres próbny: pełna aplikacja przez ${LANDING_TRIAL_DAYS} dni, do ${landingTrial.maxUsers} osób, bez karty. Plan wybierasz potem w aplikacji.`,
		plansTitle: 'Wszystkie plany w skrócie',
		plans: {
			free: { name: 'Darmowy', price: '0 zł', desc: `Do ${landingTrial.maxUsers} osób: ewidencja czasu i wydruk ewidencji.` },
			core: { name: 'Core', desc: 'Ewidencja, urlopy, przegląd i raporty zespołu, powiadomienia, asystent AI.' },
			pro: { name: 'PRO', desc: 'Wszystko w cenie, także Timer i QR, grafik pracy, zadania i czat.' },
			business: { name: 'Business', desc: 'Wszystko w cenie i priorytetowe wsparcie.' },
		},
		from: 'od',
		upTo: (n: number) => `do ${n} os.`,
		upToLong: (n: number) => `do ${n} osób`,
		modulesLine: 'Moduły do Core',
		compare: 'Porównaj wszystkie plany',
		compareFeature: 'Funkcja',
		comparePeople: 'Liczba osób',
		comparePrice: 'Cena netto / mies.',
		notes: `Ceny netto. Płacisz kartą, BLIK-iem lub przelewem. Rocznie płacisz za ${LANDING_ANNUAL_MONTHS_CHARGED} miesięcy zamiast 12. Plan możesz anulować w dowolnym momencie.`,
		enterprise: 'Ponad 100 osób albo potrzebujesz czegoś szytego na miarę?',
		enterpriseLink: 'Napisz do nas',
		contactHref: '/kontakt',
	},
	en: {
		eyebrow: 'Pricing',
		title: 'Work out the price for your team',
		subtitle: `Start with ${LANDING_TRIAL_DAYS} days of the full app for free, no card needed. Then pick a plan — or stay on the free plan if you have up to ${landingTrial.maxUsers} people.`,
		people: 'How many people are on your team?',
		always: 'Always included',
		needs: 'What else do you need?',
		needInCore: 'in the Core plan',
		needModule: (price: string) => `module + ${price} / mo`,
		billingGroup: 'Billing period',
		monthly: 'Monthly',
		annual: 'Yearly',
		annualSave: '2 months free',
		recommended: 'Recommended for you',
		perMonth: 'net / month',
		perYear: 'net / year',
		annualEquivalent: (x: string) => `that is ${x} net per month`,
		freeName: 'Free',
		freePrice: '$0',
		freePeriod: 'no time limit',
		freeWhy: `For up to ${landingTrial.maxUsers} people, time tracking and timesheet printouts are free.`,
		freeIncludes: 'Included: time tracking, each person’s timesheet printout (PDF, Excel), phone app.',
		freeAlt: (plan: string, price: string) => `Leave, team reports and the AI assistant come with ${plan} — ${price}`,
		customName: 'Over 100 people',
		customPrice: 'Custom quote',
		customWhy: 'Write to us — we will fit the plan and terms to the size of your company.',
		customCta: 'Contact us',
		whyBundleCheaper: (core: string) => `With these features this plan is cheaper than Core with modules (${core}).`,
		whyBundleSame: 'Same price as Core with the modules you picked — and you get every feature.',
		whyBundleNudge: (diff: string) => `Only ${diff} more than Core with the modules you picked — and you get every feature.`,
		whyCoreModules: 'You only pay for the modules you need.',
		whyCore: 'Everything your team needs day to day.',
		whyOverFree: (n: number) => `The free plan covers up to ${landingTrial.maxUsers} people — for ${n} people this is the cheapest plan.`,
		includesCore: 'Included: time tracking, leave, team overview and reports, notifications, AI assistant with no limit',
		includesBundle:
			'Everything included: time tracking, leave, team overview and reports, notifications, AI assistant, timer and QR, work schedules, tasks and chat.',
		includesBusinessExtra: ' Priority support.',
		cta: `Create your team — ${LANDING_TRIAL_DAYS} days free`,
		ctaExisting: 'Already have an account? Choose this plan in the app',
		altOr: (plan: string, price: string) => `Or ${plan} — ${price}`,
		altAll: (plan: string, price: string) => `Every feature: ${plan} — ${price}`,
		trialNote: `Trial: the full app for ${LANDING_TRIAL_DAYS} days, up to ${landingTrial.maxUsers} people, no card. You choose a plan later in the app.`,
		plansTitle: 'All plans at a glance',
		plans: {
			free: { name: 'Free', price: '$0', desc: `Up to ${landingTrial.maxUsers} people: time tracking and timesheet printouts.` },
			core: { name: 'Core', desc: 'Time tracking, leave, team overview and reports, notifications, AI assistant.' },
			pro: { name: 'PRO', desc: 'Everything included, also timer and QR, work schedules, tasks and chat.' },
			business: { name: 'Business', desc: 'Everything included, plus priority support.' },
		},
		from: 'from',
		upTo: (n: number) => `up to ${n}`,
		upToLong: (n: number) => `up to ${n} people`,
		modulesLine: 'Core modules',
		compare: 'Compare all plans',
		compareFeature: 'Feature',
		comparePeople: 'Team size',
		comparePrice: 'Net price / month',
		notes: `Net prices, billed in PLN — USD amounts are approximate (1 USD ≈ ${PLN_PER_USD} PLN). Pay by card, BLIK or bank transfer. Yearly: you pay for ${LANDING_ANNUAL_MONTHS_CHARGED} months instead of 12. You can cancel a plan at any time.`,
		enterprise: 'Over 100 people, or need something tailored?',
		enterpriseLink: 'Contact us',
		contactHref: '/en#contact',
	},
} as const

function money(locale: Locale, pln: number) {
	if (locale === 'en') {
		const usd = pln / PLN_PER_USD
		return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
	}
	const whole = Number.isInteger(pln)
	return `${pln.toLocaleString('pl-PL', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })} zł`
}

function peopleLabel(locale: Locale, n: number) {
	if (locale === 'en') return n === 1 ? '1 person' : `${n} people`
	if (n === 1) return '1 osoba'
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return `${n} osoby`
	return `${n} osób`
}

/** „netto / mies.” kończy się kropką — nie dokładamy drugiej */
function sentence(text: string) {
	return text.endsWith('.') ? text : `${text}.`
}

/** Rejestracja z wybranym planem — aplikacja podpowie go potem w Pakietach */
function registerHref(params: { plan?: string; modules?: readonly string[]; users: number; billing: Billing }) {
	const u = new URL(REGISTER_URL)
	if (params.plan) u.searchParams.set('plan', params.plan)
	if (params.modules?.length) u.searchParams.set('modules', params.modules.join(','))
	u.searchParams.set('users', String(params.users))
	u.searchParams.set('billing', params.billing)
	return u.toString()
}

type Card = {
	name: string
	price: string
	period: string
	equivalent: string | null
	why: string
	includes: string
	alt: string | null
	cta: { href: string; label: string; internal: boolean }
	existingHref: string | null
}

export default function LandingPricing({ locale }: { locale: Locale }) {
	const t = COPY[locale]
	const [users, setUsers] = useState(DEFAULT_USERS)
	const [billing, setBilling] = useState<Billing>('monthly')
	const [checked, setChecked] = useState<Partial<Record<NeedKey, boolean>>>({ leave: true })

	// Plakietka z kafelka „O aplikacji” zaznacza funkcję (LandingFeatureTiles)
	useEffect(() => {
		const onFeature = (e: Event) => {
			const featureId = (e as CustomEvent<{ featureId?: FeatureId }>).detail?.featureId
			const need = featureId ? FEATURE_TO_NEED[featureId] : undefined
			if (need) setChecked(prev => ({ ...prev, [need]: true }))
		}
		window.addEventListener(PRICING_FEATURE_EVENT, onFeature)
		return () => window.removeEventListener(PRICING_FEATURE_EVENT, onFeature)
	}, [])

	const needs: CalculatorNeeds = useMemo(
		() => ({
			leave: checked.leave,
			reports: checked.reports,
			ai: checked.ai,
			modules: landingModules.map(m => m.id).filter(id => checked[id]),
		}),
		[checked],
	)
	const rec = useMemo(() => recommendPlan(users, needs, PRICING), [users, needs])

	const yearly = billing === 'annual'
	const months = yearly ? LANDING_ANNUAL_MONTHS_CHARGED : 1
	const period = yearly ? t.perYear : t.perMonth
	const inline = (monthlyNet: number) => `${money(locale, monthlyNet * months)} ${period}`
	const equivalent = (monthlyNet: number) =>
		yearly ? t.annualEquivalent(money(locale, Math.round(((monthlyNet * months) / 12) * 100) / 100)) : null
	const moduleNames = (mods: readonly string[]) => mods.map(m => MODULE_COPY[m as ModuleId][locale])
	const coreName = (planKey: string, mods: readonly string[]) => [PLAN_NAME[planKey][locale], ...moduleNames(mods)].join(' + ')
	const noNeeds = !checked.leave && !checked.reports && !checked.ai && needs.modules?.length === 0

	let card: Card
	if (rec.kind === 'free') {
		const smallest = landingCoreTiers[0]
		card = {
			name: t.freeName,
			price: t.freePrice,
			period: t.freePeriod,
			equivalent: null,
			why: t.freeWhy,
			includes: t.freeIncludes,
			alt: sentence(t.freeAlt(PLAN_NAME[smallest.id][locale], inline(smallest.monthlyNetPln))),
			cta: { href: registerHref({ users, billing }), label: t.cta, internal: false },
			existingHref: null,
		}
	} else if (rec.kind === 'custom') {
		card = {
			name: t.customName,
			price: t.customPrice,
			period: '',
			equivalent: null,
			why: t.customWhy,
			includes: t.includesBundle,
			alt: null,
			cta: { href: t.contactHref, label: t.customCta, internal: true },
			existingHref: null,
		}
	} else if (rec.kind === 'bundle') {
		const { bundle, core } = rec
		const diff = bundle.monthlyNetPln - core.monthlyNetPln
		const why =
			diff < 0 ? t.whyBundleCheaper(inline(core.monthlyNetPln)) : diff === 0 ? t.whyBundleSame : t.whyBundleNudge(money(locale, diff * months))
		card = {
			name: PLAN_NAME[bundle.planKey][locale],
			price: money(locale, bundle.monthlyNetPln * months),
			period,
			equivalent: equivalent(bundle.monthlyNetPln),
			why,
			includes: t.includesBundle + (bundle.planKey === 'business' ? t.includesBusinessExtra : ''),
			alt: sentence(t.altOr(coreName(core.planKey, core.modules), inline(core.monthlyNetPln))),
			cta: { href: registerHref({ plan: bundle.planKey, users, billing }), label: t.cta, internal: false },
			existingHref: paymentHref(bundle.planKey, { billing, checkout: true }),
		}
	} else {
		const { core, bundle } = rec
		const mods = core.modules
		card = {
			name: coreName(core.planKey, mods),
			price: money(locale, core.monthlyNetPln * months),
			period,
			equivalent: equivalent(core.monthlyNetPln),
			why: noNeeds ? t.whyOverFree(users) : mods.length ? t.whyCoreModules : t.whyCore,
			includes: `${[t.includesCore, ...moduleNames(mods)].join(', ')}.`,
			alt: sentence(t.altAll(PLAN_NAME[bundle.planKey][locale], inline(bundle.monthlyNetPln))),
			cta: { href: registerHref({ plan: core.planKey, modules: mods, users, billing }), label: t.cta, internal: false },
			existingHref: paymentHref(core.planKey, { billing, modules: mods.length ? mods : undefined, checkout: true }),
		}
	}

	// Wypełnienie paska suwaka (CSS nie zna wartości inputa)
	const sliderFill = `${((Math.min(users, USERS_MAX_SLIDER) - 1) / (USERS_MAX_SLIDER - 1)) * 100}%`
	const coreFrom = landingCoreTiers[0].monthlyNetPln
	const proTiers = landingBundles.filter(b => b.id !== 'business')
	const business = landingBundles.find(b => b.id === 'business')

	/** Komórka tabeli porównania: plan funkcji z planCatalog.FEATURES */
	const matrixCell = (feature: (typeof landingFeatures)[number], column: 'free' | 'core' | 'bundle') => {
		const yes = (
			<span className="lp-compare__yes" aria-label={locale === 'pl' ? 'tak' : 'yes'}>
				✓
			</span>
		)
		const no = (
			<span className="lp-compare__no" aria-label={locale === 'pl' ? 'nie' : 'no'}>
				—
			</span>
		)
		if (feature.plan === 'free' || feature.plan === 'all') return yes
		if (column === 'free') return no
		if (feature.plan === 'core' || column === 'bundle') return yes
		const moduleId = 'module' in feature ? feature.module : null
		const price = landingModules.find(m => m.id === moduleId)?.monthlyNetPln
		return price != null ? <span className="lp-compare__extra">+ {money(locale, price)}</span> : no
	}

	return (
		<section id={locale === 'pl' ? 'cennik' : 'prices'} className="lp-section py-12 px-4" aria-labelledby="lp-title">
			<div className="max-w-7xl mx-auto">
				<div className="landing-about-heading-block">
					<p className="landing-about-heading-eyebrow landing-section-eyebrow">{t.eyebrow}</p>
					<h2 id="lp-title" className="landing-about-heading-title">
						{t.title}
					</h2>
					<p className="landing-about-intro mt-4 text-lg text-gray-600">{t.subtitle}</p>
				</div>

				<div className="lp-calc">
					<div className="lp-card">
						<div className="lp-step">
							<div className="lp-step__head">
								<label className="lp-label" htmlFor="lp-users-range">
									{t.people}
								</label>
								<output className="lp-users__value" htmlFor="lp-users-range" aria-live="polite">
									{peopleLabel(locale, users)}
								</output>
							</div>
							<div className="lp-users">
								<input
									id="lp-users-range"
									type="range"
									min={1}
									max={USERS_MAX_SLIDER}
									step={1}
									value={Math.min(users, USERS_MAX_SLIDER)}
									onChange={e => setUsers(Number(e.target.value))}
									style={{ '--lp-fill': sliderFill } as CSSProperties}
									aria-valuetext={peopleLabel(locale, users)}
								/>
								<input
									type="number"
									inputMode="numeric"
									className="lp-users__number"
									min={1}
									max={999}
									value={users}
									onChange={e => setUsers(Math.max(1, Math.min(999, Math.floor(Number(e.target.value)) || 1)))}
									aria-label={t.people}
								/>
							</div>
						</div>

						<div className="lp-step">
							<div className="lp-step__head">
								<div className="lp-label">{t.always}</div>
							</div>
							<ul className="lp-always">
								{ALWAYS_INCLUDED.map(id => (
									<li key={id} className="lp-always__item">
										<span className="lp-check" aria-hidden="true">
											✓
										</span>
										{FEATURE_COPY[id][locale].title}
									</li>
								))}
							</ul>
						</div>

						<fieldset className="lp-step lp-fieldset">
							<legend className="lp-label lp-legend">{t.needs}</legend>
							<div className="lp-needs">
								{NEED_FIELDS.map(field => {
									const on = Boolean(checked[field.need])
									const modulePrice = landingModules.find(m => m.id === field.need)?.monthlyNetPln
									return (
										<label key={field.need} className={`lp-need${on ? ' lp-need--on' : ''}`}>
											<input
												type="checkbox"
												checked={on}
												onChange={e => setChecked(prev => ({ ...prev, [field.need]: e.target.checked }))}
											/>
											<span className="lp-need__body">
												<span className="lp-need__text">{FEATURE_COPY[field.feature][locale].title}</span>
												<span className="lp-need__hint">
													{modulePrice != null ? t.needModule(money(locale, modulePrice)) : t.needInCore}
												</span>
											</span>
										</label>
									)
								})}
							</div>
						</fieldset>

						<div className="lp-step">
							<div className="lp-billing" role="group" aria-label={t.billingGroup}>
								<button
									type="button"
									className={`lp-billing__btn${billing === 'monthly' ? ' lp-billing__btn--on' : ''}`}
									aria-pressed={billing === 'monthly'}
									onClick={() => setBilling('monthly')}
								>
									{t.monthly}
								</button>
								<button
									type="button"
									className={`lp-billing__btn${billing === 'annual' ? ' lp-billing__btn--on' : ''}`}
									aria-pressed={billing === 'annual'}
									onClick={() => setBilling('annual')}
								>
									{t.annual}
									<small className="lp-billing__save">{t.annualSave}</small>
								</button>
							</div>
						</div>
					</div>

					<div className="lp-card lp-result" aria-live="polite">
						<div className="lp-result__badge">{t.recommended}</div>
						<div className="lp-result__name">{card.name}</div>
						<div className="lp-result__price">
							{card.price}
							{card.period ? <small className="lp-result__period">{card.period}</small> : null}
						</div>
						{card.equivalent ? <div className="lp-result__equiv">{card.equivalent}</div> : null}
						<div className="lp-result__why">{card.why}</div>
						<div className="lp-result__includes">{card.includes}</div>
						{card.cta.internal ? (
							<Link className="lp-result__cta" href={card.cta.href}>
								{card.cta.label}
							</Link>
						) : (
							<a className="lp-result__cta" href={card.cta.href}>
								{card.cta.label}
							</a>
						)}
						{card.existingHref ? (
							<a className="lp-result__existing" href={card.existingHref}>
								{t.ctaExisting}
							</a>
						) : null}
						{card.alt ? <div className="lp-result__alt">{card.alt}</div> : null}
						<div className="lp-result__trial">{t.trialNote}</div>
					</div>
				</div>

				<div id={locale === 'pl' ? 'cennik-pakiety-platne' : 'prices-paid-plans'} className="lp-plans scroll-mt-24">
					<h3 className="lp-plans__title">{t.plansTitle}</h3>
					<ul className="lp-plans__grid">
						<li className="lp-plan">
							<div className="lp-plan__name">{t.plans.free.name}</div>
							<div className="lp-plan__price">{t.plans.free.price}</div>
							<div className="lp-plan__desc">{t.plans.free.desc}</div>
						</li>
						<li className="lp-plan">
							<div className="lp-plan__name">{t.plans.core.name}</div>
							<div className="lp-plan__price">
								{t.from} {money(locale, coreFrom)}
							</div>
							<div className="lp-plan__desc">{t.plans.core.desc}</div>
							<div className="lp-plan__tiers">
								{landingCoreTiers.map(tier => `${t.upTo(tier.maxUsers)} ${money(locale, tier.monthlyNetPln)}`).join(' · ')}
							</div>
						</li>
						<li className="lp-plan">
							<div className="lp-plan__name">{t.plans.pro.name}</div>
							<div className="lp-plan__price">
								{t.from} {money(locale, proTiers[0].monthlyNetPln)}
							</div>
							<div className="lp-plan__desc">{t.plans.pro.desc}</div>
							<div className="lp-plan__tiers">
								{proTiers.map(tier => `${t.upTo(tier.maxUsers)} ${money(locale, tier.monthlyNetPln)}`).join(' · ')}
							</div>
						</li>
						{business ? (
							<li className="lp-plan">
								<div className="lp-plan__name">{t.plans.business.name}</div>
								<div className="lp-plan__price">{money(locale, business.monthlyNetPln)}</div>
								<div className="lp-plan__desc">{t.plans.business.desc}</div>
								<div className="lp-plan__tiers">{t.upToLong(business.maxUsers)}</div>
							</li>
						) : null}
					</ul>
					<div className="lp-plans__modules">
						<b>{t.modulesLine}:</b>{' '}
						{landingModules.map(m => `${MODULE_COPY[m.id][locale]} + ${money(locale, m.monthlyNetPln)}`).join(' · ')} ({t.perMonth})
					</div>

					<details className="lp-compare">
						<summary className="lp-compare__summary">{t.compare}</summary>
						<div className="lp-compare__scroll">
							<table className="lp-compare__table">
								<thead>
									<tr>
										<th scope="col">{t.compareFeature}</th>
										<th scope="col">{t.plans.free.name}</th>
										<th scope="col">{t.plans.core.name}</th>
										<th scope="col">{t.plans.pro.name}</th>
										<th scope="col">{t.plans.business.name}</th>
									</tr>
								</thead>
								<tbody>
									{landingFeatures.map(f => (
										<tr key={f.id}>
											<th scope="row">{FEATURE_COPY[f.id][locale].title}</th>
											<td>{matrixCell(f, 'free')}</td>
											<td>{matrixCell(f, 'core')}</td>
											<td>{matrixCell(f, 'bundle')}</td>
											<td>{matrixCell(f, 'bundle')}</td>
										</tr>
									))}
									<tr>
										<th scope="row">{t.comparePeople}</th>
										<td>{t.upTo(landingTrial.maxUsers)}</td>
										<td>{t.upTo(landingCoreTiers[landingCoreTiers.length - 1].maxUsers)}</td>
										<td>{t.upTo(proTiers[proTiers.length - 1].maxUsers)}</td>
										<td>{business ? t.upTo(business.maxUsers) : '—'}</td>
									</tr>
									<tr>
										<th scope="row">{t.comparePrice}</th>
										<td>{t.plans.free.price}</td>
										<td>
											{t.from} {money(locale, coreFrom)}
										</td>
										<td>
											{t.from} {money(locale, proTiers[0].monthlyNetPln)}
										</td>
										<td>{business ? money(locale, business.monthlyNetPln) : '—'}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</details>

					<div className="lp-notes">{t.notes}</div>
					<div className="lp-notes">
						{t.enterprise}{' '}
						<Link href={t.contactHref} className="lp-link">
							{t.enterpriseLink}
						</Link>
					</div>
				</div>
			</div>
		</section>
	)
}
