import type { Metadata } from 'next'

/** Meta pod GSC: „elektroniczna ewidencja czasu pracy” — przewodnik (papier/Excel vs program), nie duplikat „online”. */
export const metadata: Metadata = {
	title: {
		absolute:
			'Elektroniczna ewidencja czasu pracy: Excel vs program | Planopia',
	},
	description:
		'Papier, Excel czy program? Porównanie metod elektronicznej ewidencji czasu pracy, wymogi i wybór systemu z raportami PDF. 30 dni pełnej Planopii za darmo.',
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
			'pl-PL': '/blog/elektroniczna-ewidencja-czasu-pracy',
			'en-US': '/en/blog/electronic-time-tracking',
		},
	},
	openGraph: {
		title: 'Elektroniczna ewidencja czasu pracy: Excel vs program | Planopia',
		description:
			'Kompletny przewodnik: kiedy przejść z papieru i arkusza na elektroniczną ewidencję i jaki program wybrać. Trial Planopii — 30 dni bez opłat.',
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
		modifiedTime: '2026-05-17T12:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Elektroniczna ewidencja czasu pracy: Excel vs program | Planopia',
		description:
			'Porównanie papieru, Excela i programu do ewidencji — wymogi i wybór narzędzia. Wypróbuj Planopię przez 30 dni.',
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
