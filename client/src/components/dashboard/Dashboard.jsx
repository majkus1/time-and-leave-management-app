import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import Sidebar from './Sidebar'
import Loader from '../Loader'
import { useAuth } from '../../context/AuthContext'
import { useTutorial } from '../../context/TutorialContext'
import { useDashboardSummary } from '../../hooks/useDashboardSummary'
import { useTimerElapsed } from '../../hooks/useTimerElapsed'
import { formatTimerClock } from '../../utils/timerDisplay'
import TeamInsightsPanel from './TeamInsightsPanel'
import PersonalOverviewPanel from './PersonalOverviewPanel'
import './Dashboard.css'

const copy = {
	pl: {
		start: 'Start',
		greeting: 'Dzień operacyjny',
		subtitle: 'Najważniejsze sprawy zespołu i Twojej pracy w jednym miejscu.',
		refreshError: 'Nie udało się załadować dashboardu.',
		workTime: 'Czas pracy',
		today: 'Dzisiaj',
		month: 'Ten miesiąc',
		hours: 'Godziny',
		overtime: 'Nadgodziny',
		recordedDays: 'Dni z wpisem',
		activeTimers: 'Aktywne liczniki',
		missingToday: 'Brak wpisu dzisiaj',
		pendingLeaves: 'Wnioski do decyzji',
		absentToday: 'Nieobecni dzisiaj',
		upcomingLeaves: 'Najbliższe urlopy',
		tasks: 'Zadania',
		openTasks: 'Otwarte',
		urgentTasks: 'Pilne',
		dueSoon: 'Terminy blisko',
		schedule: 'Grafik dzisiaj',
		draftShifts: 'Robocze wpisy',
		communication: 'Komunikacja',
		unreadChat: 'Czat',
		unreadAnnouncements: 'Komunikaty',
		unreadNotifications: 'Powiadomienia',
		quickActions: 'Szybkie akcje',
		plan: 'Plan',
		teamSeats: 'Miejsca w zespole',
		aiLeft: 'AI pozostało',
		noData: 'Brak pozycji',
		noWorkToday: 'Nie ma jeszcze wpisu czasu pracy na dziś.',
		noWorkTodayShort: 'Brak wpisu',
		workTodayMeta: 'Twój status czasu pracy',
		timerActive: 'Licznik działa',
		timerIdle: 'Brak aktywnego licznika',
		timerWidget: 'Licznik czasu',
		timerReady: 'Gotowy do pracy',
		timerReadyHint: 'Uruchom licznik albo uzupełnij wpis z poziomu ewidencji.',
		timerRunning: 'Liczy czas pracy',
		timerBreak: 'Przerwa',
		timerOvertime: 'Nadgodziny',
		timerStarted: 'Start',
		priorityToday: 'Priorytet dnia',
		requestsNeedDecision: 'wniosków urlopowych do decyzji',
		myRequestsPending: 'Twoje wnioski urlopowe czekają na decyzję',
		myRequestsPendingMeta: 'Podgląd statusu Twoich wniosków w planerze urlopów.',
		entriesMissing: 'osób bez wpisu czasu pracy dzisiaj',
		fillOwnToday: 'Uzupełnij dziś czas pracy',
		fillOwnTodayMeta: 'Dodaj wpis, aby Twoja ewidencja była kompletna.',
		urgentTasksNeedFocus: 'pilnych zadań do zrobienia',
		teamOnTrack: 'Dzień pod kontrolą',
		teamOnTrackMeta: 'Brak pilnych sygnałów wymagających reakcji.',
		decisionSignal: 'Kliknij, aby przejść do listy wniosków i domknąć decyzje.',
		missingSignal: 'Kliknij, aby otworzyć ewidencję zespołu i uzupełnić braki.',
		taskSignal: 'Kliknij, aby przejść do zadań z terminem i wysokim priorytetem.',
		moduleLocked: 'Moduł niedostępny w bieżącym planie.',
		open: 'Otwórz',
		goTo: 'Przejdź',
		viewAll: 'Zobacz',
		roleAdmin: 'Widok administratora',
		roleHr: 'Widok HR',
		roleSupervisor: 'Widok przełożonego',
		roleWorker: 'Widok pracownika',
		leavesTeamLabel: 'Wnioski do decyzji',
		leavesOwnLabel: 'Nieobecni w zespole dzisiaj',
		leavesOwnMeta: 'Twój najbliższy urlop',
		leavesOwnMetaNone: 'Brak zaplanowanego urlopu',
		teamWorkTitle: 'Czas pracy zespołu',
		fillWorkTimeCta: 'Uzupełnij czas pracy',
		teamCreatedTitle: 'Zespół został utworzony pomyślnie!',
		teamCreatedBody: 'Twój zespół został pomyślnie zarejestrowany. Możesz teraz rozpocząć korzystanie z aplikacji.',
		getStarted: 'Rozpocznij',
		weekendToday: 'Weekend — zespół nie pracuje',
		weekendTodayShort: 'Weekend',
		holidayToday: 'Święto',
		nonWorkingDayMeta: 'Dziś nie trzeba uzupełniać ewidencji czasu pracy.',
		nonWorkingDayNote: 'Dzień wolny od pracy',
		timerNonWorkingHint: 'W dni wolne od pracy licznik nie jest dostępny.',
		timerUnavailable: 'Licznik niedostępny',
	},
	en: {
		start: 'Home',
		greeting: 'Operational day',
		subtitle: 'The most important team and personal work signals in one place.',
		refreshError: 'Could not load the dashboard.',
		workTime: 'Work time',
		today: 'Today',
		month: 'This month',
		hours: 'Hours',
		overtime: 'Overtime',
		recordedDays: 'Recorded days',
		activeTimers: 'Active timers',
		missingToday: 'Missing today',
		pendingLeaves: 'Requests to review',
		absentToday: 'Absent today',
		upcomingLeaves: 'Upcoming leave',
		tasks: 'Tasks',
		openTasks: 'Open',
		urgentTasks: 'Urgent',
		dueSoon: 'Due soon',
		schedule: 'Today schedule',
		draftShifts: 'Draft entries',
		communication: 'Communication',
		unreadChat: 'Chat',
		unreadAnnouncements: 'Announcements',
		unreadNotifications: 'Notifications',
		quickActions: 'Quick actions',
		plan: 'Plan',
		teamSeats: 'Team seats',
		aiLeft: 'AI remaining',
		noData: 'No items',
		noWorkToday: 'No work time entry for today yet.',
		noWorkTodayShort: 'No entry',
		workTodayMeta: 'Your work time status',
		timerActive: 'Timer active',
		timerIdle: 'No active timer',
		timerWidget: 'Time timer',
		timerReady: 'Ready for work',
		timerReadyHint: 'Start the timer or complete the entry from work time.',
		timerRunning: 'Tracking work time',
		timerBreak: 'Break',
		timerOvertime: 'Overtime',
		timerStarted: 'Start',
		priorityToday: 'Today priority',
		requestsNeedDecision: 'leave requests to review',
		myRequestsPending: 'Your leave requests are awaiting a decision',
		myRequestsPendingMeta: 'Track your requests status in the leave planner.',
		entriesMissing: 'people without a work time entry today',
		fillOwnToday: 'Log your work time today',
		fillOwnTodayMeta: 'Add an entry to keep your records complete.',
		urgentTasksNeedFocus: 'urgent tasks to handle',
		teamOnTrack: 'Day under control',
		teamOnTrackMeta: 'No urgent signals need action right now.',
		decisionSignal: 'Click to open the requests list and close decisions.',
		missingSignal: 'Click to open team records and fill the gaps.',
		taskSignal: 'Click to open tasks with due dates and high priority.',
		moduleLocked: 'Module unavailable in the current plan.',
		open: 'Open',
		goTo: 'Go',
		viewAll: 'View',
		roleAdmin: 'Admin view',
		roleHr: 'HR view',
		roleSupervisor: 'Supervisor view',
		roleWorker: 'Employee view',
		leavesTeamLabel: 'Requests to review',
		leavesOwnLabel: 'Team absent today',
		leavesOwnMeta: 'Your next leave',
		leavesOwnMetaNone: 'No leave scheduled',
		teamWorkTitle: 'Team work time',
		fillWorkTimeCta: 'Log work time',
		teamCreatedTitle: 'Team created successfully!',
		teamCreatedBody: 'Your team has been successfully registered. You can now start using the application.',
		getStarted: 'Get started',
		weekendToday: 'Weekend — team does not work',
		weekendTodayShort: 'Weekend',
		holidayToday: 'Public holiday',
		nonWorkingDayMeta: 'No work time entry is required today.',
		nonWorkingDayNote: 'Non-working day',
		timerNonWorkingHint: 'The timer is unavailable on non-working days.',
		timerUnavailable: 'Timer unavailable',
	},
}

function getText(language) {
	return language === 'pl' ? copy.pl : copy.en
}

function formatHours(value, language) {
	const n = Number(value || 0)
	return `${new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		maximumFractionDigits: 1,
	}).format(n)} h`
}

function formatNumber(value, language) {
	return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB').format(Number(value || 0))
}

function parseCalendarDate(value) {
	if (!value) return null
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		return new Date(year, month - 1, day)
	}
	return new Date(value)
}

function formatDate(value, language) {
	if (!value) return ''
	return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		day: '2-digit',
		month: 'short',
	}).format(parseCalendarDate(value))
}

function formatDateLong(value, language) {
	if (!value) return ''
	return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(parseCalendarDate(value))
}

function formatTime(value, language) {
	if (!value) return ''
	return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value))
}

function leaveTypeLabel(t, type) {
	if (!type) return ''
	const translated = t(type)
	return translated && translated !== type ? translated : type.replace(/^leaveform\./, '')
}

function isWorkExpectedToday(summary) {
	return summary?.period?.todayContext?.isWorkingDay !== false
}

function nonWorkingDaySignal(summary, text) {
	const ctx = summary?.period?.todayContext
	if (!ctx || ctx.isWorkingDay !== false) return null

	return {
		value: ctx.kind === 'holiday' ? (ctx.holidayName || text.holidayToday) : text.weekendToday,
		meta: text.nonWorkingDayMeta,
		tone: 'neutral',
	}
}

function isMyTodayMissing(summary) {
	if (!isWorkExpectedToday(summary)) return false
	const myToday = summary?.work?.myToday
	if (!myToday) return true
	return (
		!Number(myToday.hours) &&
		!Number(myToday.overtime) &&
		!myToday.absenceType &&
		!myToday.activeTimer
	)
}

// Priorytet dnia zależny od roli i modułów: pokazujemy tylko to, na co dana
// osoba faktycznie ma wpływ, i podpinamy konkretną ścieżkę nawigacji.
function buildDaySignal(summary, text, language) {
	const viewer = summary?.viewer || {}
	const modules = viewer.modules || {}
	const canApprove = viewer.canApproveLeaves === true
	const canViewTimesheets = viewer.canViewTimesheets === true
	const pendingLeaves = Number(summary?.leaves?.pendingCount || 0)
	const missingToday = Number(summary?.work?.teamMonth?.todayMissingCount || 0)
	const urgentTasks = Number(summary?.tasks?.urgentOpenCount || 0)

	if (modules.leaves && canApprove && pendingLeaves > 0) {
		return {
			value: `${formatNumber(pendingLeaves, language)} ${text.requestsNeedDecision}`,
			meta: text.decisionSignal,
			tone: 'warning',
			path: '/leave-list',
		}
	}

	if (canViewTimesheets && missingToday > 0 && isWorkExpectedToday(summary)) {
		return {
			value: `${formatNumber(missingToday, language)} ${text.entriesMissing}`,
			meta: text.missingSignal,
			tone: 'info',
			path: '/calendars-list',
		}
	}

	if (modules.tasks && urgentTasks > 0) {
		return {
			value: `${formatNumber(urgentTasks, language)} ${text.urgentTasksNeedFocus}`,
			meta: text.taskSignal,
			tone: 'danger',
			path: '/boards',
		}
	}

	if (modules.leaves && !canApprove && pendingLeaves > 0) {
		return {
			value: text.myRequestsPending,
			meta: text.myRequestsPendingMeta,
			tone: 'info',
			path: '/leave-planner',
		}
	}

	const nonWorking = nonWorkingDaySignal(summary, text)
	if (nonWorking) return nonWorking

	if (isMyTodayMissing(summary)) {
		return {
			value: text.fillOwnToday,
			meta: text.fillOwnTodayMeta,
			tone: 'info',
			path: '/work-time',
		}
	}

	return {
		value: text.teamOnTrack,
		meta: text.teamOnTrackMeta,
		tone: 'success',
	}
}

function roleViewLabel(roleView, text) {
	switch (roleView) {
		case 'admin':
			return text.roleAdmin
		case 'hr':
			return text.roleHr
		case 'supervisor':
			return text.roleSupervisor
		default:
			return text.roleWorker
	}
}

function taskBoardUrl(task) {
	if (!task?.boardId || !task?.id) return '/boards'
	return `/boards/${task.boardId}?task=${encodeURIComponent(String(task.id))}`
}

function MetricCard({ icon, label, value, meta, tone = 'neutral', to }) {
	const inner = (
		<>
			<div className="po-dashboard-metric__icon">
				<img src={icon} alt="" aria-hidden />
			</div>
			<div>
				<span>{label}</span>
				<strong>{value}</strong>
				{meta && <small>{meta}</small>}
			</div>
		</>
	)

	if (to) {
		return (
			<Link to={to} className={`po-dashboard-metric po-dashboard-metric--${tone} po-dashboard-metric--link`}>
				{inner}
			</Link>
		)
	}

	return <div className={`po-dashboard-metric po-dashboard-metric--${tone}`}>{inner}</div>
}

function Section({ title, action, children, className = '' }) {
	return (
		<section className={`po-dashboard-section ${className}`}>
			<div className="po-dashboard-section__head">
				<h2>{title}</h2>
				{action}
			</div>
			{children}
		</section>
	)
}

function EmptyState({ text }) {
	return <p className="po-dashboard-empty">{text}</p>
}

function TimerStatusCard({ text, language, activeTimer, metrics, todayContext }) {
	const isActive = !!activeTimer?.startTime
	const isBlocked = !isActive && todayContext?.isWorkingDay === false
	const blockedTitle = todayContext?.kind === 'holiday'
		? (todayContext.holidayName || text.holidayToday)
		: text.weekendTodayShort
	const status = metrics?.isBreak
		? text.timerBreak
		: metrics?.isOvertime
			? text.timerOvertime
			: text.timerRunning
	const description = metrics?.workDescription || activeTimer?.workDescription || ''

	return (
		<section className={`po-dashboard-timer ${isActive ? 'is-active' : ''} ${isBlocked ? 'is-blocked' : ''}`}>
			<div className="po-dashboard-timer__main">
				<span>{text.timerWidget}</span>
				<strong>
					{isActive && metrics
						? formatTimerClock(metrics.elapsedSeconds)
						: isBlocked
							? blockedTitle
							: text.timerReady}
				</strong>
				<p>
					{isActive
						? (description || status)
						: isBlocked
							? text.timerNonWorkingHint
							: text.timerReadyHint}
				</p>
			</div>
			<div className="po-dashboard-timer__side">
				{isActive && (
					<div>
						<small>{status}</small>
						<small>{text.timerStarted}: {formatTime(activeTimer.startTime, language)}</small>
					</div>
				)}
				{!isBlocked && <Link to="/work-time">{text.open}</Link>}
			</div>
		</section>
	)
}

function DayPriorityCard({ text, signal }) {
	const content = (
		<>
			<span>{text.priorityToday}</span>
			<strong>{signal.value}</strong>
			<p>{signal.meta}</p>
			{signal.path && <span className="po-dashboard-priority__cta">{text.goTo} →</span>}
		</>
	)

	if (signal.path) {
		return (
			<Link
				to={signal.path}
				className={`po-dashboard-priority po-dashboard-priority--${signal.tone} po-dashboard-priority--link`}
			>
				{content}
			</Link>
		)
	}

	return (
		<section className={`po-dashboard-priority po-dashboard-priority--${signal.tone}`}>
			{content}
		</section>
	)
}

function SuccessModal({ text, onClose }) {
	return (
		<div className="po-dashboard-success" onClick={(event) => event.target === event.currentTarget && onClose()}>
			<div className="po-dashboard-success__panel" onClick={(event) => event.stopPropagation()}>
				<div className="po-dashboard-success__mark">
					<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h2>{text.teamCreatedTitle}</h2>
				<p>{text.teamCreatedBody}</p>
				<button type="button" onClick={onClose}>{text.getStarted}</button>
			</div>
		</div>
	)
}

function Dashboard() {
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const location = useLocation()
	const { t, i18n } = useTranslation()
	const language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'
	const text = getText(language)
	const { username, hasSeenTutorial, firstLoginAt } = useAuth()
	const { openTutorial } = useTutorial()
	const tutorialAutoOpenedRef = useRef(false)
	const { data: summary, isLoading, isError } = useDashboardSummary()
	const activeTimer = useMemo(() => {
		const timer = summary?.work?.myToday?.activeTimer
		return timer?.startTime ? { active: true, ...timer } : null
	}, [summary?.work?.myToday?.activeTimer])
	const timerMetrics = useTimerElapsed(activeTimer)

	useEffect(() => {
		const showModalFromStorage = sessionStorage.getItem('showTeamSuccessModal') === 'true'
		const showModalFromState = location.state?.showTeamSuccessModal

		if (showModalFromStorage || showModalFromState) {
			setShowSuccessModal(true)
			if (showModalFromStorage) sessionStorage.removeItem('showTeamSuccessModal')
			window.history.replaceState({}, document.title)
			setTimeout(() => {
				confetti({
					particleCount: 120,
					spread: 70,
					origin: { y: 0.2 },
					zIndex: 10000,
				})
			}, 300)
		}
	}, [location.state])

	const shouldOfferAutoTutorial = useCallback(() => {
		if (hasSeenTutorial || !firstLoginAt || showSuccessModal) return false
		return true
	}, [hasSeenTutorial, firstLoginAt, showSuccessModal])

	const openAutoTutorialOnce = useCallback(() => {
		if (tutorialAutoOpenedRef.current || !shouldOfferAutoTutorial()) return
		tutorialAutoOpenedRef.current = true
		openTutorial({ firstView: true })
	}, [shouldOfferAutoTutorial, openTutorial])

	useEffect(() => {
		if (!shouldOfferAutoTutorial()) return
		const timer = setTimeout(openAutoTutorialOnce, 500)
		return () => clearTimeout(timer)
	}, [shouldOfferAutoTutorial, openAutoTutorialOnce])

	const handleCloseSuccessModal = () => {
		setShowSuccessModal(false)
		setTimeout(openAutoTutorialOnce, 300)
	}

	const todayContext = summary?.period?.todayContext
	const todayState = useMemo(() => {
		if (todayContext?.isWorkingDay === false) {
			if (todayContext.kind === 'holiday') {
				return {
					label: todayContext.holidayName || text.holidayToday,
					active: false,
					meta: text.nonWorkingDayMeta,
				}
			}
			return { label: text.weekendTodayShort, active: false, meta: text.nonWorkingDayMeta }
		}

		const today = summary?.work?.myToday
		if (!today) return { label: text.noWorkTodayShort, active: false, meta: text.noWorkToday }
		if (today.activeTimer) return { label: text.timerActive, active: true }
		if (today.absenceType) return { label: leaveTypeLabel(t, today.absenceType), active: false }
		return { label: `${formatHours(today.hours, language)} · ${text.overtime}: ${formatHours(today.overtime, language)}`, active: false }
	}, [summary, text, language, t, todayContext])

	const dayNote = useMemo(() => {
		if (todayContext?.isWorkingDay !== false) return null
		if (todayContext.kind === 'holiday') {
			return todayContext.holidayName || text.holidayToday
		}
		return text.nonWorkingDayNote
	}, [todayContext, text])

	const daySignal = useMemo(
		() => buildDaySignal(summary, text, language),
		[summary, text, language]
	)

	const modules = summary?.viewer?.modules || {}
	const canViewTimesheets = summary?.viewer?.canViewTimesheets === true
	const canApproveLeaves = summary?.viewer?.canApproveLeaves === true
	const showTimer = modules.timeTracking === true
	const leavesModule = modules.leaves === true
	const tasksEnabled = summary?.tasks?.enabled === true
	const roleView = summary?.viewer?.roleView
	const canManageBilling = roleView === 'admin' || roleView === 'hr'
	const showTeamInsights = summary?.viewer?.canViewTeamInsights === true
	const showPersonalPanel = leavesModule && summary.personal?.enabled
	const personalOverviewPanel = showPersonalPanel ? (
		<PersonalOverviewPanel personal={summary.personal} language={language} />
	) : null

	return (
		<>
			<Sidebar />
			<main className="content p-3 po-dashboard">
				{isLoading && (
					<div className="po-dashboard-loader">
						<Loader />
					</div>
				)}

				{isError && !isLoading && (
					<div className="po-dashboard-error">{text.refreshError}</div>
				)}

				{summary && !isLoading && (
					<>
						<header className="po-dashboard-header">
							<div className="po-dashboard-header__hero">
								<div className="po-dashboard-header__hero-main">
									<div className="po-dashboard-header__icon" aria-hidden="true">
										<img src="/img/home.png" alt="" />
									</div>
									<div className="po-dashboard-header__intro">
										<span>{text.start}</span>
										<h1>{text.greeting}</h1>
										<p>
											<strong className="po-dashboard-header__team">{summary.team?.name || username}</strong>
											<span className="po-dashboard-header__sep"> · </span>
											{text.subtitle}
										</p>
									</div>
								</div>
								<div className="po-dashboard-header__aside">
									<div className="po-dashboard-header__meta">
										<strong>{formatDateLong(summary.period?.today, language)}</strong>
										{dayNote && <em className="po-dashboard-header__day-note">{dayNote}</em>}
										<span>{roleViewLabel(summary.viewer?.roleView, text)}</span>
									</div>
									{isWorkExpectedToday(summary) && (
										<Link to="/work-time" className="po-dashboard-header__cta">
											{text.fillWorkTimeCta}
										</Link>
									)}
								</div>
							</div>
						</header>

						<div className={`po-dashboard-command ${showTimer ? '' : 'po-dashboard-command--single'}`}>
							{showTimer && (
								<TimerStatusCard
									text={text}
									language={language}
									activeTimer={activeTimer}
									metrics={timerMetrics}
									todayContext={todayContext}
								/>
							)}
							<DayPriorityCard text={text} signal={daySignal} />
						</div>

						<div className="po-dashboard-metrics">
							<MetricCard
								icon="/img/clock.png"
								label={text.today}
								value={todayState.label}
								meta={todayState.active ? summary.work?.myToday?.activeTimer?.workDescription : todayState.meta || text.workTodayMeta}
								tone={todayState.active ? 'success' : 'neutral'}
								to="/work-time"
							/>
							<MetricCard
								icon="/img/schedule time works.png"
								label={text.month}
								value={formatHours(summary.work?.myMonth?.hours, language)}
								meta={`${text.overtime}: ${formatHours(summary.work?.myMonth?.overtime, language)}`}
								tone="info"
								to="/work-time"
							/>
							{leavesModule && (
								canApproveLeaves ? (
									<MetricCard
										icon="/img/trip.png"
										label={text.leavesTeamLabel}
										value={formatNumber(summary.leaves?.pendingCount, language)}
										meta={`${text.absentToday}: ${formatNumber(summary.leaves?.todayAbsentCount, language)}`}
										tone={summary.leaves?.pendingCount > 0 ? 'warning' : 'neutral'}
										to="/leave-list"
									/>
								) : (
									<MetricCard
										icon="/img/trip.png"
										label={text.leavesOwnLabel}
										value={formatNumber(summary.leaves?.todayAbsentCount, language)}
										meta={
											summary.leaves?.ownNextLeave
												? `${text.leavesOwnMeta}: ${formatDate(summary.leaves.ownNextLeave.startDate, language)}`
												: text.leavesOwnMetaNone
										}
										tone="neutral"
										to="/leave-planner"
									/>
								)
							)}
							{tasksEnabled && (
								<MetricCard
									icon="/img/task-list.png"
									label={text.tasks}
									value={formatNumber(summary.tasks?.totalOpenCount, language)}
									meta={`${text.urgentTasks}: ${formatNumber(summary.tasks?.urgentOpenCount, language)}`}
									tone={summary.tasks?.urgentOpenCount > 0 ? 'danger' : 'neutral'}
									to="/boards"
								/>
							)}
						</div>

						{!showTeamInsights && personalOverviewPanel}

						{showTeamInsights && (
							<TeamInsightsPanel
								language={language}
								showWork={canViewTimesheets}
								showLeaves={leavesModule}
								showTasks={tasksEnabled}
							/>
						)}

						<div className="po-dashboard-grid">
							{canViewTimesheets && (
								<Section
									title={text.teamWorkTitle}
									action={<Link to="/calendars-list">{text.open}</Link>}
									className={`po-dashboard-section--wide po-dashboard-section--work ${showTimer ? 'po-dashboard-section--work-3' : 'po-dashboard-section--work-2'}`}
								>
									<div className={`po-dashboard-workline ${showTimer ? '' : 'po-dashboard-workline--2'}`}>
										<div>
											<span>{text.recordedDays}</span>
											<strong>{formatNumber(summary.work?.teamMonth?.recordedDays, language)}</strong>
										</div>
										{showTimer && (
											<div>
												<span>{text.activeTimers}</span>
												<strong>{formatNumber(summary.work?.teamMonth?.activeTimers, language)}</strong>
											</div>
										)}
										<div>
											<span>{text.missingToday}</span>
											<strong>{formatNumber(summary.work?.teamMonth?.todayMissingCount, language)}</strong>
										</div>
									</div>
								</Section>
							)}

							{tasksEnabled && (
								<Section title={text.dueSoon} action={<Link to="/boards">{text.viewAll}</Link>}>
									{summary.tasks.dueSoon?.length ? (
										<ul className="po-dashboard-list">
											{summary.tasks.dueSoon.map(task => (
												<li key={task.id}>
													<Link to={taskBoardUrl(task)} className="po-dashboard-list__link">
														<strong>{task.title}</strong>
														<span>{task.boardName} · {task.priority}</span>
														<small>{formatDate(task.dueDate || task.workPeriodEnd || task.workPeriodStart, language)}</small>
													</Link>
												</li>
											))}
										</ul>
									) : (
										<EmptyState text={text.noData} />
									)}
								</Section>
							)}

							{leavesModule && (
								<Section title={text.upcomingLeaves} action={<Link to="/leave-planner">{text.viewAll}</Link>}>
									{summary.leaves?.upcoming?.length ? (
										<ul className="po-dashboard-list">
											{summary.leaves.upcoming.map(item => (
												<li key={item.id} className="po-dashboard-list__item">
													<strong>{item.userName}</strong>
													<span>{leaveTypeLabel(t, item.type)}</span>
													<small>{formatDate(item.startDate, language)} - {formatDate(item.endDate, language)}</small>
												</li>
											))}
										</ul>
									) : (
										<EmptyState text={text.noData} />
									)}
								</Section>
							)}

							{summary.schedule?.enabled && (
								<Section title={text.schedule} action={<Link to="/schedule">{text.viewAll}</Link>}>
									{summary.schedule.todayEntries?.length ? (
										<ul className="po-dashboard-list">
											{summary.schedule.todayEntries.map(entry => (
												<li key={entry.id} className="po-dashboard-list__item">
													<strong>{entry.employeeName}</strong>
													<span>{entry.scheduleName}</span>
													<small>{entry.timeFrom} - {entry.timeTo}</small>
												</li>
											))}
										</ul>
									) : (
										<EmptyState text={text.noData} />
									)}
								</Section>
							)}

							<Section title={text.communication}>
								<div className={`po-dashboard-communication ${modules.announcements && modules.chat ? '' : 'po-dashboard-communication--tight'}`}>
									<div className="po-dashboard-communication__tile">
										<span>{text.unreadNotifications}</span>
										<strong>{formatNumber(summary.communication?.notificationsUnread, language)}</strong>
									</div>
									{modules.announcements && (
										<Link to="/announcements" className="po-dashboard-communication__tile po-dashboard-communication__tile--link">
											<span>{text.unreadAnnouncements}</span>
											<strong>{formatNumber(summary.communication?.announcementsUnread, language)}</strong>
										</Link>
									)}
									{modules.chat && (
										<Link to="/chat" className="po-dashboard-communication__tile po-dashboard-communication__tile--link">
											<span>{text.unreadChat}</span>
											<strong>{formatNumber(summary.communication?.chatUnread, language)}</strong>
										</Link>
									)}
								</div>
								{modules.announcements && summary.communication?.latestAnnouncements?.length > 0 && (
									<ul className="po-dashboard-mini-list">
										{summary.communication.latestAnnouncements.map(item => (
											<li key={item.id}>{item.title}</li>
										))}
									</ul>
								)}
							</Section>

							<Section
								title={text.plan}
								action={canManageBilling && <Link to="/packages">{text.open}</Link>}
							>
								<div className={`po-dashboard-plan ${modules.ai ? '' : 'po-dashboard-plan--single'}`}>
									<div>
										<span>{summary.entitlements?.planKey || 'Planopia'}</span>
										<strong>
											{formatNumber(summary.team?.activeSeatCount, language)}
											{summary.team?.maxUsers ? ` / ${formatNumber(summary.team.maxUsers, language)}` : ''}
										</strong>
										<small>{text.teamSeats}</small>
									</div>
									{modules.ai && (
										<div>
											<span>{text.aiLeft}</span>
											<strong>{summary.entitlements?.ai?.remainingApprox ?? '-'}</strong>
											<small>{summary.entitlements?.ai?.usageMonthKey || ''}</small>
										</div>
									)}
								</div>
							</Section>
						</div>

						{showTeamInsights && personalOverviewPanel}
					</>
				)}
			</main>
			{showSuccessModal && <SuccessModal text={text} onClose={handleCloseSuccessModal} />}
		</>
	)
}

export default Dashboard
