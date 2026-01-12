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
				<h3><img src="/img/trip.png" alt="ikonka w sidebar" /> {t('adminleavereq.h3')}</h3>
				<hr />
				{user && (
					<h3 style={{ marginBottom: '25px' }}>
						{user.firstName} {user.lastName} ({user.position})
					</h3>
				)}
				<div>
					{leaveTypesWithLimit.length > 0 && (
						<>
							<div style={{ marginBottom: '15px' }}>
								<label style={{ marginRight: '5px', fontWeight: '600', fontSize: '16px', display: 'block', marginBottom: '10px' }}>
									{t('adminleavereq.label1') || 'Dni urlopu'}
								</label>
								{leaveTypesWithLimit.map(leaveType => {
									const typeName = i18n.resolvedLanguage === 'en' && leaveType.nameEn ? leaveType.nameEn : leaveType.name
									const currentValue = leaveTypeDays[leaveType.id] || ''
									return (
										<div key={leaveType.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
											<label style={{ minWidth: '200px', fontSize: '14px' }}>{typeName}:</label>
											<input
												type="number"
												min="0"
												value={currentValue}
												onChange={e => handleLeaveTypeDaysChange(leaveType.id, e.target.value)}
												style={{ width: '80px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
												className='focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
										</div>
									)
								})}
								<button onClick={updateLeaveTypeDays} style={{ marginTop: '10px' }} className="btn btn-success">
									{t('adminleavereq.btnupdatenumber') || 'Zaktualizuj'}
								</button>
							</div>
						</>
					)}
					<div style={{ 
						marginTop: '8px', 
						marginBottom: '38px',
						padding: '10px 12px',
						backgroundColor: '#fff3cd',
						border: '1px solid #ffc107',
						borderRadius: '6px',
						fontSize: '13px',
						color: '#856404',
						maxWidth: '600px'
					}}>
						<strong>💡 {t('adminleavereq.reminder')}</strong>
					</div>
					{showVacationUpdateMessage && (
						<p style={{ display: 'inline-block' }} className="update-days">
							{t('adminleavereq.updatedays')}
						</p>
					)}
				</div>

				<ul style={{ marginTop: '20px' }}>
					<h4 style={{ marginBottom: '20px' }}>{t('adminleavereq.h4')}</h4>
					{leaveRequests.map(request => (
						<li key={request._id} style={{ marginBottom: '30px' }}>
							<p>
								{t('adminleavereq.type')} {getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}
							</p>
							<p>
								{t('adminleavereq.date')} {formatDate(request.startDate)} - {formatDate(request.endDate)}
							</p>
							<p>
								{t('adminleavereq.days')} {request.daysRequested}
							</p>
							<p>
								{t('adminleavereq.subst')} {request.replacement || t('adminleavereq.none')}
							</p>
							<p>
								{t('adminleavereq.comment')} {request.additionalInfo || t('adminleavereq.none')}
							</p>
							<p>
								{t('adminleavereq.status')}{' '}
								<span className={`autocol ${statusLabels[request.status] || 'status-unknown'}`}>
									{t(`leaveform.statuses.${request.status.split('.')[1]}`) || request.status}
								</span>
								{request.updatedBy && (
									<span>
										{' '}
										({t('leaveform.updatedBy')}: {request.updatedBy.firstName} {request.updatedBy.lastName})
									</span>
								)}
							</p>

							{/* Ukryj przyciski akceptacji/odrzucenia dla L4 (status.sent) */}
							{request.status !== 'status.sent' && (
								<>
									<button
										onClick={() => {
											updateLeaveRequestStatus(request._id, 'status.accepted')
											// Sprawdź czy typ ma allowDaysLimit - wtedy pokaż przypomnienie
											if (settings && settings.leaveRequestTypes) {
												const leaveType = settings.leaveRequestTypes.find(t => t.id === request.type)
												if (leaveType && leaveType.allowDaysLimit) {
													setShowVacationUpdateMessage(true)
												}
											}
										}}
										disabled={updatingRequestId === request._id}
										style={{ 
											marginRight: '5px',
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

									<button
										onClick={() => {
											updateLeaveRequestStatus(request._id, 'status.rejected')
											// Sprawdź czy typ ma allowDaysLimit - wtedy pokaż przypomnienie
											if (settings && settings.leaveRequestTypes) {
												const leaveType = settings.leaveRequestTypes.find(t => t.id === request.type)
												if (leaveType && leaveType.allowDaysLimit) {
													setShowVacationUpdateMessage(true)
												}
											}
										}}
										disabled={updatingRequestId === request._id}
										style={{ 
											marginRight: '5px',
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
								</>
							)}

							<button
								onClick={() => goToPDFPreview(request)}
								style={{ marginRight: '5px' }}
								className="btn btn-primary">
								{t('adminleavereq.btn3')}
							</button>
						</li>
					))}
				</ul>
			</div>
			)}
		</>
	)
}

export default AdminLeaveRequests
