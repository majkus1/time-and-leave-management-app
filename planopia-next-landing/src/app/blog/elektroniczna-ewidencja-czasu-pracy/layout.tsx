import type { Metadata } from 'next'

/** Meta pod GSC: „elektroniczna ewidencja czasu pracy” — przewodnik (papier/Excel vs program), nie duplikat „online”. */
export const metadata: Metadata = {
	title: {
		absolute:
			'Elektroniczna ewidencja czasu pracy 2026 — Excel czy program? | Planopia',
	},
	description:
		'Papier, Excel czy program? Porównanie metod ewidencji czasu pracy w 2026 (z tabelą), wymogi prawne i wybór systemu z raportami PDF/XLSX. 30 dni Planopii za darmo, potem darmowy plan.',
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
		title: 'Elektroniczna ewidencja czasu pracy 2026 — Excel czy program? | Planopia',
		description:
			'Kompletny przewodnik na 2026: kiedy przejść z papieru i Excela na elektroniczną ewidencję, tabela porównawcza i jaki program wybrać. Trial Planopii — 30 dni bez opłat.',
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
		title: 'Elektroniczna ewidencja czasu pracy 2026 — Excel czy program? | Planopia',
		description:
			'Papier, Excel czy program do ewidencji? Tabela porównawcza i wybór narzędzia na 2026. Wypróbuj Planopię przez 30 dni za darmo.',
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
