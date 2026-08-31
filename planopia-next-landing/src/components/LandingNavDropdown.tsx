'use client'

import Link from 'next/link'
import { useRef, useState, useCallback, type ReactNode } from 'react'

const CLOSE_MS = 240

export type NavDropdownItem = {
	href: string
	title: string
	description: string
	/** Ikona po lewej — obrazek albo inline SVG. Bez niej pozostaje sama ramka. */
	icon?: ReactNode
}

type Props = {
	label: string
	items: NavDropdownItem[]
}

/**
 * Powłoka rozwijanego menu w nagłówku. Wyciągnięta z LandingIndustriesDropdown,
 * gdy pojawiło się drugie takie menu („Rozwiązania") — inaczej byłaby to druga
 * kopia tej samej obsługi hovera, opóźnienia zamknięcia i mostka nad panelem.
 */
export default function LandingNavDropdown({ label, items }: Props) {
	const [open, setOpen] = useState(false)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
						{items.map(item => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="grid min-w-[21rem] grid-cols-[44px_1fr] items-center gap-3 px-4 py-3 text-left no-underline transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
									onClick={() => setOpen(false)}>
									<span
										className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/70"
										aria-hidden>
										{item.icon}
									</span>
									<span className="min-w-0">
										<span className="block font-semibold leading-5 text-gray-900">{item.title}</span>
										<span className="mt-1 block text-sm leading-snug text-gray-600">{item.description}</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
