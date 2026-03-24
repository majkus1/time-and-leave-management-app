import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Complaints — Planopia.pl',
	description:
		'How to submit a complaint about Planopia services: email, response timeframes. ML Devworks Michał Lipka.',
	openGraph: {
		url: 'https://planopia.pl/en/complaints',
		title: 'Complaints — Planopia.pl',
	},
	alternates: {
		canonical: 'https://planopia.pl/en/complaints',
		languages: {
			pl: 'https://planopia.pl/reklamacje',
			en: 'https://planopia.pl/en/complaints',
		},
	},
}

export default function ComplaintsEnLayout({ children }: { children: React.ReactNode }) {
	return children
}
