import Image from 'next/image'
import Link from 'next/link'
import { industryConstructionCopy } from '@/data/industryConstructionCopy'
import { INDUSTRY_CONSTRUCTION_HERO } from '@/data/industryConstructionHeroAssets'

type Locale = 'pl' | 'en'

const blogPath: Record<Locale, string> = {
	pl: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
	en: '/en/blog/time-tracking-on-construction-sites',
}

const registerHref = 'https://app.planopia.pl/team-registration'

export default function IndustryConstructionHero({ locale }: { locale: Locale }) {
	const c = industryConstructionCopy[locale]

	return (
		<section
			id="construction-welcome"
			className="landing-polished-hero landing-hero-below-fixed-header px-4 py-10 md:py-12"
			aria-labelledby="construction-hero-heading"
		>
			<div className="max-w-7xl mx-auto">
				<div className="landing-polished-hero-grid grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
					<header
						id="construction-hero-heading"
						className="landing-polished-hero-copy order-2 md:order-1 min-w-0 text-left"
					>
						<p className="landing-polished-eyebrow">
							{locale === 'pl' ? 'Branża: budownictwo' : 'Industry: construction'}
						</p>
						<h1 className="landing-polished-title">{c.heroH1}</h1>
						<p className="landing-polished-subtitle mt-2 max-w-xl">{c.heroSub}</p>
						<div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
							<a
								href={registerHref}
								className="construction-solid-btn construction-solid-btn--green order-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-center text-base font-semibold shadow-md transition hover:bg-green-700"
							>
								{c.ctaButton}
							</a>
							<Link
								href={blogPath[locale]}
								className="order-2 inline-flex min-h-[48px] items-center justify-start px-1 text-left text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline sm:px-2"
							>
								{c.blogLinkLabel}
							</Link>
						</div>
					</header>
					<div className="order-1 md:order-2 min-w-0">
						<Image
							src={INDUSTRY_CONSTRUCTION_HERO.src}
							alt={c.heroImageAlt}
							className="rounded-xl w-full h-auto aspect-[3/2] object-cover"
							width={INDUSTRY_CONSTRUCTION_HERO.width}
							height={INDUSTRY_CONSTRUCTION_HERO.height}
							priority
							fetchPriority="high"
							sizes={INDUSTRY_CONSTRUCTION_HERO.sizes}
						/>
					</div>
				</div>
			</div>
		</section>
	)
}
