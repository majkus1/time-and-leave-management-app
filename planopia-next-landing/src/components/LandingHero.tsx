import Link from 'next/link'
import { LANDING_HERO_LCP } from '@/data/landingHeroAssets'
import { landingHeroCopy } from '@/data/landingHeroCopy'
import { planOfferingCopy } from '@/data/planOfferingCopy'

type Locale = 'pl' | 'en'

export default function LandingHero({ locale }: { locale: Locale }) {
	const copy = landingHeroCopy[locale]
	const offering = planOfferingCopy[locale]

	return (
		<section
			className="landing-polished-hero px-4 py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header"
			id="planopia-welcome"
		>
			<div className="landing-polished-hero-inner max-w-7xl mx-auto text-left">
				<div className="landing-polished-hero-grid grid lg:grid-cols-2 gap-10 items-center">
					<div className="landing-polished-hero-copy ordering">
						<p className="landing-polished-eyebrow">{copy.eyebrow}</p>
						<h1 className="landing-polished-title text-2xl sm:text-3xl font-bold text-blue-700">
							{offering.heroH1}
						</h1>
						<p className="landing-polished-subtitle font-semibold text-gray-800 mt-2 max-w-xl" id="underheader">
							{offering.heroSub}
						</p>
						<div className="landing-polished-hero-actions">
							<Link
								href="https://app.planopia.pl/team-registration"
								className="landing-polished-hero-cta inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-4 shadow hover:bg-green-700 transition"
							>
								{copy.cta}
							</Link>
							<Link href={copy.secondaryCtaHref} className="landing-polished-hero-secondary">
								{copy.secondaryCta}
							</Link>
						</div>
						<div className="landing-polished-proof">
							{copy.proof.map(item => (
								<span key={item}>{item}</span>
							))}
						</div>
					</div>
					<img
						src={LANDING_HERO_LCP.src}
						alt={copy.imageAlt}
						className="landing-polished-hero-image rounded-xl w-full h-auto aspect-[3/2]"
						width={LANDING_HERO_LCP.width}
						height={LANDING_HERO_LCP.height}
						fetchPriority="high"
						decoding="async"
						sizes={LANDING_HERO_LCP.sizes}
					/>
				</div>
			</div>
		</section>
	)
}
