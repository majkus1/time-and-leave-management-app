import React from 'react'
import { useTranslation } from 'react-i18next'
import {
	formatScheduleConflictDate,
	groupScheduleConflictsByDate,
} from '../../utils/leaveScheduleConflict'

function LeaveScheduleConflictConfirmContent({
	conflicts = [],
	employeeName = '',
	isForOtherEmployee = false,
}) {
	const { t, i18n } = useTranslation()
	const grouped = groupScheduleConflictsByDate(conflicts)

	const intro = isForOtherEmployee
		? t('leaveScheduleConflict.confirmIntroOther', { name: employeeName })
		: t('leaveScheduleConflict.confirmIntroSelf')

	return (
		<div className="leave-schedule-conflict-confirm">
			<p className="leave-schedule-conflict-confirm__intro">{intro}</p>

			<div className="leave-schedule-conflict-confirm__list-box" role="list">
				{grouped.map(([date, entries]) =>
					entries.map((entry, index) => (
						<div
							key={`${date}-${entry.scheduleName}-${index}`}
							className="leave-schedule-conflict-confirm__item"
							role="listitem">
							<span className="leave-schedule-conflict-confirm__date">
								{formatScheduleConflictDate(date, i18n.resolvedLanguage)}
							</span>
							<span className="leave-schedule-conflict-confirm__meta">
								{entry.scheduleName}
								<span className="leave-schedule-conflict-confirm__time">
									{entry.timeFrom}–{entry.timeTo}
								</span>
							</span>
						</div>
					))
				)}
			</div>

			<p className="leave-schedule-conflict-confirm__question">
				{t('leaveScheduleConflict.confirmQuestion')}
			</p>
			<p className="leave-schedule-conflict-confirm__note">
				{t('leaveScheduleConflict.confirmManagerNote')}
			</p>
		</div>
	)
}

export default LeaveScheduleConflictConfirmContent
