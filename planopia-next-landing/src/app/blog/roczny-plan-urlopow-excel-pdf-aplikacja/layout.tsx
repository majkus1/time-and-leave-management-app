import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'
import { Open_Sans, Teko, Titillium_Web } from 'next/font/google'
import '../../globals.css'

const openSans = Open_Sans({
	variable: '--font-open-sans',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700', '800'],
})

const teko = Teko({
	variable: '--font-teko',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
})

const titilliumWeb = Titillium_Web({
	variable: '--font-titillium-web',
	subsets: ['latin'],
	weight: ['200', '300', '400', '600', '700', '900'],
})

export const metadata: Metadata = {
	title: 'Roczny plan urlopów Excel, PDF i aplikacja — checklista 2026 | Planopia',
	description: `Roczny plan urlopów w Excelu i PDF vs program do wniosków urlopowych: ograniczenia arkuszy, nadgodziny, migracja do aplikacji. ${blogArticleOfferLine.pl}`,
	keywords: [
		'roczny plan urlopów excel',
		'plan urlopów pdf',
		'roczny plan urlopów 2026 excel darmowy',
		'program do wniosków urlopowych',
		'program kadrowy urlopy',
		'oprogramowanie do ewidencji nadgodzin',
		'zarządzanie urlopami',
		'planowanie urlopów',
		'Planopia',
		'aplikacja urlopowa',
		'excel vs program urlopy',
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
		url: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		siteName: 'Planopia',
		title: 'Roczny plan urlopów: Excel, PDF i aplikacja — co wybrać w 2026? | Planopia',
		description: `Checklista programu do wniosków urlopowych i ograniczenia Excela. ${blogArticleOfferLine.pl}`,
		images: [
			{
				url: 'https://planopia.pl/img/roczny-plan.webp',
				width: 1200,
				height: 630,
				alt: 'Plan urlopów i wnioski urlopowe w Planopii',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Roczny plan urlopów Excel, PDF i aplikacja | Planopia',
		description: `Urlopy: arkusz, PDF czy system z akceptacjami? ${blogArticleOfferLine.pl}`,
		images: ['https://planopia.pl/img/roczny-plan.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		languages: {
			pl: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
			en: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function BlogLeavePlanExcelPlLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
	)
}
