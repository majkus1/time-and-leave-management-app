import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '../dashboard/Sidebar'
import AIAssistantHeader from './AIAssistantHeader'
import AIAssistantPeriodBar from './AIAssistantPeriodBar'
import AIAssistantSessionSidebar from './AIAssistantSessionSidebar'
import AIAssistantMessageList from './AIAssistantMessageList'
import AIAssistantComposer from './AIAssistantComposer'
import {
	useAIAssistantStatus,
	streamAIAssistantChat,
	downloadAiIntentExport,
	buildExportText,
	postAiLeaveDraft,
	postAiWorkdayDraft,
} from '../../hooks/useAIAssistant'
import { BILLING_ENTITLEMENTS_QUERY_KEY } from '../../hooks/useBilling'
import { useCreateLeaveRequest } from '../../hooks/useLeaveRequests'
import { useCreateWorkday } from '../../hooks/useWorkdays'
import { useAlert } from '../../context/AlertContext'
import { useAIAssistantSessions } from '../../hooks/useAIAssistantSessions'
import AIAssistantLeaveDraftPanel from './AIAssistantLeaveDraftPanel'
import AIAssistantWorkdayDraftPanel from './AIAssistantWorkdayDraftPanel'
import './AIAssistant.css'

function formatDateInput(d) {
	const x = new Date(d)
	const y = x.getFullYear()
	const m = String(x.getMonth() + 1).padStart(2, '0')
	const day = String(x.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

function AIAssistant() {
	const { t, i18n } = useTranslation()
	const queryClient = useQueryClient()
	const { data: status, isLoading: statusLoading } = useAIAssistantStatus()
	const [streaming, setStreaming] = useState(false)

	const sessionsApi = useAIAssistantSessions()
	const {
		activeId,
		messages,
		setMessages,
		lastMeta,
		setLastMeta,
		periodPreset,
		setPeriodPreset,
		dateFrom,
		setDateFrom,
		dateTo,
		setDateTo,
		sessionsSorted,
		newSession,
		selectSession,
		deleteSession,
		setSessionTitle,
	} = sessionsApi

	const messagesRef = useRef(messages)
	useEffect(() => {
		messagesRef.current = messages
	}, [messages])

	const [error, setError] = useState(null)
	const [quotaBlocked, setQuotaBlocked] = useState(false)
	/** 'chat' | 'leave' | 'workday' */
	const [assistantMode, setAssistantMode] = useState('chat')
	const [pendingLeaveDraft, setPendingLeaveDraft] = useState(null)
	const [pendingWorkdayDraft, setPendingWorkdayDraft] = useState(null)

	const createLeaveMutation = useCreateLeaveRequest()
	const createWorkdayMutation = useCreateWorkday()
	const { showAlert } = useAlert()

	const enabled = status?.enabled === true
	const ent = status?.aiEntitlements
	const aiBillingBlock =
		!statusLoading &&
		enabled &&
		ent?.metered === true &&
		(ent?.needsSubscription === true || ent?.hasAccess === false)

	const busy = streaming || createLeaveMutation.isPending || createWorkdayMutation.isPending
	const disabled = !enabled || statusLoading || aiBillingBlock

	useEffect(() => {
		setPendingLeaveDraft(null)
		setPendingWorkdayDraft(null)
	}, [activeId])

	const sendUserMessage = useCallback(
		async text => {
			setError(null)
			setQuotaBlocked(false)
			const prev = messagesRef.current
			const withUser = [...prev, { role: 'user', content: text }]
			messagesRef.current = withUser
			setMessages(withUser)

			if (prev.length === 0) {
				setSessionTitle(activeId, text.slice(0, 56) + (text.length > 56 ? '…' : ''))
			}

			setStreaming(true)
			setPendingLeaveDraft(null)
			setPendingWorkdayDraft(null)
			const withAssistantStart = [...withUser, { role: 'assistant', content: '' }]
			messagesRef.current = withAssistantStart
			setMessages(withAssistantStart)

			try {
				if (assistantMode === 'leave') {
					setLastMeta(null)
					const data = await postAiLeaveDraft({
						messages: withUser.map(m => ({ role: m.role, content: m.content })),
						locale: i18n.resolvedLanguage === 'en' ? 'en' : 'pl',
					})
					setMessages(prev => {
						const next = [...prev]
						const lastIdx = next.length - 1
						if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
							next[lastIdx] = {
								...next[lastIdx],
								content: data.reply || '',
							}
						}
						messagesRef.current = next
						return next
					})
					if (data.draft) {
						setPendingLeaveDraft(data.draft)
					}
				} else if (assistantMode === 'workday') {
					setLastMeta(null)
					const data = await postAiWorkdayDraft({
						messages: withUser.map(m => ({ role: m.role, content: m.content })),
						locale: i18n.resolvedLanguage === 'en' ? 'en' : 'pl',
					})
					setMessages(prev => {
						const next = [...prev]
						const lastIdx = next.length - 1
						if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
							next[lastIdx] = {
								...next[lastIdx],
								content: data.reply || '',
							}
						}
						messagesRef.current = next
						return next
					})
					if (data.draft) {
						setPendingWorkdayDraft(data.draft)
					}
				} else {
					const preset = periodPreset === 'default' ? 'month' : periodPreset
					await streamAIAssistantChat(
						{
							messages: withUser.map(m => ({ role: m.role, content: m.content })),
							periodPreset: preset === 'custom' ? 'custom' : preset,
							dateFrom: preset === 'custom' ? dateFrom : undefined,
							dateTo: preset === 'custom' ? dateTo : undefined,
							locale: i18n.resolvedLanguage === 'en' ? 'en' : 'pl',
						},
						{
							onMeta: meta => setLastMeta(meta),
							onDelta: chunk => {
								setMessages(prev => {
									const next = [...prev]
									const lastIdx = next.length - 1
									if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
										next[lastIdx] = {
											...next[lastIdx],
											content: next[lastIdx].content + chunk,
										}
									}
									messagesRef.current = next
									return next
								})
							},
							onExportOffer: offer => {
								setMessages(prev => {
									const next = [...prev]
									const lastIdx = next.length - 1
									if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
										next[lastIdx] = { ...next[lastIdx], exportOffer: offer }
									}
									messagesRef.current = next
									return next
								})
							},
						}
					)
				}
			} catch (err) {
				const code = err.response?.data?.code || err.code
				const msg = err.response?.data?.error || err.message || t('aiAssistant.errorGeneric')
				setError(msg)
				setQuotaBlocked(code === 'AI_QUOTA_EXCEEDED' || code === 'AI_DISABLED_NO_SUBSCRIPTION')
				messagesRef.current = prev
				setMessages(prev)
			} finally {
				setStreaming(false)
				queryClient.invalidateQueries({ queryKey: ['ai-assistant-status'] })
				queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
			}
		},
		[
			assistantMode,
			periodPreset,
			dateFrom,
			dateTo,
			i18n.resolvedLanguage,
			t,
			setMessages,
			setLastMeta,
			activeId,
			setSessionTitle,
			queryClient,
		]
	)

	const handleConfirmLeaveDraft = useCallback(async () => {
		if (!pendingLeaveDraft) return
		setError(null)
		try {
			await createLeaveMutation.mutateAsync({
				type: pendingLeaveDraft.type,
				startDate: pendingLeaveDraft.startDate,
				endDate: pendingLeaveDraft.endDate,
				daysRequested: pendingLeaveDraft.daysRequested,
				replacement: pendingLeaveDraft.replacement || '',
				additionalInfo: pendingLeaveDraft.additionalInfo || '',
			})
			await showAlert(t('aiAssistant.leave.submitSuccess'))
			setPendingLeaveDraft(null)
		} catch (e) {
			await showAlert(e.response?.data?.message || t('aiAssistant.leave.submitError'))
		}
	}, [pendingLeaveDraft, createLeaveMutation, showAlert, t])

	const handleConfirmWorkdayDraft = useCallback(async () => {
		if (!pendingWorkdayDraft) return
		setError(null)
		try {
			await createWorkdayMutation.mutateAsync({
				date: `${pendingWorkdayDraft.date}T12:00:00.000Z`,
				hoursWorked: pendingWorkdayDraft.hoursWorked,
				additionalWorked: pendingWorkdayDraft.additionalWorked,
				realTimeDayWorked: pendingWorkdayDraft.realTimeDayWorked,
				absenceType: pendingWorkdayDraft.absenceType,
				notes: pendingWorkdayDraft.notes,
			})
			await showAlert(t('aiAssistant.workday.submitSuccess'))
			setPendingWorkdayDraft(null)
		} catch (e) {
			await showAlert(e.response?.data?.message || t('aiAssistant.workday.submitError'))
		}
	}, [pendingWorkdayDraft, createWorkdayMutation, showAlert, t])

	const handleIntentExport = useCallback(
		async (format, offer) => {
			setError(null)
			try {
				const preset = periodPreset === 'default' ? 'month' : periodPreset
				await downloadAiIntentExport(format, {
					...offer,
					periodPreset: preset === 'custom' ? 'custom' : preset,
					dateFrom: preset === 'custom' ? dateFrom : undefined,
					dateTo: preset === 'custom' ? dateTo : undefined,
					locale: i18n.resolvedLanguage === 'en' ? 'en' : 'pl',
				})
				queryClient.invalidateQueries({ queryKey: ['ai-assistant-status'] })
				queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
			} catch (e) {
				setError(e.message || t('aiAssistant.errorGeneric'))
			}
		},
		[periodPreset, dateFrom, dateTo, i18n.resolvedLanguage, t, queryClient]
	)

	const clearChat = useCallback(() => {
		messagesRef.current = []
		setMessages([])
		setLastMeta(null)
		setError(null)
		setQuotaBlocked(false)
	}, [setMessages, setLastMeta])

	const exportTxt = useCallback(() => {
		const text = buildExportText(messages, lastMeta)
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `planopia-ai-${formatDateInput(new Date())}.txt`
		a.click()
		URL.revokeObjectURL(url)
	}, [messages, lastMeta])

	const getSessionTitle = useCallback(
		s => {
			if (s.title && s.title.trim()) return s.title.trim()
			return t('aiAssistant.sessions.untitled')
		},
		[t]
	)

	return (
		<>
			<Helmet>
				<title>{t('aiAssistant.pageTitle')} · Planopia</title>
			</Helmet>
			<Sidebar />
			<div className="content p-3 ai-assistant-page">
				<div className="ai-assistant-layout">
					<div className="ai-assistant-layout__rail">
						<AIAssistantSessionSidebar
							sessionsSorted={sessionsSorted}
							activeId={activeId}
							onSelect={selectSession}
							onNew={newSession}
							onDelete={deleteSession}
							getTitle={getSessionTitle}
						/>
					</div>
					<div className="ai-assistant-shell">
						<AIAssistantHeader enabled={enabled} aiEntitlements={ent} />
						{!statusLoading && !enabled && (
							<div className="ai-assistant-banner" role="status">
								{t('aiAssistant.configHint')}
							</div>
						)}
						{error && (
							<div className="ai-assistant-error" role="alert">
								<div>{error}</div>
								{quotaBlocked && (
									<div className="ai-assistant-quota-hint">
										<Link to="/packages">{t('aiAssistant.quotaLink')}</Link>
									</div>
								)}
							</div>
						)}
						{assistantMode === 'leave' && enabled && (
							<div className="ai-assistant-banner ai-assistant-banner--leave" role="status">
								{t('aiAssistant.leave.banner')}
							</div>
						)}
						{assistantMode === 'workday' && enabled && (
							<div className="ai-assistant-banner ai-assistant-banner--workday" role="status">
								{t('aiAssistant.workday.banner')}
							</div>
						)}
						{assistantMode === 'chat' && (
							<AIAssistantPeriodBar
								preset={periodPreset}
								onPresetChange={setPeriodPreset}
								dateFrom={dateFrom}
								dateTo={dateTo}
								onDateFromChange={setDateFrom}
								onDateToChange={setDateTo}
								disabled={disabled || busy}
							/>
						)}
						<div className="ai-assistant-toolbar">
							<button type="button" className="ai-assistant-toolbar__btn" onClick={clearChat} disabled={busy || messages.length === 0}>
								{t('aiAssistant.clear')}
							</button>
							<button type="button" className="ai-assistant-toolbar__btn" onClick={exportTxt} disabled={messages.length === 0}>
								{t('aiAssistant.exportTxt')}
							</button>
							<button
								type="button"
								className={`ai-assistant-toolbar__btn${assistantMode === 'leave' ? ' ai-assistant-toolbar__btn--active' : ''}`}
								onClick={() => {
									setAssistantMode(m => (m === 'leave' ? 'chat' : 'leave'))
									setPendingLeaveDraft(null)
									setPendingWorkdayDraft(null)
									setLastMeta(null)
								}}
								disabled={disabled || busy}
							>
								{assistantMode === 'leave' ? t('aiAssistant.leave.modeOff') : t('aiAssistant.leave.modeOn')}
							</button>
							<button
								type="button"
								className={`ai-assistant-toolbar__btn${assistantMode === 'workday' ? ' ai-assistant-toolbar__btn--active' : ''}`}
								onClick={() => {
									setAssistantMode(m => (m === 'workday' ? 'chat' : 'workday'))
									setPendingLeaveDraft(null)
									setPendingWorkdayDraft(null)
									setLastMeta(null)
								}}
								disabled={disabled || busy}
							>
								{assistantMode === 'workday' ? t('aiAssistant.workday.modeOff') : t('aiAssistant.workday.modeOn')}
							</button>
						</div>
						<AIAssistantMessageList messages={messages} onIntentExport={handleIntentExport} busy={busy} />
						<AIAssistantComposer
							onSend={sendUserMessage}
							disabled={disabled}
							busy={busy}
							placeholder={
								assistantMode === 'leave'
									? t('aiAssistant.leave.placeholder')
									: assistantMode === 'workday'
										? t('aiAssistant.workday.placeholder')
										: undefined
							}
							showQuickPrompts={assistantMode === 'chat'}
						/>
						{pendingLeaveDraft && (
							<AIAssistantLeaveDraftPanel
								draft={pendingLeaveDraft}
								onConfirm={handleConfirmLeaveDraft}
								onCancel={() => setPendingLeaveDraft(null)}
								busy={createLeaveMutation.isPending}
							/>
						)}
						{pendingWorkdayDraft && (
							<AIAssistantWorkdayDraftPanel
								draft={pendingWorkdayDraft}
								onConfirm={handleConfirmWorkdayDraft}
								onCancel={() => setPendingWorkdayDraft(null)}
								busy={createWorkdayMutation.isPending}
							/>
						)}
						{lastMeta && assistantMode === 'chat' && (
							<p className="ai-assistant-meta">
								{lastMeta.allTime
									? t('aiAssistant.contextNoteAllTime', { scope: lastMeta.scope })
									: t('aiAssistant.contextNote', {
											from: lastMeta.periodFrom,
											to: lastMeta.periodTo,
											scope: lastMeta.scope,
										})}
								{!lastMeta.allTime && lastMeta.yearMessageOverride
									? t('aiAssistant.contextNoteYearFromMessage', { year: lastMeta.yearMessageOverride })
									: null}
							</p>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default AIAssistant
