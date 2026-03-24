'use client'

import Link from 'next/link'

type Locale = 'pl' | 'en'

const copy: Record<
	Locale,
	{
		title: string
		fullName: string
		addressLines: string[]
		nip: string
		regon: string
		websiteLabel: string
		complaintsIntro: string
		complaintsLink: string
	}
> = {
	pl: {
		title: 'Dane firmy (sprzedawca)',
		fullName: 'ML Devworks Michał Lipka',
		addressLines: ['Rynek Główny 34 lok. 15', '31-010 Kraków'],
		nip: 'NIP:',
		regon: 'REGON:',
		websiteLabel: 'Strona:',
		complaintsIntro: 'Reklamacje dotyczące usługi:',
		complaintsLink: 'Informacje o reklamacjach',
	},
	en: {
		title: 'Company details (seller)',
		fullName: 'ML Devworks Michał Lipka',
		addressLines: ['Rynek Główny 34 lok. 15', '31-010 Kraków', 'Poland'],
		nip: 'Tax ID (NIP):',
		regon: 'REGON:',
		websiteLabel: 'Website:',
		complaintsIntro: 'Complaints about the service:',
		complaintsLink: 'Complaints procedure',
	},
}

export default function SellerCompanyDetails({ locale }: { locale: Locale }) {
	const t = copy[locale]
	const complaintsHref = locale === 'pl' ? '/reklamacje' : '/en/complaints'

	return (
		<div className="mb-6 rounded-xl border border-gray-200 bg-white/90 p-4 text-left shadow-sm">
			<h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t.title}</h3>
			<p className="mt-2 text-sm text-gray-800">
				<span className="font-bold text-indigo-800">Planopia</span>
				{' — '}
				<span className="text-gray-800">{t.fullName}</span>
			</p>
			<address className="mt-2 not-italic text-sm text-gray-700 leading-relaxed">
				{t.addressLines.map(line => (
					<span key={line} className="block">
						{line}
					</span>
				))}
			</address>
			<p className="mt-2 text-sm text-gray-800">
				<span className="font-semibold">{t.nip}</span> 6762707876
			</p>
			<p className="mt-1 text-sm text-gray-800">
				<span className="font-semibold">{t.regon}</span> 543372505
			</p>
			<p className="mt-2 text-sm">
				<span className="font-semibold text-gray-800">{t.websiteLabel}</span>{' '}
				<a
					href="https://ml-devworks.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-indigo-700 font-medium hover:underline underline-offset-2"
				>
					ml-devworks.com
				</a>
			</p>
			<p className="mt-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
				{t.complaintsIntro}{' '}
				<Link href={complaintsHref} className="font-semibold text-indigo-700 hover:underline underline-offset-2">
					{t.complaintsLink}
				</Link>
			</p>
		</div>
	)
}
