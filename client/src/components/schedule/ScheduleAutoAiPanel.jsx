import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { postScheduleAiAutoDraft } from '../../hooks/useSchedule'
import { useAIAssistantStatus } from '../../hooks/useAIAssistant'
import { BILLING_ENTITLEMENTS_QUERY_KEY } from '../../hooks/useBilling'

const WD_MAP = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }

function formatPeriodLabel(locale, year, month) {
	try {
		const d = new Date(Number(year), Number(month) - 1, 1)
		const raw = d.toLocaleString(locale, { month: 'long', year: 'numeric' })
		if (!raw) return `${month}/${year}`
		return raw.charAt(0).toUpperCase() + raw.slice(1)
	} catch {
		return `${month}/${year}`
	}
}

function formatDateShort(iso, locale) {
	if (!iso || typeof iso !== 'string') return '—'
	const safe = iso.length >= 10 ? iso.slice(0, 10) : iso
	const d = new Date(safe + 'T12:00:00')
	if (Number.isNaN(d.getTime())) return iso
	return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function resolveUserName(userId, users) {
	if (!userId || !Array.isArray(users)) return String(userId || '—')
	const id = String(userId)
	const u = users.find((x) => String(x._id) === id)
	if (!u) return id.slice(-6)
	return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || id
}

function DraftPreview({ draft, users, year, month, t, i18n }) {
	const locale = i18n.resolvedLanguage || 'pl'
	const shifts = Array.isArray(draft?.shifts) ? draft.shifts : []
	const overrides = Array.isArray(draft?.dayOverrides) ? draft.dayOverrides : []
	const exclusions = Array.isArray(draft?.manualExclusions) ? draft.manualExclusions : []
	const notes = typeof draft?.notes === 'string' ? draft.notes.trim() : ''

	const weekdayLabel = (v) => {
		const key = WD_MAP[v]
		return key ? t(`schedule.auto.weekdays.${key}`) : String(v)
	}

	const card = {
		borderRadius: '14px',
		padding: '14px 16px',
		marginBottom: '10px',
		background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
		border: '1px solid #e2e8f0',
		boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
	}

	const chip = {
		display: 'inline-flex',
		alignItems: 'center',
		padding: '3px 9px',
		borderRadius: '999px',
		fontSize: '12px',
		fontWeight: 600,
		background: '#f1f5f9',
		color: '#475569',
		border: '1px solid #e2e8f0',
	}

	return (
		<div className="schedule-auto-ai-draft" style={{
			borderRadius: '16px',
			padding: '4px',
			background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 35%, #f0fdf4 100%)',
			border: '1px solid #a7f3d0',
			boxShadow: '0 4px 24px rgba(16, 185, 129, 0.12)',
			marginBottom: '4px',
		}}>
			<div style={{ padding: '16px 18px 14px' }}>
				<div style={{ marginBottom: '14px' }}>
					<div className="schedule-auto-ai-draft__title" style={{ fontSize: '16px', fontWeight: 800, color: '#064e3b', marginBottom: '6px', letterSpacing: '-0.02em' }}>
						{t('schedule.auto.ai.previewTitle')}
					</div>
					<div className="schedule-auto-ai-draft__subtitle" style={{ fontSize: '13px', fontWeight: 600, color: '#0d9488' }}>
						{t('schedule.auto.ai.previewPeriod')}: {formatPeriodLabel(locale, year, month)}
					</div>
				</div>

				{/* Zmiany */}
				<div style={{ marginBottom: '12px' }}>
					<div className="schedule-auto-ai-draft__section-title" style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', marginBottom: '8px' }}>
						{t('schedule.auto.ai.previewShifts')}
					</div>
					{shifts.length === 0 ? (
						<div className="schedule-auto-ai-draft__empty" style={{ fontSize: '13px', color: '#64748b' }}>{t('schedule.auto.ai.previewEmptySection')}</div>
					) : (
						shifts.map((s, i) => (
							<div key={`s-${i}`} className="schedule-auto-ai-draft__card" style={card}>
								<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
									<span
										style={{
											fontSize: '15px',
											fontWeight: 800,
											color: '#0f172a',
											fontVariantNumeric: 'tabular-nums',
										}}
									>
										{s.timeFrom} → {s.timeTo}
									</span>
									<span className="schedule-auto-ai-draft__chip" style={chip}>
										{t('schedule.auto.ai.previewMinPeople')}: {s.minEmployees ?? '—'}
									</span>
								</div>
								<div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
									{t('schedule.auto.ai.previewWeekdays')}
								</div>
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
									{[...(Array.isArray(s.weekdays) ? s.weekdays : [])]
										.sort((a, b) => {
											const order = [1, 2, 3, 4, 5, 6, 0]
											return order.indexOf(a) - order.indexOf(b)
										})
										.map((d) => (
										<span
											key={d}
											className="schedule-auto-ai-draft__chip schedule-auto-ai-draft__chip--green"
											style={{
												...chip,
												background: '#ecfdf5',
												color: '#065f46',
												borderColor: '#a7f3d0',
											}}
										>
											{weekdayLabel(d)}
										</span>
									))}
								</div>
							</div>
						))
					)}
				</div>

				{/* Nadpisania */}
				<div style={{ marginBottom: '12px' }}>
					<div className="schedule-auto-ai-draft__section-title" style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', marginBottom: '8px' }}>
						{t('schedule.auto.ai.previewOverrides')}
					</div>
					{overrides.length === 0 ? (
						<div className="schedule-auto-ai-draft__empty" style={{ fontSize: '13px', color: '#64748b' }}>{t('schedule.auto.ai.previewEmptySection')}</div>
					) : (
						overrides.map((o, i) => (
							<div key={`o-${i}`} className="schedule-auto-ai-draft__card" style={card}>
								<div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '14px' }}>
									{formatDateShort(o.date, locale)}
								</div>
								<div style={{ fontSize: '14px', color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
									{o.timeFrom} – {o.timeTo} · {t('schedule.auto.ai.previewMinPeople')}: {o.minEmployees ?? '—'}
								</div>
							</div>
						))
					)}
				</div>

				{/* Wykluczenia */}
				<div style={{ marginBottom: '12px' }}>
					<div className="schedule-auto-ai-draft__section-title" style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', marginBottom: '8px' }}>
						{t('schedule.auto.ai.previewExclusions')}
					</div>
					{exclusions.length === 0 ? (
						<div className="schedule-auto-ai-draft__empty" style={{ fontSize: '13px', color: '#64748b' }}>{t('schedule.auto.ai.previewEmptySection')}</div>
					) : (
						exclusions.map((ex, i) => (
							<div key={`e-${i}`} className="schedule-auto-ai-draft__card" style={card}>
								<div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
									{resolveUserName(ex.userId, users)}
								</div>
								<div style={{ fontSize: '13px', color: '#475569' }}>{formatDateShort(ex.date, locale)}</div>
								<div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
									{ex.timeFrom && ex.timeTo
										? `${ex.timeFrom} – ${ex.timeTo}`
										: t('schedule.auto.ai.previewFullDayExclusion')}
								</div>
							</div>
						))
					)}
				</div>

				{/* Opcje */}
				<div style={{ ...card, marginBottom: '10px' }} className="schedule-auto-ai-draft__card">
					<div style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', marginBottom: '10px' }}>
						{t('schedule.auto.ai.previewOptions')}
					</div>
					<ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
						<li>
							{t('schedule.auto.allowMultipleShiftsPerDay')}:{' '}
							<strong>{draft.allowMultipleShiftsPerDay ? t('schedule.auto.ai.previewYes') : t('schedule.auto.ai.previewNo')}</strong>
						</li>
						<li>
							{t('schedule.auto.preferAvailability')}:{' '}
							<strong>{draft.preferAvailability !== false ? t('schedule.auto.ai.previewYes') : t('schedule.auto.ai.previewNo')}</strong>
						</li>
						<li>
							{t('schedule.auto.strictAvailability')}:{' '}
							<strong>{draft.strictAvailability ? t('schedule.auto.ai.previewYes') : t('schedule.auto.ai.previewNo')}</strong>
						</li>
					</ul>
				</div>

				{notes ? (
					<div style={{ ...card, marginBottom: 0 }} className="schedule-auto-ai-draft__card">
						<div style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', marginBottom: '6px' }}>
							{t('schedule.auto.ai.previewNotes')}
						</div>
						<p style={{ margin: 0, fontSize: '14px', color: '#1e293b', lineHeight: 1.5 }}>{notes}</p>
					</div>
				) : null}

				<p className="schedule-auto-ai-draft__disclaimer" style={{ margin: '14px 0 0', fontSize: '12px', color: '#047857', lineHeight: 1.45 }}>
					{t('schedule.auto.ai.disclaimer')}
				</p>
			</div>
		</div>
	)
}

/**
 * Osobny moduł AI do auto-uzupełnienia grafiku (nie Asystent globalny).
 */
export default function ScheduleAutoAiPanel({
	scheduleId,
	year,
	month,
	onApply,
	busy,
	isAvailabilityEnabled,
	users = [],
}) {
	const { t, i18n } = useTranslation()
	const queryClient = useQueryClient()
	const { data: aiStatus } = useAIAssistantStatus()
	const [messages, setMessages] = useState([])
	const [input, setInput] = useState('')
	const [streaming, setStreaming] = useState(false)
	const [error, setError] = useState(null)
	const [errorCode, setErrorCode] = useState(null)
	const [pendingDraft, setPendingDraft] = useState(null)
	const bottomRef = useRef(null)

	const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'pl'

	const aiEnabled = aiStatus?.enabled === true
	const ent = aiStatus?.aiEntitlements
	const showQuotaStrip =
		aiEnabled && ent && !ent.unrestricted && ent.metered === true
	const blockScheduleAi =
		aiEnabled &&
		ent?.metered === true &&
		(ent?.needsSubscription === true || ent?.hasAccess === false)

	const shellStyle = useMemo(
		() => ({
			marginTop: '4px',
			borderRadius: '18px',
			padding: '18px 18px 16px',
			background: 'linear-gradient(165deg, #f8fafc 0%, #f1f5f9 45%, #eef2ff 100%)',
			border: '1px solid #e2e8f0',
			boxShadow: '0 8px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
		}),
		[]
	)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, streaming, pendingDraft])

	const send = async () => {
		const text = input.trim()
		if (!text || streaming || busy || blockScheduleAi) return
		setError(null)
		setErrorCode(null)
		setInput('')
		const next = [...messages, { role: 'user', content: text }]
		setMessages(next)
		setStreaming(true)
		setPendingDraft(null)
		try {
			const data = await postScheduleAiAutoDraft({
				scheduleId,
				year,
				month,
				messages: next.map((m) => ({ role: m.role, content: m.content })),
				locale,
			})
			setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '' }])
			if (data.draft) {
				setPendingDraft(data.draft)
			}
		} catch (e) {
			const code = e.response?.data?.code
			setErrorCode(code || null)
			setError(e.response?.data?.message || e.message || 'Error')
			setMessages((prev) => prev.slice(0, -1))
			setInput(text)
		} finally {
			setStreaming(false)
			queryClient.invalidateQueries({ queryKey: ['ai-assistant-status'] })
			queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		}
	}

	const handleApply = async () => {
		if (!pendingDraft || busy) return
		try {
			await onApply(pendingDraft)
			setPendingDraft(null)
			setMessages([])
		} catch {
			/* błąd obsłużony w rodzicu — zostaw podgląd */
		}
	}

	return (
		<div className="schedule-auto-ai-panel" style={shellStyle}>
			<style>
				{`
					@keyframes scheduleAiDot {
						0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
						40% { opacity: 1; transform: translateY(-2px); }
					}
					.schedule-ai-dot:nth-child(1) { animation-delay: 0s; }
					.schedule-ai-dot:nth-child(2) { animation-delay: 0.15s; }
					.schedule-ai-dot:nth-child(3) { animation-delay: 0.3s; }
					.schedule-auto-ai-composer {
						display: flex;
						gap: 10px;
						margin-bottom: 14px;
						flex-wrap: wrap;
						align-items: stretch;
					}
					.schedule-auto-ai-composer .schedule-auto-ai-input {
						flex: 1 1 200px;
						min-width: 180px;
						min-height: 52px;
						padding: 12px 14px;
						border: 1px solid #cbd5e1;
						border-radius: 12px;
						font-size: 14px;
						line-height: 1.45;
						resize: vertical;
						background: #fff;
						outline: none;
						box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
						font-family: inherit;
						color: #0f172a;
					}
					.schedule-auto-ai-composer .schedule-auto-ai-input:disabled {
						opacity: 0.65;
						cursor: not-allowed;
					}
					.schedule-auto-ai-composer .schedule-auto-ai-send {
						padding: 12px 20px;
						align-self: flex-end;
						border: none;
						background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
						color: #fff;
						border-radius: 12px;
						font-weight: 700;
						font-size: 14px;
						cursor: pointer;
						box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
					}
					.schedule-auto-ai-composer .schedule-auto-ai-send:disabled {
						cursor: not-allowed;
						opacity: 0.55;
					}
					@media (max-width: 767px) {
						.schedule-auto-ai-composer {
							flex-direction: column;
							flex-wrap: nowrap;
						}
						.schedule-auto-ai-composer .schedule-auto-ai-input {
							flex: none;
							width: 100%;
							min-width: 0;
						}
						.schedule-auto-ai-composer .schedule-auto-ai-send {
							align-self: stretch;
							width: 100%;
						}
					}
				`}
			</style>

			<p
				className="schedule-auto-ai-panel__intro"
				style={{
					margin: '0 0 14px',
					fontSize: '14px',
					color: '#475569',
					lineHeight: 1.55,
					maxWidth: '52em',
					overflowWrap: 'break-word',
				}}
			>
				{t('schedule.auto.ai.intro')}
			</p>

			{!aiEnabled && (
				<div
					className="schedule-auto-ai-panel__banner"
					style={{
						marginBottom: '12px',
						padding: '10px 12px',
						background: '#f1f5f9',
						borderRadius: '10px',
						fontSize: '13px',
						color: '#475569',
					}}
				>
					{t('aiAssistant.configHint')}
				</div>
			)}

			{showQuotaStrip && (
				<div
					className={`schedule-auto-ai-panel__quota${blockScheduleAi ? ' is-blocked' : ''}`}
					style={{
						marginBottom: '12px',
						padding: '10px 12px',
						borderRadius: '10px',
						fontSize: '13px',
						lineHeight: 1.5,
						background: blockScheduleAi ? '#fff7ed' : '#ecfdf5',
						border: `1px solid ${blockScheduleAi ? '#fed7aa' : '#a7f3d0'}`,
						color: '#0f172a',
					}}
				>
					{ent.needsSubscription ? (
						<>
							{t('aiAssistant.aiQuota.needPlan')}{' '}
							<Link to="/packages" style={{ fontWeight: 700, color: '#7c3aed' }}>
								{t('aiAssistant.quotaLink')}
							</Link>
						</>
					) : ent.hasAccess ? (
						<>
							{t('aiAssistant.aiQuota.remaining', {
								n:
									ent.remainingApprox === Number.POSITIVE_INFINITY || ent.remainingApprox == null
										? '—'
										: String(ent.remainingApprox),
							})}
						</>
					) : (
						<>
							{t('aiAssistant.aiQuota.depleted')}{' '}
							<Link to="/packages" style={{ fontWeight: 700, color: '#7c3aed' }}>
								{t('aiAssistant.quotaLink')}
							</Link>
						</>
					)}
					<div className="schedule-auto-ai-panel__quota-hint" style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
						{t('aiAssistant.aiQuota.sharedHint')}
					</div>
				</div>
			)}

			{error && (
				<div
					className="schedule-auto-ai-panel__error"
					style={{
						marginBottom: '12px',
						padding: '12px 14px',
						background: 'linear-gradient(90deg, #fef2f2, #fff1f2)',
						color: '#b91c1c',
						borderRadius: '12px',
						fontSize: '13px',
						border: '1px solid #fecaca',
					}}
				>
					<div>{error}</div>
					{(errorCode === 'AI_QUOTA_EXCEEDED' || errorCode === 'AI_DISABLED_NO_SUBSCRIPTION') && (
						<div style={{ marginTop: '8px' }}>
							<Link to="/packages" style={{ fontWeight: 700, color: '#7c3aed' }}>
								{t('aiAssistant.quotaLink')}
							</Link>
						</div>
					)}
				</div>
			)}

			<div
				className="schedule-auto-ai-panel__chat"
				style={{
					borderRadius: '14px',
					padding: '14px',
					maxHeight: 'min(40vh, 360px)',
					overflowY: 'auto',
					background: 'rgba(255,255,255,0.72)',
					backdropFilter: 'blur(8px)',
					border: '1px solid rgba(226, 232, 240, 0.95)',
					marginBottom: '14px',
					boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
				}}
			>
				{messages.length === 0 && (
					<p className="schedule-auto-ai-panel__empty" style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>{t('schedule.auto.ai.noConfig')}</p>
				)}
				{messages.map((m, i) => (
					<div
						key={`${i}-${m.role}`}
						style={{
							marginBottom: '12px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
						}}
					>
						<div
							className="schedule-auto-ai-panel__msg-label"
							style={{
								fontSize: '10px',
								fontWeight: 700,
								letterSpacing: '0.04em',
								textTransform: 'uppercase',
								color: '#94a3b8',
								marginBottom: '6px',
								paddingLeft: m.role === 'user' ? 0 : '4px',
								paddingRight: m.role === 'user' ? '4px' : 0,
							}}
						>
							{m.role === 'user' ? t('schedule.auto.ai.youLabel') : t('schedule.auto.ai.assistantLabel')}
						</div>
						<div
							className={`schedule-auto-ai-panel__msg${m.role === 'user' ? ' schedule-auto-ai-panel__msg--user' : ' schedule-auto-ai-panel__msg--assistant'}`}
							style={{
								maxWidth: '92%',
								padding: '12px 14px',
								borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
								fontSize: '14px',
								lineHeight: 1.5,
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
								background:
									m.role === 'user'
										? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
										: '#ffffff',
								color: m.role === 'user' ? '#fff' : '#0f172a',
								border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
								boxShadow: m.role === 'user' ? '0 4px 14px rgba(14, 165, 233, 0.35)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
							}}
						>
							{m.content}
						</div>
					</div>
				))}
				{streaming && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
						<span>{t('schedule.auto.ai.typing')}</span>
						<span style={{ display: 'inline-flex', gap: '4px' }}>
							{[0, 1, 2].map((d) => (
								<span
									key={d}
									className="schedule-ai-dot"
									style={{
										width: '6px',
										height: '6px',
										borderRadius: '50%',
										background: '#0ea5e9',
										animation: 'scheduleAiDot 1s ease-in-out infinite',
									}}
								/>
							))}
						</span>
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			<div className="schedule-auto-ai-composer">
				<textarea
					className="schedule-auto-ai-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={t('schedule.auto.ai.placeholder')}
					rows={2}
					disabled={streaming || busy || !aiEnabled || blockScheduleAi}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							send()
						}
					}}
				/>
				<button
					type="button"
					className="schedule-auto-ai-send"
					onClick={send}
					disabled={streaming || busy || !input.trim() || !aiEnabled || blockScheduleAi}
				>
					{t('schedule.auto.ai.send')}
				</button>
			</div>

			{pendingDraft && (
				<div style={{ marginTop: '4px' }}>
					<DraftPreview draft={pendingDraft} users={users} year={year} month={month} t={t} i18n={i18n} />
					<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
						<button
							type="button"
							className="schedule-auto-modal__btn schedule-auto-modal__btn--primary"
							onClick={handleApply}
							disabled={busy}
							style={{
								padding: '12px 22px',
								border: 'none',
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								color: '#fff',
								borderRadius: '12px',
								fontWeight: 700,
								fontSize: '14px',
								cursor: busy ? 'not-allowed' : 'pointer',
								opacity: busy ? 0.65 : 1,
								boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
							}}
						>
							{busy ? '…' : t('schedule.auto.ai.confirmApply')}
						</button>
						<button
							type="button"
							className="schedule-auto-modal__btn schedule-auto-modal__btn--secondary"
							onClick={() => setPendingDraft(null)}
							disabled={busy}
							style={{
								padding: '12px 20px',
								border: '1px solid #cbd5e1',
								background: '#fff',
								borderRadius: '12px',
								color: '#475569',
								fontWeight: 600,
								fontSize: '14px',
								cursor: busy ? 'not-allowed' : 'pointer',
							}}
						>
							{t('schedule.auto.ai.discardDraft')}
						</button>
					</div>
				</div>
			)}

			{!isAvailabilityEnabled && (
				<p className="schedule-auto-ai-panel__footer-note" style={{ margin: '12px 0 0', fontSize: '12px', color: '#94a3b8' }}>{t('schedule.auto.preferAvailability')}</p>
			)}
		</div>
	)
}
