'use client'

import LandingNavDropdown from './LandingNavDropdown'
import { solutionNavForLocale, type SolutionNavItem } from '../data/solutionsNav'

/**
 * Ikony inline, a nie pliki: repo nie ma spójnego zestawu dla funkcji produktu,
 * a dokładanie niepasujących obrazków wyglądałoby gorzej niż prosty rysunek.
 */
const IKONY: Record<SolutionNavItem['icon'], React.ReactNode> = {
	clock: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</>
	),
	calendar: (
		<>
			<rect x="3" y="5" width="18" height="16" rx="2" />
			<path d="M8 3v4M16 3v4M3 10h18" />
		</>
	),
	grid: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<path d="M3 10h18M9 10v10M15 10v10" />
		</>
	),
	qr: (
		<>
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<path d="M14 14h3v3h-3zM20 14v3M17 20h4" />
		</>
	),
	plus: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 8v8M8 12h8" />
		</>
	),
}

function Ikona({ nazwa }: { nazwa: SolutionNavItem['icon'] }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="#047857"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-6 w-6"
			aria-hidden>
			{IKONY[nazwa]}
		</svg>
	)
}

export default function LandingSolutionsDropdown({ locale }: { locale: 'pl' | 'en' }) {
	const items = solutionNavForLocale(locale).map(item => ({
		href: item.href,
		title: item.title,
		description: item.description,
		icon: <Ikona nazwa={item.icon} />,
	}))

	return <LandingNavDropdown label={locale === 'pl' ? 'Rozwiązania' : 'Solutions'} items={items} />
}
