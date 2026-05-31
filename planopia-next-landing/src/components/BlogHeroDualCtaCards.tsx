import Link from 'next/link'
import type { ReactNode } from 'react'

type Locale = 'pl' | 'en'

type Props = {
	locale: Locale
	/** Lewa karta — jeśli brak, używany jest domyślny tekst „kompleksowa aplikacja”. */
	trial?: ReactNode
	trialCtaLabel?: string
	trialHref?: string
	trialDownload?: boolean
	/** Prawa karta — jeśli brak, domyślny tekst o większych firmach. */
	enterprise?: ReactNode
	/** Nadpisanie etykiety przycisku cennika (np. EN: „View pricing”). */
	pricingCtaLabel?: string
	/** Nadpisanie linku prawego przycisku, np. do pobrania pliku. */
	pricingHref?: string
	/** Dodaje atrybut download do prawego przycisku. */
	pricingDownload?: boolean
}

const btnClass =
	'blog-hero-dual-cta__btn mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-5 py-3.5 text-center text-sm font-semibold shadow-md transition hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:text-[15px] text-white !text-white [text-decoration:none] visited:text-white hover:text-white'

/**
 * Dwie karty CTA w hero wybranych wpisów blogowych (spójny, nowoczesny styl).
 */
export default function BlogHeroDualCtaCards({
	locale,
	trial,
	trialCtaLabel,
	trialHref,
	trialDownload,
	enterprise,
	pricingCtaLabel,
	pricingHref,
	pricingDownload,
}: Props) {
	const isPl = locale === 'pl'
	const defaultTrialHref = 'https://app.planopia.pl/team-registration'
	const defaultPricingHref = isPl ? '/#cennik' : '/en#prices'
	const trialCta = trialCtaLabel ?? (isPl ? 'Załóż darmowy zespół' : 'Create your free team')
	const defaultPricingCta = isPl ? 'Zobacz cennik' : 'See pricing'
	const pricingCta = pricingCtaLabel ?? defaultPricingCta
	const leftCtaHref = trialHref ?? defaultTrialHref
	const rightCtaHref = pricingHref ?? defaultPricingHref

	const defaultTrial: ReactNode = isPl ? (
		<>
			<span className="font-semibold text-emerald-900">30 dni za darmo</span>
			{' '}
			— pełne funkcje, do 5 użytkowników (pierwszy miesiąc)
		</>
	) : (
		<>
			<span className="font-semibold text-emerald-900">30 days free</span>
			{' '}
			— full features, up to 5 users (first month)
		</>
	)

	const defaultEnterprise: ReactNode = isPl ? (
		<>
			<span className="font-semibold text-slate-900">Dla większych firm:</span>{' '}
			nielimitowana liczba użytkowników, elastyczne funkcje i integracje
		</>
	) : (
		<>
			<span className="font-semibold text-slate-900">For larger companies:</span>{' '}
			unlimited users, flexible features and integrations
		</>
	)

	return (
		<div className="blog-hero-dual-cta mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
			<div className="relative flex flex-col overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-white p-6 shadow-md shadow-emerald-900/[0.07] ring-1 ring-emerald-100/90 transition before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(16,185,129,0.14),transparent_55%)] before:content-[''] hover:shadow-lg hover:shadow-emerald-900/[0.1] md:min-h-[200px] md:p-7">
				<p className="relative z-[1] flex-1 text-center text-[15px] leading-snug text-gray-800 md:text-base md:leading-relaxed">
					{trial ?? defaultTrial}
				</p>
				<a
					href={leftCtaHref}
					download={trialDownload}
					className={`${btnClass} bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus-visible:outline-emerald-600 white-text-btn`}>
					{trialCta}
				</a>
			</div>

			<div className="relative flex flex-col overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/95 via-white to-white p-6 shadow-md shadow-slate-900/[0.06] ring-1 ring-sky-100/90 transition before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(14,165,233,0.14),transparent_55%)] before:content-[''] hover:shadow-lg hover:shadow-slate-900/[0.09] md:min-h-[200px] md:p-7">
				<p className="relative z-[1] flex-1 text-center text-[15px] leading-snug text-gray-800 md:text-base md:leading-relaxed">
					{enterprise ?? defaultEnterprise}
				</p>
				<a
					href={rightCtaHref}
					download={pricingDownload}
					className={`${btnClass} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-blue-600 white-text-btn`}>
					{pricingCta}
				</a>
			</div>
		</div>
	)
}
