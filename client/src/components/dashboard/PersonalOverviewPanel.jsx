import React from 'react'
import { Link } from 'react-router-dom'

const copy = {
	pl: {
		title: 'Twój urlop i kalendarz',
		subtitle: 'Limity urlopowe, najbliższy urlop oraz święto zespołu.',
		remaining: 'Pozostało',
		used: 'Wykorzystano',
		pending: 'Oczekujące',
		limit: 'Limit',
		days: 'dni',
		requestLeave: 'Złóż wniosek',
		planner: 'Planer urlopów',
		nextLeave: 'Twój najbliższy urlop',
		ongoingLeave: 'Trwający urlop',
		noNextLeave: 'Brak zaplanowanego urlopu.',
		planInPlanner: 'Zaplanuj w planerze',
		nextHoliday: 'Najbliższe święto',
		holidayToday: 'Dziś święto',
		inDays: 'Za {{count}} dni',
		endsInDays: 'Kończy się za {{count}} dni',
		todayHoliday: 'Dziś',
		duration: '{{count}} dni',
		noLimits: 'Brak skonfigurowanych limitów urlopowych dla Twojego konta.',
		noHoliday: 'Brak nadchodzących świąt w kalendarzu zespołu.',
	},
	en: {
		title: 'Your leave and calendar',
		subtitle: 'Leave limits, your next leave and the team’s next public holiday.',
		remaining: 'Remaining',
		used: 'Used',
		pending: 'Pending',
		limit: 'Limit',
		days: 'days',
		requestLeave: 'Request leave',
		planner: 'Leave planner',
		nextLeave: 'Your next leave',
		ongoingLeave: 'Leave in progress',
		noNextLeave: 'No leave scheduled.',
		planInPlanner: 'Plan in the planner',
		nextHoliday: 'Next public holiday',
		holidayToday: 'Holiday today',
		inDays: 'In {{count}} days',
		endsInDays: 'Ends in {{count}} days',
		todayHoliday: 'Today',
		duration: '{{count}} days',
		noLimits: 'No leave limits are configured for your account.',
		noHoliday: 'No upcoming holidays in the team calendar.',
	},
}

function formatNumber(value, language) {
	return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		maximumFractionDigits: 1,
	}).format(Number(value || 0))
}

function formatDate(value, language) {
	if (!value) return ''
	const [year, month, day] = String(value).split('-').map(Number)
	const date = new Date(year, month - 1, day)
	return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(date)
}

function formatDateRange(startDate, endDate, language) {
	if (!startDate) return ''
	if (!endDate || startDate === endDate) return formatDate(startDate, language)
	return `${formatDate(startDate, language)} – ${formatDate(endDate, language)}`
}

function PersonalOverviewPanel({ personal, language }) {
	const lang = language === 'pl' ? 'pl' : 'en'
	const text = copy[lang] || copy.pl

	if (!personal?.enabled) return null

	const leaveLimits = personal.leaveLimits || []
	const nextLeave = personal.nextLeave
	const holiday = personal.holidays?.next
	const holidaysEnabled = personal.holidays?.enabled === true
	const showLimits = leaveLimits.length > 0
	const showHoliday = holidaysEnabled
	const showAside = true

	const typeLabel = (item) => (lang === 'en' ? (item.typeNameEn || item.typeName) : item.typeName)

	return (
		<section className="po-dashboard-personal po-dashboard-section po-dashboard-section--wide">
			<div className="po-dashboard-personal__head">
				<div>
					<h2>{text.title}</h2>
					<p>{text.subtitle}</p>
				</div>
				<div className="po-dashboard-personal__actions">
					<Link to="/leave-request">{text.requestLeave}</Link>
					<Link to="/leave-planner">{text.planner}</Link>
				</div>
			</div>

			<div className={`po-dashboard-personal__grid ${showLimits && showAside ? '' : 'po-dashboard-personal__grid--single'}`}>
				<div className="po-dashboard-personal__limits">
					{showLimits ? (
						leaveLimits.map(item => (
							<article key={item.typeId} className="po-dashboard-personal__limit-card">
								<div className="po-dashboard-personal__limit-top">
									<strong>{typeLabel(item)}</strong>
									<span>{text.remaining}: {formatNumber(item.remaining, lang)} {text.days}</span>
								</div>
								<div className="po-dashboard-personal__limit-track" aria-hidden="true">
									<div
										className={`po-dashboard-personal__limit-fill ${item.isAtRisk ? 'is-risk' : ''}`}
										style={{ width: `${item.usagePercent}%` }}
									/>
								</div>
								<div className="po-dashboard-personal__limit-meta">
									<span>{text.used}: {formatNumber(item.used, lang)}</span>
									<span>{text.pending}: {formatNumber(item.pending, lang)}</span>
									<span>{text.limit}: {formatNumber(item.limit, lang)}</span>
								</div>
							</article>
						))
					) : (
						<p className="po-dashboard-personal__empty">{text.noLimits}</p>
					)}
				</div>

				<div className="po-dashboard-personal__aside">
					<article className={`po-dashboard-personal__next-leave ${nextLeave?.isOngoing ? 'is-ongoing' : ''}`}>
						<span>{nextLeave?.isOngoing ? text.ongoingLeave : text.nextLeave}</span>
						{nextLeave ? (
							<>
								<strong>{typeLabel(nextLeave)}</strong>
								<p>{formatDateRange(nextLeave.startDate, nextLeave.endDate, lang)}</p>
								<div className="po-dashboard-personal__next-leave-meta">
									{nextLeave.daysRequested > 0 && (
										<small>{text.duration.replace('{{count}}', formatNumber(nextLeave.daysRequested, lang))}</small>
									)}
									<small>
										{nextLeave.isOngoing
											? text.endsInDays.replace('{{count}}', String(nextLeave.daysRemaining ?? 0))
											: nextLeave.daysUntil === 0
												? text.todayHoliday
												: text.inDays.replace('{{count}}', String(nextLeave.daysUntil))}
									</small>
								</div>
							</>
						) : (
							<>
								<p className="po-dashboard-personal__empty">{text.noNextLeave}</p>
								<Link to="/leave-planner" className="po-dashboard-personal__next-leave-link">
									{text.planInPlanner}
								</Link>
							</>
						)}
					</article>

					{showHoliday && (
						<article className={`po-dashboard-personal__holiday ${holiday?.isToday ? 'is-today' : ''}`}>
							<span>{holiday?.isToday ? text.holidayToday : text.nextHoliday}</span>
							{holiday ? (
								<>
									<strong>{holiday.name}</strong>
									<p>{formatDate(holiday.date, lang)}</p>
									<small>
										{holiday.isToday
											? text.todayHoliday
											: text.inDays.replace('{{count}}', String(holiday.daysUntil))}
									</small>
								</>
							) : (
								<p className="po-dashboard-personal__empty">{text.noHoliday}</p>
							)}
						</article>
					)}
				</div>
			</div>
		</section>
	)
}

export default PersonalOverviewPanel
