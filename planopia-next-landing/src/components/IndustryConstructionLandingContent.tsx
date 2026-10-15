import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import IndustryLanding from './productLanding/IndustryLanding'
import { industryConstructionCopy, type IndustryConstructionLocale } from '@/data/industryConstructionCopy'
import { INDUSTRY_CONSTRUCTION_HERO } from '@/data/industryConstructionHeroAssets'
import { shot } from '@/data/productShots'

type Props = { locale: IndustryConstructionLocale }

const blogPath: Record<IndustryConstructionLocale, string> = {
	pl: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
	en: '/en/blog/time-tracking-on-construction-sites',
}

export default function IndustryConstructionLandingContent({ locale }: Props) {
	const c = industryConstructionCopy[locale]
	const canonical =
		locale === 'pl' ? 'https://planopia.pl/dla-branzy-budowlanej' : 'https://planopia.pl/en/for-construction-industry'

	const siteOrigin = 'https://planopia.pl'
	const webPageId = `${canonical}#webpage`
	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': webPageId,
		name: c.heroH1,
		description: c.heroSub,
		url: canonical,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		isPartOf: {
			'@type': 'WebSite',
			'@id': `${siteOrigin}/#website`,
			name: 'Planopia',
			url: siteOrigin,
			publisher: {
				'@type': 'Organization',
				name: 'Planopia',
				url: siteOrigin,
				logo: { '@type': 'ImageObject', url: `${siteOrigin}/img/new-logoplanopia.webp` },
			},
		},
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			width: INDUSTRY_CONSTRUCTION_HERO.width,
			height: INDUSTRY_CONSTRUCTION_HERO.height,
			caption: c.heroH1,
		},
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: siteOrigin,
			image: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			screenshot: INDUSTRY_CONSTRUCTION_HERO.absoluteUrl,
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'PLN',
				description:
					locale === 'pl'
						? '30 dni pełnej aplikacji; potem darmowy plan ewidencji do 5 kont lub pakiety płatne'
						: '30-day full trial; then free time tracking (5 accounts) or paid plans',
			},
		},
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Planopia',
				item: locale === 'pl' ? siteOrigin : `${siteOrigin}/en`,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: locale === 'pl' ? 'Budownictwo' : 'Construction',
				item: canonical,
			},
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: c.faqs.map(f => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<IndustryLanding
				locale={locale}
				eyebrow={locale === 'pl' ? 'Branża: budownictwo' : 'Industry: construction'}
				heroH1={c.heroH1}
				heroSub={c.heroSub}
				ctaButton={c.ctaButton}
				secondary={{ label: c.blogLinkLabel, href: blogPath[locale] }}
				heroImage={{ src: INDUSTRY_CONSTRUCTION_HERO.src, alt: c.heroImageAlt, width: INDUSTRY_CONSTRUCTION_HERO.width, height: INDUSTRY_CONSTRUCTION_HERO.height }}
				problemsTitle={c.problemsTitle}
				problems={c.problems}
				spotlights={[
					{ id: 'field-crew', eyebrow: c.fieldCrewEyebrow, title: c.fieldCrewTitle, lead: c.fieldCrewLead, bullets: c.fieldCrewBullets, note: c.fieldCrewNote, shot: shot(locale, 'create-noaccess') },
					{ id: 'qr-site', ...c.qrSpot, shot: shot(locale, 'qr-codes') },
					{ id: 'output', ...c.outputSpot, shot: shot(locale, 'qr-sessions') },
				]}
				solutionTitle={c.solutionTitle}
				solutionIntro={c.solutionIntro}
				features={c.features}
				galleryTitle={c.galleryTitle}
				gallery={[shot(locale, 'managed-calendar'), shot(locale, 'schedule'), shot(locale, 'board')]}
				ai={{ title: c.aiTitle, bullets: c.aiBullets, visual: <ConstructionAiAssistantScreenshot locale={locale} /> }}
				stepsTitle={c.stepsTitle}
				steps={c.steps}
				faqTitle={c.faqTitle}
				faqs={c.faqs}
				cta={{ title: c.ctaTitle, note: c.ctaNote, button: c.ctaButton }}
				guide={{ eyebrow: c.videoEyebrow, title: c.videoTitle, body: c.videoBody, href: c.videoHref, cta: c.videoCta }}
			/>
		</>
	)
}
