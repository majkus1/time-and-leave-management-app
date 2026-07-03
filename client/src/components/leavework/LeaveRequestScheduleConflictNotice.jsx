import React from 'react'
import { useTranslation } from 'react-i18next'
import {
	formatScheduleConflictDate,
	getScheduleConflictSummary,
	groupScheduleConflictsByDate,
} from '../../utils/leaveScheduleConflict'

function LeaveRequestScheduleConflictNotice({ conflict, variant = 'card' }) {
	const { t, i18n } = useTranslation()
	const days = conflict?.days || []
	if (!conflict?.hasConflict || days.length === 0) return null

	const grouped = groupScheduleConflictsByDate(days)
	const summary = getScheduleConflictSummary(t, days)

	return (
		<div
			className={`leave-schedule-conflict-notice leave-schedule-conflict-notice--${variant}`}
			role="note"
			aria-label={t('leaveScheduleConflict.badgeAria')}>
			<div className="leave-schedule-conflict-notice__header">
				<span className="leave-schedule-conflict-notice__icon" aria-hidden="true">
					!
				</span>
				<div>
					<p className="leave-schedule-conflict-notice__title">{t('leaveScheduleConflict.badgeTitle')}</p>
					<p className="leave-schedule-conflict-notice__summary">{summary}</p>
				</div>
			</div>
			<ul className="leave-schedule-conflict-notice__list">
				{grouped.map(([date, entries]) =>
					entries.map((entry, index) => (
						<li key={`${date}-${entry.scheduleName}-${index}`}>
							<strong>{formatScheduleConflictDate(date, i18n.resolvedLanguage)}</strong>
							<span>
								{' '}
								— {entry.scheduleName} ({entry.timeFrom}–{entry.timeTo})
							</span>
						</li>
					))
				)}
			</ul>
			<p className="leave-schedule-conflict-notice__hint">{t('leaveScheduleConflict.managerHint')}</p>
		</div>
	)
}

export default LeaveRequestScheduleConflictNotice
