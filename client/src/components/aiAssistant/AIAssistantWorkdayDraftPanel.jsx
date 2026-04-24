import React from 'react'
import { useTranslation } from 'react-i18next'

function workdayEntriesFromDraft(draft) {
	if (!draft) return []
	if (Array.isArray(draft.entries) && draft.entries.length > 0) return draft.entries
	if (draft.date) return [draft]
	return []
}

function WorkdayEntryBlock({ entry, fmt }) {
	return (
		<ul className="ai-assistant-leave-draft__list ai-assistant-workday-draft__entry-list">
			<li>
				<strong>{entry.fieldDateLabel}</strong> {entry.date}
			</li>
			<li>
				<strong>{entry.fieldHoursLabel}</strong> {fmt(entry.hoursWorked)}
			</li>
			<li>
				<strong>{entry.fieldOvertimeLabel}</strong> {fmt(entry.additionalWorked)}
			</li>
			<li>
				<strong>{entry.fieldTimeRangeLabel}</strong> {fmt(entry.realTimeDayWorked)}
			</li>
			<li>
				<strong>{entry.fieldAbsenceLabel}</strong> {fmt(entry.absenceType)}
			</li>
			{entry.notes ? (
				<li>
					<strong>{entry.fieldNotesLabel}</strong> {entry.notes}
				</li>
			) : null}
		</ul>
	)
}

/**
 * Preview + confirm before POST /api/workdays (same fields as MonthlyCalendar form).
 * Supports multiple days via `draft.entries` (or legacy single `draft.date`).
 */
function AIAssistantWorkdayDraftPanel({ draft, onConfirm, onCancel, busy }) {
	const { t } = useTranslation()
	const entries = workdayEntriesFromDraft(draft)
	if (entries.length === 0) return null

	const fmt = v => (v == null || v === '' ? '—' : String(v))

	const labeled = entries.map((e, idx) => ({
		...e,
		fieldDateLabel: t('aiAssistant.workday.fieldDate'),
		fieldHoursLabel: t('aiAssistant.workday.fieldHours'),
		fieldOvertimeLabel: t('aiAssistant.workday.fieldOvertime'),
		fieldTimeRangeLabel: t('aiAssistant.workday.fieldTimeRange'),
		fieldAbsenceLabel: t('aiAssistant.workday.fieldAbsence'),
		fieldNotesLabel: t('aiAssistant.workday.fieldNotes'),
		key: `${e.date}-${idx}`,
	}))

	const title =
		entries.length > 1
			? t('aiAssistant.workday.previewTitleMany', { n: entries.length })
			: t('aiAssistant.workday.previewTitle')

	return (
		<div className="ai-assistant-leave-draft ai-assistant-workday-draft" role="region" aria-label={title}>
			<h3 className="ai-assistant-leave-draft__title">{title}</h3>
			{labeled.map((entry, i) => (
				<div
					key={entry.key}
					className={
						i > 0 ? 'ai-assistant-workday-draft__entry ai-assistant-workday-draft__entry--follow' : 'ai-assistant-workday-draft__entry'
					}
				>
					{entries.length > 1 ? (
						<p className="ai-assistant-workday-draft__day-label">
							{t('aiAssistant.workday.dayIndex', { n: i + 1, date: entry.date })}
						</p>
					) : null}
					<WorkdayEntryBlock entry={entry} fmt={fmt} />
				</div>
			))}
			<p className="ai-assistant-leave-draft__legal">{t('aiAssistant.workday.disclaimer')}</p>
			<div className="ai-assistant-leave-draft__actions">
				<button type="button" className="ai-assistant-leave-draft__btn ai-assistant-leave-draft__btn--primary" onClick={onConfirm} disabled={busy}>
					{busy ? '…' : entries.length > 1 ? t('aiAssistant.workday.confirmSendMany', { n: entries.length }) : t('aiAssistant.workday.confirmSend')}
				</button>
				<button type="button" className="ai-assistant-leave-draft__btn" onClick={onCancel} disabled={busy}>
					{t('aiAssistant.workday.cancel')}
				</button>
			</div>
		</div>
	)
}

export default AIAssistantWorkdayDraftPanel
