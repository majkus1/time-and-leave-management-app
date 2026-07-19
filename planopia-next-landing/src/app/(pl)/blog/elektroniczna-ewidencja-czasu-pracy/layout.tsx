import type { Metadata } from 'next'

const META_TITLE = 'Elektroniczna ewidencja czasu pracy 2026 | Planopia'
const META_DESCRIPTION =
	'Porównaj papier, Excel i program do elektronicznej ewidencji czasu pracy. Zobacz wymagania, raporty oraz sposób wyboru systemu dla firmy.'

/** Meta pod GSC: „elektroniczna ewidencja czasu pracy” — przewodnik (papier/Excel vs program), nie duplikat „online”. */
export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
	keywords: [
		'elektroniczna ewidencja czasu pracy',
		'elektroniczna ewidencja czasu pracy program',
		'program do ewidencji czasu pracy',
		'ewidencja czasu pracy excel',
		'ewidencja czasu pracy online',
		'program do rejestracji czasu pracy',
		'zarządzanie czasem pracy',
		'darmowa ewidencja czasu pracy',
		'Planopia',
		'system ewidencji czasu pracy',
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
		canonical: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
		languages: {
			pl: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
			en: 'https://planopia.pl/en/blog/electronic-time-tracking',
		},
	},
	openGraph: {
		title: META_TITLE,
		description: META_DESCRIPTION,
		url: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Elektroniczna ewidencja czasu pracy — przewodnik Planopia',
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2024-10-18T00:00:00.000Z',
		modifiedTime: '2026-05-31T12:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
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

export default function BlogFiveLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
