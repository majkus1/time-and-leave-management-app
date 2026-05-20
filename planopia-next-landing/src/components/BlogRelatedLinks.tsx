import Link from 'next/link'
import {
	BLOG_PILLAR_EN,
	BLOG_PILLAR_PL,
	getBlogArticleLinkConfig,
	type BlogInternalLink,
} from '@/data/blogInternalLinks'

type Position = 'top' | 'bottom'

type Props = {
	/** Slug artykułu bez /blog/, np. „ewidencja-czasu-pracy-online”. */
	slug: string
	locale?: 'pl' | 'en'
	position?: Position
	className?: string
}

function PillarBanner({ pillar }: { pillar: BlogInternalLink }) {
	return (
		<aside
			className="mb-8 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white px-4 py-4 md:px-5 md:py-5 shadow-sm ring-1 ring-emerald-100/70"
			aria-label="Główny przewodnik o ewidencji"
		>
			<p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800/90 mb-1.5">
				Zacznij tutaj
			</p>
			<p className="text-sm text-gray-700 leading-relaxed m-0 mb-3">
				Szukasz <strong>darmowej aplikacji do ewidencji</strong>? Nasz główny przewodnik zbiera trial, plan po
				próbie i porównanie z Excelem.
			</p>
			<Link
				href={pillar.href}
				className="blog-pillar-banner-link inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold leading-snug no-underline transition"
			>
				→ {pillar.label}
			</Link>
		</aside>
	)
}

function RelatedNav({
	title,
	links,
	pillar,
	showPillarLink,
}: {
	title: string
	links: BlogInternalLink[]
	pillar: BlogInternalLink
	showPillarLink: boolean
}) {
	const items = showPillarLink ? [pillar, ...links.filter((l) => l.href !== pillar.href)] : links

	return (
		<nav className="border-t border-slate-200 pt-8" aria-label={title}>
			<p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</p>
			<ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
				{items.map((item) => (
					<li key={item.href}>
						<Link
							href={item.href}
							className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 transition"
						>
							{item.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	)
}

export default function BlogRelatedLinks({ slug, locale = 'pl', position = 'bottom', className = '' }: Props) {
	const config = getBlogArticleLinkConfig(slug, locale)
	if (!config) return null

	const pillar = locale === 'pl' ? BLOG_PILLAR_PL : BLOG_PILLAR_EN
	const relatedTitle = config.relatedTitle ?? 'Powiązane artykuły'
	const isPillarPage =
		slug === 'darmowa-aplikacja-do-ewidencji-czasu-pracy' || slug === 'free-time-tracking-app'

	if (position === 'top') {
		if (!config.showPillarBanner || isPillarPage) return null
		return (
			<div className={className}>
				<PillarBanner pillar={pillar} />
			</div>
		)
	}

	return (
		<div className={className}>
			<RelatedNav
				title={relatedTitle}
				links={config.related}
				pillar={pillar}
				showPillarLink={!isPillarPage}
			/>
		</div>
	)
}
