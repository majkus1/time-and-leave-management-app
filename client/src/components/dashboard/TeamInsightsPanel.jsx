import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useDashboardTeamInsights } from '../../hooks/useDashboardTeamInsights'

const copy = {
	pl: {
		title: 'Statystyki zespołu',
		subtitle: 'KPI za wybrany okres — czas pracy, urlopy i zadania w Twoim zakresie.',
		periodMonth: 'Ten miesiąc',
		periodPrev: 'Poprzedni miesiąc',
		periodCustom: 'Własny zakres',
		periodLabel: 'Okres',
		scopeLabel: 'Zakres danych',
		dateFrom: 'Od',
		dateTo: 'Do',
		allEmployees: 'Cały zespół w zakresie',
		allDepartments: 'Wszystkie działy w zakresie',
		departmentFilter: 'Dział',
		unassignedDepartment: 'Bez przypisanego działu',
		employeeFilter: 'Pracownik',
		scopeCount: 'Zakres',
		people: 'os.',
		workTitle: 'Czas pracy',
		workHours: 'Suma godzin',
		workOvertime: 'Nadgodziny',
		workRecorded: 'Dni z wpisem',
		workAvg: 'Średnio / osobę',
		workTop: 'Najwięcej godzin',
		leaveTitle: 'Urlopy',
		leavePending: 'Do decyzji',
		leaveApproved: 'Zaakceptowane w okresie',
		leaveDays: 'Dni urlopowe',
		leaveHours: 'Godziny urlopowe',
		leaveUpcoming: 'Nadchodzące (45 dni)',
		tasksTitle: 'Zadania',
		tasksOpen: 'Otwarte',
		tasksUrgent: 'Pilne',
		tasksOverdue: 'Po terminie',
		tasksDone: 'Ukończone w okresie',
		openWork: 'Ewidencja',
		openLeaves: 'Wnioski',
		openTasks: 'Tablice',
		emptyTop: 'Brak wpisów w tym okresie',
		loadError: 'Nie udało się załadować statystyk zespołu.',
	},
	en: {
		title: 'Team statistics',
		subtitle: 'KPIs for the selected period — work time, leave and tasks in your scope.',
		periodMonth: 'This month',
		periodPrev: 'Previous month',
		periodCustom: 'Custom range',
		periodLabel: 'Period',
		scopeLabel: 'Data scope',
		dateFrom: 'From',
		dateTo: 'To',
		allEmployees: 'All employees in scope',
		allDepartments: 'All departments in scope',
		departmentFilter: 'Department',
		unassignedDepartment: 'No department assigned',
		employeeFilter: 'Employee',
		scopeCount: 'Scope',
		people: 'people',
		workTitle: 'Work time',
		workHours: 'Total hours',
		workOvertime: 'Overtime',
		workRecorded: 'Recorded days',
		workAvg: 'Average / person',
		workTop: 'Most hours',
		leaveTitle: 'Leave',
		leavePending: 'Awaiting decision',
		leaveApproved: 'Approved in period',
		leaveDays: 'Leave days',
		leaveHours: 'Leave hours',
		leaveUpcoming: 'Upcoming (45 days)',
		tasksTitle: 'Tasks',
		tasksOpen: 'Open',
		tasksUrgent: 'Urgent',
		tasksOverdue: 'Overdue',
		tasksDone: 'Completed in period',
		openWork: 'Records',
		openLeaves: 'Requests',
		openTasks: 'Boards',
		emptyTop: 'No entries in this period',
		loadError: 'Could not load team statistics.',
	},
}

function formatHours(value, language) {
	const n = Number(value || 0)
	return `${new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	}).format(n)} h`
}

function formatNumber(value, language) {
	return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB').format(Number(value || 0))
}

function InsightKpi({ label, value, tone = 'neutral' }) {
	return (
		<div className={`po-dashboard-insights__kpi po-dashboard-insights__kpi--${tone}`}>
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	)
}

function BarRow({ label, value, max, suffix = '' }) {
	const width = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0
	return (
		<div className="po-dashboard-insights__bar-row">
			<div className="po-dashboard-insights__bar-head">
				<span>{label}</span>
				<strong>{value}{suffix}</strong>
			</div>
			<div className="po-dashboard-insights__bar-track" aria-hidden="true">
				<div className="po-dashboard-insights__bar-fill" style={{ width: `${width}%` }} />
			</div>
		</div>
	)
}

function employeeMatchesDepartment(employee, departmentKey) {
	if (!departmentKey) return true
	if (departmentKey === '__unassigned__') return !employee.departments?.length
	return employee.departments?.includes(departmentKey)
}

function toInputDate(value) {
	if (!value) return ''
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function defaultCustomRange() {
	const now = new Date()
	const start = new Date(now.getFullYear(), now.getMonth(), 1)
	return {
		startDate: toInputDate(start),
		endDate: toInputDate(now),
	}
}

function TeamInsightsPanel({ language, showWork, showLeaves, showTasks }) {
	const { i18n } = useTranslation()
	const lang = language || (i18n.language === 'pl' ? 'pl' : 'en')
	const text = copy[lang] || copy.pl
	const [period, setPeriod] = useState('month')
	const [customRange, setCustomRange] = useState(defaultCustomRange)
	const [department, setDepartment] = useState('')
	const [userId, setUserId] = useState('')
	const { data: insights, isLoading, isError } = useDashboardTeamInsights({
		period,
		startDate: period === 'custom' ? customRange.startDate : '',
		endDate: period === 'custom' ? customRange.endDate : '',
		department,
		userId,
		enabled: true,
	})

	const employeeOptions = useMemo(() => {
		const employees = insights?.employees || []
		if (!department) return employees
		return employees.filter(employee => employeeMatchesDepartment(employee, department))
	}, [insights?.employees, department])

	useEffect(() => {
		if (!userId || !department) return
		const stillValid = employeeOptions.some(employee => String(employee.id) === String(userId))
		if (!stillValid) setUserId('')
	}, [department, userId, employeeOptions])

	const periodOptions = useMemo(
		() => [
			{ id: 'month', label: text.periodMonth },
			{ id: 'prev_month', label: text.periodPrev },
			{ id: 'custom', label: text.periodCustom },
		],
		[text]
	)

	const handlePeriodChange = (nextPeriod) => {
		setPeriod(nextPeriod)
		if (nextPeriod === 'custom' && (!customRange.startDate || !customRange.endDate)) {
			setCustomRange(defaultCustomRange())
		}
	}

	if (isLoading && !insights) {
		return (
			<section className="po-dashboard-insights po-dashboard-section">
				<div className="po-dashboard-insights__loader">
					<Loader />
				</div>
			</section>
		)
	}

	if (isError || !insights?.enabled) return null

	const maxHours = insights.work?.maxLeaderHours || 0
	const taskMax = Math.max(
		insights.tasks?.openCount || 0,
		insights.tasks?.urgentCount || 0,
		insights.tasks?.overdueCount || 0,
		insights.tasks?.completedCount || 0,
		1
	)

	return (
		<section className="po-dashboard-insights po-dashboard-section po-dashboard-section--wide">
			<div className="po-dashboard-insights__head">
				<div>
					<h2>{text.title}</h2>
					<p>{text.subtitle}</p>
					<small>
						{text.scopeCount}: {formatNumber(insights.scope?.employeeCount, lang)} / {formatNumber(insights.scope?.totalScopedEmployees, lang)} {text.people}
						{' · '}
						{insights.period?.startDate} — {insights.period?.endDate}
					</small>
				</div>
				<div className="po-dashboard-insights__actions">
					{showWork && <Link to="/calendars-list">{text.openWork}</Link>}
					{showLeaves && <Link to="/leave-list">{text.openLeaves}</Link>}
					{showTasks && <Link to="/boards">{text.openTasks}</Link>}
				</div>
			</div>

			<div className={`po-dashboard-insights__toolbar ${period === 'custom' ? 'po-dashboard-insights__toolbar--custom' : ''}`}>
				<div className="po-dashboard-insights__toolbar-labels">
					<span className="po-dashboard-insights__toolbar-label">{text.periodLabel}</span>
					<span className="po-dashboard-insights__toolbar-label">{text.scopeLabel}</span>
				</div>
				<div className="po-dashboard-insights__toolbar-body">
					<div className="po-dashboard-insights__toolbar-period">
						<div className="po-dashboard-insights__periods" role="tablist" aria-label={text.periodLabel}>
							{periodOptions.map(option => (
								<button
									key={option.id}
									type="button"
									className={period === option.id ? 'is-active' : ''}
									onClick={() => handlePeriodChange(option.id)}
								>
									{option.label}
								</button>
							))}
						</div>
						{period === 'custom' && (
							<div className="po-dashboard-insights__custom-range">
								<label className="po-dashboard-insights__date-field">
									<span>{text.dateFrom}</span>
									<input
										type="date"
										value={customRange.startDate}
										max={customRange.endDate || undefined}
										onChange={event => setCustomRange(current => ({
											...current,
											startDate: event.target.value,
										}))}
									/>
								</label>
								<span className="po-dashboard-insights__range-sep" aria-hidden="true">—</span>
								<label className="po-dashboard-insights__date-field">
									<span>{text.dateTo}</span>
									<input
										type="date"
										value={customRange.endDate}
										min={customRange.startDate || undefined}
										onChange={event => setCustomRange(current => ({
											...current,
											endDate: event.target.value,
										}))}
									/>
								</label>
							</div>
						)}
					</div>

					<div className="po-dashboard-insights__toolbar-scope">
						<div className="po-dashboard-insights__scope-grid">
							{insights.departments?.length > 0 && (
								<label className="po-dashboard-insights__select-wrap">
									<span>{text.departmentFilter}</span>
									<select
										value={department}
										onChange={event => {
											setDepartment(event.target.value)
											setUserId('')
										}}
									>
										<option value="">{text.allDepartments}</option>
										{insights.departments.map(item => (
											<option key={item.key} value={item.key}>
												{item.name || text.unassignedDepartment} ({formatNumber(item.employeeCount, lang)})
											</option>
										))}
									</select>
								</label>
							)}
							<label className="po-dashboard-insights__select-wrap">
								<span>{text.employeeFilter}</span>
								<select value={userId} onChange={event => setUserId(event.target.value)}>
									<option value="">{text.allEmployees}</option>
									{employeeOptions.map(employee => (
										<option key={employee.id} value={employee.id}>
											{employee.name}
										</option>
									))}
								</select>
							</label>
						</div>
					</div>
				</div>
			</div>

			<div className="po-dashboard-insights__grid">
				{showWork && insights.work?.enabled && (
					<article className="po-dashboard-insights__card po-dashboard-insights__card--work">
						<h3>{text.workTitle}</h3>
						<div className="po-dashboard-insights__kpis">
							<InsightKpi label={text.workHours} value={formatHours(insights.work.totalHours, lang)} tone="info" />
							<InsightKpi label={text.workOvertime} value={formatHours(insights.work.totalOvertime, lang)} />
							<InsightKpi label={text.workRecorded} value={formatNumber(insights.work.recordedDays, lang)} />
							<InsightKpi label={text.workAvg} value={formatHours(insights.work.avgHoursPerEmployee, lang)} />
						</div>
						<div className="po-dashboard-insights__chart">
							<span className="po-dashboard-insights__chart-title">{text.workTop}</span>
							{insights.work.topByHours?.length ? (
								insights.work.topByHours.map(row => (
									<BarRow
										key={row.userId}
										label={row.userName}
										value={row.hours}
										max={maxHours}
										suffix=" h"
									/>
								))
							) : (
								<p className="po-dashboard-insights__empty">{text.emptyTop}</p>
							)}
						</div>
					</article>
				)}

				{showLeaves && insights.leave?.enabled && (
					<article className="po-dashboard-insights__card po-dashboard-insights__card--leave">
						<h3>{text.leaveTitle}</h3>
						<div className="po-dashboard-insights__kpis">
							{insights.leave.canApprove && (
								<InsightKpi
									label={text.leavePending}
									value={formatNumber(insights.leave.pendingCount, lang)}
									tone={insights.leave.pendingCount > 0 ? 'warning' : 'neutral'}
								/>
							)}
							<InsightKpi label={text.leaveApproved} value={formatNumber(insights.leave.approvedRequestsCount, lang)} />
							<InsightKpi label={text.leaveDays} value={formatNumber(insights.leave.totalLeaveDays, lang)} tone="info" />
							{/* Godziny z wnioskow godzinowych sa osobnym kafelkiem — nigdy nie sumujemy ich z dniami. */}
							{insights.leave.totalLeaveHours > 0 && (
								<InsightKpi label={text.leaveHours} value={formatNumber(insights.leave.totalLeaveHours, lang)} tone="info" />
							)}
							<InsightKpi label={text.leaveUpcoming} value={formatNumber(insights.leave.upcomingCount, lang)} />
						</div>
						<div className="po-dashboard-insights__chart">
							<BarRow label={text.leaveApproved} value={insights.leave.approvedRequestsCount} max={Math.max(insights.leave.approvedRequestsCount, insights.leave.upcomingCount, 1)} />
							<BarRow label={text.leaveUpcoming} value={insights.leave.upcomingCount} max={Math.max(insights.leave.approvedRequestsCount, insights.leave.upcomingCount, 1)} />
							{insights.leave.canApprove && (
								<BarRow label={text.leavePending} value={insights.leave.pendingCount} max={Math.max(insights.leave.pendingCount, 1)} />
							)}
						</div>
					</article>
				)}

				{showTasks && insights.tasks?.enabled && (
					<article className="po-dashboard-insights__card po-dashboard-insights__card--tasks">
						<h3>{text.tasksTitle}</h3>
						<div className="po-dashboard-insights__kpis">
							<InsightKpi label={text.tasksOpen} value={formatNumber(insights.tasks.openCount, lang)} />
							<InsightKpi label={text.tasksUrgent} value={formatNumber(insights.tasks.urgentCount, lang)} tone="danger" />
							<InsightKpi label={text.tasksOverdue} value={formatNumber(insights.tasks.overdueCount, lang)} tone={insights.tasks.overdueCount > 0 ? 'warning' : 'neutral'} />
							<InsightKpi label={text.tasksDone} value={formatNumber(insights.tasks.completedCount, lang)} tone="success" />
						</div>
						<div className="po-dashboard-insights__chart">
							<BarRow label={text.tasksOpen} value={insights.tasks.openCount} max={taskMax} />
							<BarRow label={text.tasksUrgent} value={insights.tasks.urgentCount} max={taskMax} />
							<BarRow label={text.tasksOverdue} value={insights.tasks.overdueCount} max={taskMax} />
							<BarRow label={text.tasksDone} value={insights.tasks.completedCount} max={taskMax} />
						</div>
					</article>
				)}
			</div>

			{isLoading && <div className="po-dashboard-insights__refreshing" aria-hidden="true" />}
		</section>
	)
}

export default TeamInsightsPanel
