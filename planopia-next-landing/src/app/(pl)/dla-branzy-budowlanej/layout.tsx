import type { Metadata } from 'next'


export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Ewidencja czasu pracy na budowie i grafiki | Planopia' },
	description:
		'Planopia dla firm budowlanych: czas pracy brygad bez logowania, grafiki, urlopy i raporty PDF/Excel. 30 dni pełnej aplikacji za darmo.',
	keywords: [
		'ewidencja czasu pracy na budowie',
		'brygadzista ewidencja czasu pracy',
		'rozliczanie brygad',
		'ewidencja pracowników budowlanych',
		'raportowanie czasu pracy na budowie',
		'firma budowlana',
		'grafik brygad',
		'aplikacja dla budowlanki',
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
		alternateLocale: ['en_US'],
		url: '/dla-branzy-budowlanej',
		siteName: 'Planopia',
		title: 'Ewidencja czasu pracy na budowie i grafiki | Planopia',
		description:
			'Jedna aplikacja na budowę i biuro: czas pracy brygad, grafiki, urlopy i raporty. 30 dni pełnej aplikacji za darmo.',
		images: [
			{
				url: '/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia — ewidencja czasu pracy dla firm budowlanych',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Ewidencja czasu pracy na budowie — Planopia',
		description: 'Czas pracy brygad bez logowania, grafiki, urlopy i raporty PDF/Excel.',
		images: ['/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: '/dla-branzy-budowlanej',
		languages: {
			'x-default': '/dla-branzy-budowlanej',
			pl: '/dla-branzy-budowlanej',
			en: '/en/for-construction-industry',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
