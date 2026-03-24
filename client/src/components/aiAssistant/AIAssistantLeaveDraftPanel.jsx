import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Preview + confirm before POST /leaveworks/leave-request (same payload as the form).
 */
function AIAssistantLeaveDraftPanel({ draft, onConfirm, onCancel, busy }) {
	const { t } = useTranslation()
	if (!draft) return null

	return (
		<div className="ai-assistant-leave-draft" role="region" aria-label={t('aiAssistant.leave.previewTitle')}>
			<h3 className="ai-assistant-leave-draft__title">{t('aiAssistant.leave.previewTitle')}</h3>
			<ul className="ai-assistant-leave-draft__list">
				<li>
					<strong>{t('aiAssistant.leave.fieldType')}</strong> {draft.typeLabel}
				</li>
				<li>
					<strong>{t('aiAssistant.leave.fieldDates')}</strong> {draft.startDate} — {draft.endDate}
				</li>
				<li>
					<strong>{t('aiAssistant.leave.fieldDays')}</strong> {draft.daysRequested}
				</li>
				<li>
					<strong>{t('aiAssistant.leave.fieldApproval')}</strong>{' '}
					{draft.requiresApproval ? t('aiAssistant.leave.approvalYes') : t('aiAssistant.leave.approvalNo')}
				</li>
				{draft.replacement ? (
					<li>
						<strong>{t('aiAssistant.leave.fieldReplacement')}</strong> {draft.replacement}
					</li>
				) : null}
				{draft.additionalInfo ? (
					<li>
						<strong>{t('aiAssistant.leave.fieldNotes')}</strong> {draft.additionalInfo}
					</li>
				) : null}
			</ul>
			<p className="ai-assistant-leave-draft__legal">{t('aiAssistant.leave.disclaimer')}</p>
			<div className="ai-assistant-leave-draft__actions">
				<button type="button" className="ai-assistant-leave-draft__btn ai-assistant-leave-draft__btn--primary" onClick={onConfirm} disabled={busy}>
					{busy ? '…' : t('aiAssistant.leave.confirmSend')}
				</button>
				<button type="button" className="ai-assistant-leave-draft__btn" onClick={onCancel} disabled={busy}>
					{t('aiAssistant.leave.cancel')}
				</button>
			</div>
		</div>
	)
}

export default AIAssistantLeaveDraftPanel
