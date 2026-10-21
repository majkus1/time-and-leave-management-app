import { landingTestimonials, testimonialsCopy } from '@/data/landingTestimonials'
import '@/styles/landingTestimonials.css'

type Locale = 'pl' | 'en'

/** Opinie i logo klientów — wysoko na stronie głównej, buduje zaufanie przed opisem funkcji. */
export default function LandingTestimonials({ locale }: { locale: Locale }) {
	const t = testimonialsCopy[locale]
	const headingId = locale === 'pl' ? 'landing-testimonials-heading' : 'landing-testimonials-heading-en'

	return (
		<section id={locale === 'pl' ? 'opinie' : 'testimonials'} className="landing-testimonials-section px-4" aria-labelledby={headingId}>
			<div className="max-w-7xl mx-auto">
				<div className="landing-about-heading-block">
					<p className="landing-about-heading-eyebrow landing-section-eyebrow">{t.eyebrow}</p>
					<h2 id={headingId} className="landing-about-heading-title">
						{t.title}
					</h2>
					<p className="landing-about-intro mt-4 text-lg text-gray-600">{t.intro}</p>
				</div>

				<div className="lt-list">
					{landingTestimonials.map(item => (
						<figure className="lt-card" key={item.id}>
							<div className="lt-card__brand">
								<picture>
									<source srcSet={item.logo.src} type="image/webp" />
									<img
										className="lt-card__logo"
										src={item.logo.fallback}
										alt={item.company}
										width={item.logo.width}
										height={item.logo.height}
										loading="lazy"
										decoding="async"
									/>
								</picture>
								{item.since ? <div className="lt-card__since">{item.since[locale]}</div> : null}
							</div>
							<div className="lt-card__body">
								<div className="lt-card__mark" aria-hidden="true">
									“
								</div>
								<blockquote className="lt-card__quote">
									<p>{item.quote[locale]}</p>
								</blockquote>
								<figcaption className="lt-card__author">
									<div className="lt-card__name">{item.author[locale]}</div>
									<div className="lt-card__role">
										{item.role[locale]}, {item.company}
									</div>
									{t.translated ? <div className="lt-card__note">{t.translated}</div> : null}
								</figcaption>
							</div>
						</figure>
					))}
				</div>
			</div>
		</section>
	)
}
