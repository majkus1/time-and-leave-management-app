import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from 'react-modal'
import { useSchedule, useScheduleEntries, useUpsertScheduleEntry, useDeleteScheduleEntry } from '../../hooks/useSchedule'
import { useUsers } from '../../hooks/useUsers'
import { isAdmin, isDepartmentViewer } from '../../utils/roleHelpers'

Modal.setAppElement('#root')

function Schedule() {
	const { scheduleId } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { data: schedule, isLoading: loadingSchedule } = useSchedule(scheduleId)
	const { data: allUsers = [] } = useUsers()
	
	// Filter users based on schedule type
	const users = React.useMemo(() => {
		if (!schedule || !allUsers.length) return []
		
		const scheduleTeamId = schedule.teamId?.toString()
		
		if (schedule.type === 'team') {
			// For team schedule - show only users from the same team
			return allUsers.filter(user => {
				const userTeamId = user.teamId?.toString()
				return userTeamId === scheduleTeamId
			})
		} else if (schedule.type === 'department') {
			// For department schedule - show only users from that department and same team
			return allUsers.filter(user => {
				const userTeamId = user.teamId?.toString()
				const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
				return userTeamId === scheduleTeamId && userDepartments.includes(schedule.departmentName)
			})
		}
		return []
	}, [schedule, allUsers])
	
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedEntries, setSelectedEntries] = useState([])
	const [timeFrom, setTimeFrom] = useState('08:00')
	const [timeTo, setTimeTo] = useState('16:00')
	const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
	const [selectedEmployeeName, setSelectedEmployeeName] = useState('')
	const calendarRef = useRef(null)
	const upsertEntryMutation = useUpsertScheduleEntry()
	const deleteEntryMutation = useDeleteScheduleEntry()
	
	// Color management for employees - generate stable colors based on name
	const colorsRef = useRef({})
	
	// Generate stable color based on employee name (deterministic)
	const getColorForEmployee = React.useCallback((employeeName) => {
		if (!employeeName) return '#3498db'
		if (!colorsRef.current[employeeName]) {
			// Generate stable color from string hash
			let hash = 0
			for (let i = 0; i < employeeName.length; i++) {
				hash = employeeName.charCodeAt(i) + ((hash << 5) - hash)
			}
			const hue = Math.abs(hash) % 360
			const saturation = 70
			const lightness = 50
			colorsRef.current[employeeName] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
		}
		return colorsRef.current[employeeName]
	}, [])
	
	const { data: scheduleEntries = [], isLoading: loadingEntries, refetch: refetchEntries } = useScheduleEntries(
		scheduleId,
		currentMonth,
		currentYear
	)

	// Check if user can edit
	const canEdit = React.useMemo(() => {
		if (!role || (Array.isArray(role) && role.length === 0)) return false
		const roles = Array.isArray(role) ? role : [role]
		const adminCheck = isAdmin(roles)
		const deptViewerCheck = isDepartmentViewer(roles)
		const result = adminCheck || deptViewerCheck
		return result
	}, [role])

	// Update calendar size when sidebar changes
	useEffect(() => {
		const updateCalendarSize = () => {
			if (calendarRef.current) {
				const calendarApi = calendarRef.current.getApi()
				setTimeout(() => {
					calendarApi.updateSize()
				}, 350)
			}
		}

		const observer = new MutationObserver(() => {
			updateCalendarSize()
		})

		if (document.body) {
			observer.observe(document.body, {
				attributes: true,
				attributeFilter: ['class']
			})
		}

		const handleResize = () => {
			updateCalendarSize()
		}
		window.addEventListener('resize', handleResize)
		updateCalendarSize()

		return () => {
			observer.disconnect()
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	// Update calendar date when month/year changes via select
	useEffect(() => {
		if (calendarRef.current) {
			const calendarApi = calendarRef.current.getApi()
			const currentViewDate = calendarApi.getDate()
			const viewMonth = currentViewDate.getMonth()
			const viewYear = currentViewDate.getFullYear()
			
			// Only update if the calendar view doesn't match the selected month/year
			if (viewMonth !== currentMonth || viewYear !== currentYear) {
				calendarApi.gotoDate(new Date(currentYear, currentMonth, 1))
			}
		}
	}, [currentMonth, currentYear])

	// Convert schedule entries to FullCalendar events
	const calendarEvents = React.useMemo(() => {
		if (!scheduleEntries || scheduleEntries.length === 0) return []
		return scheduleEntries.flatMap(day => {
			return day.entries.map((entry, index) => {
				const employeeColor = getColorForEmployee(entry.employeeName)
				return {
					title: `${entry.employeeName} (${entry.timeFrom} - ${entry.timeTo})`,
					start: day.date,
					allDay: true,
					backgroundColor: employeeColor,
					borderColor: employeeColor,
					textColor: '#ffffff',
					id: entry._id,
					extendedProps: {
						entryId: entry._id,
						employeeName: entry.employeeName,
						employeeId: entry.employeeId,
						timeFrom: entry.timeFrom,
						timeTo: entry.timeTo
					}
				}
			})
		})
	}, [scheduleEntries, getColorForEmployee])

	if (loadingSchedule) return <Loader />

	if (!schedule) {
		return (
			<>
				<Sidebar />
				<div style={{ padding: '15px' }}>
					<p>{t('schedule.notFound') || 'Grafik nie został znaleziony'}</p>
					<button onClick={() => navigate('/schedule')}>
						{t('schedule.backToList') || 'Wróć do listy grafików'}
					</button>
				</div>
			</>
		)
	}

	const handleDateClick = async (info) => {
		// Determine clicked date from event or date click
		const clickedDate = info.date ? info.dateStr : (info.event ? info.event.startStr : info.dateStr)
		setSelectedDate(clickedDate)
		
		// Find entries for this date
		const dayEntries = scheduleEntries.find(day => {
			const dayDate = new Date(day.date)
			return dayDate.toISOString().split('T')[0] === clickedDate
		})
		
		const entries = dayEntries ? dayEntries.entries : []
		setSelectedEntries(entries)
		setSelectedEmployeeId('')
		setSelectedEmployeeName('')
		setTimeFrom('08:00')
		setTimeTo('16:00')
		setIsModalOpen(true)
	}

	const handleMonthChange = (info) => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		// Update state only if different to avoid unnecessary re-renders
		if (newMonth !== currentMonth || newYear !== currentYear) {
			setCurrentMonth(newMonth)
			setCurrentYear(newYear)
		}
	}

	const handleMonthSelect = (event) => {
		const newMonth = parseInt(event.target.value, 10)
		if (newMonth !== currentMonth) {
			setCurrentMonth(newMonth)
		}
	}

	const handleYearSelect = (event) => {
		const newYear = parseInt(event.target.value, 10)
		if (newYear !== currentYear) {
			setCurrentYear(newYear)
		}
	}

	const goToSelectedDate = (month, year) => {
		const calendarApi = calendarRef.current.getApi()
		calendarApi.gotoDate(new Date(year, month, 1))
	}

	const handleEmployeeSelect = (event) => {
		const employeeId = event.target.value
		const selectedUser = users.find(u => u._id === employeeId)
		if (selectedUser) {
			setSelectedEmployeeId(employeeId)
			setSelectedEmployeeName(`${selectedUser.firstName} ${selectedUser.lastName}`)
		}
	}

	const handleAddEntry = async (e) => {
		e.preventDefault()

		if (!selectedEmployeeId || !selectedEmployeeName) {
			await showAlert(t('schedule.selectEmployee') || 'Wybierz pracownika')
			return
		}

		if (!timeFrom || !timeTo) {
			await showAlert(t('schedule.fillTimes') || 'Wypełnij godziny pracy')
			return
		}

		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
			await showAlert(t('schedule.invalidTimeFormat') || 'Nieprawidłowy format czasu. Użyj formatu HH:mm (np. 08:00)')
			return
		}

		try {
			await upsertEntryMutation.mutateAsync({
				scheduleId,
				data: {
					date: selectedDate,
					timeFrom,
					timeTo,
					employeeId: selectedEmployeeId,
					employeeName: selectedEmployeeName
				}
			})
			
			// Reset form
			setSelectedEmployeeId('')
			setSelectedEmployeeName('')
			setTimeFrom('08:00')
			setTimeTo('16:00')
			
			// Refetch entries to update the calendar and modal
			const { data: updatedEntries } = await refetchEntries()
			
			// Update selected entries in modal after refetch
			if (updatedEntries) {
				const dayEntries = updatedEntries.find(day => {
					const dayDate = new Date(day.date)
					return dayDate.toISOString().split('T')[0] === selectedDate
				})
				setSelectedEntries(dayEntries ? dayEntries.entries : [])
			}
			
			await showAlert(t('schedule.entryAdded') || 'Wpis został dodany pomyślnie')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.addError') || 'Błąd podczas dodawania wpisu')
		}
	}

	const handleDeleteEntry = async (entryId) => {
		const confirmed = await showConfirm(
			t('schedule.deleteConfirm') || 'Czy na pewno chcesz usunąć ten wpis?'
		)
		if (!confirmed) return

		try {
			await deleteEntryMutation.mutateAsync({
				scheduleId,
				entryId
			})
			// Refetch entries to update the calendar and modal
			await refetchEntries()
			
			// Update selected entries in modal after refetch if modal is open
			if (selectedDate) {
				const { data: updatedEntries } = await refetchEntries()
				if (updatedEntries) {
					const dayEntries = updatedEntries.find(day => {
						const dayDate = new Date(day.date)
						return dayDate.toISOString().split('T')[0] === selectedDate
					})
					setSelectedEntries(dayEntries ? dayEntries.entries : [])
				} else {
					// Fallback: remove entry from local state
					setSelectedEntries(prev => prev.filter(entry => entry._id !== entryId))
				}
			}
			
			await showAlert(t('schedule.entryDeleted') || 'Wpis został usunięty pomyślnie')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.deleteError') || 'Błąd podczas usuwania wpisu')
		}
	}

	const renderEventContent = (eventInfo) => {
		return (
			<div className="event-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
				<span style={{ flex: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>{eventInfo.event.title}</span>
				{canEdit && (
					<span 
						className="event-delete" 
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
						const entryId = eventInfo.event.extendedProps?.entryId || eventInfo.event.id
						handleDeleteEntry(entryId)
						}}
						style={{
							marginLeft: '5px',
							cursor: 'pointer',
							color: 'white',
							fontWeight: 'bold',
							fontSize: '20px',
							flexShrink: 0
						}}
					>
						×
					</span>
				)}
			</div>
		)
	}

	return (
		<>
			<Sidebar />
			<div style={{ padding: '15px', maxWidth: '100%', overflowX: 'auto' }} className='schedule-container'>
				<h2 style={{
					display: 'flex',
					alignItems: 'center',
					marginBottom: '20px',
					color: '#2c3e50',
					fontSize: '28px',
					fontWeight: '600'
				}}>
					<img src="/img/project.png" alt="Schedule icon" />
					{schedule.name}
				</h2>

				<div style={{
					display: 'flex',
					gap: '10px',
					marginBottom: '20px',
					alignItems: 'center'
				}}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						{t('schedule.month') || 'Miesiąc'}
						<select
							value={currentMonth}
							onChange={handleMonthSelect}
							style={{
								marginLeft: '5px',
								padding: '8px 12px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px'
							}}>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
										.replace(/^./, str => str.toUpperCase())}
								</option>
							))}
						</select>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						{t('schedule.year') || 'Rok'}
						<select
							value={currentYear}
							onChange={handleYearSelect}
							style={{
								marginLeft: '5px',
								padding: '8px 12px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px'
							}}>
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
				</div>

				{loadingEntries ? (
					<Loader />
				) : (
					<div style={{
						backgroundColor: 'white'
					}}>
						<FullCalendar
							plugins={[dayGridPlugin, interactionPlugin]}
							initialView="dayGridMonth"
							initialDate={new Date(currentYear, currentMonth, 1)}
							locale={i18n.resolvedLanguage}
							firstDay={1}
							showNonCurrentDates={false}
							events={calendarEvents}
							ref={calendarRef}
							dateClick={handleDateClick}
							eventClick={handleDateClick}
							displayEventTime={false}
							datesSet={handleMonthChange}
							height="auto"
							key={`${currentMonth}-${currentYear}`}
							eventContent={renderEventContent}
						/>
					</div>
				)}

				{!canEdit && (
					<div style={{
						marginTop: '20px',
						padding: '15px',
						backgroundColor: '#fff3cd',
						border: '1px solid #ffc107',
						borderRadius: '8px',
						color: '#856404'
					}}>
						{t('schedule.readOnlyMessage') || 'Masz uprawnienia tylko do przeglądania grafiku. Nie możesz dodawać ani edytować wpisów.'}
					</div>
				)}
			</div>

			<Modal
				isOpen={isModalOpen}
				onRequestClose={() => {
					setIsModalOpen(false)
					setSelectedDate(null)
					setSelectedEntries([])
				}}
				style={{
					overlay: {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						backdropFilter: 'blur(2px)'
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '600px',
						width: '90%',
						maxHeight: '80vh',
						overflowY: 'auto',
						borderRadius: '12px',
						padding: '30px',
						backgroundColor: 'white',
						boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
					}
				}}
				contentLabel={t('schedule.addEntry') || 'Dodaj wpis do grafiku'}>
				{selectedEntries.length > 0 ? (
					<div style={{ marginBottom: '30px' }}>
						<h3 style={{
							marginBottom: '15px',
							color: '#2c3e50',
							fontSize: '18px',
							fontWeight: '600'
						}}>
							{t('schedule.existingEntries') || 'Istniejące wpisy'}
						</h3>
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '10px'
						}}>
						{selectedEntries.map((entry) => {
							return (
									<div key={entry._id || Math.random()} style={{
										padding: '15px',
										backgroundColor: '#f8f9fa',
										borderRadius: '8px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										minHeight: '60px'
									}}>
										<div style={{ flex: 1 }}>
											<div style={{
												fontWeight: '600',
												color: '#2c3e50',
												marginBottom: '5px'
											}}>
												{entry.employeeName || 'Brak nazwy'}
											</div>
											<div style={{
												color: '#7f8c8d',
												fontSize: '16px'
											}}>
												{entry.timeFrom} - {entry.timeTo}
											</div>
										</div>
										{canEdit ? (
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													console.log('Delete button clicked for entry:', entry._id, 'canEdit:', canEdit)
													if (handleDeleteEntry) {
														handleDeleteEntry(entry._id)
													} else {
														console.error('handleDeleteEntry is not defined!')
													}
												}}
												style={{
													background: '#e74c3c',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													padding: '8px 16px',
													cursor: 'pointer',
													fontSize: '16px',
													fontWeight: '500',
													flexShrink: 0,
													marginLeft: '10px'
												}}
											>
												{t('schedule.delete') || 'Usuń'}
											</button>
										) : (
											<div style={{ 
												padding: '8px 16px', 
												fontSize: '12px', 
												color: '#999',
												marginLeft: '10px'
											}}>
												Brak uprawnień
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>
				) : null}

				{canEdit && (
					<form onSubmit={handleAddEntry}>
					<h3 style={{
						marginBottom: '15px',
						color: '#2c3e50',
						fontSize: '18px',
						fontWeight: '600'
					}}>
						{t('schedule.addNewEntry') || 'Dodaj nowy wpis'}
					</h3>

					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#2c3e50'
						}}>
							{t('schedule.employee') || 'Pracownik'}
						</label>
						<select
							value={selectedEmployeeId}
							onChange={handleEmployeeSelect}
							required
							style={{
								width: '100%',
								padding: '12px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px'
							}}>
							<option value="">
								{t('schedule.selectEmployee') || 'Wybierz pracownika'}
							</option>
							{users.map((user) => (
								<option key={user._id} value={user._id}>
									{user.firstName} {user.lastName}
									{user.position ? ` - ${user.position}` : ''}
								</option>
							))}
						</select>
					</div>

					<div style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '15px',
						marginBottom: '20px'
					}}>
						<div>
							<label style={{
								display: 'block',
								marginBottom: '8px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('schedule.timeFrom') || 'Od'}
							</label>
							<input
								type="text"
								value={timeFrom}
								onChange={(e) => setTimeFrom(e.target.value)}
								placeholder="08:00"
								required
								pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
						</div>
						<div>
							<label style={{
								display: 'block',
								marginBottom: '8px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('schedule.timeTo') || 'Do'}
							</label>
							<input
								type="text"
								value={timeTo}
								onChange={(e) => setTimeTo(e.target.value)}
								placeholder="16:00"
								required
								pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
						</div>
					</div>

					<div style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '10px',
						marginTop: '30px'
					}}>
						<button
							type="button"
							onClick={() => {
								setIsModalOpen(false)
								setSelectedDate(null)
								setSelectedEntries([])
							}}
							style={{
								padding: '12px 24px',
								backgroundColor: '#95a5a6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer'
							}}>
							{t('schedule.cancel') || 'Anuluj'}
						</button>
						<button
							type="submit"
							style={{
								padding: '12px 24px',
								backgroundColor: '#27ae60',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer'
							}}>
							{t('schedule.add') || 'Dodaj'}
						</button>
					</div>
				</form>
				)}
				{!canEdit && selectedEntries.length > 0 && (
					<div style={{
						marginTop: '20px',
						padding: '15px',
						backgroundColor: '#fff3cd',
						border: '1px solid #ffc107',
						borderRadius: '8px',
						color: '#856404',
						textAlign: 'center'
					}}>
						{t('schedule.readOnlyMessage') || 'Masz uprawnienia tylko do przeglądania grafiku. Nie możesz dodawać ani edytować wpisów.'}
					</div>
				)}
			</Modal>
		</>
	)
}

export default Schedule

