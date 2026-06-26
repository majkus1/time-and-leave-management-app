import { blogFreeAppCopy } from '@/data/blogFreeAppCopy'
import { BLOG_FREE_APP_OG } from '@/data/blogFreeAppAssets'

type Props = { locale: 'pl' | 'en' }

export default function BlogFreeAppJsonLd({ locale }: Props) {
	const t = blogFreeAppCopy[locale]
	const homeUrl = locale === 'pl' ? 'https://planopia.pl' : 'https://planopia.pl/en'
	const blogUrl = `${homeUrl}/blog`

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${t.url}#article`,
		headline: t.headline,
		url: t.url,
		datePublished: t.datePublished,
		dateModified: t.dateModified,
		inLanguage: locale === 'pl' ? 'pl-PL' : 'en-US',
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: {
				'@type': 'ImageObject',
				url: 'https://planopia.pl/img/new-logoplanopia.webp',
			},
		},
		description: t.metaDescription,
		image: BLOG_FREE_APP_OG.url,
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: BLOG_FREE_APP_OG.url,
			width: BLOG_FREE_APP_OG.width,
			height: BLOG_FREE_APP_OG.height,
			caption: t.heroH1,
		},
		mainEntityOfPage: { '@type': 'WebPage', '@id': t.url },
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: t.faqs.map(f => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: homeUrl },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: blogUrl },
			{ '@type': 'ListItem', position: 3, name: t.heroH1, item: t.url },
		],
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
		</>
	)
}
