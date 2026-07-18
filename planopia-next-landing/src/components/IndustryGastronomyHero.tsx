import Image from 'next/image'
import Link from 'next/link'
import { industryGastronomyCopy as copy } from '@/data/industryGastronomyCopy'

const registerHref = 'https://app.planopia.pl/team-registration'

export default function IndustryGastronomyHero() {
	return (
		<section
			id="gastronomy-welcome"
			className="industry-landing-hero landing-polished-hero landing-hero-below-fixed-header px-4 py-10 md:py-12"
			aria-labelledby="gastronomy-hero-heading"
		>
			<div className="max-w-7xl mx-auto">
				<div className="landing-polished-hero-grid grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
					<header
						id="gastronomy-hero-heading"
						className="landing-polished-hero-copy order-2 md:order-1 min-w-0 text-left"
					>
						<p className="landing-polished-eyebrow">Branża: gastronomia</p>
						<h1 className="landing-polished-title">{copy.heroH1}</h1>
						<p className="landing-polished-subtitle mt-2 max-w-xl">{copy.heroSub}</p>
						<div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
							<a
								href={registerHref}
								className="construction-solid-btn construction-solid-btn--green order-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-center text-base font-semibold shadow-md transition hover:bg-green-700"
							>
								{copy.ctaButton}
							</a>
							<Link
								href="/blog/jak-ulozyc-grafik-pracy-w-restauracji"
								className="order-2 inline-flex min-h-[48px] items-center justify-start px-1 text-left text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline sm:px-2"
							>
								{copy.blogLinkLabel}
							</Link>
						</div>
					</header>

					<div className="order-1 md:order-2 min-w-0">
						<Image
							src="/img/gastronomia.webp"
							alt="Planowanie grafiku i ewidencja czasu pracy zespołu restauracji w Planopii"
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
