import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** Zapamiętanie zwinięcia sekcji szybkich akcji (odświeżenie / nawigacja). */
const QUICK_ACTIONS_OPEN_STORAGE_KEY = 'planopia-ai-quick-actions-open-v1'

function readStoredQuickActionsOpen() {
	if (typeof window === 'undefined') return true
	try {
		const raw = localStorage.getItem(QUICK_ACTIONS_OPEN_STORAGE_KEY)
		if (raw === '0') return false
		if (raw === '1') return true
	} catch {
		/* private mode / quota */
	}
	return true
}

/**
 * Input + send + quick prompts (controlled submit from parent).
 */
function AIAssistantComposer({
	onSend,
	onMonthlyReport,
	monthlyReportHint: monthlyReportHintProp,
	disabled,
	busy,
	placeholder,
	showQuickPrompts = true,
	showPrivacyHint = true,
}) {
	const { t } = useTranslation()
	const monthlyHint = monthlyReportHintProp || t('aiAssistant.monthlyReportHint')
	const [value, setValue] = useState('')
	/** Zwija cały blok szybkich akcji nad polem (Podsumuj miesiąc + 4 przyciski). Stan w localStorage. */
	const [quickActionsOpen, setQuickActionsOpen] = useState(readStoredQuickActionsOpen)

	useEffect(() => {
		try {
			localStorage.setItem(QUICK_ACTIONS_OPEN_STORAGE_KEY, quickActionsOpen ? '1' : '0')
		} catch {
			/* ignore */
		}
	}, [quickActionsOpen])

	const ph = placeholder || t('aiAssistant.placeholder')

	const submit = useCallback(() => {
		const v = value.trim()
		if (!v || disabled || busy) return
		onSend(v)
		setValue('')
	}, [value, disabled, busy, onSend])

	const quick = useCallback(
		text => {
			if (disabled || busy) return
			onSend(text)
		},
		[disabled, busy, onSend]
	)

	const runMonthly = useCallback(() => {
		if (disabled || busy || !onMonthlyReport) return
		onMonthlyReport()
	}, [disabled, busy, onMonthlyReport])

	const quickButtons = (
		<div className="ai-assistant-quick">
			<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.summary'))} disabled={disabled || busy}>
				{t('aiAssistant.quick.summary')}
			</button>
			<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.leaves'))} disabled={disabled || busy}>
				{t('aiAssistant.quick.leaves')}
			</button>
			<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.tasks'))} disabled={disabled || busy}>
				{t('aiAssistant.quick.tasks')}
			</button>
			<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.exportFile'))} disabled={disabled || busy}>
				{t('aiAssistant.quick.exportFile')}
			</button>
		</div>
	)

	return (
		<div className="ai-assistant-composer">
			{showQuickPrompts && onMonthlyReport && (
				<div
					className={`ai-assistant-quick-actions-shell${quickActionsOpen ? '' : ' ai-assistant-quick-actions-shell--collapsed'}`}
				>
					<div className="ai-assistant-quick-actions-shell__toolbar">
						<button
							type="button"
							className="ai-assistant-monthly-killer__toggle"
							onClick={() => setQuickActionsOpen(o => !o)}
							aria-expanded={quickActionsOpen}
							aria-controls="ai-assistant-quick-actions-body"
						>
							<span
								className={`ai-assistant-monthly-killer__chev${quickActionsOpen ? ' ai-assistant-monthly-killer__chev--open' : ''}`}
								aria-hidden
							/>
							{quickActionsOpen
								? t('aiAssistant.monthlyReportSectionCollapse')
								: t('aiAssistant.monthlyReportSectionExpand')}
						</button>
					</div>
					{quickActionsOpen && (
						<div id="ai-assistant-quick-actions-body" className="ai-assistant-quick-actions-shell__body">
							<div className="ai-assistant-monthly-killer ai-assistant-monthly-killer--embedded">
								<button
									type="button"
									className="ai-assistant-monthly-killer__btn"
									onClick={runMonthly}
									disabled={disabled || busy}
									title={monthlyHint}
								>
									{t('aiAssistant.monthlyReportButton')}
								</button>
								<p className="ai-assistant-monthly-killer__hint">{monthlyHint}</p>
							</div>
							{quickButtons}
						</div>
					)}
				</div>
			)}
			{showQuickPrompts && !onMonthlyReport && quickButtons}
			<div className="ai-assistant-composer__row">
				<textarea
					className="ai-assistant-composer__input"
					rows={3}
					placeholder={ph}
					value={value}
					onChange={e => setValue(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							submit()
						}
					}}
					disabled={disabled || busy}
				/>
				<button type="button" className="ai-assistant-composer__send" onClick={submit} disabled={disabled || busy || !value.trim()}>
					{busy ? '…' : t('aiAssistant.send')}
				</button>
			</div>
			{showPrivacyHint && (
				<p className="ai-assistant-composer__privacy" role="note">
					{t('aiAssistant.composerPrivacyHint')}
				</p>
			)}
		</div>
	)
}

export default AIAssistantComposer
