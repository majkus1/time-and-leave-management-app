import Link from 'next/link'
import dynamic from 'next/dynamic'
import { blogFreeAppCopy } from '@/data/blogFreeAppCopy'

const BlogFreeAppHeroVideo = dynamic(() => import('./BlogFreeAppHeroVideo'), {
	loading: () => (
		<div
			className="mt-8 sm:mt-10 aspect-video w-full rounded-xl bg-slate-100/90 ring-1 ring-slate-200/80"
			aria-hidden
		/>
	),
})

type Props = { locale: 'pl' | 'en' }

export default function BlogFreeAppHeroSection({ locale }: Props) {
	const t = blogFreeAppCopy[locale]

	return (
		<section
			className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-gradient-to-br from-slate-50 via-blue-50/60 to-emerald-50/30 landing-hero-below-fixed-header"
			id="blog-free-app-welcome">
			<div className="max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto w-full">
				<div className="rounded-2xl md:rounded-3xl border border-blue-100/80 bg-white shadow-md md:shadow-lg px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 text-left md:text-center ring-1 ring-slate-200/60">
					<h1 className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 blogh1 leading-[1.2] tracking-tight max-w-5xl md:mx-auto">
						{t.heroH1}
					</h1>
					<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl md:max-w-4xl mx-0 md:mx-auto mb-6 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
						{locale === 'pl' ? (
							<>
								30 dni pełnej aplikacji dla zespołu do 5 osób —{' '}
								<strong className="font-semibold text-gray-800">bez karty na start</strong>. Potem darmowa
								ewidencja (5 kont) lub pakiety płatne.{' '}
							</>
						) : (
							<>
								30 days full access for teams of up to 5 people —{' '}
								<strong className="font-semibold text-gray-800">no credit card required to get started</strong>.
								Then <strong className="font-semibold text-gray-800">free time tracking</strong> (5 accounts) or
								paid plans.{' '}
							</>
						)}
						<Link href={t.pricingHref} className="text-blue-600 font-medium hover:underline whitespace-nowrap">
							{t.pricingLabel}
						</Link>
						.
					</p>
					<Link
						href="https://app.planopia.pl/team-registration"
						className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition text-base sm:text-lg white-text-btn">
						{t.cta}
					</Link>
				</div>
				<BlogFreeAppHeroVideo locale={locale} />
			</div>
		</section>
	)
}
