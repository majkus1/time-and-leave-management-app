import type { Metadata } from 'next'
import { BLOG_LEAVE_PROGRAM_OG } from '@/data/blogLeaveProgramAssets'

const META_TITLE = 'Program do urlopów dla małej firmy | Planopia'
const META_DESCRIPTION =
	'Dowiedz się, jak wybrać program do urlopów dla małej firmy: wnioski, akceptacje, kalendarz, koszt i prosty start bez Excela.'

export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
	keywords: [
		'program do urlopów dla małej firmy',
		'program do urlopów darmowy',
		'darmowy program do urlopów',
		'aplikacja do urlopów dla małej firmy',
		'program urlopowy',
		'wnioski urlopowe online',
		'jak wybrać program do urlopów',
		'kalendarz urlopowy online',
		'Planopia',
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
		canonical: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
		languages: {
			'x-default': 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
			pl: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
		},
	},
	openGraph: {
		title: META_TITLE,
		description: META_DESCRIPTION,
		url: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
		siteName: 'Planopia',
		images: [
			{
				url: BLOG_LEAVE_PROGRAM_OG.url,
				width: BLOG_LEAVE_PROGRAM_OG.width,
				height: BLOG_LEAVE_PROGRAM_OG.height,
				alt: BLOG_LEAVE_PROGRAM_OG.alt,
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2026-05-31T00:00:00.000Z',
		modifiedTime: '2026-05-31T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [BLOG_LEAVE_PROGRAM_OG.url],
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

export default function BlogProgramUrlopowMalaFirmaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
