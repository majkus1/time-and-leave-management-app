import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import plLocale from '@fullcalendar/core/locales/pl'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { addDays } from 'date-fns'
import { useCalendarTasks } from '../../hooks/useBoards'
import QuickCalendarTaskModal from './QuickCalendarTaskModal'
import { calendarTaskSortMinutes, formatCalendarTimeDisplay } from '../../utils/taskScheduleTime'

function toYMD(d) {
	if (!d) return null
	const x = new Date(d)
	if (isNaN(x.getTime())) return null
	const y = x.getFullYear()
	const m = String(x.getMonth() + 1).padStart(2, '0')
	const day = String(x.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

const btnArrowStyle = {
	padding: '8px 12px',
	border: '1px solid #bdc3c7',
	borderRadius: '6px',
	backgroundColor: 'white',
	cursor: 'pointer',
	fontSize: '18px',
	fontWeight: '600',
	color: '#495057',
	transition: 'all 0.2s ease',
}

const selectStyle = {
	padding: '8px 12px',
	border: '1px solid #bdc3c7',
	borderRadius: '6px',
	fontSize: '16px',
}

/**
 * @param {{ boardId?: string | null, showBoardNameInTitle?: boolean, title?: string, boards?: Array<{ _id: string, name?: string }> }} props
 */
function TasksBoardCalendar({ boardId = null, showBoardNameInTitle = false, title, boards = [] }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const calendarRef = useRef(null)

	const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
	const [quickOpen, setQuickOpen] = useState(false)

	const { data: tasks = [], isLoading } = useCalendarTasks(currentYear, currentMonth + 1, boardId, {
		enabled: true,
	})

	useEffect(() => {
		const updateCalendarSize = () => {
			const api = calendarRef.current?.getApi?.()
			if (api) setTimeout(() => api.updateSize(), 350)
		}
		const observer = new MutationObserver(updateCalendarSize)
		if (document.body) {
			observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
		}
		window.addEventListener('resize', updateCalendarSize)
		updateCalendarSize()
		return () => {
			observer.disconnect()
			window.removeEventListener('resize', updateCalendarSize)
		}
	}, [])

	const handleMonthSelect = (e) => {
		const newMonth = parseInt(e.target.value, 10)
		setCurrentMonth(newMonth)
	}

	const handleYearSelect = (e) => {
		const newYear = parseInt(e.target.value, 10)
		setCurrentYear(newYear)
	}

	const handlePrevMonth = () => {
		const d = new Date(currentYear, currentMonth - 1, 1)
		setCurrentMonth(d.getMonth())
		setCurrentYear(d.getFullYear())
	}

	const handleNextMonth = () => {
		const d = new Date(currentYear, currentMonth + 1, 1)
		setCurrentMonth(d.getMonth())
		setCurrentYear(d.getFullYear())
	}

	const events = useMemo(() => {
		const out = []
		const locale = i18n.resolvedLanguage || i18n.language || 'pl-PL'
		for (const task of tasks) {
			const baseTitle = showBoardNameInTitle && task.boardName
				? `${task.boardName}: ${task.title}`
				: task.title
			const color = task.calendarOnly ? '#8e44ad' : '#2980b9'
			const textColor = '#fff'
			const displayTime = formatCalendarTimeDisplay(task, locale)
			const sortMinutes = calendarTaskSortMinutes(task)
			const commonProps = {
				id: task._id,
				title: baseTitle,
				backgroundColor: color,
				borderColor: color,
				textColor,
				allDay: true,
				extendedProps: {
					boardId: String(task.boardId),
					calendarOnly: task.calendarOnly,
					taskStatus: task.status || 'todo',
					taskPriority: task.priority || 'medium',
					displayTime,
					sortMinutes,
				},
			}
			if (task.dueDate) {
				const start = toYMD(task.dueDate)
				if (!start) continue
				out.push({
					...commonProps,
					start,
				})
			} else if (task.workPeriodStart && task.workPeriodEnd) {
				const start = toYMD(task.workPeriodStart)
				const endInclusive = new Date(task.workPeriodEnd)
				if (!start || isNaN(endInclusive.getTime())) continue
				const endExclusive = addDays(endInclusive, 1)
				out.push({
					...commonProps,
					start,
					end: toYMD(endExclusive),
				})
			}
		}
		out.sort((a, b) => {
			const dayCmp = String(a.start).localeCompare(String(b.start))
			if (dayCmp !== 0) return dayCmp
			const sortA = a.extendedProps?.sortMinutes ?? 24 * 60
			const sortB = b.extendedProps?.sortMinutes ?? 24 * 60
			if (sortA !== sortB) return sortA - sortB
			return String(a.title).localeCompare(String(b.title))
		})
		return out
	}, [tasks, showBoardNameInTitle, i18n.resolvedLanguage, i18n.language])

	const renderEventContent = useCallback(
		eventInfo => {
			const p = eventInfo.event.extendedProps || {}
			const statusKey = p.taskStatus || 'todo'
			const priorityKey = p.taskPriority || 'medium'
			const statusLabel = t(`boards.status.${statusKey}`)
			const priorityLabel = t(`boards.priority.${priorityKey}`)
			const meta = `${t('boards.status')}: ${statusLabel} · ${t('boards.priority')}: ${priorityLabel}`
			const timePrefix = p.displayTime ? `${p.displayTime} · ` : ''
			const fullTitle = `${timePrefix}${eventInfo.event.title} — ${meta}`
			return (
				<div className="tasks-board-calendar-event-inner" title={fullTitle}>
					{p.displayTime && (
						<div className="tasks-board-calendar-event-time">{p.displayTime}</div>
					)}
					<div className="tasks-board-calendar-event-title">{eventInfo.event.title}</div>
					<div className="tasks-board-calendar-event-meta">{meta}</div>
				</div>
			)
		},
		[t],
	)

	const heading =
		title ||
		(boardId
			? t('boards.calendarBoardTitle') || 'Kalendarz zadań (ta tablica)'
			: t('boards.calendarAllBoardsTitle') || 'Kalendarz moich zadań (wszystkie tablice)')

	const locale = i18n.language?.startsWith('pl') ? plLocale : undefined

	return (
		<div
			className="tasks-board-calendar-wrap notranslate"
			style={{
				marginTop: '32px',
				backgroundColor: '#fff',
				borderRadius: '12px',
				boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
				<h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px', fontWeight: 600 }}>{heading}</h3>
				<button
					type="button"
					onClick={() => setQuickOpen(true)}
					disabled={!boardId && (!boards || boards.length === 0)}
					style={{
						padding: '10px 18px',
						backgroundColor: '#27ae60',
						color: '#fff',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						fontWeight: 500,
					}}
				>
					+ {t('boards.quickCalendarTask') || 'Szybkie zadanie'}
				</button>
			</div>
			<p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: 0, marginBottom: '16px' }}>
				{t('boards.calendarHint') || 'Kliknij zadanie, aby przejść do tablicy.'}
			</p>

			<div
				className="calendar-controls flex flex-wrap items-center"
				style={{
					marginBottom: '16px',
					gap: '8px',
					alignItems: 'center',
					flexWrap: 'wrap',
				}}
			>
				<label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
					<span className="sr-only">{t('workcalendar.monthlabel')}</span>
					<select
						value={currentMonth}
						onChange={handleMonthSelect}
						style={selectStyle}
						className="calendar-month-select focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label={t('workcalendar.monthlabel')}
					>
						{Array.from({ length: 12 }, (_, i) => {
							const monthName = new Date(0, i).toLocaleString(i18n.resolvedLanguage, { month: 'long' })
							const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)
							return (
								<option key={i} value={i}>
									{capitalized}
								</option>
							)
						})}
					</select>
				</label>
				<label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
					<span className="sr-only">{t('workcalendar.yearlabel')}</span>
					<select
						value={currentYear}
						onChange={handleYearSelect}
						style={selectStyle}
						className="focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label={t('workcalendar.yearlabel')}
					>
						{Array.from({ length: 20 }, (_, i) => {
							const year = new Date().getFullYear() - 10 + i
							return (
								<option key={year} value={year}>
									{year}
								</option>
							)
						})}
					</select>
				</label>
				<button
					type="button"
					onClick={handlePrevMonth}
					style={btnArrowStyle}
					onMouseOver={(e) => {
						e.target.style.backgroundColor = '#f8f9fa'
						e.target.style.borderColor = '#adb5bd'
					}}
					onMouseOut={(e) => {
						e.target.style.backgroundColor = 'white'
						e.target.style.borderColor = '#bdc3c7'
					}}
					aria-label={t('boards.calendarPrevMonth') || 'Poprzedni miesiąc'}
				>
					&lt;
				</button>
				<button
					type="button"
					onClick={handleNextMonth}
					style={btnArrowStyle}
					onMouseOver={(e) => {
						e.target.style.backgroundColor = '#f8f9fa'
						e.target.style.borderColor = '#adb5bd'
					}}
					onMouseOut={(e) => {
						e.target.style.backgroundColor = 'white'
						e.target.style.borderColor = '#bdc3c7'
					}}
					aria-label={t('boards.calendarNextMonth') || 'Następny miesiąc'}
				>
					&gt;
				</button>
			</div>

			{isLoading && (
				<p style={{ color: '#95a5a6', fontSize: '14px', marginBottom: '8px' }}>{t('boards.calendarLoading') || 'Ładowanie…'}</p>
			)}
			<div className="tasks-board-calendar-fc">
				<FullCalendar
					key={`${currentYear}-${currentMonth}`}
					ref={calendarRef}
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					initialDate={new Date(currentYear, currentMonth, 1)}
					locale={locale}
					firstDay={1}
					showNonCurrentDates={false}
					headerToolbar={false}
					height="auto"
					events={events}
					eventClick={(info) => {
						info.jsEvent.preventDefault()
						const bid = info.event.extendedProps.boardId
						const tid = info.event.id
						if (bid && tid) {
							navigate(`/boards/${bid}?task=${encodeURIComponent(tid)}`)
						}
					}}
					eventContent={renderEventContent}
					eventDisplay="block"
					eventOrder="sortMinutes"
					dayMaxEvents={4}
					moreLinkText={(n) => `+${n}`}
				/>
			</div>
			{quickOpen && (
				<QuickCalendarTaskModal
					boardId={boardId}
					boardsForPicker={!boardId ? boards : null}
					onClose={() => setQuickOpen(false)}
					onSuccess={() => setQuickOpen(false)}
				/>
			)}
			<style>{`
				.tasks-board-calendar-wrap {
					padding: 20px;
				}
				@media (max-width: 768px) {
					.tasks-board-calendar-wrap {
						padding: 10px;
					}
				}
				.tasks-board-calendar-fc .fc { font-family: inherit; }
				.tasks-board-calendar-fc .fc-scrollgrid { border-radius: 8px; overflow: hidden; }
				.tasks-board-calendar-fc .fc-daygrid-event {
					min-height: 38px;
				}
				.tasks-board-calendar-fc .fc-daygrid-event .fc-event-main {
					padding: 3px 5px 4px;
				}
				.tasks-board-calendar-event-inner {
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: 2px;
					width: 100%;
					min-width: 0;
					color: #fff;
				}
				.tasks-board-calendar-event-time {
					font-size: 10px;
					font-weight: 800;
					line-height: 1.2;
					color: rgba(255, 255, 255, 0.98) !important;
					letter-spacing: 0.02em;
				}
				.tasks-board-calendar-event-title {
					font-size: 11px;
					font-weight: 700;
					line-height: 1.25;
					color: #fff !important;
					white-space: normal;
					word-break: break-word;
					width: 100%;
				}
				.tasks-board-calendar-event-meta {
					font-size: 9px;
					font-weight: 600;
					line-height: 1.2;
					color: rgba(255, 255, 255, 0.92) !important;
					white-space: normal;
					word-break: break-word;
					width: 100%;
					opacity: 0.98;
					letter-spacing: 0.01em;
				}
				@media (min-width: 768px) {
					.tasks-board-calendar-event-time { font-size: 11px; }
					.tasks-board-calendar-event-title { font-size: 12px; }
					.tasks-board-calendar-event-meta { font-size: 10px; }
				}
			`}</style>
		</div>
	)
}

export default TasksBoardCalendar
