import type { Metadata } from 'next'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Jak zarządzać firmą sprzątającą? Poradnik | Planopia' },
	description:
		'Zarządzanie firmą sprzątającą krok po kroku: obiekty, grafik ekip, zastępstwa, zadania, kontrola wykonania i rozliczenie godzin bez chaosu w Excelu.',
	keywords: [
		'jak zarządzać firmą sprzątającą',
		'zarządzanie firmą sprzątającą',
		'grafik pracy firma sprzątająca',
		'zarządzanie pracownikami firmy sprzątającej',
		'grafik ekip sprzątających',
		'aplikacja dla firm sprzątających',
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
		type: 'article',
		locale: 'pl_PL',
		url: '/blog/jak-zarzadzac-firma-sprzatajaca',
		siteName: 'Planopia',
		publishedTime: '2026-07-17T12:00:00.000Z',
		modifiedTime: '2026-07-17T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: 'Jak zarządzać firmą sprzątającą? Praktyczny poradnik',
		description: 'Obiekty, grafik ekip, zastępstwa, zadania i ewidencja godzin — praktyczny proces krok po kroku.',
		images: [{ url: '/img/sprzatajaca.webp', width: 1536, height: 1024, alt: 'Organizacja pracy firmy sprzątającej w Planopii' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Jak zarządzać firmą sprzątającą? | Planopia',
		description: 'Praktyczny proces organizacji ekip, obiektów, zastępstw i czasu pracy.',
		images: ['/img/sprzatajaca.webp'],
	},
	alternates: { canonical: '/blog/jak-zarzadzac-firma-sprzatajaca' },
	category: 'business',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
