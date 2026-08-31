import type { Metadata } from 'next'

const META_TITLE = 'QR time clocking and attendance | Planopia'
const META_DESCRIPTION =
	'Replace the paper attendance sheet with QR time clocking. People scan in and out from a phone, and hours land straight in your time records.'
const IMAGE = '/img/desktop-ennews.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'qr time clocking',
		'employee attendance app',
		'electronic attendance sheet',
		'clock in clock out app',
		'time clock software',
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
		url: '/en/qr-time-clocking',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'A printed QR code instead of a paper attendance sheet. People clock in and out from a phone, and the hours flow into your time records.',
		images: [
			{
				url: IMAGE,
				width: 1918,
				height: 908,
				alt: 'QR time clocking in the Planopia app',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'QR time clocking — Planopia',
		description: 'A scan instead of a signature. Hours land straight in your records. 30 days of the full app free.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/en/qr-time-clocking',
		languages: {
			'x-default': '/rejestracja-czasu-pracy-qr',
			pl: '/rejestracja-czasu-pracy-qr',
			en: '/en/qr-time-clocking',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
