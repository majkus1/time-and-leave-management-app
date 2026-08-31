'use client'

import Image from 'next/image'
import LandingNavDropdown from './LandingNavDropdown'
import { industryNavForLocale } from '../data/industryNav'

type Props = {
	locale: 'pl' | 'en'
}

export default function LandingIndustriesDropdown({ locale }: Props) {
	const items = industryNavForLocale(locale).map(item => ({
		href: item.href,
		title: item.title,
		description: item.description,
		icon: <Image src={item.iconSrc} alt="" width={32} height={32} className="h-8 w-8 object-contain" />,
	}))

	return <LandingNavDropdown label={locale === 'pl' ? 'Branże' : 'Industries'} items={items} />
}
