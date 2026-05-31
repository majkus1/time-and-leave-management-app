'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	FOOTER_BLOG_HIGHLIGHTS,
	FOOTER_LEGAL,
	FOOTER_SOLUTIONS,
	FOOTER_SOLUTIONS_HEADING,
	FOOTER_UI,
	LANDING_SELLER,
	type LandingLocale,
} from '@/data/landingFooterData'

function localeFromPath(pathname: string | null): LandingLocale {
	if (!pathname) return 'pl'
	return pathname.startsWith('/en') ? 'en' : 'pl'
}

export default function LandingSiteFooter() {
	const pathname = usePathname()
	const locale = localeFromPath(pathname)
	const t = FOOTER_UI[locale]
	const homeHref = locale === 'pl' ? '/' : '/en'
	const blogIndexHref = locale === 'pl' ? '/blog' : '/en/blog'
	const complaintsHref = locale === 'pl' ? '/reklamacje' : '/en/complaints'

	return (
		<footer
			className="landing-site-footer border-t border-slate-200/80 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)]"
			lang={locale === 'pl' ? 'pl' : 'en'}
		>
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
					{/* Brand */}
					<div className="lg:col-span-3">
						<Link href={homeHref} className="inline-block transition hover:opacity-90">
							<img
								src="/img/new-logoplanopia.webp"
								alt="Planopia"
								className="h-auto w-[min(200px,70vw)]"
								width={200}
								height={48}
							/>
						</Link>
						<p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">{t.brandLine}</p>

						<nav className="mt-5" aria-label={FOOTER_SOLUTIONS_HEADING[locale]}>
							<h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								{FOOTER_SOLUTIONS_HEADING[locale]}
							</h2>
							<ul className="mt-3 space-y-2.5">
								{FOOTER_SOLUTIONS[locale].map(item => (
									<li key={item.href}>
										<Link
											href={item.href}
											className="text-sm font-medium text-slate-700 transition hover:text-emerald-700 hover:underline underline-offset-4"
										>
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</div>

					{/* Legal */}
					<nav className="lg:col-span-3" aria-label={t.legalHeading}>
						<h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t.legalHeading}</h2>
						<ul className="mt-4 space-y-2.5">
							{FOOTER_LEGAL[locale].map(item => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm font-medium text-slate-700 transition hover:text-emerald-700 hover:underline underline-offset-4"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					{/* Blog */}
					<nav className="lg:col-span-3" aria-label={t.blogHeading}>
						<h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t.blogHeading}</h2>
						<ul className="mt-4 space-y-2.5">
							{FOOTER_BLOG_HIGHLIGHTS.map((pair, i) => {
								const item = locale === 'pl' ? pair.pl : pair.en
								return (
									<li key={`${item.href}-${i}`}>
										<Link
											href={item.href}
											className="text-sm font-medium text-slate-700 transition hover:text-emerald-700 hover:underline underline-offset-4"
										>
											{item.label}
										</Link>
									</li>
								)
							})}
							<li>
								<Link
									href={blogIndexHref}
									className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 hover:underline underline-offset-4"
								>
									{t.blogAll} →
								</Link>
							</li>
						</ul>
					</nav>

					{/* Company */}
					<div className="lg:col-span-3">
						<h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t.companyHeading}</h2>
						<p className="mt-4 text-sm font-semibold text-slate-900">
							<span className="text-emerald-800">Planopia</span>
							{' — '}
							{LANDING_SELLER.legalName}
						</p>
						<address className="mt-2 not-italic text-sm leading-relaxed text-slate-600">
							{LANDING_SELLER.addressLines[locale].map(line => (
								<span key={line} className="block">
									{line}
								</span>
							))}
						</address>
						<p className="mt-3 text-sm text-slate-700">
							<span className="font-medium text-slate-800">{t.nipLabel}:</span> {LANDING_SELLER.nip}
						</p>
						<p className="mt-1 text-sm text-slate-700">
							<span className="font-medium text-slate-800">{t.regonLabel}:</span> {LANDING_SELLER.regon}
						</p>
						<p className="mt-3 text-sm text-slate-700">
							<span className="font-medium text-slate-800">{t.websiteLabel}:</span>{' '}
							<a
								href={LANDING_SELLER.websiteHref}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-emerald-800 underline-offset-2 hover:text-emerald-950 hover:underline"
							>
								{LANDING_SELLER.websiteLabel}
							</a>
						</p>
						<p className="mt-4 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
							{t.complaintsIntro}{' '}
							<Link href={complaintsHref} className="font-medium text-emerald-800 hover:underline underline-offset-2">
								{t.complaintsLink}
							</Link>
						</p>
					</div>
				</div>

				<div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-8 text-center sm:flex-row sm:text-left">
					<p className="text-xs text-slate-500">
						© {new Date().getFullYear()} Planopia · {LANDING_SELLER.legalName}
					</p>
				</div>
			</div>
		</footer>
	)
}
