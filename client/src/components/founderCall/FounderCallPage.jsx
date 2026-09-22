import React, { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { API_URL } from '../../config.js'
import './FounderCallPage.css'

/*
 * /umow-rozmowe — rezerwacja 15-minutowej rozmowy wdrożeniowej z założycielem. Bez pozycji w menu: link trafia
 * do maila powitalnego i baneru na Start. Terminy liczy serwer (dni robocze 16:00–21:00 czasu polskiego, co 30 min).
 */
const QUERY_KEY = ['founder-call', 'availability']

function useAvailability() {
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/founder-call/availability`, { withCredentials: true })
			return data
		},
		staleTime: 30 * 1000,
		refetchOnWindowFocus: true,
	})
}

function fmtDay(dateYmd, locale) {
	const [y, m, d] = dateYmd.split('-').map(Number)
	const date = new Date(y, m - 1, d)
	return {
		weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
		day: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
		full: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
	}
}

function fmtTime(iso, locale, tz) {
	return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: tz })
}

function fmtFull(iso, locale, tz) {
	const s = new Date(iso).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: tz })
	return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function FounderCallPage() {
	const { t, i18n } = useTranslation()
	const locale = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB'
	const { showAlert, showConfirm } = useAlert()
	const qc = useQueryClient()
	const { data, isLoading, isError } = useAvailability()
	const [dayIdx, setDayIdx] = useState(0)
	const [slot, setSlot] = useState(null)
	const [phone, setPhone] = useState('')
	const [note, setNote] = useState('')
	const [done, setDone] = useState(null)

	const days = data?.days || []
	const tz = data?.tz || 'Europe/Warsaw'
	const current = days[dayIdx] || null
	const viewerTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
	const tzDiffers = viewerTz && viewerTz !== tz

	useEffect(() => {
		if (dayIdx >= days.length) setDayIdx(0)
	}, [days.length, dayIdx])

	const book = useMutation({
		mutationFn: async body => {
			const { data: res } = await axios.post(`${API_URL}/api/founder-call/book`, body, { withCredentials: true })
			return res
		},
		onSuccess: res => {
			setDone(res.booking)
			setSlot(null)
			qc.invalidateQueries({ queryKey: QUERY_KEY })
		},
		onError: e => {
			const code = e?.response?.data?.code
			qc.invalidateQueries({ queryKey: QUERY_KEY })
			void showAlert(
				code === 'SLOT_TAKEN' ? t('founderCallPage.slotTaken') : code === 'ALREADY_BOOKED' ? t('founderCallPage.alreadyBooked') : t('founderCallPage.error')
			)
		},
	})

	const cancel = useMutation({
		mutationFn: async () => {
			const { data: res } = await axios.post(`${API_URL}/api/founder-call/cancel`, {}, { withCredentials: true })
			return res
		},
		onSuccess: () => {
			setDone(null)
			qc.invalidateQueries({ queryKey: QUERY_KEY })
		},
		onError: () => void showAlert(t('founderCallPage.error')),
	})

	const onCancel = async () => {
		if (!(await showConfirm(t('founderCallPage.cancelConfirm')))) return
		cancel.mutate()
	}

	const existing = done || data?.myBooking

	return (
		<>
			<Helmet>
				<title>{t('founderCallPage.title')} — Planopia</title>
			</Helmet>
			<Sidebar />
			<div className="content p-3">
				<div className="po-call">
					{/* div, nie <header>: globalny styl aplikacji robi header { position: fixed } */}
					<div className="po-call__head">
						<img className="po-call__avatar" src="/img/1709827103942.webp" alt="" width="64" height="64" />
						<div>
							<span className="po-call__eyebrow">{t('founderCallPage.eyebrow')}</span>
							<h1 className="po-call__title">{t('founderCallPage.title')}</h1>
							<p className="po-call__lead">{t('founderCallPage.lead')}</p>
						</div>
					</div>

					{isLoading && <Loader />}
					{isError && <p className="po-call__error">{t('founderCallPage.error')}</p>}

					{!isLoading && existing && (
						<section className="po-call__card po-call__card--done" aria-live="polite">
							<div className="po-call__check" aria-hidden="true">✓</div>
							<h2>{t('founderCallPage.bookedTitle')}</h2>
							<p className="po-call__when">{fmtFull(existing.start, locale, tz)}</p>
							<p className="po-call__muted">
								{t('founderCallPage.bookedBody')}
								{tzDiffers ? ` ${t('founderCallPage.tzNote', { tz })}` : ''}
							</p>
							<button type="button" className="po-call__cancel" onClick={onCancel} disabled={cancel.isPending}>
								{cancel.isPending ? t('founderCallPage.cancelling') : t('founderCallPage.cancel')}
							</button>
						</section>
					)}

					{!isLoading && !existing && days.length === 0 && !isError && (
						<p className="po-call__muted">{t('founderCallPage.noSlots')}</p>
					)}

					{!isLoading && !existing && days.length > 0 && (
						<section className="po-call__card">
							<h2 className="po-call__step">{t('founderCallPage.stepDay')}</h2>
							<div className="po-call__days" role="tablist" aria-label={t('founderCallPage.stepDay')}>
								{days.map((d, i) => {
									const f = fmtDay(d.date, locale)
									return (
										<button
											key={d.date}
											type="button"
											role="tab"
											aria-selected={i === dayIdx}
											className={`po-call__day${i === dayIdx ? ' is-active' : ''}`}
											onClick={() => {
												setDayIdx(i)
												setSlot(null)
											}}
										>
											<span className="po-call__day-wd">{f.weekday}</span>
											<span className="po-call__day-d">{f.day}</span>
											<span className="po-call__day-n">{t('founderCallPage.slotsCount', { count: d.slots.length })}</span>
										</button>
									)
								})}
							</div>

							{current && (
								<>
									<h2 className="po-call__step">
										{t('founderCallPage.stepTime')} <span className="po-call__muted">— {fmtDay(current.date, locale).full}</span>
									</h2>
									<p className="po-call__muted po-call__tz">
										{t('founderCallPage.tzLabel')}
										{tzDiffers ? ` · ${t('founderCallPage.tzNote', { tz })}` : ''}
									</p>
									<div className="po-call__slots">
										{current.slots.map(s => (
											<button
												key={s.start}
												type="button"
												className={`po-call__slot${slot?.start === s.start ? ' is-active' : ''}`}
												aria-pressed={slot?.start === s.start}
												onClick={() => setSlot(s)}
											>
												{fmtTime(s.start, locale, tz)}
											</button>
										))}
									</div>
								</>
							)}

							{slot && (
								<form
									className="po-call__form"
									onSubmit={e => {
										e.preventDefault()
										book.mutate({ slotStart: slot.start, phone, note })
									}}
								>
									<h2 className="po-call__step">{t('founderCallPage.stepConfirm')}</h2>
									<p className="po-call__when">{fmtFull(slot.start, locale, tz)}</p>
									<label className="po-call__label">
										{t('founderCallPage.phone')}
										<input
											type="tel"
											inputMode="tel"
											autoComplete="tel"
											value={phone}
											onChange={e => setPhone(e.target.value)}
											placeholder="+48 600 000 000"
											maxLength={32}
										/>
										<span className="po-call__hint">{t('founderCallPage.phoneHint')}</span>
									</label>
									<label className="po-call__label">
										{t('founderCallPage.note')}
										<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={600} placeholder={t('founderCallPage.notePlaceholder')} />
									</label>
									<div className="po-call__actions">
										<button type="submit" className="po-call__submit" disabled={book.isPending}>
											{book.isPending ? t('founderCallPage.booking') : t('founderCallPage.book')}
										</button>
										<button type="button" className="po-call__ghost" onClick={() => setSlot(null)} disabled={book.isPending}>
											{t('founderCallPage.changeSlot')}
										</button>
									</div>
								</form>
							)}
						</section>
					)}
				</div>
			</div>
		</>
	)
}
