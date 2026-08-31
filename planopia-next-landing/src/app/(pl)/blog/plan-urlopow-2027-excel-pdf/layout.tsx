import type { Metadata } from 'next'

const META_TITLE = 'Plan urlopów 2027 — darmowy wzór Excel i PDF | Planopia'
const META_DESCRIPTION =
	'Pobierz darmowy roczny plan urlopów 2027 w Excelu i PDF. Automatyczne liczenie dni roboczych, wszystkie dni wolne i terminy z Kodeksu pracy.'
const URL = 'https://planopia.pl/blog/plan-urlopow-2027-excel-pdf'
const IMAGE = 'https://planopia.pl/img/plan-urlopow-2027-excel-pdf.webp'

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
		canonical: URL,
		languages: { pl: URL, 'x-default': URL },
	},
	openGraph: {
		type: 'article',
		locale: 'pl_PL',
		url: URL,
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		publishedTime: '2026-08-19T08:00:00.000Z',
		modifiedTime: '2026-08-19T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [{
			url: IMAGE,
			width: 1200,
			height: 630,
			alt: 'Roczny plan urlopów 2027 — wzór w Excelu i PDF',
		}],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [IMAGE],
	},
	category: 'Urlopy i planowanie',
}

export default function LeavePlan2027Layout({ children }: { children: React.ReactNode }) {
	return children
}
