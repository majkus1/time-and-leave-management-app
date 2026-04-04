'use client'

import Link from 'next/link'
import { useRef, useState, useCallback } from 'react'
import { industryNavForLocale } from '../data/industryNav'

const CLOSE_MS = 240

type Props = {
	locale: 'pl' | 'en'
}

export default function LandingIndustriesDropdown({ locale }: Props) {
	const [open, setOpen] = useState(false)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const items = industryNavForLocale(locale)
	const label = locale === 'pl' ? 'Branże' : 'Industries'

	const clearTimer = useCallback(() => {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current)
			closeTimer.current = null
		}
	}, [])

	const openNow = useCallback(() => {
		clearTimer()
		setOpen(true)
	}, [clearTimer])

	const scheduleClose = useCallback(() => {
		clearTimer()
		closeTimer.current = setTimeout(() => setOpen(false), CLOSE_MS)
	}, [clearTimer])

	if (items.length === 0) return null

	return (
		<div className="relative inline-flex" onMouseEnter={openNow} onMouseLeave={scheduleClose}>
			<button
				type="button"
				className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-blue-600 font-bold hover:text-blue-700 transition"
				aria-expanded={open}
				aria-haspopup="true">
				{label}
				<span className="text-xs text-blue-600/85" aria-hidden>
					▾
				</span>
			</button>
			{/* Mostek -mt-2 + pt-2: kursor nie „gubi” hovera między przyciskiem a panelem */}
			<div
				className={`absolute left-1/2 top-full z-[100] w-max max-w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 -mt-2 pt-2 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
				<div
					className={`origin-top rounded-xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5 transition duration-150 ${
						open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-0.5 opacity-0'
					}`}>
					<ul className="m-0 list-none p-0">
						{items.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="block px-4 py-3 text-left no-underline transition hover:bg-blue-50"
									onClick={() => setOpen(false)}>
									<span className="block font-semibold text-gray-900">{item.title}</span>
									<span className="mt-0.5 block text-sm leading-snug text-gray-600">{item.description}</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
