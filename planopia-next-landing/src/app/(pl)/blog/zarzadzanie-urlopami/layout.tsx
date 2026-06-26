import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'

export const metadata: Metadata = {
	title: {
		absolute:
			'Zarządzanie urlopami w firmie — program, system i aplikacja urlopowa | Planopia',
	},
	description:
		'Program do urlopów i zarządzanie urlopami pracowników: wnioski, kalendarz, zatwierdzenia bez chaosu w Excelu. ' + blogArticleOfferLine.pl,
	keywords: [
		'zarządzanie urlopami',
		'aplikacja do urlopów',
		'program do urlopów',
		'zarządzanie urlopami w firmie',
		'system urlopowy',
		'planowanie urlopów',
		'ewidencja urlopów',
		'wnioski urlopowe',
		'Planopia',
		'urlopy w firmie',
		'automatyzacja urlopów',
		'zarządzanie nieobecnościami',
		'system do zarządzania urlopami',
		'aplikacja urlopowa',
		'zarządzanie urlopami pracowników',
	],
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL('https://planopia.pl'),
	alternates: {
		canonical: 'https://planopia.pl/blog/zarzadzanie-urlopami',
		languages: {
			pl: 'https://planopia.pl/blog/zarzadzanie-urlopami',
			en: 'https://planopia.pl/en/blog/leave-management',
		},
	},
	openGraph: {
		title: 'Zarządzanie urlopami — system urlopowy i aplikacja dla firm | Planopia',
		description: `Program do urlopów i ewidencja nieobecności w jednym narzędziu. ${blogArticleOfferLine.pl}`,
		url: 'https://planopia.pl/blog/zarzadzanie-urlopami',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Zarządzanie urlopami w firmie - Planopia',
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2024-10-25T00:00:00.000Z',
		modifiedTime: '2026-03-27T12:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Zarządzanie urlopami — program i aplikacja dla firm | Planopia',
		description: `System urlopowy zamiast arkuszy — Planopia. ${blogArticleOfferLine.pl}`,
		images: ['/img/desktop.png'],
		creator: '@planopia',
	},
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
	category: 'technology',
}

export default function BlogSixLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
