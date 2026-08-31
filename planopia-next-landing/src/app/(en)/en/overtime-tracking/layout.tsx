import type { Metadata } from 'next'

const META_TITLE = 'Overtime tracking software | Planopia'
const META_DESCRIPTION =
	'Track overtime hours against the day they happened, not a monthly total. Monthly PDF and Excel reports. Free tier for up to 5 active accounts.'
const IMAGE = '/img/desktop-ennews.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'overtime tracking',
		'overtime tracking software',
		'record overtime hours',
		'overtime management app',
		'time and overtime records',
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
		locale: 'en_US',
		alternateLocale: ['pl_PL'],
		url: '/en/overtime-tracking',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'Overtime recorded against the day it happened, not a monthly lump sum. Monthly PDF and Excel reports. Free tier for up to 5 accounts.',
		images: [
			{
				url: IMAGE,
				width: 1918,
				height: 908,
				alt: 'Overtime tracking in the Planopia app',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Overtime tracking — Planopia',
		description: 'Overtime on the day it happened. PDF and Excel reports. Free tier for up to 5 accounts.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/en/overtime-tracking',
		languages: {
			'x-default': '/ewidencja-nadgodzin',
			pl: '/ewidencja-nadgodzin',
			en: '/en/overtime-tracking',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
