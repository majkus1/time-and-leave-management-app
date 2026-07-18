import type { Metadata } from 'next'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Jak ułożyć grafik pracy w restauracji? Poradnik | Planopia' },
	description:
		'Grafik pracy w restauracji krok po kroku: dostępność zespołu, obsada sali i kuchni, zastępstwa, urlopy oraz rozliczenie godzin bez chaosu w Excelu.',
	keywords: [
		'jak ułożyć grafik pracy w restauracji',
		'grafik pracy restauracja',
		'grafik pracy gastronomia',
		'grafik pracowników restauracji',
		'grafik zmianowy gastronomia',
		'program do grafiku restauracji',
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
		url: '/blog/jak-ulozyc-grafik-pracy-w-restauracji',
		siteName: 'Planopia',
		publishedTime: '2026-07-17T12:00:00.000Z',
		modifiedTime: '2026-07-17T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: 'Jak ułożyć grafik pracy w restauracji? Praktyczny poradnik',
		description: 'Dostępność zespołu, obsada zmian, zastępstwa i ewidencja godzin — proces krok po kroku.',
		images: [{ url: '/img/gastronomia.webp', width: 1536, height: 1024, alt: 'Grafik pracy pracowników restauracji w Planopii' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Jak ułożyć grafik pracy w restauracji? | Planopia',
		description: 'Praktyczny proces planowania zmian w gastronomii bez chaosu w arkuszach i wiadomościach.',
		images: ['/img/gastronomia.webp'],
	},
	alternates: { canonical: '/blog/jak-ulozyc-grafik-pracy-w-restauracji' },
	category: 'business',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
