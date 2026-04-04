import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useUserNotifications, USER_NOTIFICATIONS_QUERY_KEY } from '../hooks/useUserNotifications'

function shouldShowPreviewBody(title, body) {
	const a = String(title || '').trim()
	const b = String(body || '').trim()
	if (!b) return false
	if (a === b) return false
	return true
}

function formatRelative(iso, lang) {
	if (!iso) return ''
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return ''
	const now = Date.now()
	const diffMs = now - d.getTime()
	const sec = Math.round(diffMs / 1000)
	const rtf = new Intl.RelativeTimeFormat(lang === 'pl' ? 'pl' : 'en', { numeric: 'auto' })
	if (sec < 45) return rtf.format(-Math.max(sec, 0), 'second')
	const min = Math.round(sec / 60)
	if (min < 60) return rtf.format(-min, 'minute')
	const h = Math.round(min / 60)
	if (h < 48) return rtf.format(-h, 'hour')
	const days = Math.round(h / 24)
	if (days < 14) return rtf.format(-days, 'day')
	return d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
		day: '2-digit',
		month: 'short',
		year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
	})
}

/**
 * @param {{ variant?: 'sidebar' | 'mobile', enabled?: boolean }} props
 */
export default function NotificationBell({ variant = 'sidebar', enabled = true }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const bellRef = useRef(null)
	const panelRef = useRef(null)
	const [pos, setPos] = useState(null)

	const { items, unread, isLoading, isError, markOneRead, markAllRead } = useUserNotifications({ enabled })

	/** Otwarcie panelu = „przeczytane”: czerwony stan znika od razu (cache), potwierdzenie na serwerze. */
	useEffect(() => {
		if (!open || !enabled) return

		const now = new Date().toISOString()
		queryClient.setQueryData(USER_NOTIFICATIONS_QUERY_KEY, (old) => {
			if (!old || typeof old !== 'object') return old
			const list = Array.isArray(old.items) ? old.items : []
			return {
				...old,
				unread: 0,
				items: list.map((i) => ({ ...i, readAt: i.readAt || now })),
			}
		})

		markAllRead().catch(() => {
			queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_QUERY_KEY })
		})
	}, [open, enabled, queryClient, markAllRead])

	useLayoutEffect(() => {
		if (!open || !bellRef.current) {
			setPos(null)
			return
		}
		const update = () => {
			const r = bellRef.current.getBoundingClientRect()
			const maxW = 380
			const w = Math.min(maxW, window.innerWidth - 16)
			let left
			if (variant === 'mobile') {
				left = Math.max(8, window.innerWidth - w - 8)
			} else {
				left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8)
			}
			setPos({ top: r.bottom + 8, left, width: w })
		}
		update()
		window.addEventListener('scroll', update, true)
		window.addEventListener('resize', update)
		return () => {
			window.removeEventListener('scroll', update, true)
			window.removeEventListener('resize', update)
		}
	}, [open, variant])

	useEffect(() => {
		if (!open) return
		const onDoc = (e) => {
			if (bellRef.current?.contains(e.target)) return
			if (panelRef.current?.contains(e.target)) return
			setOpen(false)
		}
		document.addEventListener('mousedown', onDoc)
		return () => document.removeEventListener('mousedown', onDoc)
	}, [open])

	const toggle = () => {
		setOpen((v) => !v)
	}

	const onItemClick = async (n) => {
		try {
			if (!n.readAt) {
				await markOneRead(n._id)
			}
		} catch {
			/* ignore */
		}
		setOpen(false)
		const link = n.link
		if (!link) return
		if (/^https?:\/\//i.test(link)) {
			window.open(link, '_blank', 'noopener,noreferrer')
			return
		}
		navigate(link.startsWith('/') ? link : `/${link}`)
	}

	const lang = i18n.resolvedLanguage === 'en' ? 'en' : 'pl'

	const panel =
		open && pos
			? createPortal(
					<div
						ref={panelRef}
						className="notification-bell__panel"
						style={{
							position: 'fixed',
							top: pos.top,
							left: pos.left,
							width: pos.width,
							zIndex: 1080,
						}}
						role="dialog"
						aria-label={t('notifications.title')}
					>
						<div className="notification-bell__panel-head">
							<h3 className="notification-bell__panel-title">{t('notifications.title')}</h3>
						</div>
						<div className="notification-bell__panel-body">
							{isLoading && (
								<p className="notification-bell__muted">{t('notifications.loading')}</p>
							)}
							{isError && !isLoading && (
								<p className="notification-bell__error">{t('notifications.error')}</p>
							)}
							{!isLoading && !isError && items.length === 0 && (
								<p className="notification-bell__muted">{t('notifications.empty')}</p>
							)}
							{!isLoading &&
								items.map((n) => (
									<button
										key={n._id}
										type="button"
										className={`notification-bell__item ${!n.readAt ? 'notification-bell__item--unread' : ''}`}
										onClick={() => onItemClick(n)}
									>
										<div className="notification-bell__item-title">{n.title}</div>
										{shouldShowPreviewBody(n.title, n.body) ? (
											<div className="notification-bell__item-body">{n.body}</div>
										) : null}
										<div className="notification-bell__item-footer">
											<span
												className={`notification-bell__channel notification-bell__channel--${n.channel}`}
											>
												{n.channel === 'email'
													? t('notifications.channelEmailShort')
													: t('notifications.channelPushShort')}
											</span>
											<time className="notification-bell__time" dateTime={n.createdAt}>
												{formatRelative(n.createdAt, lang)}
											</time>
										</div>
									</button>
								))}
						</div>
					</div>,
					document.body
			  )
			: null

	return (
		<div className={`notification-bell notification-bell--${variant}`} ref={bellRef}>
			<button
				type="button"
				className={`notification-bell__trigger ${unread > 0 ? 'notification-bell__trigger--unread' : ''}`}
				onClick={toggle}
				aria-expanded={open}
				aria-haspopup="dialog"
				aria-label={t('notifications.ariaLabel')}
			>
				<svg
					className="notification-bell__icon"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden
				>
					<path
						d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				</svg>
				{unread > 0 && <span className="notification-bell__badge" aria-hidden />}
			</button>
			{panel}
		</div>
	)
}
