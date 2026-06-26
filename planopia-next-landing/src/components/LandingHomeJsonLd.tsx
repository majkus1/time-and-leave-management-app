import { landingHomeFaqs } from '@/data/landingHomeFaqs'
import { LANDING_HERO_LCP } from '@/data/landingHeroAssets'
import { planOfferingCopy } from '@/data/planOfferingCopy'

type Locale = 'pl' | 'en'

export default function LandingHomeJsonLd({ locale }: { locale: Locale }) {
	const offering = planOfferingCopy[locale]
	const faqs = landingHomeFaqs[locale]
	const appUrl = locale === 'pl' ? 'https://planopia.pl' : 'https://planopia.pl/en'
	const inLanguage = locale === 'pl' ? 'pl-PL' : 'en-US'

	const softwareSchema = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Planopia',
		url: appUrl,
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		inLanguage,
		image: LANDING_HERO_LCP.absoluteUrl,
		screenshot: LANDING_HERO_LCP.absoluteUrl,
		author: {
			'@type': 'Person',
			name: 'Michał Lipka',
		},
		description: offering.metaLong,
		offers: {
			'@type': 'AggregateOffer',
			offerCount: '5',
			lowPrice: '0',
			highPrice: '479',
			priceCurrency: 'PLN',
			description: offering.jsonLdOfferDescription,
		},
	}

	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': `${appUrl}#webpage`,
		url: appUrl,
		name: offering.heroH1,
		description: offering.metaShort,
		inLanguage,
		isPartOf: {
			'@type': 'WebSite',
			'@id': 'https://planopia.pl/#website',
			name: 'Planopia',
			url: 'https://planopia.pl',
		},
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: LANDING_HERO_LCP.absoluteUrl,
			width: LANDING_HERO_LCP.width,
			height: LANDING_HERO_LCP.height,
			caption: offering.heroH1,
		},
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map(f => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
		</>
	)
}
