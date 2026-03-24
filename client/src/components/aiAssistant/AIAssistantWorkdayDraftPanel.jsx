import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Preview + confirm before POST /api/workdays (same fields as MonthlyCalendar form).
 */
function AIAssistantWorkdayDraftPanel({ draft, onConfirm, onCancel, busy }) {
	const { t } = useTranslation()
	if (!draft) return null

	const fmt = (v) => (v == null || v === '' ? '—' : String(v))

	return (
		<div className="ai-assistant-leave-draft ai-assistant-workday-draft" role="region" aria-label={t('aiAssistant.workday.previewTitle')}>
			<h3 className="ai-assistant-leave-draft__title">{t('aiAssistant.workday.previewTitle')}</h3>
			<ul className="ai-assistant-leave-draft__list">
				<li>
					<strong>{t('aiAssistant.workday.fieldDate')}</strong> {draft.date}
				</li>
				<li>
					<strong>{t('aiAssistant.workday.fieldHours')}</strong> {fmt(draft.hoursWorked)}
				</li>
				<li>
					<strong>{t('aiAssistant.workday.fieldOvertime')}</strong> {fmt(draft.additionalWorked)}
				</li>
				<li>
					<strong>{t('aiAssistant.workday.fieldTimeRange')}</strong> {fmt(draft.realTimeDayWorked)}
				</li>
				<li>
					<strong>{t('aiAssistant.workday.fieldAbsence')}</strong> {fmt(draft.absenceType)}
				</li>
				{draft.notes ? (
					<li>
						<strong>{t('aiAssistant.workday.fieldNotes')}</strong> {draft.notes}
					</li>
				) : null}
			</ul>
			<p className="ai-assistant-leave-draft__legal">{t('aiAssistant.workday.disclaimer')}</p>
			<div className="ai-assistant-leave-draft__actions">
				<button type="button" className="ai-assistant-leave-draft__btn ai-assistant-leave-draft__btn--primary" onClick={onConfirm} disabled={busy}>
					{busy ? '…' : t('aiAssistant.workday.confirmSend')}
				</button>
				<button type="button" className="ai-assistant-leave-draft__btn" onClick={onCancel} disabled={busy}>
					{t('aiAssistant.workday.cancel')}
				</button>
			</div>
		</div>
	)
}

export default AIAssistantWorkdayDraftPanel
