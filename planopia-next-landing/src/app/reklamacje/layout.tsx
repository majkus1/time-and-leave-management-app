import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Reklamacje — Planopia.pl',
	description:
		'Jak złożyć reklamację dotyczącą usługi Planopia: zgłoszenie mailowe, terminy rozpatrzenia. ML Devworks Michał Lipka.',
	openGraph: {
		url: 'https://planopia.pl/reklamacje',
		title: 'Reklamacje — Planopia.pl',
	},
	alternates: {
		canonical: 'https://planopia.pl/reklamacje',
		languages: {
			pl: 'https://planopia.pl/reklamacje',
			en: 'https://planopia.pl/en/complaints',
		},
	},
}

export default function ReklamacjeLayout({ children }: { children: React.ReactNode }) {
	return children
}
