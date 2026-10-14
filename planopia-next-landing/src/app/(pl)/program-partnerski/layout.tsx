import type { Metadata } from 'next'
import { META, PARTNER_PAGE_PATH } from '@/data/partnerProgramCopy'

// Własna grafika do podglądu linku — stronę wysyłamy biurom mailem i w komunikatorach
const IMAGE = '/img/program-partnerski-og.png'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META.title },
	description: META.description,
	keywords: [
		'program partnerski',
		'program partnerski dla biur rachunkowych',
		'program poleceń SaaS',
		'prowizja za polecenie',
		'współpraca z biurami rachunkowymi',
		'panel biura rachunkowego',
		'Planopia',
	],
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	openGraph: {
		type: 'website',
		locale: 'pl_PL',
		url: PARTNER_PAGE_PATH,
		siteName: 'Planopia',
		title: META.ogTitle,
		description: META.ogDescription,
		images: [
			{
				url: IMAGE,
				width: 1200,
				height: 630,
				alt: 'Program partnerski Planopia: 25% prowizji przez rok, potem 10% bez limitu',
				type: 'image/png',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: META.ogTitle,
		description: META.ogDescription,
		images: [IMAGE],
	},
	// Strona tylko po polsku — bez wersji EN w hreflang
	alternates: {
		canonical: PARTNER_PAGE_PATH,
		languages: {
			'x-default': PARTNER_PAGE_PATH,
			pl: PARTNER_PAGE_PATH,
		},
	},
	category: 'business',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
