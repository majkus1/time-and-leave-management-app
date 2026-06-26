import { blogProgramUrlopowCopy } from '@/data/blogProgramUrlopowCopy'
import { BLOG_LEAVE_PROGRAM_OG } from '@/data/blogLeaveProgramAssets'

export default function BlogProgramUrlopowJsonLd() {
	const t = blogProgramUrlopowCopy

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${t.url}#article`,
		headline: t.headline,
		description: t.description,
		image: BLOG_LEAVE_PROGRAM_OG.url,
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: BLOG_LEAVE_PROGRAM_OG.url,
			width: BLOG_LEAVE_PROGRAM_OG.width,
			height: BLOG_LEAVE_PROGRAM_OG.height,
			caption: t.headline,
		},
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		url: t.url,
		datePublished: t.datePublished,
		dateModified: t.dateModified,
		inLanguage: 'pl-PL',
		keywords:
			'program do urlopów dla małej firmy, program do urlopów darmowy, aplikacja do urlopów, program urlopowy, wnioski urlopowe online, jak wybrać program do urlopów',
		mainEntityOfPage: { '@type': 'WebPage', '@id': t.url },
	}

	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': `${t.url}#webpage`,
		url: t.url,
		name: t.headline,
		description: t.description,
		inLanguage: 'pl-PL',
		isPartOf: {
			'@type': 'WebSite',
			'@id': 'https://planopia.pl/#website',
			name: 'Planopia',
			url: 'https://planopia.pl',
		},
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: BLOG_LEAVE_PROGRAM_OG.url,
			width: BLOG_LEAVE_PROGRAM_OG.width,
			height: BLOG_LEAVE_PROGRAM_OG.height,
		},
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
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://planopia.pl/blog' },
			{ '@type': 'ListItem', position: 3, name: t.headline, item: t.url },
		],
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
		</>
	)
}
