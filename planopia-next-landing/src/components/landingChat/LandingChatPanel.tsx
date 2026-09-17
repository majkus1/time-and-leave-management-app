'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantMessageContent } from './landingChatMarkdown'
import { LANDING_CHAT_ICON, LANDING_CONTACT_ANCHOR, LANDING_REGISTER_URL } from './landingChatCopy'
import { useLandingChat, type ChatLine } from './LandingChatProvider'

export function ChatIcon({ className, alt }: { className?: string; alt: string }) {
	return (
		<span
			className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white/95 shadow-md shadow-emerald-900/20 ${className ?? ''}`}
			aria-hidden
		>
			<img src={LANDING_CHAT_ICON} alt={alt} className="h-[95%] w-[95%] object-contain" />
		</span>
	)
}

type Variant = 'section' | 'widget'

function ModuleChips({ variant }: { variant: Variant }) {
	const { copy, modules, module, setModule, busy } = useLandingChat()
	const rowRef = useRef<HTMLDivElement>(null)

	/*
	 * Wiersz chipów przewija się poziomo (widget, telefon) — aktywny chip ma być widoczny po odtworzeniu rozmowy.
	 * Tylko scrollLeft wiersza: scrollIntoView przewijało całą stronę do sekcji przy każdym wejściu na planopia.pl.
	 */
	useEffect(() => {
		const row = rowRef.current
		const active = row?.querySelector<HTMLElement>('.landing-chat-chip--active')
		if (!row || !active || row.scrollWidth <= row.clientWidth) return
		const rowRect = row.getBoundingClientRect()
		const chipRect = active.getBoundingClientRect()
		if (chipRect.left < rowRect.left) row.scrollLeft += chipRect.left - rowRect.left - 8
		else if (chipRect.right > rowRect.right) row.scrollLeft += chipRect.right - rowRect.right + 8
	}, [module])

	return (
		<div ref={rowRef} className="landing-chat-chips" role="group" aria-label={copy.topicsLabel}>
			<button
				type="button"
				className={`landing-chat-chip${module === null ? ' landing-chat-chip--active' : ''}`}
				aria-pressed={module === null}
				disabled={busy}
				onClick={() => setModule(null, variant)}
			>
				{copy.topicAll}
			</button>
			{modules.map(m => {
				const active = m.id === module
				return (
					<button
						key={m.id}
						type="button"
						className={`landing-chat-chip${active ? ' landing-chat-chip--active' : ''}`}
						aria-pressed={active}
						title={m.summary}
						disabled={busy}
						onClick={() => setModule(active ? null : m.id, variant)}
					>
						{m.title}
					</button>
				)
			})}
		</div>
	)
}

function Suggestions({ variant }: { variant: Variant }) {
	const { copy, modules, module, send, busy } = useLandingChat()
	const source = modules.find(m => m.id === module) ?? modules.find(m => m.id === 'general')
	const questions = source?.suggestedQuestions.slice(0, variant === 'section' ? 4 : 3) ?? []
	if (questions.length === 0) return null
	return (
		<div className="landing-chat-suggestions" aria-label={copy.suggestionsLabel}>
			{questions.map(q => (
				<button key={q} type="button" className="landing-chat-suggestion" disabled={busy} onClick={() => void send(q, 'suggestion')}>
					{q}
				</button>
			))}
		</div>
	)
}

function Messages({ lines, thinking, alt, bottomRef }: { lines: ChatLine[]; thinking: string; alt: string; bottomRef: React.RefObject<HTMLDivElement | null> }) {
	return (
		<>
			{lines.map((line, i) => (
				<div key={`${line.role}-${i}`} className={`flex w-full min-w-0 ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}>
					{line.role === 'assistant' ? (
						<div className="flex min-w-0 max-w-[92%] items-end gap-2.5 pr-3">
							<ChatIcon className="h-10 w-10 mb-0.5 shrink-0" alt={alt} />
							<div className="landing-chat-bubble landing-chat-bubble--assistant min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800">
								{line.content ? (
									<AssistantMessageContent text={line.content} />
								) : (
									<span className="landing-chat-typing" aria-label={thinking}>
										<span />
										<span />
										<span />
									</span>
								)}
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
			<div ref={bottomRef} />
		</>
	)
}

function CtaBox() {
	const { copy, cta, locale, trackCta, dismissCta } = useLandingChat()
	if (!cta) return null
	const isRegister = cta === 'register'
	return (
		<div className="landing-chat-cta" role="note">
			<div className="landing-chat-cta__text">{isRegister ? copy.ctaHintRegister : copy.ctaHintContact}</div>
			<a
				href={isRegister ? LANDING_REGISTER_URL : LANDING_CONTACT_ANCHOR[locale]}
				className={`landing-chat-cta__btn${isRegister ? '' : ' landing-chat-cta__btn--secondary'}`}
				onClick={() => {
					trackCta(cta)
					if (!isRegister) dismissCta()
				}}
			>
				{isRegister ? copy.ctaRegister : copy.ctaContact}
			</a>
		</div>
	)
}

function Escalation() {
	const { copy, escalation, setEscalation, sendEscalation } = useLandingChat()
	if (escalation.step === 'form') {
		return (
			<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
				<label className="block text-xs font-semibold text-gray-700">{copy.emailBodyLabel}</label>
				<textarea
					value={escalation.body}
					onChange={e => setEscalation({ body: e.target.value })}
					rows={4}
					className="landing-chat-input w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900"
					disabled={escalation.busy}
				/>
				<label className="block text-xs font-semibold text-gray-700">{copy.emailReplyLabel}</label>
				<input
					type="email"
					value={escalation.replyEmail}
					onChange={e => setEscalation({ replyEmail: e.target.value })}
					className="landing-chat-input w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900"
					disabled={escalation.busy}
				/>
				<p className="landing-chat-note m-0 text-xs text-gray-600">{copy.emailTranscriptNote}</p>
				<div className="flex flex-wrap gap-2 pt-1">
					<button
						type="button"
						onClick={() => escalation.body.trim() && setEscalation({ step: 'confirm' })}
						disabled={escalation.busy || !escalation.body.trim()}
						className="landing-chat-btn rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					>
						{copy.emailNext}
					</button>
					<button
						type="button"
						onClick={() => setEscalation({ step: 'idle', body: '', replyEmail: '' })}
						className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-gray-700"
					>
						{copy.emailCancel}
					</button>
				</div>
			</div>
		)
	}
	if (escalation.step === 'confirm') {
		return (
			<div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-gray-800">
				<p className="m-0 font-medium leading-snug">{copy.emailConfirm}</p>
				<p className="mx-0 my-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg border border-amber-100/90 bg-white/90 px-3 py-3 text-xs leading-relaxed shadow-sm">
					{escalation.body}
				</p>
				<p className="landing-chat-note m-0 text-xs text-gray-600">{copy.emailTranscriptNote}</p>
				<div className="flex flex-wrap gap-2 pt-1">
					<button
						type="button"
						onClick={() => void sendEscalation()}
						disabled={escalation.busy}
						className="landing-chat-btn rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					>
						{copy.emailSend}
					</button>
					<button
						type="button"
						onClick={() => setEscalation({ step: 'form' })}
						disabled={escalation.busy}
						className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-gray-700"
					>
						{copy.emailBack}
					</button>
				</div>
			</div>
		)
	}
	return null
}

/**
 * Wspólny rdzeń czatu (sekcja na stronie głównej i panel widgetu). Stan rozmowy jest w LandingChatProvider,
 * więc rozmowa zaczęta w sekcji jest widoczna w widgecie na innych stronach.
 */
export default function LandingChatPanel({ variant }: { variant: Variant }) {
	const { copy, lines, busy, error, send, escalation, setEscalation, reset, focusRequest, open } = useLandingChat()
	const [input, setInput] = useState('')
	const bottomRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const scrollBoxRef = useRef<HTMLDivElement>(null)

	/* Przewijamy tylko kontener wiadomości, nie stronę — sekcja na stronie głównej nie może „skakać”. */
	useEffect(() => {
		const box = scrollBoxRef.current
		if (box) box.scrollTop = box.scrollHeight
	}, [lines, busy, escalation.step])

	useEffect(() => {
		if (focusRequest === 0) return
		if (variant === 'widget' && !open) return
		requestAnimationFrame(() => inputRef.current?.focus())
	}, [focusRequest, variant, open])

	const submit = useCallback(() => {
		const text = input.trim()
		if (!text || busy) return
		setInput('')
		void send(text, variant)
	}, [input, busy, send, variant])

	const showEscalation = escalation.step !== 'idle'
	const hasUserTurns = lines.some(l => l.role === 'user')

	return (
		<div className={`landing-chat-core landing-chat-core--${variant}`}>
			<div className="landing-chat-core__topics">
				<ModuleChips variant={variant} />
				<Suggestions variant={variant} />
			</div>
			<div ref={scrollBoxRef} className="landing-chat-core__messages min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3 py-3">
				{escalation.sent && (
					<p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{copy.emailSent}</p>
				)}
				<Messages lines={lines} thinking={copy.thinking} alt={copy.chatIconAlt} bottomRef={bottomRef} />
				{busy && <p className="landing-chat-note text-xs text-gray-500 px-1">{copy.thinking}</p>}
				{error && <p className="text-xs text-red-600 px-1" role="alert">{error}</p>}
				<CtaBox />
			</div>
			<div className="landing-chat-core__composer border-t border-slate-100 bg-white px-4 py-4">
				{showEscalation ? (
					<Escalation />
				) : (
					<>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
							<textarea
								ref={inputRef}
								value={input}
								onChange={e => setInput(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault()
										submit()
									}
								}}
								rows={2}
								placeholder={copy.placeholder}
								className="landing-chat-input w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
								disabled={busy}
								aria-label={copy.placeholder}
							/>
							<button
								type="button"
								onClick={submit}
								disabled={busy || !input.trim()}
								className="landing-chat-btn rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 sm:shrink-0"
							>
								{copy.send}
							</button>
						</div>
						<div className="landing-chat-core__footer mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
							<button
								type="button"
								onClick={() => setEscalation({ step: 'form', sent: false })}
								className="landing-chat-link text-xs font-medium text-emerald-800 hover:underline"
							>
								{copy.emailCta}
							</button>
							{hasUserTurns && (
								<button type="button" onClick={reset} disabled={busy} className="landing-chat-link text-xs font-medium text-gray-600 hover:underline">
									{copy.reset}
								</button>
							)}
							<span className="landing-chat-note ml-auto text-[11px] text-gray-500">{copy.privacy}</span>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
