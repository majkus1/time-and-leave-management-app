import type { Metadata } from 'next'

const META_TITLE = 'Jak ułożyć grafik pracy — zasady i błędy | Planopia'
const META_DESCRIPTION =
	'Jak ułożyć grafik pracy zgodnie z Kodeksem pracy: doba pracownicza, 11 godzin odpoczynku dobowego, 35 godzin tygodniowego i okres rozliczeniowy.'
const PAGE_URL = 'https://planopia.pl/blog/jak-ulozyc-grafik-pracy'
const IMAGE = 'https://planopia.pl/img/aigrafik.webp'

export const metadata: Metadata = {
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
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
	alternates: {
		canonical: PAGE_URL,
		languages: { pl: PAGE_URL, 'x-default': PAGE_URL },
	},
	openGraph: {
		type: 'article',
		locale: 'pl_PL',
		url: PAGE_URL,
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		publishedTime: '2026-08-31T08:00:00.000Z',
		modifiedTime: '2026-08-31T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [
			{
				url: IMAGE,
				width: 1898,
				height: 910,
				alt: 'Grafik pracy zespołu w aplikacji Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Jak ułożyć grafik pracy zgodnie z Kodeksem pracy',
		description: 'Doba pracownicza, 11 i 35 godzin odpoczynku, okres rozliczeniowy — i pięć błędów, które psują grafik.',
		images: [IMAGE],
	},
	category: 'Grafiki i harmonogramy',
}

export default function WorkScheduleRulesLayout({ children }: { children: React.ReactNode }) {
	return children
}
