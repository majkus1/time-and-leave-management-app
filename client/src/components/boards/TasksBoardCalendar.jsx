import React, { useMemo, useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import plLocale from '@fullcalendar/core/locales/pl'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { addDays } from 'date-fns'
import { useCalendarTasks } from '../../hooks/useBoards'
import QuickCalendarTaskModal from './QuickCalendarTaskModal'

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
		for (const task of tasks) {
			const baseTitle = showBoardNameInTitle && task.boardName
				? `${task.boardName}: ${task.title}`
				: task.title
			const color = task.calendarOnly ? '#8e44ad' : '#2980b9'
			const textColor = '#fff'
			if (task.dueDate) {
				const start = toYMD(task.dueDate)
				if (!start) continue
				out.push({
					id: task._id,
					title: baseTitle,
					start,
					allDay: true,
					backgroundColor: color,
					borderColor: color,
					textColor,
					extendedProps: {
						boardId: String(task.boardId),
						calendarOnly: task.calendarOnly,
					},
				})
			} else if (task.workPeriodStart && task.workPeriodEnd) {
				const start = toYMD(task.workPeriodStart)
				const endInclusive = new Date(task.workPeriodEnd)
				if (!start || isNaN(endInclusive.getTime())) continue
				const endExclusive = addDays(endInclusive, 1)
				out.push({
					id: task._id,
					title: baseTitle,
					start,
					end: toYMD(endExclusive),
					allDay: true,
					backgroundColor: color,
					borderColor: color,
					textColor,
					extendedProps: {
						boardId: String(task.boardId),
						calendarOnly: task.calendarOnly,
					},
				})
			}
		}
		return out
	}, [tasks, showBoardNameInTitle])

	const heading =
		title ||
		(boardId
			? t('boards.calendarBoardTitle') || 'Kalendarz zadań (ta tablica)'
			: t('boards.calendarAllBoardsTitle') || 'Kalendarz moich zadań (wszystkie tablice)')

	const locale = i18n.language?.startsWith('pl') ? plLocale : undefined

	return (
		<div
			className="tasks-board-calendar-wrap"
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
						className="focus:outline-none focus:ring-2 focus:ring-blue-500"
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
					eventDisplay="block"
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
			`}</style>
		</div>
	)
}

export default TasksBoardCalendar
