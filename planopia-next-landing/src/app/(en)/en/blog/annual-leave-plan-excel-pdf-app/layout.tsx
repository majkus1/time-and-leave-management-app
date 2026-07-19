import type { Metadata } from 'next'

const META_TITLE = 'Annual Leave Plan 2026: Excel, PDF or App | Planopia'
const META_DESCRIPTION =
	'Compare an annual leave plan in Excel or PDF with an online request and approval app. A practical 2026 checklist for small teams.'

export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
	keywords: [
		'annual leave plan excel',
		'leave calendar pdf',
		'leave request software',
		'vacation planning spreadsheet',
		'HR leave app small business',
		'overtime tracking software',
		'leave management',
		'Planopia',
		'excel vs leave app',
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
		canonical: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		languages: {
			pl: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
			en: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		},
	},
	openGraph: {
		title: META_TITLE,
		description: META_DESCRIPTION,
		url: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/roczny-plan.webp',
				width: 1200,
				height: 630,
				alt: 'Leave planning and requests in Planopia',
			},
		],
		locale: 'en_US',
		type: 'article',
		publishedTime: '2026-03-27T00:00:00.000Z',
		modifiedTime: '2026-03-27T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: ['/img/roczny-plan.webp'],
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

export default function ENBlogLeavePlanExcelLayout({ children }: { children: React.ReactNode }) {
	return children
}
