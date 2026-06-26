import dynamic from 'next/dynamic'
import Link from 'next/link'
import BlogHeroDualCtaCards from './BlogHeroDualCtaCards'
import {
	BLOG_LEAVE_PROGRAM_HERO_DESKTOP,
	BLOG_LEAVE_PROGRAM_HERO_MOBILE,
} from '@/data/blogLeaveProgramAssets'
import { blogProgramUrlopowCopy } from '@/data/blogProgramUrlopowCopy'

const AnimatedBlogImages = dynamic(() => import('./AnimatedBlogImages'), {
	loading: () => (
		<div
			className="rounded-xl aspect-[4/2] w-full bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80"
			aria-hidden
		/>
	),
})

const PROGRAM_HREF = blogProgramUrlopowCopy.programHref

export default function BlogProgramUrlopowHero() {
	return (
		<section
			className="px-4 py-10 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/50 landing-hero-below-fixed-header"
			id="blog-hero"
		>
			<div className="max-w-7xl mx-auto text-left content-blog">
				<div className="grid xl:grid-cols-2 gap-10 items-center">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700/90 mb-2 landing-section-eyebrow">
							Urlopy w małej firmie
						</p>
						<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
							Program do urlopów dla małej firmy — jak wybrać (2026)
						</h1>
						<p className="text-gray-700 text-lg leading-relaxed">
							Mała firma nie potrzebuje ciężkiego systemu HR — potrzebuje{' '}
							<strong>prostego programu do urlopów</strong>: wniosków online, wspólnego kalendarza i akceptacji
							jednym kliknięciem. Podpowiadamy, <strong>na co zwrócić uwagę przy wyborze</strong>, ile to kosztuje i
							czy istnieje <strong>darmowy program do urlopów</strong>.
						</p>
						<div className="mt-6">
							<BlogHeroDualCtaCards
								locale="pl"
								trial={
									<>
										<span className="font-semibold text-emerald-900">30 dni pełnej aplikacji za darmo</span>{' '}
										— urlopy, wnioski i kalendarz dla zespołu do 5 osób
									</>
								}
								enterprise={
									<>
										<span className="font-semibold text-slate-900">Zobacz dedykowaną stronę:</span> funkcje,
										przykłady i cennik programu do urlopów
									</>
								}
								pricingCtaLabel="Zobacz program do urlopów"
								pricingHref={PROGRAM_HREF}
							/>
						</div>
					</div>
					<AnimatedBlogImages
						desktopImages={[...BLOG_LEAVE_PROGRAM_HERO_DESKTOP]}
						mobileImages={[...BLOG_LEAVE_PROGRAM_HERO_MOBILE]}
						interval={5200}
					/>
				</div>
			</div>
		</section>
	)
}
