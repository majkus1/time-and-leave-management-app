import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useActiveTimer, useStartTimer, usePauseTimer, useStopTimer, useUpdateActiveTimer, useSplitSession, useTodaySessions } from '../../hooks/useTimer'
import { useUserAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { useWorkdays } from '../../hooks/useWorkdays'
import { isHolidayDate } from '../../utils/holidays'
import axios from 'axios'
import { API_URL } from '../../config'
import Modal from 'react-modal'

function TimerPanel() {
	const { t } = useTranslation()
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
	const { data: workdays = [] } = useWorkdays()
	
	const [workDescription, setWorkDescription] = useState('')
	const [editingDescription, setEditingDescription] = useState('')
	const [editingTaskId, setEditingTaskId] = useState('')
	const [editingWorkDescription, setEditingWorkDescription] = useState('')
	const [selectedTaskId, setSelectedTaskId] = useState('')
	const [selectedWorkDescription, setSelectedWorkDescription] = useState('')
	const [isOvertime, setIsOvertime] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [elapsedTime, setElapsedTime] = useState(0)
	const [allTasks, setAllTasks] = useState([])
	const [loadingTasks, setLoadingTasks] = useState(false)
	const [infoModalIsOpen, setInfoModalIsOpen] = useState(false)
	const [isSplitting, setIsSplitting] = useState(false)
	const [newSessionDescription, setNewSessionDescription] = useState('')
	const [newSessionTaskId, setNewSessionTaskId] = useState('')
	const [newSessionWorkDescription, setNewSessionWorkDescription] = useState('')

	// Get current month and year
	const currentDate = new Date()
	const currentMonth = currentDate.getMonth()
	const currentYear = currentDate.getFullYear()

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

	// Calculate elapsed time
	useEffect(() => {
		if (!activeTimer?.active || !activeTimer.startTime) {
			setElapsedTime(0)
			return
		}

		const interval = setInterval(() => {
			if (!activeTimer.isBreak) {
				const start = new Date(activeTimer.startTime)
				const now = new Date()
				const diff = (now - start) / 1000 // seconds
				setElapsedTime(diff)
			}
		}, 1000)

		return () => clearInterval(interval)
	}, [activeTimer])

	// Sync editing description with active timer
	useEffect(() => {
		if (activeTimer?.active && activeTimer.workDescription) {
			setEditingDescription(activeTimer.workDescription)
		} else {
			setEditingDescription('')
		}
	}, [activeTimer])

	const formatTime = (seconds) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = Math.floor(seconds % 60)
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

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
		if (!settings) return { canStart: true } // If settings not loaded, allow (backend will check)

		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const todayStr = normalizeDate(today)

		// Check if there's already a workday entry with hours worked for today
		if (Array.isArray(workdays)) {
			for (const workday of workdays) {
				if (!workday.date) continue
				const workdayDateStr = normalizeDate(workday.date)
				if (workdayDateStr === todayStr && workday.hoursWorked && workday.hoursWorked > 0) {
					return { canStart: false, reason: t('timer.workdayExists') || 'Nie można uruchomić timera w dniu, w którym jest już wpisana łączna liczba godzin pracy' }
				}
			}
		}

		// Check if it's a weekend and team doesn't work on weekends
		const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
		const dayOfWeek = today.getDay()
		const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6 // 0 = niedziela, 6 = sobota

		if (!workOnWeekends && isWeekendDay) {
			return { canStart: false, reason: t('timer.weekendBlocked') || 'Nie można uruchomić timera w weekend (zespół nie pracuje w weekendy)' }
		}

		// Check if it's a holiday
		const holidayInfo = isHolidayDate(today, settings)
		if (holidayInfo) {
			const holidayName = holidayInfo.name || 'Święto'
			return { canStart: false, reason: t('timer.holidayBlocked', { holiday: holidayName }) || `Nie można uruchomić timera w święto: ${holidayName}` }
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
						return { canStart: false, reason: t('timer.leaveBlocked') || 'Nie można uruchomić timera w dniu z zaakceptowanym wnioskiem urlopowym/nieobecnością' }
					}
				}
			}
		}

		return { canStart: true }
	}, [settings, acceptedLeaveRequests, workdays, t])

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
				isOvertime
			})
			// Clear selections after starting
			setSelectedTaskId('')
			setSelectedWorkDescription('')
			await showAlert(t('timer.started') || 'Miłej pracy!')
		} catch (error) {
			console.error('Error starting timer:', error)
			await showAlert(error.response?.data?.message || t('timer.startError') || 'Błąd podczas uruchamiania timera')
		}
	}

	const handlePause = async () => {
		try {
			await pauseTimer.mutateAsync()
		} catch (error) {
			console.error('Error pausing timer:', error)
			await showAlert(error.response?.data?.message || t('timer.pauseError') || 'Błąd podczas pauzowania timera')
		}
	}

	const handleStop = async () => {
		try {
			await stopTimer.mutateAsync()
			setWorkDescription('')
			setEditingDescription('')
			setSelectedTaskId('')
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
			await showAlert(error.response?.data?.message || t('timer.stopError') || 'Błąd podczas zatrzymywania timera')
		}
	}

	const handleUpdateDescription = async () => {
		try {
			await updateTimer.mutateAsync({
				workDescription: editingDescription.trim() || '',
				taskId: selectedTaskId || null
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
						month: '2-digit',
						year: 'numeric'
					})}
				</span>
			</h3>

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
							color: '#7f8c8d'
						}}>
							{isBreak 
								? (t('timer.onBreak') || 'Przerwa')
								: (activeTimer.isOvertime 
									? (t('timer.overtime') || 'Nadgodziny')
									: (t('timer.working') || 'Praca')
								)
							}
						</div>
						{!isEditing && activeTimer.workDescription && (
							<div style={{
								marginTop: '10px',
								fontSize: '14px',
								color: '#495057',
								fontStyle: 'italic'
							}}>
								{activeTimer.workDescription}
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
							<select
								value={editingTaskId ? `task_${editingTaskId}` : (editingWorkDescription ? `work_${editingWorkDescription}` : '')}
								onChange={(e) => {
									const value = e.target.value
									
									// Check if it's a task ID (starts with task_)
									if (value.startsWith('task_')) {
										const taskId = value.replace('task_', '')
										setEditingTaskId(taskId)
										setEditingWorkDescription('')
										const task = allTasks.find(t => t._id === taskId)
										if (task) {
											setEditingDescription(task.title)
										}
									} 
									// Check if it's a work description (starts with work_)
									else if (value.startsWith('work_')) {
										const workDesc = value.replace('work_', '')
										setEditingWorkDescription(workDesc)
										setEditingTaskId('')
										setEditingDescription(workDesc)
									}
									// Empty selection
									else {
										setEditingTaskId('')
										setEditingWorkDescription('')
									}
								}}
								style={{
									width: '100%',
									padding: '10px 15px',
									border: '1px solid #ddd',
									borderRadius: '6px',
									fontSize: '14px',
									marginBottom: '10px'
								}}
							>
								<option value="">{t('timer.noTask') || '-- Brak zadania --'}</option>
								
								{/* Tasks section */}
								{allTasks.length > 0 && (
									<optgroup label={t('timer.tasksGroup') || 'Zadania z tablic'}>
										{allTasks.map(task => (
											<option key={`task_${task._id}`} value={`task_${task._id}`}>
												{task.title}
											</option>
										))}
									</optgroup>
								)}
								
								{/* Work descriptions section */}
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
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
									onClick={handleUpdateDescription}
									disabled={updateTimer.isPending}
									style={{
										flex: 1,
										backgroundColor: '#27ae60',
										color: 'white',
										border: 'none',
										padding: '10px 20px',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '500',
										cursor: updateTimer.isPending ? 'not-allowed' : 'pointer',
										opacity: updateTimer.isPending ? 0.6 : 1
									}}
								>
									{t('timer.save') || 'Zapisz'}
								</button>
								<button
									onClick={() => {
										setIsEditing(false)
										setEditingDescription(activeTimer.workDescription || '')
										setEditingTaskId('')
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
									setEditingWorkDescription('')
								}}
								style={{
									width: '100%',
									backgroundColor: '#3498db',
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
									<select
										value={newSessionTaskId ? `task_${newSessionTaskId}` : (newSessionWorkDescription ? `work_${newSessionWorkDescription}` : '')}
										onChange={(e) => {
											const value = e.target.value
											
											// Check if it's a task ID (starts with task_)
											if (value.startsWith('task_')) {
												const taskId = value.replace('task_', '')
												setNewSessionTaskId(taskId)
												setNewSessionWorkDescription('')
												const task = allTasks.find(t => t._id === taskId)
												if (task) {
													setNewSessionDescription(task.title)
												}
											} 
											// Check if it's a work description (starts with work_)
											else if (value.startsWith('work_')) {
												const workDesc = value.replace('work_', '')
												setNewSessionWorkDescription(workDesc)
												setNewSessionTaskId('')
												setNewSessionDescription(workDesc)
											}
											// Empty selection
											else {
												setNewSessionTaskId('')
												setNewSessionWorkDescription('')
											}
										}}
										style={{
											width: '100%',
											padding: '10px 15px',
											border: '1px solid #ddd',
											borderRadius: '6px',
											fontSize: '14px',
											marginBottom: '10px'
										}}
									>
										<option value="">{t('timer.noTask') || '-- Brak zadania --'}</option>
										
										{/* Tasks section */}
										{allTasks.length > 0 && (
											<optgroup label={t('timer.tasksGroup') || 'Zadania z tablic'}>
												{allTasks.map(task => (
													<option key={`task_${task._id}`} value={`task_${task._id}`}>
														{task.title}
													</option>
												))}
											</optgroup>
										)}
										
										{/* Work descriptions section */}
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
									<div style={{ display: 'flex', gap: '10px' }}>
										<button
											onClick={async () => {
												try {
													await splitSession.mutateAsync({
														workDescription: newSessionDescription.trim() || '',
														taskId: newSessionTaskId || null,
														isOvertime: activeTimer.isOvertime
													})
													setIsSplitting(false)
													setNewSessionDescription('')
													setNewSessionTaskId('')
													setNewSessionWorkDescription('')
													await showAlert(t('timer.sessionSaved') || 'Sesja zapisana, kontynuacja z nowym opisem')
												} catch (error) {
													console.error('Error splitting session:', error)
													await showAlert(error.response?.data?.message || t('timer.splitError') || 'Błąd podczas zapisywania sesji')
												}
											}}
											disabled={splitSession.isPending}
											style={{
												flex: 1,
												backgroundColor: '#9b59b6',
												color: 'white',
												border: 'none',
												padding: '10px 20px',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: '500',
												cursor: splitSession.isPending ? 'not-allowed' : 'pointer',
												opacity: splitSession.isPending ? 0.6 : 1
											}}
										>
											{splitSession.isPending ? (t('timer.saving') || 'Zapisywanie...') : (t('timer.saveAndContinue') || 'Zapisz sesję i kontynuuj')}
										</button>
										<button
											onClick={() => {
												setIsSplitting(false)
												setNewSessionDescription('')
												setNewSessionTaskId('')
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
								disabled={updateTimer.isPending}
								style={{
									width: '18px',
									height: '18px',
									cursor: updateTimer.isPending ? 'not-allowed' : 'pointer'
								}}
							/>
							<span style={{ fontWeight: '500' }}>
								{t('timer.overtimeMode') || 'Tryb nadgodzin'}
							</span>
						</label>
					</div>

					{/* Control buttons */}
					<div style={{
						display: 'flex',
						gap: '10px',
						flexWrap: 'wrap'
					}}>
						<button
							onClick={handlePause}
							disabled={pauseTimer.isPending}
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
								cursor: pauseTimer.isPending ? 'not-allowed' : 'pointer',
								opacity: pauseTimer.isPending ? 0.6 : 1
							}}
						>
							{isBreak ? (t('timer.resume') || 'Wznów') : (t('timer.pause') || 'Przerwa')}
						</button>
						<button
							onClick={handleStop}
							disabled={stopTimer.isPending || isFromQR}
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
								cursor: (stopTimer.isPending || isFromQR) ? 'not-allowed' : 'pointer',
								opacity: (stopTimer.isPending || isFromQR) ? 0.6 : 1
							}}
							title={isFromQR ? (t('timer.stopQROnly') || 'Timer uruchomiony przez kod QR może być zatrzymany tylko przez ponowne zeskanowanie kodu QR') : ''}
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
							{t('timer.selectTask') || 'Lub wybierz zadanie lub opis pracy (opcjonalnie)'}
						</label>
						<select
							value={selectedTaskId ? `task_${selectedTaskId}` : (selectedWorkDescription ? `work_${selectedWorkDescription}` : '')}
							onChange={(e) => {
								const value = e.target.value
								
								// Check if it's a task ID (starts with task_)
								if (value.startsWith('task_')) {
									const taskId = value.replace('task_', '')
									setSelectedTaskId(taskId)
									setSelectedWorkDescription('')
									const task = allTasks.find(t => t._id === taskId)
									if (task) {
										setWorkDescription(task.title)
									}
								} 
								// Check if it's a work description (starts with work_)
								else if (value.startsWith('work_')) {
									const workDesc = value.replace('work_', '')
									setSelectedWorkDescription(workDesc)
									setSelectedTaskId('')
									setWorkDescription(workDesc)
								}
								// Empty selection
								else {
									setSelectedTaskId('')
									setSelectedWorkDescription('')
									setWorkDescription('')
								}
							}}
							style={{
								width: '100%',
								padding: '10px 15px',
								border: '1px solid #ddd',
								borderRadius: '6px',
								fontSize: '14px'
							}}
						>
							<option value="">{t('timer.noTask') || '-- Brak zadania --'}</option>
							
							{/* Tasks section */}
							{allTasks.length > 0 && (
								<optgroup label={t('timer.tasksGroup') || 'Zadania z tablic'}>
									{allTasks.map(task => (
										<option key={`task_${task._id}`} value={`task_${task._id}`}>
											{task.title}
										</option>
									))}
								</optgroup>
							)}
							
							{/* Work descriptions section */}
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
						disabled={startTimer.isPending}
						style={{
							width: '100%',
							backgroundColor: '#27ae60',
							color: 'white',
							border: 'none',
							padding: '12px 20px',
							borderRadius: '6px',
							fontSize: '16px',
							fontWeight: '500',
							cursor: startTimer.isPending ? 'not-allowed' : 'pointer',
							opacity: startTimer.isPending ? 0.6 : 1,
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
						{t('timer.infoModal.howItWorks') || 'Jak działa timer?'}
					</h3>
					<p style={{
						margin: 0,
						color: '#4b5563',
						fontSize: '15px',
						lineHeight: '1.6'
					}}>
						{t('timer.infoModal.howItWorksDesc') || 'Timer pozwala na rejestrację czasu pracy. Kliknij "Start" aby rozpocząć pomiar czasu. Możesz dodać opis pracy lub wybrać zadanie z listy. Timer można zatrzymać, zapauzować lub wznowić w dowolnym momencie.'}
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
						{t('timer.infoModal.qrCodeDesc') || 'Możesz używać kodów QR do automatycznego rejestrowania wejścia i wyjścia. Zeskanuj kod QR aby rozpocząć timer (wejście), a następnie zeskanuj ten sam kod ponownie aby go zatrzymać (wyjście).'}
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
						{t('timer.infoModal.canDisable') || 'Administratorzy i HR mogą wyłączyć funkcję timera w ustawieniach zespołu, jeśli nie jest potrzebna.'}
					</p>
				</div>

				<div style={{
					display: 'flex',
					justifyContent: 'flex-end',
					marginTop: '30px'
				}}>
					<button
						onClick={() => setInfoModalIsOpen(false)}
						style={{
							padding: '10px 20px',
							fontSize: '16px',
							fontWeight: '500',
							color: 'white',
							backgroundColor: '#3b82f6',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							transition: 'background-color 0.2s'
						}}
						onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
						onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}>
						{t('timer.infoModal.close') || 'Zamknij'}
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default TimerPanel
