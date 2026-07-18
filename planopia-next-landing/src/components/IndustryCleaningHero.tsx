import Image from 'next/image'
import Link from 'next/link'
import { industryCleaningCopy as copy } from '@/data/industryCleaningCopy'

const registerHref = 'https://app.planopia.pl/team-registration'

export default function IndustryCleaningHero() {
	return (
		<section
			id="cleaning-welcome"
			className="industry-landing-hero landing-polished-hero landing-hero-below-fixed-header px-4 py-10 md:py-12"
			aria-labelledby="cleaning-hero-heading"
		>
			<div className="max-w-7xl mx-auto">
				<div className="landing-polished-hero-grid grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
					<header id="cleaning-hero-heading" className="landing-polished-hero-copy order-2 md:order-1 min-w-0 text-left">
						<p className="landing-polished-eyebrow">Branża: firmy sprzątające</p>
						<h1 className="landing-polished-title">{copy.heroH1}</h1>
						<p className="landing-polished-subtitle mt-2 max-w-xl">{copy.heroSub}</p>
						<div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
							<a href={registerHref} className="construction-solid-btn construction-solid-btn--green order-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-center text-base font-semibold shadow-md transition hover:bg-green-700">
								{copy.ctaButton}
							</a>
							<Link href="/blog/jak-zarzadzac-firma-sprzatajaca" className="order-2 inline-flex min-h-[48px] items-center justify-start px-1 text-left text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline sm:px-2">
								{copy.blogLinkLabel}
							</Link>
						</div>
					</header>

					<div className="order-1 md:order-2 min-w-0">
						<Image
							src="/img/sprzatajaca.webp"
							alt="Grafik ekip i ewidencja czasu pracy firmy sprzątającej w Planopii"
							className="rounded-xl w-full h-auto aspect-[3/2] object-cover"
							width={1536}
							height={1024}
							priority
							fetchPriority="high"
							sizes="(min-width: 1280px) 608px, (min-width: 768px) 50vw, calc(100vw - 32px)"
						/>
					</div>
				</div>
			</div>
		</section>
	)
}
