import React from 'react'
import { useTranslation } from 'react-i18next'
import { getLeaveRequestYears } from '../../utils/leaveRequestPeriod'

function LeaveRequestPeriodFilter({
	requests,
	selectedYear,
	selectedMonth,
	onYearChange,
	onMonthChange,
	resultCount,
	onOpenInsights,
	onOpenStatusFilters,
	activeStatusCount,
}) {
	const { t, i18n } = useTranslation()
	const years = React.useMemo(() => getLeaveRequestYears(requests), [requests])

	const handleYearChange = (event) => {
		const value = event.target.value
		onYearChange(value === 'all' ? 'all' : Number(value))
		if (value === 'all') onMonthChange('all')
	}

	return (
		<div className="leave-request-period-filter" aria-label={t('leaveRequestFilter.title')}>
			<div className="leave-request-period-filter__controls">
				<label>
					<span>{t('leaveRequestFilter.year')}</span>
					<select value={selectedYear} onChange={handleYearChange}>
						<option value="all">{t('leaveRequestFilter.allYears')}</option>
						{years.map((year) => (
							<option key={year} value={year}>{year}</option>
						))}
					</select>
				</label>

				<label>
					<span>{t('leaveRequestFilter.month')}</span>
					<select
						className="calendar-month-select"
						value={selectedMonth}
						onChange={(event) => onMonthChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
						disabled={selectedYear === 'all'}
					>
						<option value="all">{t('leaveRequestFilter.allMonths')}</option>
						{Array.from({ length: 12 }, (_, month) => {
							const name = new Date(Date.UTC(2020, month, 1)).toLocaleString(i18n.resolvedLanguage, {
								month: 'long',
								timeZone: 'UTC',
							})
							return <option key={month} value={month}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
						})}
					</select>
				</label>
			</div>

			<div className="leave-request-period-filter__count">
				{t('leaveRequestFilter.results', { shown: resultCount, total: requests.length })}
			</div>
			{(onOpenInsights || onOpenStatusFilters) && (
				<div className="leave-request-period-filter__actions">
					{onOpenInsights && (
						<button type="button" className="leave-request-insights-button" onClick={onOpenInsights}>
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
							</svg>
							{t('leaveRequestInsights.button')}
						</button>
					)}
					{onOpenStatusFilters && (
						<button type="button" className="leave-request-insights-button" onClick={onOpenStatusFilters}>
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M4 7h16M7 12h10M10 17h4" />
							</svg>
							{t('leaveRequestInsights.statusButton', { count: activeStatusCount })}
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default LeaveRequestPeriodFilter
