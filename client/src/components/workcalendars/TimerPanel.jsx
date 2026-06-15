import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useActiveTimer, useStartTimer, usePauseTimer, useStopTimer, useUpdateActiveTimer, useSplitSession, useTodaySessions } from '../../hooks/useTimer'
import { useTimerElapsed } from '../../hooks/useTimerElapsed'
import { formatTimerClock } from '../../utils/timerDisplay'
import { useUserAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { useWorkActivities } from '../../hooks/useWorkActivities'
import { teamHasWorkActivities, getEnabledWorkActivities, getWorkActivityName, findWorkActivityById } from '../../utils/workActivities'
import { buildTimerSelectValue, parseTimerSelectValue } from '../../utils/timerSessionSelect'
import { useWorkdays } from '../../hooks/useWorkdays'
import { useCalendarConfirmation } from '../../hooks/useCalendar'
import { isHolidayDate } from '../../utils/holidays'
import axios from 'axios'
import { API_URL } from '../../config'
import Modal from 'react-modal'

function TimerPanel() {
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const { userId } = useAuth()
	const { data: activeTimer, isLoading: loadingTimer } = useActiveTimer()
	const startTimer = useStartTimer()
	const pauseTimer = usePauseTimer()
	const stopTimer = useStopTimer()
	const updateTimer = useUpdateActiveTimer()
	const splitSession = useSplitSession()
	const { data: acceptedLeaveRequests = [] } = useUserAcceptedLeaveRequests(userId)
	const { data: settings } = useSettings()
	const { data: workActivities = [] } = useWorkActivities()
	const enabledWorkActivities = useMemo(
		() => getEnabledWorkActivities(workActivities),
		[workActivities]
	)
	const activitiesEnabled = teamHasWorkActivities({ workActivities })
	const { data: workdays = [] } = useWorkdays()
	
	const [workDescription, setWorkDescription] = useState('')
	const [editingDescription, setEditingDescription] = useState('')
	const [editingTaskId, setEditingTaskId] = useState('')
	const [editingActivityId, setEditingActivityId] = useState('')
	const [editingWorkDescription, setEditingWorkDescription] = useState('')
	const [selectedTaskId, setSelectedTaskId] = useState('')
	const [selectedActivityId, setSelectedActivityId] = useState('')
	const [selectedWorkDescription, setSelectedWorkDescription] = useState('')
	const [isOvertime, setIsOvertime] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [allTasks, setAllTasks] = useState([])
	const [loadingTasks, setLoadingTasks] = useState(false)
	const [infoModalIsOpen, setInfoModalIsOpen] = useState(false)
	const [isSplitting, setIsSplitting] = useState(false)
	const [newSessionDescription, setNewSessionDescription] = useState('')
	const [newSessionTaskId, setNewSessionTaskId] = useState('')
	const [newSessionActivityId, setNewSessionActivityId] = useState('')
	const [newSessionWorkDescription, setNewSessionWorkDescription] = useState('')
	const [closingSessionQuantity, setClosingSessionQuantity] = useState('')
	const timerMetrics = useTimerElapsed(activeTimer)
	const elapsedTime = timerMetrics?.elapsedSeconds ?? 0
	const totalBreakTime = timerMetrics?.totalBreakTime ?? 0
	const totalOvertimeTime = timerMetrics?.totalOvertimeTime ?? 0
	/** Ms of first start in this run (until Stop). Unchanged on „Zapisz sesję i kontynuuj”; cleared when timer stops. */
	const [continuousRunStartMs, setContinuousRunStartMs] = useState(null)
	/** True after at least one „Zapisz sesję i kontynuuj” w tym ciągu — wtedy pokazujemy łączny czas. */
	const [hasSplitSessionInRun, setHasSplitSessionInRun] = useState(false)

	// Get current month and year
	const currentDate = new Date()
	const currentMonth = currentDate.getMonth()
	const currentYear = currentDate.getFullYear()
	const activeTimerDate = activeTimer?.startTime ? new Date(activeTimer.startTime) : currentDate
	const activeTimerMonth = Number.isNaN(activeTimerDate.getTime()) ? currentMonth : activeTimerDate.getMonth()
	const activeTimerYear = Number.isNaN(activeTimerDate.getTime()) ? currentYear : activeTimerDate.getFullYear()
	const { data: isTimerMonthConfirmed = false } = useCalendarConfirmation(activeTimerMonth, activeTimerYear)
	const timerMonthLocked = !!isTimerMonthConfirmed
	const timerMonthConfirmedBase = i18n.resolvedLanguage === 'pl'
		? 'Miesiąc jest potwierdzony.'
		: 'This month is confirmed.'
	const getTimerMonthLockedMessage = (action) => {
		if (i18n.resolvedLanguage !== 'pl') {
			const actions = {
				start: 'start the time counter',
				stop: 'stop and save the time counter',
				pause: 'pause or resume the time counter',
				edit: 'edit the active time counter entry',
				split: 'save this session and continue',
			}
			return `${timerMonthConfirmedBase} Revert confirmation to ${actions[action] || 'change time counter entries'}.`
		}

		const actions = {
			start: 'uruchomić licznik czasu',
			stop: 'zatrzymać i zapisać licznik czasu',
			pause: 'wstrzymać lub wznowić licznik czasu',
			edit: 'edytować aktywny wpis licznika czasu',
			split: 'zapisać sesję i kontynuować pracę',
		}
		return `${timerMonthConfirmedBase} Cofnij potwierdzenie, aby ${actions[action] || 'zmieniać wpisy z licznika czasu'}.`
	}

	// Fetch sessions from current month to get unique work descriptions
	const { data: sessionsData } = useTodaySessions(currentMonth, currentYear)

	// Fetch tasks assigned to user from all accessible boards
	useEffect(() => {
		if (!userId) {
			setAllTasks([])
			return
		}

		const fetchTasks = async () => {
			setLoadingTasks(true)
			try {
				const response = await axios.get(`${API_URL}/api/users/my-tasks`, {
					withCredentials: true
				})
				
				setAllTasks(response.data || [])
			} catch (error) {
				console.error('Error fetching user tasks:', error)
				setAllTasks([])
			} finally {
				setLoadingTasks(false)
			}
		}

		fetchTasks()
	}, [userId])

	// Extract unique work descriptions from current month
	const workDescriptions = useMemo(() => {
		if (!sessionsData?.grouped) return []
		
		const descriptions = new Set()
		sessionsData.grouped.forEach(group => {
			if (group.workDescription && group.workDescription.trim()) {
				descriptions.add(group.workDescription.trim())
			}
			// Also check individual sessions
			group.sessions?.forEach(session => {
				if (session.workDescription && session.workDescription.trim()) {
					descriptions.add(session.workDescription.trim())
				}
			})
		})
		
		return Array.from(descriptions).sort()
	}, [sessionsData])

	const applyParsedSessionSelection = (parsed, setters) => {
		setters.setTaskId(parsed.taskId || '')
		setters.setActivityId(parsed.activityId || '')
		if (parsed.activityId || parsed.taskId) {
			setters.setWorkDescriptionKey('')
		} else {
			setters.setWorkDescriptionKey(parsed.workDescription || '')
		}
		setters.setDescription(parsed.workDescription || '')
	}

	const renderSessionSelect = (valueParts, setters) => (
		<select
			value={buildTimerSelectValue(valueParts)}
			onChange={(e) => applyParsedSessionSelection(
				parseTimerSelectValue(e.target.value, {
					allTasks,
					workActivities: enabledWorkActivities,
					locale: i18n.language,
				}),
				setters
			)}
			style={{
				width: '100%',
				padding: '10px 15px',
				border: '1px solid #ddd',
				borderRadius: '6px',
				fontSize: '14px',
				marginBottom: '10px',
				...(setters.style || {}),
			}}
		>
			<option value="">{t('timer.noTask') || '-- Brak wyboru --'}</option>
			{activitiesEnabled && enabledWorkActivities.length > 0 && (
				<optgroup label={t('timer.activitiesGroup') || 'Czynności'}>
					{enabledWorkActivities.map(activity => (
						<option key={`activity_${activity.id}`} value={`activity_${activity.id}`}>
							{getWorkActivityName(activity, i18n.language)}
						</option>
					))}
				</optgroup>
			)}
			{allTasks.length > 0 && (
				<optgroup label={t('timer.tasksGroup') || 'Zadania z tablic'}>
					{allTasks.map(task => (
						<option key={`task_${task._id}`} value={`task_${task._id}`}>
							{task.title}
						</option>
					))}
				</optgroup>
			)}
			{workDescriptions.length > 0 && (
				<optgroup label={t('timer.workDescriptionsGroup') || 'Opisy pracy z tego miesiąca'}>
					{workDescriptions.map((desc, idx) => (
						<option key={`work_${idx}`} value={`work_${desc}`}>
							{desc}
						</option>
					))}
				</optgroup>
			)}
		</select>
	)

	const activeActivityLabel = useMemo(() => {
		if (!activeTimer?.activityId) return ''
		const activity = enabledWorkActivities.find(item => item.id === activeTimer.activityId)
		return getWorkActivityName(activity, i18n.language)
	}, [activeTimer?.activityId, enabledWorkActivities, i18n.language])

	const activeMeasuredActivity = useMemo(() => {
		const activity = findWorkActivityById(enabledWorkActivities, activeTimer?.activityId)
		return activity?.trackQuantity ? activity : null
	}, [enabledWorkActivities, activeTimer?.activityId])

	const validateClosingQuantity = async () => {
		if (!activeMeasuredActivity || closingSessionQuantity === '') return true
		const quantity = Number(closingSessionQuantity)
		if (!Number.isFinite(quantity) || quantity < 0) {
			await showAlert(t('workcalendar.activities.errors.invalidQuantity', { row: 1 }))
			return false
		}
		return true
	}

	const closingQuantityPayload = () => (
		activeMeasuredActivity && closingSessionQuantity !== ''
			? Number(closingSessionQuantity)
			: null
	)

	const renderClosingQuantityField = () => {
		if (!activeMeasuredActivity || activeTimer?.qrCodeId) return null
		return (
			<div className="timer-quantity-card">
				<label>
					<span>{t('workcalendar.activities.quantityLabel')} ({activeMeasuredActivity.unit})</span>
					<input
						type="number"
						min="0"
						step="0.01"
						value={closingSessionQuantity}
						onChange={(event) => setClosingSessionQuantity(event.target.value)}
						placeholder="0"
					/>
				</label>
				<small>{t('timer.quantityHint') || 'Uzupełnij po zakończeniu tej sesji, jeśli chcesz liczyć wydajność.'}</small>
			</div>
		)
	}

	// Anchor for total wall time since first Start in this run (split does not reset startTime anchor)
	useEffect(() => {
		if (activeTimer?.active && activeTimer.startTime) {
			setContinuousRunStartMs(prev => {
				if (prev != null) return prev
				return new Date(activeTimer.startTime).getTime()
			})
		} else {
			setContinuousRunStartMs(null)
			setHasSplitSessionInRun(false)
		}
	}, [activeTimer?.active, activeTimer?.startTime])

	// Sync editing description with active timer
	useEffect(() => {
		if (activeTimer?.active && activeTimer.workDescription) {
			setEditingDescription(activeTimer.workDescription)
		} else {
			setEditingDescription('')
		}
	}, [activeTimer])

	useEffect(() => {
		setClosingSessionQuantity('')
	}, [activeTimer?.activityId, activeTimer?.startTime])

	const formatTime = formatTimerClock

	// Helper function to normalize date to YYYY-MM-DD format without timezone issues
	const normalizeDate = (dateInput) => {
		if (!dateInput) return null
		// If it's already a string in YYYY-MM-DD format, return it
		if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
			return dateInput
		}
		// Otherwise, parse it and extract date components
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return null
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Check if timer can be started today
	const canStartToday = useMemo(() => {
		if (timerMonthLocked) {
			return { canStart: false, reason: getTimerMonthLockedMessage('start') }
		}

		if (!settings) return { canStart: true } // If settings not loaded, allow (backend will check)

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// No limit on timer sessions - timer hours will be added to existing hoursWorked

		// Check if it's a weekend and team doesn't work on weekends
		const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
		const dayOfWeek = today.getDay()
		const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6 // 0 = niedziela, 6 = sobota

		if (!workOnWeekends && isWeekendDay) {
			return { canStart: false, reason: t('timer.weekendBlocked') || 'Nie można uruchomić licznika czasu pracy w weekend (zespół nie pracuje w weekendy)' }
		}

		// Check if it's a holiday
		const holidayInfo = isHolidayDate(today, settings)
		if (holidayInfo) {
			const holidayName = holidayInfo.name || 'Święto'
			return { canStart: false, reason: t('timer.holidayBlocked', { holiday: holidayName }) || `Nie można uruchomić licznika czasu pracy w święto: ${holidayName}` }
		}

		// Check if user has accepted leave request for today
		if (Array.isArray(acceptedLeaveRequests)) {
			for (const request of acceptedLeaveRequests) {
				if (request.startDate && request.endDate) {
					const startDate = new Date(request.startDate)
					startDate.setHours(0, 0, 0, 0)
					const endDate = new Date(request.endDate)
					endDate.setHours(23, 59, 59, 999)

					if (today >= startDate && today <= endDate) {
						return { canStart: false, reason: t('timer.leaveBlocked') || 'Nie można uruchomić licznika czasu pracy w dniu z zaakceptowanym wnioskiem urlopowym/nieobecnością' }
					}
				}
			}
		}

		return { canStart: true }
	}, [timerMonthLocked, timerMonthConfirmedBase, i18n.resolvedLanguage, settings, acceptedLeaveRequests, workdays, t])

	const handleStart = async () => {
		// Check frontend validation first
		if (!canStartToday.canStart) {
			await showAlert(canStartToday.reason)
			return
		}

		try {
			await startTimer.mutateAsync({
				workDescription: workDescription.trim() || '',
				taskId: selectedTaskId || null,
				activityId: selectedActivityId || null,
				isOvertime
			})
			// Clear selections after starting
			setSelectedTaskId('')
			setSelectedActivityId('')
			setSelectedWorkDescription('')
			await showAlert(t('timer.started') || 'Miłej pracy!')
		} catch (error) {
			console.error('Error starting timer:', error)
			await showAlert(error.response?.data?.message || t('timer.startError') || 'Błąd podczas uruchamiania licznika czasu pracy')
		}
	}

	const handlePause = async () => {
		if (timerMonthLocked) {
			await showAlert(getTimerMonthLockedMessage('pause'))
			return
		}

		try {
			await pauseTimer.mutateAsync()
		} catch (error) {
			console.error('Error pausing timer:', error)
			await showAlert(error.response?.data?.message || t('timer.pauseError') || 'Błąd podczas pauzowania licznika czasu pracy')
		}
	}

	const handleStop = async () => {
		if (timerMonthLocked) {
			await showAlert(getTimerMonthLockedMessage('stop'))
			return
		}

		try {
			if (!(await validateClosingQuantity())) return
			await stopTimer.mutateAsync({ quantity: closingQuantityPayload() })
			setWorkDescription('')
			setEditingDescription('')
			setSelectedTaskId('')
			setSelectedActivityId('')
			setClosingSessionQuantity('')
			setIsOvertime(false)
			setIsEditing(false)
			await showAlert(t('timer.stopped') || 'Koniec pracy!')
			
			// Scroll to work sessions section after stopping timer
			setTimeout(() => {
				const sessionsHeader = document.getElementById('work-sessions-header')
				if (sessionsHeader) {
					sessionsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' })
				}
			}, 100)
		} catch (error) {
			console.error('Error stopping timer:', error)
			await showAlert(error.response?.data?.message || t('timer.stopError') || 'Błąd podczas zatrzymywania licznika czasu pracy')
		}
	}

	const handleUpdateDescription = async () => {
		if (timerMonthLocked) {
			await showAlert(getTimerMonthLockedMessage('edit'))
			return
		}

		try {
			await updateTimer.mutateAsync({
				workDescription: editingDescription.trim() || '',
				taskId: editingTaskId || null,
				activityId: editingActivityId || null,
			})
			setIsEditing(false)
			await showAlert(t('timer.updated') || 'Opis zaktualizowany')
		} catch (error) {
			console.error('Error updating timer:', error)
			await showAlert(error.response?.data?.message || t('timer.updateError') || 'Błąd podczas aktualizacji opisu')
		}
	}

	if (loadingTimer) {
		return (
			<div style={{
				backgroundColor: 'white',
				borderRadius: '12px',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				padding: '20px',
				marginBottom: '40px'
			}}>
				<p>{t('timer.loading') || 'Ładowanie...'}</p>
			</div>
		)
	}

	const isActive = activeTimer?.active && activeTimer.startTime
	const isBreak = activeTimer?.isBreak
	const isFromQR = activeTimer?.qrCodeId ? true : false

	const cumulativeRunElapsedSeconds =
		continuousRunStartMs != null ? Math.max(0, (Date.now() - continuousRunStartMs) / 1000) : 0

	return (
		<div style={{
			backgroundColor: 'white',
			borderRadius: '12px',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
			padding: '20px',
			marginBottom: '40px'
		}}>
			<h3 style={{
				color: '#2c3e50',
				marginBottom: '20px',
				fontSize: '20px',
				fontWeight: '600',
				display: 'flex',
				alignItems: 'center',
				gap: '10px',
				flexWrap: 'wrap'
			}}>
				<img src="/img/timer.png" alt="timer" style={{ width: '24px', height: '24px' }} />
				<span>{t('timer.title') || 'Licznik czasu pracy'}</span>
				<button
					onClick={() => setInfoModalIsOpen(true)}
					style={{
						background: 'transparent',
						border: 'none',
						cursor: 'pointer',
						padding: '4px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginLeft: '8px'
					}}
					title={t('timer.infoModal.title') || 'Informacje o liczniku czasu pracy'}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#3b82f6"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						style={{ cursor: 'pointer' }}>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="16" x2="12" y2="12"></line>
						<line x1="12" y1="8" x2="12.01" y2="8"></line>
					</svg>
				</button>
				<span style={{
					fontSize: '14px',
					fontWeight: '400',
					color: '#7f8c8d',
					marginLeft: 'auto'
				}}>
					{new Date().toLocaleDateString('pl-PL', {
						day: '2-digit',
						month: '2-digit'
					})}
				</span>
			</h3>

			{timerMonthLocked && (
				<div
					style={{
						marginBottom: '16px',
						padding: '10px 12px',
						borderRadius: '8px',
						border: '1px solid #fde68a',
						backgroundColor: '#fffbeb',
						color: '#92400e',
						fontSize: '14px',
						lineHeight: 1.45,
					}}
				>
					{isActive ? getTimerMonthLockedMessage('stop') : getTimerMonthLockedMessage('start')}
				</div>
			)}

			{isActive ? (
				<>
					{/* Active timer display */}
					<div style={{
						textAlign: 'center',
						marginBottom: '20px',
						padding: '20px',
						backgroundColor: isBreak ? '#fff3cd' : '#d4edda',
						borderRadius: '8px',
						border: `2px solid ${isBreak ? '#ffc107' : '#28a745'}`
					}}>
						<div style={{
							fontSize: '36px',
							fontWeight: 'bold',
							color: '#2c3e50',
							marginBottom: '10px',
							fontFamily: 'monospace'
						}}>
							{formatTime(elapsedTime)}
						</div>
						<div style={{
							fontSize: '14px',
							color: '#7f8c8d',
							marginBottom: '8px'
						}}>
							{isBreak 
								? (t('timer.onBreak') || 'Przerwa')
								: (activeTimer.isOvertime 
									? (t('timer.overtime') || 'Nadgodziny')
									: (t('timer.working') || 'Praca')
								)
							}
						</div>
						{!isEditing && (activeActivityLabel || activeTimer.workDescription) && (
							<div style={{
								marginTop: '10px',
								fontSize: '14px',
								color: '#495057',
								fontStyle: 'italic'
							}}>
								{activeActivityLabel || activeTimer.workDescription}
							</div>
						)}
						{(totalBreakTime > 0 || (activeTimer.isOvertime && totalOvertimeTime > 0)) && (
							<div
								style={{
									marginTop: '10px',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								{totalBreakTime > 0 && (
									<div style={{
										padding: '6px 12px',
										backgroundColor: 'rgba(255, 193, 7, 0.15)',
										borderRadius: '6px',
										display: 'inline-block',
										fontSize: '12px',
										color: '#856404',
										fontWeight: '500'
									}}>
										<span style={{ marginRight: '4px' }}>⏸️</span>
										{t('timer.totalBreakTime') || 'Łączny czas przerwy'}: <strong>{formatTime(totalBreakTime)}</strong>
									</div>
								)}
								{activeTimer.isOvertime && totalOvertimeTime > 0 && (
									<div style={{
										padding: '6px 12px',
										backgroundColor: 'rgba(231, 76, 60, 0.15)',
										borderRadius: '6px',
										display: 'inline-block',
										fontSize: '12px',
										color: '#c0392b',
										fontWeight: '500'
									}}>
										<span style={{ marginRight: '4px' }}>⏰</span>
										{t('timer.totalOvertimeTime') || 'Łączny czas nadgodzin'}: <strong>{formatTime(totalOvertimeTime)}</strong>
									</div>
								)}
							</div>
						)}
						{activeTimer.qrCodeId && (
							<div style={{
								marginTop: '8px',
								fontSize: '12px',
								color: '#6c757d',
								fontStyle: 'italic'
							}}>
								{t('timer.fromQR') || 'Z kodu QR'}
							</div>
						)}
						{continuousRunStartMs != null && hasSplitSessionInRun && (
							<div
								style={{
									fontSize: '12px',
									fontWeight: '500',
									color: '#6c757d',
									marginTop: '12px',
									paddingTop: '10px',
									borderTop: '1px solid rgba(0, 0, 0, 0.06)',
									fontFamily: 'monospace',
									letterSpacing: '0.02em',
								}}
							>
								{t('timer.cumulativeRunTimeLabel') || 'Łącznie od uruchomienia licznika'}:{' '}
								<span style={{ color: '#495057' }}>{formatTime(cumulativeRunElapsedSeconds)}</span>
							</div>
						)}
					</div>

					{/* Edit description form (if timer is active) */}
					{isEditing ? (
						<div style={{ marginBottom: '15px' }}>
							<label style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '500',
								color: '#2c3e50'
							}}>
								{t('timer.editDescription') || 'Edytuj opis pracy'}
							</label>
							<input
								type="text"
								value={editingDescription}
								onChange={(e) => setEditingDescription(e.target.value)}
								placeholder={t('timer.workDescriptionPlaceholder') || 'Opis pracy...'}
								style={{
									width: '100%',
									padding: '10px 15px',
									border: '1px solid #ddd',
									borderRadius: '6px',
									fontSize: '14px',
									marginBottom: '10px'
								}}
							/>
							{renderSessionSelect(
								{ activityId: editingActivityId, taskId: editingTaskId, workDescription: editingWorkDescription },
								{
									setTaskId: setEditingTaskId,
									setActivityId: setEditingActivityId,
									setWorkDescriptionKey: setEditingWorkDescription,
									setDescription: setEditingDescription,
								}
							)}
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
									onClick={handleUpdateDescription}
									disabled={updateTimer.isPending || timerMonthLocked}
									style={{
										flex: 1,
										backgroundColor: '#27ae60',
										color: 'white',
										border: 'none',
										padding: '10px 20px',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '500',
										cursor: (updateTimer.isPending || timerMonthLocked) ? 'not-allowed' : 'pointer',
										opacity: (updateTimer.isPending || timerMonthLocked) ? 0.6 : 1
									}}
								>
									{t('timer.save') || 'Zapisz'}
								</button>
								<button
									onClick={() => {
										setIsEditing(false)
										setEditingDescription(activeTimer.workDescription || '')
										setEditingTaskId('')
										setEditingActivityId('')
										setEditingWorkDescription('')
									}}
									style={{
										flex: 1,
										backgroundColor: '#95a5a6',
										color: 'white',
										border: 'none',
										padding: '10px 20px',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '500',
										cursor: 'pointer'
									}}
								>
									{t('timer.cancel') || 'Anuluj'}
								</button>
							</div>
						</div>
					) : (
						<>
							<button
								onClick={() => {
									setIsEditing(true)
									setEditingDescription(activeTimer.workDescription || '')
									setEditingTaskId(activeTimer.taskId || '')
									setEditingActivityId(activeTimer.activityId || '')
									setEditingWorkDescription('')
								}}
								style={{
									width: '100%',
									backgroundColor: '#00a846',
									color: 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '500',
									cursor: 'pointer',
									marginBottom: '15px'
								}}
							>
								{t('timer.editDescription') || 'Edytuj opis pracy'}
							</button>
							{isSplitting ? (
								<div style={{ marginBottom: '15px' }}>
									<label style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '500',
										color: '#2c3e50'
									}}>
										{t('timer.newSessionDescription') || 'Nowy opis pracy (opcjonalnie)'}
									</label>
									<input
										type="text"
										value={newSessionDescription}
										onChange={(e) => setNewSessionDescription(e.target.value)}
										placeholder={t('timer.workDescriptionPlaceholder') || 'Opis pracy...'}
										style={{
											width: '100%',
											padding: '10px 15px',
											border: '1px solid #ddd',
											borderRadius: '6px',
											fontSize: '14px',
											marginBottom: '10px'
										}}
									/>
									{renderSessionSelect(
										{ activityId: newSessionActivityId, taskId: newSessionTaskId, workDescription: newSessionWorkDescription },
										{
											setTaskId: setNewSessionTaskId,
											setActivityId: setNewSessionActivityId,
											setWorkDescriptionKey: setNewSessionWorkDescription,
											setDescription: setNewSessionDescription,
										}
									)}
									{renderClosingQuantityField()}
									<div style={{ display: 'flex', gap: '10px' }}>
										<button
											onClick={async () => {
												if (timerMonthLocked) {
													await showAlert(getTimerMonthLockedMessage('split'))
													return
												}

												try {
													if (!(await validateClosingQuantity())) return
													await splitSession.mutateAsync({
														workDescription: newSessionDescription.trim() || '',
														taskId: newSessionTaskId || null,
														activityId: newSessionActivityId || null,
														isOvertime: activeTimer.isOvertime,
														quantity: closingQuantityPayload(),
													})
													setHasSplitSessionInRun(true)
													setIsSplitting(false)
													setNewSessionDescription('')
													setNewSessionTaskId('')
													setNewSessionActivityId('')
													setNewSessionWorkDescription('')
													setClosingSessionQuantity('')
													await showAlert(t('timer.sessionSaved') || 'Sesja zapisana, kontynuacja z nowym opisem')
												} catch (error) {
													console.error('Error splitting session:', error)
													await showAlert(error.response?.data?.message || t('timer.splitError') || 'Błąd podczas zapisywania sesji')
												}
											}}
											disabled={splitSession.isPending || timerMonthLocked}
											style={{
												flex: 1,
												backgroundColor: '#9b59b6',
												color: 'white',
												border: 'none',
												padding: '10px 20px',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: '500',
												cursor: (splitSession.isPending || timerMonthLocked) ? 'not-allowed' : 'pointer',
												opacity: (splitSession.isPending || timerMonthLocked) ? 0.6 : 1
											}}
										>
											{splitSession.isPending ? (t('timer.saving') || 'Zapisywanie...') : (t('timer.saveAndContinue') || 'Zapisz sesję i kontynuuj')}
										</button>
										<button
											onClick={() => {
												setIsSplitting(false)
												setNewSessionDescription('')
												setNewSessionTaskId('')
												setNewSessionActivityId('')
												setNewSessionWorkDescription('')
											}}
											style={{
												flex: 1,
												backgroundColor: '#95a5a6',
												color: 'white',
												border: 'none',
												padding: '10px 20px',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: '500',
												cursor: 'pointer'
											}}
										>
											{t('timer.cancel') || 'Anuluj'}
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => setIsSplitting(true)}
									style={{
										width: '100%',
										backgroundColor: '#9b59b6',
										color: 'white',
										border: 'none',
										padding: '10px 20px',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '500',
										cursor: 'pointer',
										marginBottom: '15px'
									}}
								>
									{t('timer.saveAndContinue') || 'Zapisz sesję i kontynuuj'}
								</button>
							)}
						</>
					)}

					{/* Overtime toggle (if timer is active) */}
					<div style={{ marginBottom: '15px' }}>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							cursor: 'pointer',
							fontSize: '14px',
							color: '#2c3e50',
							padding: '10px',
							backgroundColor: activeTimer.isOvertime ? '#fff3cd' : '#f8f9fa',
							borderRadius: '6px',
							border: `1px solid ${activeTimer.isOvertime ? '#ffc107' : '#ddd'}`,
							transition: 'all 0.2s'
						}}>
							<input
								type="checkbox"
								checked={activeTimer.isOvertime || false}
								onChange={async (e) => {
									try {
										await updateTimer.mutateAsync({
											isOvertime: e.target.checked
										})
									} catch (error) {
										console.error('Error updating overtime:', error)
										await showAlert(error.response?.data?.message || t('timer.updateError') || 'Błąd podczas aktualizacji')
									}
								}}
								disabled={updateTimer.isPending || timerMonthLocked}
								style={{
									width: '18px',
									height: '18px',
									cursor: (updateTimer.isPending || timerMonthLocked) ? 'not-allowed' : 'pointer',
									opacity: (updateTimer.isPending || timerMonthLocked) ? 0.6 : 1
								}}
							/>
							<span style={{ fontWeight: '500' }}>
								{t('timer.overtimeMode') || 'Tryb nadgodzin'}
							</span>
						</label>
					</div>

					{!isSplitting && renderClosingQuantityField()}

					{/* Control buttons */}
					<div style={{
						display: 'flex',
						gap: '10px',
						flexWrap: 'wrap'
					}}>
						<button
							onClick={handlePause}
							disabled={pauseTimer.isPending || timerMonthLocked}
							title={timerMonthLocked ? getTimerMonthLockedMessage('pause') : ''}
							style={{
								flex: 1,
								minWidth: '120px',
								backgroundColor: isBreak ? '#ffc107' : '#ffc107',
								color: '#2c3e50',
								border: 'none',
								padding: '12px 20px',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: (pauseTimer.isPending || timerMonthLocked) ? 'not-allowed' : 'pointer',
								opacity: (pauseTimer.isPending || timerMonthLocked) ? 0.6 : 1
							}}
						>
							{isBreak ? (t('timer.resume') || 'Wznów') : (t('timer.pause') || 'Przerwa')}
						</button>
						<button
							onClick={handleStop}
							disabled={stopTimer.isPending || isFromQR || timerMonthLocked}
							style={{
								flex: 1,
								minWidth: '120px',
								backgroundColor: isFromQR ? '#95a5a6' : '#e74c3c',
								color: 'white',
								border: 'none',
								padding: '12px 20px',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: (stopTimer.isPending || isFromQR || timerMonthLocked) ? 'not-allowed' : 'pointer',
								opacity: (stopTimer.isPending || isFromQR || timerMonthLocked) ? 0.6 : 1
							}}
							title={timerMonthLocked ? getTimerMonthLockedMessage('stop') : (isFromQR ? (t('timer.stopQROnly') || 'Licznik czasu pracy uruchomiony przez kod QR może być zatrzymany tylko przez ponowne zeskanowanie kodu QR') : '')}
						>
							{t('timer.stop') || 'Stop'}
						</button>
					</div>
				</>
			) : (
				<>
					{/* Start timer form */}
					<div style={{ marginBottom: '15px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#2c3e50'
						}}>
							{t('timer.workDescription') || 'Nad czym pracujesz?'} {t('timer.optional') || '(opcjonalnie)'}
						</label>
						<input
							type="text"
							value={workDescription}
							onChange={(e) => setWorkDescription(e.target.value)}
							placeholder={t('timer.workDescriptionPlaceholder') || 'Opis pracy...'}
							style={{
								width: '100%',
								padding: '10px 15px',
								border: '1px solid #ddd',
								borderRadius: '6px',
								fontSize: '14px',
								marginBottom: '10px'
							}}
						/>
					</div>

					<div style={{ marginBottom: '15px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#2c3e50'
						}}>
							{t('timer.selectTask') || 'Lub wybierz czynność, zadanie lub opis (opcjonalnie)'}
						</label>
						{renderSessionSelect(
							{ activityId: selectedActivityId, taskId: selectedTaskId, workDescription: selectedWorkDescription },
							{
								setTaskId: setSelectedTaskId,
								setActivityId: setSelectedActivityId,
								setWorkDescriptionKey: setSelectedWorkDescription,
								setDescription: setWorkDescription,
								style: { marginBottom: 0 },
							}
						)}
					</div>

					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							cursor: 'pointer',
							fontSize: '14px',
							color: '#2c3e50'
						}}>
							<input
								type="checkbox"
								checked={isOvertime}
								onChange={(e) => setIsOvertime(e.target.checked)}
								style={{
									width: '18px',
									height: '18px',
									cursor: 'pointer'
								}}
							/>
							<span>{t('timer.overtimeMode') || 'Tryb nadgodzin'}</span>
						</label>
					</div>

					<button
						onClick={handleStart}
						disabled={startTimer.isPending || timerMonthLocked}
						title={timerMonthLocked ? getTimerMonthLockedMessage('start') : ''}
						style={{
							width: '100%',
							backgroundColor: '#27ae60',
							color: 'white',
							border: 'none',
							padding: '12px 20px',
							borderRadius: '6px',
							fontSize: '16px',
							fontWeight: '500',
							cursor: (startTimer.isPending || timerMonthLocked) ? 'not-allowed' : 'pointer',
							opacity: (startTimer.isPending || timerMonthLocked) ? 0.6 : 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px'
						}}
					>
						<img src="/img/play.png" alt="play" style={{ width: '20px', height: '20px' }} />
						{startTimer.isPending ? (t('timer.starting') || 'Uruchamianie...') : (t('timer.start') || 'Start')}
					</button>
				</>
			)}

			{/* Info Modal */}
			<Modal
				isOpen={infoModalIsOpen}
				onRequestClose={() => setInfoModalIsOpen(false)}
				style={{
					overlay: {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						backdropFilter: 'blur(2px)',
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '600px',
						maxHeight: '80vh',
						width: '90%',
						borderRadius: '12px',
						padding: '30px',
						backgroundColor: 'white',
						overflow: 'auto',
					},
				}}
				contentLabel={t('timer.infoModal.title') || 'Informacje o liczniku czasu pracy'}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					<h2 style={{ 
						margin: 0,
						color: '#2c3e50',
						fontSize: '24px',
						fontWeight: '600'
					}}>
						{t('timer.infoModal.title') || 'Informacje o liczniku czasu pracy'}
					</h2>
					<button
						onClick={() => setInfoModalIsOpen(false)}
						style={{
							background: 'transparent',
							border: 'none',
							fontSize: '28px',
							cursor: 'pointer',
							color: '#7f8c8d',
							lineHeight: '1',
							padding: '0',
							width: '30px',
							height: '30px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}
						onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
						onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}>
						×
					</button>
				</div>

				<div style={{ marginBottom: '25px' }}>
					<h3 style={{
						margin: '0 0 10px 0',
						color: '#1f2937',
						fontSize: '18px',
						fontWeight: '600'
					}}>
						{t('timer.infoModal.howItWorks') || 'Jak działa licznik czasu pracy?'}
					</h3>
					<p style={{
						margin: 0,
						color: '#4b5563',
						fontSize: '15px',
						lineHeight: '1.6',
						whiteSpace: 'pre-line'
					}}>
						{t('timer.infoModal.howItWorksDesc') || 'Licznik czasu pracy pozwala na rejestrację czasu pracy. Kliknij "Start", aby rozpocząć pomiar czasu. Możesz dodać opis pracy lub wybrać zadanie z listy. Licznik czasu pracy można zatrzymać, zapauzować lub wznowić w dowolnym momencie.'}
					</p>
				</div>

				<div style={{ marginBottom: '25px' }}>
					<h3 style={{
						margin: '0 0 10px 0',
						color: '#1f2937',
						fontSize: '18px',
						fontWeight: '600'
					}}>
						{t('timer.infoModal.qrCode') || 'Kody QR - Wejście/Wyjście'}
					</h3>
					<p style={{
						margin: 0,
						color: '#4b5563',
						fontSize: '15px',
						lineHeight: '1.6'
					}}>
						{t('timer.infoModal.qrCodeDesc') || 'Możesz używać kodów QR do automatycznego rejestrowania wejścia i wyjścia. Zeskanuj kod QR, aby rozpocząć licznik czasu pracy (wejście), a następnie zeskanuj ten sam kod ponownie, aby go zatrzymać (wyjście).'}
					</p>
				</div>

				<div style={{ marginBottom: '25px' }}>
					<h3 style={{
						margin: '0 0 10px 0',
						color: '#1f2937',
						fontSize: '18px',
						fontWeight: '600'
					}}>
						{t('timer.infoModal.configuration') || 'Konfiguracja'}
					</h3>
					<p style={{
						margin: 0,
						color: '#4b5563',
						fontSize: '15px',
						lineHeight: '1.6',
						marginBottom: '15px'
					}}>
						{t('timer.infoModal.configurationDesc') || 'Administratorzy i HR mogą skonfigurować kody QR w ustawieniach zespołu (Settings).'}
					</p>
					<p style={{
						margin: 0,
						color: '#dc2626',
						fontSize: '15px',
						fontWeight: '600',
						lineHeight: '1.6',
						padding: '12px',
						backgroundColor: '#fef2f2',
						borderRadius: '6px',
						borderLeft: '4px solid #dc2626'
					}}>
						{t('timer.infoModal.canDisable') || 'Administratorzy i HR mogą wyłączyć funkcję licznika czasu pracy w ustawieniach zespołu, jeśli nie jest potrzebna.'}
					</p>
				</div>

				<div style={{
					display: 'flex',
					justifyContent: 'flex-end',
					marginTop: '30px'
				}}>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => setInfoModalIsOpen(false)}>
						{t('timer.infoModal.close') || 'Zamknij'}
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default TimerPanel
