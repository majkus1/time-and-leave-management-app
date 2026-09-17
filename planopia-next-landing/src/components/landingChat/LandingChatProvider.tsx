'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { trackEvent } from '@/lib/analytics'
import type { LandingChatCta } from '@/lib/landingChat/cta'
import type { LandingChatUiModule } from '@/lib/landingChat/modulesForUi'
import { landingChatCopy, type LandingChatCopy, type LandingChatLocale } from './landingChatCopy'

export type ChatLine = {
	role: 'user' | 'assistant'
	content: string
	/** Powitanie nie jest wysyłane do modelu. */
	welcome?: boolean
	/** Odpowiedź jeszcze się streamuje. */
	streaming?: boolean
}

type MailStep = 'idle' | 'form' | 'confirm'

type EscalationState = {
	step: MailStep
	body: string
	replyEmail: string
	busy: boolean
	sent: boolean
}

export type LandingChatContextValue = {
	locale: LandingChatLocale
	copy: LandingChatCopy
	modules: LandingChatUiModule[]
	lines: ChatLine[]
	busy: boolean
	error: string | null
	module: string | null
	cta: LandingChatCta | null
	open: boolean
	send: (text: string, source: 'section' | 'widget' | 'suggestion') => Promise<void>
	setModule: (id: string | null, source: 'section' | 'widget') => void
	reset: () => void
	openPanel: (source: string) => void
	closePanel: () => void
	dismissCta: () => void
	trackCta: (kind: LandingChatCta) => void
	escalation: EscalationState
	setEscalation: (patch: Partial<EscalationState>) => void
	sendEscalation: () => Promise<void>
	/** Element sekcji na stronie głównej — widget chowa FAB, gdy sekcja jest na ekranie. */
	registerSection: (el: HTMLElement | null) => void
	sectionVisible: boolean
	focusRequest: number
	requestFocus: () => void
}

const LandingChatContext = createContext<LandingChatContextValue | null>(null)

const STORAGE_PREFIX = 'planopia-landing-chat-v1:'
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000

type StoredState = { lines: ChatLine[]; module: string | null; updatedAt: number }

function readStored(locale: LandingChatLocale): StoredState | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${locale}`)
		if (!raw) return null
		const parsed = JSON.parse(raw) as StoredState
		if (!parsed || !Array.isArray(parsed.lines)) return null
		if (typeof parsed.updatedAt !== 'number' || Date.now() - parsed.updatedAt > STORAGE_TTL_MS) return null
		return {
			lines: parsed.lines
				.filter(l => l && (l.role === 'user' || l.role === 'assistant') && typeof l.content === 'string')
				.map(l => ({ role: l.role, content: l.content, welcome: l.welcome === true })),
			module: typeof parsed.module === 'string' ? parsed.module : null,
			updatedAt: parsed.updatedAt,
		}
	} catch {
		return null
	}
}

function writeStored(locale: LandingChatLocale, state: StoredState) {
	if (typeof window === 'undefined') return
	try {
		sessionStorage.setItem(`${STORAGE_PREFIX}${locale}`, JSON.stringify(state))
	} catch {
		/* tryb prywatny / limit */
	}
}

type SseEvent =
	| { type: 'meta'; meta: unknown }
	| { type: 'delta'; text: string }
	| { type: 'cta'; cta: LandingChatCta }
	| { type: 'end'; model?: string }
	| { type: 'error'; message?: string }

async function readSse(res: Response, onEvent: (ev: SseEvent) => void) {
	if (!res.body) throw new Error('empty body')
	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ''
	const handle = (raw: string) => {
		const line = raw
			.split('\n')
			.map(l => l.replace(/\r$/, ''))
			.find(l => l.startsWith('data: '))
		if (!line) return
		try {
			onEvent(JSON.parse(line.slice(6)) as SseEvent)
		} catch {
			/* niepełny fragment */
		}
	}
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, { stream: true })
		let sep: number
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			handle(buffer.slice(0, sep))
			buffer = buffer.slice(sep + 2)
		}
	}
	if (buffer.trim()) handle(buffer)
}

export function LandingChatProvider({
	locale,
	modules,
	children,
}: {
	locale: LandingChatLocale
	modules: LandingChatUiModule[]
	children: ReactNode
}) {
	const copy = landingChatCopy[locale]
	/* Powitanie w stanie początkowym — renderuje się już w SSR, nie dopiero po hydracji. */
	const [lines, setLines] = useState<ChatLine[]>(() => [{ role: 'assistant', content: copy.welcome, welcome: true }])
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [module, setModuleState] = useState<string | null>(null)
	const [cta, setCta] = useState<LandingChatCta | null>(null)
	const [open, setOpen] = useState(false)
	const [hydrated, setHydrated] = useState(false)
	const [sectionVisible, setSectionVisible] = useState(false)
	const [focusRequest, setFocusRequest] = useState(0)
	const [escalation, setEscalationState] = useState<EscalationState>({
		step: 'idle',
		body: '',
		replyEmail: '',
		busy: false,
		sent: false,
	})
	const linesRef = useRef(lines)
	linesRef.current = lines
	const sectionRef = useRef<HTMLElement | null>(null)
	const turnRef = useRef(0)

	/* Odtworzenie rozmowy po nawigacji między stronami landingu (sessionStorage per locale). */
	useEffect(() => {
		const stored = readStored(locale)
		if (stored && stored.lines.length > 0) {
			setLines(stored.lines)
			setModuleState(stored.module)
			turnRef.current = stored.lines.filter(l => l.role === 'user').length
		}
		setHydrated(true)
	}, [locale])

	useEffect(() => {
		if (!hydrated || busy) return
		writeStored(locale, { lines, module, updatedAt: Date.now() })
	}, [lines, module, locale, hydrated, busy])

	const registerSection = useCallback((el: HTMLElement | null) => {
		sectionRef.current = el
		if (!el || typeof IntersectionObserver === 'undefined') {
			setSectionVisible(false)
			return
		}
		const io = new IntersectionObserver(entries => setSectionVisible(entries.some(e => e.isIntersecting)), {
			threshold: 0.2,
		})
		io.observe(el)
		return () => io.disconnect()
	}, [])

	const requestFocus = useCallback(() => setFocusRequest(n => n + 1), [])

	const openPanel = useCallback(
		(source: string) => {
			setOpen(true)
			setError(null)
			trackEvent('landing_chat_open', { source, locale })
			requestFocus()
		},
		[locale, requestFocus],
	)

	const closePanel = useCallback(() => setOpen(false), [])

	const setModule = useCallback(
		(id: string | null, source: 'section' | 'widget') => {
			setModuleState(id)
			if (id) trackEvent('landing_chat_module_select', { module: id, source, locale })
		},
		[locale],
	)

	const send = useCallback(
		async (rawText: string, source: 'section' | 'widget' | 'suggestion') => {
			const text = rawText.trim()
			if (!text || busy) return
			setError(null)
			setCta(null)
			const prev = linesRef.current
			const history = [...prev, { role: 'user' as const, content: text }]
			const withAssistant: ChatLine[] = [...history, { role: 'assistant', content: '', streaming: true }]
			linesRef.current = withAssistant
			setLines(withAssistant)
			setBusy(true)
			turnRef.current += 1
			trackEvent('landing_chat_message', { locale, module: module ?? 'none', turn: turnRef.current, source })

			const patchLast = (updater: (line: ChatLine) => ChatLine) => {
				setLines(current => {
					const next = [...current]
					const idx = next.length - 1
					if (idx >= 0 && next[idx].role === 'assistant') next[idx] = updater(next[idx])
					linesRef.current = next
					return next
				})
			}
			const fail = (message: string, status: number | string) => {
				setError(message)
				trackEvent('landing_chat_error', { status: String(status), locale })
				linesRef.current = prev
				setLines(prev)
			}

			try {
				const res = await fetch('/api/public/landing-chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						locale,
						module,
						stream: true,
						messages: history.filter(l => !l.welcome).map(({ role, content }) => ({ role, content })),
					}),
				})
				if (!res.ok) {
					if (res.status === 429) fail(copy.errorRate, 429)
					else if (res.status === 503) fail(copy.errorDisabled, 503)
					else fail(copy.error, res.status)
					return
				}
				const ct = res.headers.get('content-type') || ''
				let full = ''
				let gotEnd = false
				let streamError: string | null = null
				if (ct.includes('text/event-stream')) {
					await readSse(res, ev => {
						if (ev.type === 'delta') {
							full += ev.text
							const snapshot = full
							patchLast(l => ({ ...l, content: snapshot }))
						} else if (ev.type === 'cta') {
							setCta(ev.cta)
						} else if (ev.type === 'end') {
							gotEnd = true
						} else if (ev.type === 'error') {
							streamError = ev.message || copy.error
						}
					})
				} else {
					const data = (await res.json().catch(() => ({}))) as { message?: string; cta?: LandingChatCta | null }
					full = data.message || ''
					gotEnd = Boolean(full)
					if (data.cta) setCta(data.cta)
				}
				if (streamError || (!gotEnd && !full)) {
					fail(streamError || copy.error, 'stream')
					return
				}
				const final = full
				patchLast(l => ({ ...l, content: final, streaming: false }))
			} catch {
				fail(copy.error, 'network')
			} finally {
				setBusy(false)
			}
		},
		[busy, copy.error, copy.errorDisabled, copy.errorRate, locale, module],
	)

	const reset = useCallback(() => {
		const fresh: ChatLine[] = [{ role: 'assistant', content: copy.welcome, welcome: true }]
		linesRef.current = fresh
		setLines(fresh)
		setCta(null)
		setError(null)
		turnRef.current = 0
	}, [copy.welcome])

	const dismissCta = useCallback(() => setCta(null), [])
	const trackCta = useCallback(
		(kind: LandingChatCta) => trackEvent('landing_chat_lead_cta', { kind, locale, module: module ?? 'none' }),
		[locale, module],
	)

	const setEscalation = useCallback((patch: Partial<EscalationState>) => {
		setEscalationState(s => ({ ...s, ...patch }))
	}, [])

	const sendEscalation = useCallback(async () => {
		const body = escalation.body.trim()
		if (!body || escalation.busy) return
		setEscalationState(s => ({ ...s, busy: true }))
		setError(null)
		try {
			const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
			const transcript = linesRef.current.filter(l => !l.welcome && l.content).map(({ role, content }) => ({ role, content }))
			const res = await fetch('/api/public/landing-chat-mail', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: body,
					replyEmail: escalation.replyEmail.trim() || undefined,
					locale,
					pageUrl,
					transcript,
					module,
				}),
			})
			if (!res.ok) {
				setError(res.status === 503 ? copy.emailDisabled : copy.emailError)
				setEscalationState(s => ({ ...s, busy: false }))
				return
			}
			trackEvent('landing_chat_escalate_mail', { locale, module: module ?? 'none', turns: transcript.length })
			setEscalationState({ step: 'idle', body: '', replyEmail: '', busy: false, sent: true })
		} catch {
			setError(copy.emailError)
			setEscalationState(s => ({ ...s, busy: false }))
		}
	}, [copy.emailDisabled, copy.emailError, escalation.body, escalation.busy, escalation.replyEmail, locale, module])

	const value = useMemo<LandingChatContextValue>(
		() => ({
			locale,
			copy,
			modules,
			lines,
			busy,
			error,
			module,
			cta,
			open,
			send,
			setModule,
			reset,
			openPanel,
			closePanel,
			dismissCta,
			trackCta,
			escalation,
			setEscalation,
			sendEscalation,
			registerSection,
			sectionVisible,
			focusRequest,
			requestFocus,
		}),
		[
			locale,
			copy,
			modules,
			lines,
			busy,
			error,
			module,
			cta,
			open,
			send,
			setModule,
			reset,
			openPanel,
			closePanel,
			dismissCta,
			trackCta,
			escalation,
			setEscalation,
			sendEscalation,
			registerSection,
			sectionVisible,
			focusRequest,
			requestFocus,
		],
	)

	return <LandingChatContext.Provider value={value}>{children}</LandingChatContext.Provider>
}

export function useLandingChat(): LandingChatContextValue {
	const ctx = useContext(LandingChatContext)
	if (!ctx) throw new Error('useLandingChat must be used within LandingChatProvider')
	return ctx
}

export function useLandingChatOptional(): LandingChatContextValue | null {
	return useContext(LandingChatContext)
}
