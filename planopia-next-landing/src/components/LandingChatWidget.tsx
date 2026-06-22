'use client'

import type { ReactNode } from 'react'
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type Locale = 'pl' | 'en'

type ChatLine = { role: 'user' | 'assistant'; content: string }

type MailStep = 'idle' | 'form' | 'confirm'

const CHAT_ICON = '/img/planio-czat.png'

const UI: Record<
	Locale,
	{
		title: string
		placeholder: string
		send: string
		thinking: string
		error: string
		welcome: string
		close: string
		open: string
		emailCta: string
		emailBodyLabel: string
		emailReplyLabel: string
		emailNext: string
		emailBack: string
		emailConfirm: string
		emailSend: string
		emailCancel: string
		emailSent: string
		emailError: string
		emailDisabled: string
	}
> = {
	pl: {
		title: 'Planio - Asystent',
		placeholder: 'Napisz pytanie…',
		send: 'Wyślij',
		thinking: 'Chwila…',
		error: 'Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.',
		welcome: 'Cześć, jestem Planio. Jak mogę pomóc?',
		close: 'Zamknij czat',
		open: 'Otwórz czat z asystentem',
		emailCta: 'Wyślij pytanie e-mailem do zespołu',
		emailBodyLabel: 'Treść wiadomości',
		emailReplyLabel: 'Twój e-mail (opcjonalnie — żeby móc odpowiedzieć)',
		emailNext: 'Dalej',
		emailBack: 'Wróć',
		emailConfirm: 'Czy wysłać wiadomość na adres office@ml-devworks.com?',
		emailSend: 'Wyślij',
		emailCancel: 'Anuluj',
		emailSent: 'Wysłano. Dziękujemy — odezwiemy się jak najszybciej.',
		emailError: 'Nie udało się wysłać. Spróbuj ponownie później.',
		emailDisabled: 'Wysyłka e-maili z czatu jest chwilowo wyłączona.',
	},
	en: {
		title: 'Planio - Assistant',
		placeholder: 'Type your question…',
		send: 'Send',
		thinking: 'One moment…',
		error: 'Could not get a reply. Please try again in a moment.',
		welcome:
			'Hi! I’m the Planopia assistant. I can explain features, pricing, the trial, and how to pick a plan — what would you like to know?',
		close: 'Close chat',
		open: 'Open assistant chat',
		emailCta: 'Send your question by email',
		emailBodyLabel: 'Message',
		emailReplyLabel: 'Your email (optional — for a reply)',
		emailNext: 'Continue',
		emailBack: 'Back',
		emailConfirm: 'Send this message to office@ml-devworks.com?',
		emailSend: 'Send',
		emailCancel: 'Cancel',
		emailSent: 'Sent. Thank you — we’ll get back to you as soon as we can.',
		emailError: 'Could not send. Please try again later.',
		emailDisabled: 'Email sending from chat is temporarily unavailable.',
	},
}

function localeFromPath(pathname: string | null): Locale {
	if (!pathname) return 'pl'
	return pathname.startsWith('/en') ? 'en' : 'pl'
}

/**
 * Modele często zwracają fragmenty w stylu Markdown (**pogrubienie**).
 * Czasem podwójnie „opakowują” (np. **\\*\\*Pro\\*\\***) — upraszczamy przed parsowaniem.
 */
function normalizeAssistantMarkdown(raw: string): string {
	let s = raw.replace(/\\([*`_#])/g, '$1')
	for (let i = 0; i < 4; i++) {
		const next = s.replace(/\*\*(\*\*[^*]+?\*\*)\*\*/g, '$1')
		if (next === s) break
		s = next
	}
	/* np. ****Pro**** → **Pro** (model czasem „podwójnie” pogrubia) */
	for (let i = 0; i < 4; i++) {
		const next = s.replace(/\*{3,}([^*\n]+?)\*{3,}/g, '**$1**')
		if (next === s) break
		s = next
	}
	return s
}

function isSafeHttpUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

/** Jedna linia tekstu: linki markdown + **wyróżnienie** (bez HTML z modelu). */
function formatAssistantLine(line: string, keyPrefix: string): ReactNode[] {
	const normalized = normalizeAssistantMarkdown(line)
	const out: ReactNode[] = []
	const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
	let cursor = 0
	let linkMatch: RegExpExecArray | null
	let nodeIndex = 0

	const pushWithBold = (chunk: string) => {
		if (!chunk) return
		const boldRe = /\*\*([^*]+)\*\*/g
		let boldCursor = 0
		let boldMatch: RegExpExecArray | null

		while ((boldMatch = boldRe.exec(chunk)) !== null) {
			if (boldMatch.index > boldCursor) {
				out.push(<span key={`${keyPrefix}-t-${nodeIndex++}`}>{chunk.slice(boldCursor, boldMatch.index)}</span>)
			}
			out.push(
				<strong key={`${keyPrefix}-b-${nodeIndex++}`} className="font-semibold text-gray-900">
					{boldMatch[1]}
				</strong>
			)
			boldCursor = boldRe.lastIndex
		}

		if (boldCursor < chunk.length) {
			out.push(<span key={`${keyPrefix}-t-${nodeIndex++}`}>{chunk.slice(boldCursor)}</span>)
		}
	}

	while ((linkMatch = linkRe.exec(normalized)) !== null) {
		const before = normalized.slice(cursor, linkMatch.index)
		pushWithBold(before)

		const label = linkMatch[1]
		const href = linkMatch[2]
		if (isSafeHttpUrl(href)) {
			out.push(
				<a
					key={`${keyPrefix}-a-${nodeIndex++}`}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="landing-chat-assistant-link underline decoration-emerald-400 underline-offset-2 font-medium"
				>
					{label}
				</a>
			)
		} else {
			pushWithBold(linkMatch[0])
		}

		cursor = linkRe.lastIndex
	}

	pushWithBold(normalized.slice(cursor))
	return out.length ? out : [normalized]
}

/** Treść bąbelka asystenta: akapity + zwykłe łamanie linii. */
function AssistantMessageContent({ text }: { text: string }) {
	const paras = text.split(/\n{2,}/)
	return (
		<div className="whitespace-pre-wrap break-words">
			{paras.map((para, pi) => {
				const lines = para.split('\n')
				return (
					<p key={pi} className={pi > 0 ? 'mt-2' : ''}>
						{lines.map((line, li) => (
							<Fragment key={li}>
								{li > 0 ? <br /> : null}
								{formatAssistantLine(line, `${pi}-${li}`)}
							</Fragment>
						))}
					</p>
				)
			})}
		</div>
	)
}

function ChatIcon({ className }: { className?: string }) {
	return (
		<span
			className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white/95 shadow-md shadow-emerald-900/20 ${className ?? ''}`}
			aria-hidden
		>
			<img src={CHAT_ICON} alt="" className="h-[95%] w-[95%] object-contain" />
		</span>
	)
}

export default function LandingChatWidget() {
	const pathname = usePathname()
	const locale = localeFromPath(pathname)
	const t = UI[locale]
	const panelId = useId()
	const [open, setOpen] = useState(false)
	const [lines, setLines] = useState<ChatLine[]>([])
	const [input, setInput] = useState('')
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [mailStep, setMailStep] = useState<MailStep>('idle')
	const [mailBody, setMailBody] = useState('')
	const [mailReply, setMailReply] = useState('')
	const [mailBusy, setMailBusy] = useState(false)
	const [mailSent, setMailSent] = useState(false)
	/** Menu mobilne ustawia `mobile-menu-open` na body — ten sam z-index co panel (9999) kładł czat wizualnie NAD menu. */
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)

	const enabledPublic = process.env.NEXT_PUBLIC_LANDING_CHAT_ENABLED !== 'false'

	useLayoutEffect(() => {
		if (typeof document === 'undefined') return
		const sync = () => {
			setMobileMenuOpen(document.body.classList.contains('mobile-menu-open'))
		}
		sync()
		const mo = new MutationObserver(sync)
		mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
		return () => mo.disconnect()
	}, [])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [lines, open, busy, mailStep])

	const seedWelcome = useCallback(() => {
		setLines([{ role: 'assistant', content: t.welcome }])
	}, [t.welcome])

	useEffect(() => {
		if (open && lines.length === 0) seedWelcome()
	}, [open, lines.length, seedWelcome])

	const openPanel = useCallback(() => {
		setOpen(true)
		setError(null)
		requestAnimationFrame(() => inputRef.current?.focus())
	}, [])

	const send = useCallback(async () => {
		const text = input.trim()
		if (!text || busy) return
		setInput('')
		setError(null)
		const nextUser: ChatLine = { role: 'user', content: text }
		const history = [...lines, nextUser]
		setLines(history)
		setBusy(true)
		try {
			const res = await fetch('/api/public/landing-chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					locale,
					messages: history.map(({ role, content }) => ({ role, content })),
				}),
			})
			const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
			if (!res.ok) {
				if (res.status === 429) {
					setError(locale === 'pl' ? 'Zbyt wiele wiadomości. Spróbuj za chwilę.' : 'Too many messages. Please wait a bit.')
				} else if (res.status === 503) {
					setError(locale === 'pl' ? 'Czat jest chwilowo niedostępny.' : 'Chat is temporarily unavailable.')
				} else {
					setError(t.error)
				}
				return
			}
			if (data.message) {
				setLines([...history, { role: 'assistant', content: data.message }])
			} else {
				setError(t.error)
			}
		} catch {
			setError(t.error)
		} finally {
			setBusy(false)
		}
	}, [busy, input, lines, locale, t.error])

	const sendMail = useCallback(async () => {
		const body = mailBody.trim()
		if (!body || mailBusy) return
		setMailBusy(true)
		setError(null)
		try {
			const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
			const res = await fetch('/api/public/landing-chat-mail', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: body,
					replyEmail: mailReply.trim() || undefined,
					locale,
					pageUrl,
				}),
			})
			if (!res.ok) {
				if (res.status === 503) setError(t.emailDisabled)
				else setError(t.emailError)
				return
			}
			setMailSent(true)
			setMailStep('idle')
			setMailBody('')
			setMailReply('')
		} catch {
			setError(t.emailError)
		} finally {
			setMailBusy(false)
		}
	}, [mailBody, mailBusy, mailReply, locale, t.emailDisabled, t.emailError])

	if (!enabledPublic) return null

	return (
		<div
			className={`landing-chat-widget pointer-events-none fixed bottom-0 right-0 z-[9997] flex flex-col items-end gap-2 p-4 md:p-5 [&_*]:pointer-events-auto ${mobileMenuOpen ? 'hidden' : ''}`}
		>
			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby={panelId}
					className="landing-chat-panel flex max-h-[min(560px,calc(100vh-6rem))] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80"
				>
					<div className="flex items-center justify-between gap-2 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
						{/* div zamiast h2: globalne `h2 { color: #213555 !important }` nadpisuje biały tekst */}
						<div
							id={panelId}
							role="heading"
							aria-level={2}
							className="landing-chat-panel__title m-0 text-base font-bold tracking-tight !text-white"
							style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
						>
							{t.title}
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="landing-chat-panel__close flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-2xl font-normal leading-none text-white hover:bg-white/15"
							aria-label={t.close}
						>
							✕
						</button>
					</div>
					<div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3 py-3">
						{mailSent && (
							<p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{t.emailSent}</p>
						)}
						{lines.map((line, i) => (
							<div
								key={`${line.role}-${i}`}
								className={`flex w-full min-w-0 ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								{line.role === 'assistant' ? (
									<div className="flex min-w-0 max-w-[92%] items-end gap-2.5 pr-3">
										<ChatIcon className="h-10 w-10 mb-0.5 shrink-0" />
										<div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800">
											<AssistantMessageContent text={line.content} />
										</div>
									</div>
								) : (
									<div
										className="landing-chat-message--user max-w-[92%] w-max rounded-2xl bg-emerald-600 px-3 py-2 text-sm leading-relaxed text-white"
										style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
									>
										<span
											className="landing-chat-user-text block whitespace-pre-wrap break-words text-white"
											style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
										>
											{line.content}
										</span>
									</div>
								)}
							</div>
						))}
						{busy && <p className="text-xs text-gray-500 px-1">{t.thinking}</p>}
						{error && <p className="text-xs text-red-600 px-1">{error}</p>}
						<div ref={bottomRef} />
					</div>
					<div className="border-t border-slate-100 bg-white px-4 py-4">
						{mailStep === 'form' && (
							<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
								<label className="block text-xs font-semibold text-gray-700">{t.emailBodyLabel}</label>
								<textarea
									value={mailBody}
									onChange={e => setMailBody(e.target.value)}
									rows={4}
									className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900"
									disabled={mailBusy}
								/>
								<label className="block text-xs font-semibold text-gray-700">{t.emailReplyLabel}</label>
								<input
									type="email"
									value={mailReply}
									onChange={e => setMailReply(e.target.value)}
									className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900"
									disabled={mailBusy}
								/>
								<div className="flex flex-wrap gap-2 pt-1">
									<button
										type="button"
										onClick={() => {
											if (!mailBody.trim()) return
											setMailStep('confirm')
										}}
										disabled={mailBusy || !mailBody.trim()}
										className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
									>
										{t.emailNext}
									</button>
									<button
										type="button"
										onClick={() => {
											setMailStep('idle')
											setMailBody('')
											setMailReply('')
										}}
										className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-gray-700"
									>
										{t.emailCancel}
									</button>
								</div>
							</div>
						)}
						{mailStep === 'confirm' && (
							<div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-gray-800">
								<p className="m-0 font-medium leading-snug">{t.emailConfirm}</p>
								<p className="mx-0 my-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg border border-amber-100/90 bg-white/90 px-3 py-3 text-xs leading-relaxed shadow-sm">
									{mailBody}
								</p>
								<div className="flex flex-wrap gap-2 pt-1">
									<button
										type="button"
										onClick={() => void sendMail()}
										disabled={mailBusy}
										className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
									>
										{t.emailSend}
									</button>
									<button
										type="button"
										onClick={() => setMailStep('form')}
										disabled={mailBusy}
										className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-gray-700"
									>
										{t.emailBack}
									</button>
								</div>
							</div>
						)}
						{mailStep === 'idle' && (
							<>
								<div className="flex flex-col gap-2">
									<textarea
										ref={inputRef}
										value={input}
										onChange={e => setInput(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault()
												void send()
											}
										}}
										rows={2}
										placeholder={t.placeholder}
										className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
										disabled={busy}
									/>
									<button
										type="button"
										onClick={() => void send()}
										disabled={busy || !input.trim()}
										className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
									>
										{t.send}
									</button>
								</div>
								<button
									type="button"
									onClick={() => {
										setMailSent(false)
										setMailStep('form')
										setError(null)
									}}
									className="mt-2 w-full rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-medium text-emerald-800 hover:bg-emerald-50"
								>
									{t.emailCta}
								</button>
							</>
						)}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => (open ? setOpen(false) : openPanel())}
				className="landing-chat-fab flex h-14 w-14 items-center justify-center rounded-full bg-transparent p-0 text-white shadow-none transition hover:scale-[1.03] hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
				aria-label={open ? t.close : t.open}
				aria-expanded={open}
			>
				<ChatIcon className="h-14 w-14" />
			</button>
		</div>
	)
}
