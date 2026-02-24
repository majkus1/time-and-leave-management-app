import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useUser } from '../../hooks/useUsers'
import { useUpdateVacationDays } from '../../hooks/useVacation'
import { useUserLeaveRequests, useUpdateLeaveRequestStatus } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'

function AdminLeaveRequests() {
	const { userId } = useParams()
	const [leaveTypeDays, setLeaveTypeDays] = useState({})
	const [showVacationUpdateMessage, setShowVacationUpdateMessage] = useState(false)
	const [updatingRequestId, setUpdatingRequestId] = useState(null)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	// TanStack Query hooks
	const { data: user, isLoading: loadingUser } = useUser(userId)
	const { data: leaveRequests = [], isLoading: loadingRequests } = useUserLeaveRequests(userId)
	const { data: settings, isLoading: loadingSettings } = useSettings()
	const updateVacationDaysMutation = useUpdateVacationDays()
	const updateLeaveRequestStatusMutation = useUpdateLeaveRequestStatus()

	const loading = loadingUser || loadingRequests || loadingSettings

	// Pobierz typy urlopów, które mają allowDaysLimit: true
	const leaveTypesWithLimit = React.useMemo(() => {
		if (!settings || !settings.leaveRequestTypes) return []
		return settings.leaveRequestTypes.filter(type => type.isEnabled && type.allowDaysLimit)
	}, [settings])

	// Sync leaveTypeDays z user data
	React.useEffect(() => {
		if (user && user.leaveTypeDays) {
			setLeaveTypeDays(user.leaveTypeDays || {})
		}
	}, [user])

	const updateLeaveTypeDays = async () => {
		try {
			// Filtruj tylko wartości, które są liczbami (w tym 0)
			const leaveTypeDaysToSend = {}
			Object.keys(leaveTypeDays).forEach(typeId => {
				const value = leaveTypeDays[typeId]
				if (value !== null && value !== undefined && value !== '') {
					const numValue = Number(value)
					if (!isNaN(numValue) && numValue >= 0) {
						leaveTypeDaysToSend[typeId] = numValue
					}
				}
			})
			
			await updateVacationDaysMutation.mutateAsync({
				userId,
				leaveTypeDays: leaveTypeDaysToSend,
			})
			
			await showAlert(t('adminleavereq.alert'))
		} catch (error) {
			console.error('Błąd podczas aktualizacji liczby dni urlopu:', error)
			const errorMessage = error.response?.data?.message || t('adminleavereq.updateError') || 'Błąd podczas aktualizacji liczby dni urlopu'
			await showAlert(errorMessage)
		}
	}

	const handleLeaveTypeDaysChange = (typeId, value) => {
		setLeaveTypeDays(prev => ({
			...prev,
			[typeId]: value === '' ? null : Number(value)
		}))
	}

	const updateLeaveRequestStatus = async (id, newStatus) => {
		setUpdatingRequestId(id)
		try {
			await updateLeaveRequestStatusMutation.mutateAsync({
				id,
				status: newStatus,
				userId,
			})
			await showAlert(t('adminleavereq.updateSuccess'))
		} catch (error) {
			console.error('Błąd podczas aktualizacji statusu zgłoszenia:', error)
			await showAlert(t('adminleavereq.updateError'))
		} finally {
			setUpdatingRequestId(null)
		}
	}

	const formatDate = date => {
		const options = { day: '2-digit', month: 'long', year: 'numeric' }
		return new Date(date).toLocaleDateString(i18n.resolvedLanguage, options)
	}

	const goToPDFPreview = leaveRequest => {
		navigate('/leave-request-pdf-preview', { state: { leaveRequest } })
	}

	const statusLabels = {
		'status.accepted': 'status-accepted',
		'status.pending': 'status-pending',
		'status.rejected': 'status-rejected',
		'status.sent': 'status-sent',
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id="leave-requests-review">
				<div style={{ maxWidth: '900px' }}>
				<div style={{ marginBottom: '20px' }}>
					<h3><img src="/img/trip.png" alt="ikonka w sidebar" /> {t('adminleavereq.h3')}</h3>
					<hr />
					{user && (
						<div style={{ marginBottom: '12px' }}>
							<h3 style={{ marginBottom: '6px' }}>
								{user.firstName} {user.lastName}
							</h3>
							<p style={{ margin: 0, color: '#6b7280' }}>
								{user.position || '-'}
							</p>
						</div>
					)}
				</div>

				{leaveTypesWithLimit.length > 0 && (
					<div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#fff', maxWidth: '450px' }}>
						<label style={{ fontWeight: '700', fontSize: '16px', display: 'block', marginBottom: '12px' }}>
							{t('adminleavereq.label1') || 'Dni urlopu'}
						</label>
						<div style={{ display: 'grid', gap: '10px' }}>
							{leaveTypesWithLimit.map(leaveType => {
								const typeName = i18n.resolvedLanguage === 'en' && leaveType.nameEn ? leaveType.nameEn : leaveType.name
								const currentValue = leaveTypeDays[leaveType.id] || ''
								return (
									<div key={leaveType.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
										<label style={{ fontSize: '14px', fontWeight: '500' }}>{typeName}</label>
										<input
											type="number"
											min="0"
											value={currentValue}
											onChange={e => handleLeaveTypeDaysChange(leaveType.id, e.target.value)}
											style={{ width: '96px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
											className='focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
								)
							})}
						</div>
						<button onClick={updateLeaveTypeDays} style={{ marginTop: '14px' }} className="btn btn-success">
							{t('adminleavereq.btnupdatenumber') || 'Zaktualizuj'}
						</button>
					</div>
				)}

				<div style={{ 
					marginBottom: '20px',
					padding: '12px 14px',
					backgroundColor: '#fff8e1',
					border: '1px solid #f59e0b',
					borderRadius: '8px',
					fontSize: '14px',
					color: '#92400e',
					lineHeight: 1.45
				}}>
					<strong>💡 {t('adminleavereq.reminder')}</strong>
				</div>

				{showVacationUpdateMessage && (
					<p style={{ display: 'inline-block', marginBottom: '20px' }} className="update-days">
						{t('adminleavereq.updatedays')}
					</p>
				)}

				<div style={{ marginTop: '8px' }}>
					<h4 style={{ marginBottom: '16px' }}>{t('adminleavereq.h4')}</h4>
					{leaveRequests.length === 0 && (
						<div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', color: '#6b7280', backgroundColor: '#fff' }}>
							{t('adminleavereq.none') || 'Brak danych'}
						</div>
					)}
					{leaveRequests.map(request => (
						<div key={request._id} style={{ marginBottom: '14px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#fff', maxWidth: '650px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
								<strong style={{ fontSize: '16px' }}>
									{getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}
								</strong>
								<div className="leave-request-status-desktop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
									<span className={`autocol ${statusLabels[request.status] || 'status-unknown'}`}>
										{t(`leaveform.statuses.${request.status.split('.')[1]}`) || request.status}
									</span>
									{request.updatedBy && (
										<span style={{ fontSize: '13px', color: '#6b7280' }}>
											{t('leaveform.updatedBy')}: {request.updatedBy.firstName} {request.updatedBy.lastName}
										</span>
									)}
								</div>
							</div>

							<div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
								<p style={{ margin: 0 }}>
									<strong>{t('adminleavereq.date')}</strong> {formatDate(request.startDate)} - {formatDate(request.endDate)}
								</p>
								<p style={{ margin: 0 }}>
									<strong>{settings?.leaveCalculationMode === 'hours' ? (t('adminleavereq.hours') || 'Liczba godzin') : (t('adminleavereq.days') || 'Liczba dni')}</strong>{' '}
									{settings?.leaveCalculationMode === 'hours'
										? (request.daysRequested * (settings.leaveHoursPerDay || 8)).toFixed(1)
										: request.daysRequested}
								</p>
								<p style={{ margin: 0 }}>
									<strong>{t('adminleavereq.subst')}</strong> {request.replacement || t('adminleavereq.none')}
								</p>
								<p style={{ margin: 0 }}>
									<strong>{t('adminleavereq.comment')}</strong> {request.additionalInfo || t('adminleavereq.none')}
								</p>
								<p className="leave-request-status-mobile" style={{ margin: 0 }}>
									<strong>{t('adminleavereq.status')}</strong>{' '}
									<span className={`autocol ${statusLabels[request.status] || 'status-unknown'}`}>
										{t(`leaveform.statuses.${request.status.split('.')[1]}`) || request.status}
									</span>
								</p>
								{request.updatedBy && (
									<p className="leave-request-updated-by-mobile" style={{ margin: 0, color: '#6b7280' }}>
										{t('leaveform.updatedBy')}: {request.updatedBy.firstName} {request.updatedBy.lastName}
									</p>
								)}
							</div>

							<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
								{request.status !== 'status.sent' && request.status !== 'status.accepted' && (
									<button
										onClick={() => {
											updateLeaveRequestStatus(request._id, 'status.accepted')
											if (settings && settings.leaveRequestTypes) {
												const leaveType = settings.leaveRequestTypes.find(t => t.id === request.type)
												if (leaveType && leaveType.allowDaysLimit) {
													setShowVacationUpdateMessage(true)
												}
											}
										}}
										disabled={updatingRequestId === request._id}
										style={{ 
											opacity: updatingRequestId === request._id ? 0.6 : 1,
											cursor: updatingRequestId === request._id ? 'not-allowed' : 'pointer',
											position: 'relative'
										}}
										className="btn btn-success">
										{updatingRequestId === request._id ? (
											<>
												<span style={{ 
													display: 'inline-block',
													width: '14px',
													height: '14px',
													border: '2px solid rgba(255,255,255,0.3)',
													borderTopColor: '#fff',
													borderRadius: '50%',
													animation: 'spin 0.8s linear infinite',
													marginRight: '6px',
													verticalAlign: 'middle'
												}}></span>
												{t('adminleavereq.btn1')}
											</>
										) : (
											t('adminleavereq.btn1')
										)}
									</button>
								)}

								{request.status !== 'status.sent' && request.status !== 'status.rejected' && (
									<button
										onClick={() => {
											updateLeaveRequestStatus(request._id, 'status.rejected')
											if (settings && settings.leaveRequestTypes) {
												const leaveType = settings.leaveRequestTypes.find(t => t.id === request.type)
												if (leaveType && leaveType.allowDaysLimit) {
													setShowVacationUpdateMessage(true)
												}
											}
										}}
										disabled={updatingRequestId === request._id}
										style={{ 
											opacity: updatingRequestId === request._id ? 0.6 : 1,
											cursor: updatingRequestId === request._id ? 'not-allowed' : 'pointer',
											position: 'relative'
										}}
										className="btn btn-danger">
										{updatingRequestId === request._id ? (
											<>
												<span style={{ 
													display: 'inline-block',
													width: '14px',
													height: '14px',
													border: '2px solid rgba(255,255,255,0.3)',
													borderTopColor: '#fff',
													borderRadius: '50%',
													animation: 'spin 0.8s linear infinite',
													marginRight: '6px',
													verticalAlign: 'middle'
												}}></span>
												{t('adminleavereq.btn2')}
											</>
										) : (
											t('adminleavereq.btn2')
										)}
									</button>
								)}

								<button
									onClick={() => goToPDFPreview(request)}
									className="btn btn-primary">
									{t('adminleavereq.btn3')}
								</button>
							</div>
						</div>
					))}
				</div>
				</div>
			</div>
			)}
		</>
	)
}

export default AdminLeaveRequests
