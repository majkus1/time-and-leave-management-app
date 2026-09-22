'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SlotsPayload } from '@/lib/founderCallSlots'

type Copy = {
	pickDay: string
	pickTime: string
	tzNote: string
	tzDiffers: string
	loading: string
	empty: string
	selected: string
	clear: string
	slotsCount: (n: number) => string
}

type Props = {
	locale: 'pl' | 'en'
	selected: Date | null
	onChange: (date: Date | null) => void
	copy: Copy
}

/*
 * Wybór terminu rozmowy w formularzu kontaktowym — te same sloty, co /umow-rozmowe w aplikacji (dni robocze
 * 16:00–21:00 czasu polskiego, co 30 min; zajęte ukryte). Dni jako przewijany rząd kart, godziny jako siatka —
 * bez kalendarza z 31 dniami, z których większość i tak jest niedostępna.
 */
export default function LandingContactSlotPicker({ locale, selected, onChange, copy }: Props) {
	const [data, setData] = useState<SlotsPayload | null>(null)
	const [failed, setFailed] = useState(false)
	const [dayIdx, setDayIdx] = useState(0)
	const localeTag = locale === 'pl' ? 'pl-PL' : 'en-GB'

	useEffect(() => {
		let alive = true
		fetch('/api/public/founder-call-slots')
			.then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
			.then((d: SlotsPayload) => alive && setData(d))
			.catch(() => alive && setFailed(true))
		return () => {
			alive = false
		}
	}, [])

	const tz = data?.tz || 'Europe/Warsaw'
	const days = data?.days || []
	const current = days[dayIdx] || null
	const viewerTz = useMemo(() => {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone
		} catch {
			return ''
		}
	}, [])
	const tzDiffers = Boolean(viewerTz && viewerTz !== tz)

	const fmtDay = (ymd: string) => {
		const [y, m, d] = ymd.split('-').map(Number)
		const date = new Date(y, m - 1, d)
		return {
			wd: date.toLocaleDateString(localeTag, { weekday: 'short' }),
			d: date.toLocaleDateString(localeTag, { day: 'numeric', month: 'short' }),
		}
	}
	const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit', timeZone: tz })
	const fmtFull = (d: Date) => {
		const s = d.toLocaleString(localeTag, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: tz })
		return s.charAt(0).toUpperCase() + s.slice(1) // tylko pierwsza litera — CSS capitalize robiło „23 Września”
	}

	if (selected) {
		return (
			<div className="landing-slot-picker landing-slot-picker--selected">
				<div className="landing-slot-picker__chosen">
					<span className="landing-slot-picker__check" aria-hidden="true">✓</span>
					<span>
						<span className="landing-slot-picker__chosen-label">{copy.selected}</span>
						<strong>{fmtFull(selected)}</strong>
					</span>
				</div>
				<button type="button" className="landing-slot-picker__clear" onClick={() => onChange(null)}>
					{copy.clear}
				</button>
			</div>
		)
	}

	if (!data && !failed) return <p className="landing-slot-picker__note">{copy.loading}</p>
	if (failed || days.length === 0) return <p className="landing-slot-picker__note">{copy.empty}</p>

	return (
		<div className="landing-slot-picker">
			<p className="landing-slot-picker__step">{copy.pickDay}</p>
			<div className="landing-slot-picker__days" role="tablist" aria-label={copy.pickDay}>
				{days.map((day, i) => {
					const f = fmtDay(day.date)
					return (
						<button
							key={day.date}
							type="button"
							role="tab"
							aria-selected={i === dayIdx}
							className={`landing-slot-picker__day${i === dayIdx ? ' is-active' : ''}`}
							onClick={() => setDayIdx(i)}
						>
							<span className="landing-slot-picker__day-wd">{f.wd}</span>
							<span className="landing-slot-picker__day-d">{f.d}</span>
							<span className="landing-slot-picker__day-n">{copy.slotsCount(day.slots.length)}</span>
						</button>
					)
				})}
			</div>
			{current && (
				<>
					<p className="landing-slot-picker__step">
						{copy.pickTime}
						<span className="landing-slot-picker__note-inline">
							{' '}
							· {copy.tzNote}
							{tzDiffers ? ` · ${copy.tzDiffers.replace('{tz}', viewerTz)}` : ''}
						</span>
					</p>
					<div className="landing-slot-picker__slots">
						{current.slots.map(s => (
							<button key={s.start} type="button" className="landing-slot-picker__slot" onClick={() => onChange(new Date(s.start))}>
								{fmtTime(s.start)}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	)
}
