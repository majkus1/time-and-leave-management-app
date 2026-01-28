import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTodaySessions, useDeleteSession } from '../../hooks/useTimer'
import { useAlert } from '../../context/AlertContext'
import axios from 'axios'
import { API_URL } from '../../config'
import { useQuery } from '@tanstack/react-query'

function WorkSessionList({ month, year, userId }) {
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	
	// Use different endpoint if userId is provided
	const { data: sessionsData, isLoading } = userId 
		? useQuery({
			queryKey: ['timer', 'sessions', 'user', userId, month, year],
			queryFn: async () => {
				const params = {}
				if (month !== undefined && month !== null) {
					params.month = month
				}
				if (year !== undefined && year !== null) {
					params.year = year
				}
				const response = await axios.get(`${API_URL}/api/workdays/timer/sessions/user/${userId}`, {
					params,
					withCredentials: true,
				})
				return response.data
			},
			enabled: month !== undefined && year !== undefined && userId !== undefined,
			staleTime: 30 * 1000,
		})
		: useTodaySessions(month, year)
	
	const deleteSession = useDeleteSession()
	const [selectedDate, setSelectedDate] = useState(null)

	// Extract grouped sessions and totals from response
	const groupedSessions = sessionsData?.grouped || []
	const totalMinutes = sessionsData?.totalMinutes || 0
	const dateRange = sessionsData?.dateRange

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

	// Get unique dates from all sessions for filter
	const availableDates = useMemo(() => {
		const dates = new Set()
		groupedSessions.forEach(group => {
			group.sessions.forEach(session => {
				if (session.date) {
					const dateStr = normalizeDate(session.date)
					if (dateStr) dates.add(dateStr)
				}
			})
		})
		return Array.from(dates).sort().reverse() // Most recent first
	}, [groupedSessions])

	// Filter sessions by selected date and recalculate percentages
	const filteredData = useMemo(() => {
		if (!selectedDate) {
			return {
				grouped: groupedSessions,
				totalMinutes: totalMinutes
			}
		}

		// Filter sessions by date
		const filteredGroups = groupedSessions.map(group => {
			const filteredSessions = group.sessions.filter(session => {
				if (!session.date) return false
				const sessionDateStr = normalizeDate(session.date)
				return sessionDateStr === selectedDate
			})

			if (filteredSessions.length === 0) return null

			// Recalculate total minutes for this group on selected date
			let groupMinutes = 0
			filteredSessions.forEach(session => {
				if (session.startTime && session.endTime) {
					const diff = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60)
					groupMinutes += Math.round(diff)
				}
			})

			return {
				...group,
				sessions: filteredSessions,
				totalMinutes: groupMinutes,
				totalHours: (groupMinutes / 60).toFixed(2)
			}
		}).filter(Boolean)

		// Calculate total minutes for selected date
		const dayTotalMinutes = filteredGroups.reduce((sum, group) => sum + group.totalMinutes, 0)

		// Recalculate percentages based on day total
		const groupsWithPercentages = filteredGroups.map(group => ({
			...group,
			percentage: dayTotalMinutes > 0 ? ((group.totalMinutes / dayTotalMinutes) * 100).toFixed(1) : 0
		}))

		// Sort by totalMinutes (descending)
		groupsWithPercentages.sort((a, b) => b.totalMinutes - a.totalMinutes)

		return {
			grouped: groupsWithPercentages,
			totalMinutes: dayTotalMinutes
		}
	}, [selectedDate, groupedSessions, totalMinutes])

	const formatHours = (hours) => {
		const num = parseFloat(hours)
		if (isNaN(num)) return '0:00'
		const h = Math.floor(num)
		const m = Math.round((num - h) * 60)
		return `${h}:${m.toString().padStart(2, '0')}`
	}

	const formatDate = (dateString) => {
		if (!dateString) return ''
		// If it's already in YYYY-MM-DD format, parse it directly
		if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			const [year, month, day] = dateString.split('-')
			const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
			return date.toLocaleDateString(i18n.resolvedLanguage, {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			})
		}
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return ''
		return date.toLocaleDateString(i18n.resolvedLanguage, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	const formatTime = (dateString) => {
		if (!dateString) return ''
		const date = new Date(dateString)
		// Use local time methods - MongoDB stores dates in UTC, but JavaScript Date
		// automatically converts to local timezone when creating Date object
		// This ensures we display the correct local time
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${hours}:${minutes}`
	}

	const calculateDuration = (startTime, endTime) => {
		if (!startTime || !endTime) return '0:00'
		const start = new Date(startTime)
		const end = new Date(endTime)
		const diff = (end - start) / 1000 / 60 // minutes
		const hours = Math.floor(diff / 60)
		const minutes = Math.floor(diff % 60)
		return `${hours}:${minutes.toString().padStart(2, '0')}`
	}

	const formatDateForInput = (dateString) => {
		if (!dateString) return ''
		// If it's already in YYYY-MM-DD format, return it
		if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString
		}
		return normalizeDate(dateString) || ''
	}

	if (isLoading) {
		return (
			<div style={{
				backgroundColor: 'white',
				borderRadius: '12px',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				padding: '20px',
				marginTop: '20px'
			}}>
				<p>{t('sessions.loading') || 'Ładowanie...'}</p>
			</div>
		)
	}

	if (!groupedSessions || groupedSessions.length === 0) {
		return (
			<div style={{
				backgroundColor: 'white',
				borderRadius: '12px',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				padding: '20px',
				marginTop: '20px'
			}}>
			<h3 style={{
				color: '#2c3e50',
				marginBottom: '15px',
				fontSize: '18px',
				fontWeight: '600',
				marginLeft: '5px'
			}}>
				{month !== undefined && year !== undefined 
					? (() => {
						const monthStr = new Date(year, month).toLocaleString(i18n.resolvedLanguage, { month: 'long', year: 'numeric' })
						const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
						return `${t('sessions.headerPrefix') || 'Sesje'} - ${capitalizedMonth}`
					})()
					: (t('sessions.title') || 'Dzisiejsze sesje pracy')
				}
			</h3>
				<p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
					{month !== undefined && year !== undefined
						? (() => {
							const monthStr = new Date(year, month).toLocaleString(i18n.resolvedLanguage, { month: 'long', year: 'numeric' })
							const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
							return `${t('sessions.noSessionsMonth') || 'Brak sesji pracy w'} ${capitalizedMonth}`
						})()
						: (t('sessions.noSessions') || 'Brak sesji pracy na dzisiaj')
					}
				</p>
			</div>
		)
	}

	const displayData = filteredData.grouped || []
	const displayTotalMinutes = filteredData.totalMinutes || 0

	return (
		<div style={{
			backgroundColor: 'white',
			borderRadius: '12px',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
			padding: '20px',
			marginTop: '20px'
		}}>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '20px',
				flexWrap: 'wrap',
				gap: '15px'
			}}>
				<h3 
					id="work-sessions-header"
					style={{
						color: '#2c3e50',
						margin: 0,
						fontSize: '18px',
						fontWeight: '600'
					}}>
					{month !== undefined && year !== undefined 
						? (() => {
							const monthStr = new Date(year, month).toLocaleString(i18n.resolvedLanguage, { month: 'long', year: 'numeric' })
							const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
							return `${t('sessions.headerPrefix') || 'Sesje'} - ${capitalizedMonth}`
						})()
						: (t('sessions.title') || 'Dzisiejsze sesje pracy')
					}
				</h3>
				<div style={{
					display: 'flex',
					gap: '10px',
					alignItems: 'center',
					flexWrap: 'wrap'
				}}>
					<select
						value={selectedDate || ''}
						onChange={(e) => setSelectedDate(e.target.value || null)}
						style={{
							padding: '8px 12px',
							border: '1px solid #ddd',
							borderRadius: '6px',
							fontSize: '14px',
							backgroundColor: 'white',
							cursor: 'pointer',
							minWidth: '180px'
						}}
					>
						<option value="">{t('sessions.allDays') || 'Wszystkie dni'}</option>
						{availableDates.map(date => (
							<option key={date} value={date}>
								{formatDate(date)}
							</option>
						))}
					</select>
					{selectedDate && (
						<button
							onClick={() => setSelectedDate(null)}
							style={{
								padding: '8px 12px',
								border: 'none',
								borderRadius: '6px',
								backgroundColor: '#e74c3c',
								color: 'white',
								fontSize: '14px',
								cursor: 'pointer',
								fontWeight: '500'
							}}
						>
							✕ {t('sessions.clearFilter') || 'Wyczyść'}
						</button>
					)}
				</div>
			</div>

			{selectedDate && (
				<div style={{
					marginBottom: '15px',
					padding: '10px',
					backgroundColor: '#e8f4f8',
					borderRadius: '6px',
					fontSize: '14px',
					color: '#2c3e50'
				}}>
					{t('sessions.filteredByDate') || 'Filtrowane według daty'}: <strong>{formatDate(selectedDate)}</strong>
				</div>
			)}

			<div style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '12px'
			}}>
				{displayData.map((group, index) => {
					const hasOvertime = group.sessions.some(s => s.isOvertime)
					const displayName = group.task 
						? group.task.title 
						: (group.workDescription || t('sessions.noDescription') || 'Praca')

					return (
						<div
							key={index}
							style={{
								border: '1px solid #e0e0e0',
								borderRadius: '8px',
								padding: '15px',
								backgroundColor: '#f8f9fa',
								borderLeft: `4px solid ${hasOvertime ? '#e74c3c' : '#3498db'}`,
								position: 'relative'
							}}
						>
							{/* Progress bar showing percentage */}
							<div style={{
								position: 'absolute',
								top: 0,
								left: 0,
								height: '4px',
								width: `${Math.min(parseFloat(group.percentage) || 0, 100)}%`,
								backgroundColor: hasOvertime ? '#e74c3c' : '#3498db',
								borderRadius: '8px 0 0 0'
							}} />

							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: '8px',
								flexWrap: 'wrap',
								gap: '10px'
							}}>
								<div style={{ flex: 1, minWidth: '200px' }}>
									<div style={{
										fontWeight: '600',
										color: '#2c3e50',
										marginBottom: '5px',
										fontSize: '15px'
									}}>
										{displayName}
									</div>
									{group.task && group.workDescription && (
										<div style={{
											fontSize: '13px',
											color: '#7f8c8d',
											marginTop: '5px'
										}}>
											{group.workDescription}
										</div>
									)}
									<div style={{
										fontSize: '12px',
										color: '#95a5a6',
										marginTop: '5px'
									}}>
										{t('sessions.sessionCount') || 'Sesji'}: {group.sessions.length}
									</div>
								</div>
								<div style={{
									textAlign: 'right',
									fontSize: '13px',
									color: '#7f8c8d'
								}}>
									<div style={{
										fontSize: '16px',
										fontWeight: '600',
										color: hasOvertime ? '#e74c3c' : '#27ae60',
										marginBottom: '5px'
									}}>
										{formatHours(group.totalHours)} {t('sessions.hours') || 'godz.'}
									</div>
									<div style={{
										fontSize: '14px',
										fontWeight: '600',
										color: '#3498db',
										marginTop: '5px'
									}}>
										{group.percentage}%
									</div>
								</div>
							</div>
							<div style={{
								display: 'flex',
								gap: '8px',
								flexWrap: 'wrap',
								marginTop: '8px'
							}}>
								{hasOvertime && (
									<span style={{
										backgroundColor: '#e74c3c',
										color: 'white',
										padding: '4px 8px',
										borderRadius: '4px',
										fontSize: '11px',
										fontWeight: '500'
									}}>
										{t('sessions.overtime') || 'Nadgodziny'}
									</span>
								)}
							</div>

							{/* Session details - dates and times */}
							{group.sessions.length > 0 && (
								<div style={{
									marginTop: '15px',
									paddingTop: '15px',
									borderTop: '1px solid #e0e0e0'
								}}>
									<div style={{
										fontSize: '12px',
										fontWeight: '600',
										color: '#7f8c8d',
										marginBottom: '10px'
									}}>
										{t('sessions.sessionDetails') || 'Szczegóły sesji'}:
									</div>
									<div style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '8px'
									}}>
										{group.sessions.map((session, sessionIndex) => {
											const sessionDate = session.date || session.startTime
											const duration = session.endTime ? calculateDuration(session.startTime, session.endTime) : null
											
											const handleDelete = async () => {
												if (!session._id || !session.workdayId) {
													await showAlert(t('sessions.deleteError') || 'Błąd: brak identyfikatora sesji')
													return
												}
												
												const confirmed = await showConfirm(
													t('sessions.deleteConfirm') || 'Czy na pewno chcesz usunąć tę sesję?',
													{
														confirmText: t('sessions.delete') || 'Usuń',
														cancelText: t('sessions.cancel') || 'Anuluj'
													}
												)
												
												if (confirmed) {
													try {
														await deleteSession.mutateAsync({
															workdayId: session.workdayId,
															sessionId: session._id
														})
														await showAlert(t('sessions.deleteSuccess') || 'Sesja została usunięta')
													} catch (error) {
														console.error('Error deleting session:', error)
														await showAlert(error.response?.data?.message || t('sessions.deleteError') || 'Błąd podczas usuwania sesji')
													}
												}
											}
											
											return (
												<div
													key={sessionIndex}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														padding: '8px 12px',
														backgroundColor: '#ffffff',
														borderRadius: '6px',
														border: '1px solid #e8e8e8',
														fontSize: '13px'
													}}
												>
													<div style={{
														color: '#2c3e50',
														fontWeight: '500',
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														flex: 1
													}}>
														<span>
															{formatDate(sessionDate)} {formatTime(session.startTime)}
															{session.endTime && ` - ${formatTime(session.endTime)}`}
														</span>
														{session.qrCode && (
															<span style={{
																fontSize: '10px',
																backgroundColor: '#e3f2fd',
																color: '#1976d2',
																padding: '2px 6px',
																borderRadius: '10px',
																fontWeight: '500'
															}}>
																{t('sessions.fromQR') || 'QR'}
															</span>
														)}
													</div>
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: '10px'
													}}>
														{duration && (
															<div style={{
																color: session.isOvertime ? '#e74c3c' : '#27ae60',
																fontWeight: '600',
																fontSize: '12px'
															}}>
																{duration} {t('sessions.hours') || 'godz.'}
															</div>
														)}
														<button
															onClick={handleDelete}
															disabled={deleteSession.isPending}
															style={{
																backgroundColor: 'transparent',
																border: 'none',
																color: '#e74c3c',
																cursor: deleteSession.isPending ? 'not-allowed' : 'pointer',
																fontSize: '18px',
																fontWeight: 'bold',
																padding: '4px 8px',
																borderRadius: '4px',
																opacity: deleteSession.isPending ? 0.5 : 1,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																width: '24px',
																height: '24px',
																transition: 'background-color 0.2s'
															}}
															onMouseEnter={(e) => {
																if (!deleteSession.isPending) {
																	e.target.style.backgroundColor = '#fee'
																}
															}}
															onMouseLeave={(e) => {
																e.target.style.backgroundColor = 'transparent'
															}}
															title={t('sessions.delete') || 'Usuń sesję'}
														>
															×
														</button>
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>

			{displayData.length > 0 && (
				<div style={{
					marginTop: '20px',
					padding: '15px',
					backgroundColor: '#f0f0f0',
					borderRadius: '8px',
					textAlign: 'center',
					fontSize: '14px',
					color: '#2c3e50',
					fontWeight: '500'
				}}>
					{t('sessions.totalTime') || 'Łączny czas'}: <strong>{formatHours(displayTotalMinutes / 60)} {t('sessions.hours') || 'godz.'}</strong>
				</div>
			)}
		</div>
	)
}

export default WorkSessionList
