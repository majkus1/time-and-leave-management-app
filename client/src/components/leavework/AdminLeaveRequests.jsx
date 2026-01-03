import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useUser } from '../../hooks/useUsers'
import { useVacationDays, useUpdateVacationDays } from '../../hooks/useVacation'
import { useUserLeaveRequests, useUpdateLeaveRequestStatus } from '../../hooks/useLeaveRequests'

function AdminLeaveRequests() {
	const { userId } = useParams()
	const [vacationDays, setVacationDays] = useState(null)
	const [showVacationUpdateMessage, setShowVacationUpdateMessage] = useState(false)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	// TanStack Query hooks
	const { data: user, isLoading: loadingUser } = useUser(userId)
	const { data: leaveRequests = [], isLoading: loadingRequests } = useUserLeaveRequests(userId)
	const { data: vacationDaysData, isLoading: loadingVacationDays } = useVacationDays(userId)
	const updateVacationDaysMutation = useUpdateVacationDays()
	const updateLeaveRequestStatusMutation = useUpdateLeaveRequestStatus()

	const loading = loadingUser || loadingRequests || loadingVacationDays

	// Sync vacationDays z query data
	React.useEffect(() => {
		if (vacationDaysData !== undefined) {
			setVacationDays(vacationDaysData)
		}
	}, [vacationDaysData])

	const updateVacationDays = async () => {
		try {
			await updateVacationDaysMutation.mutateAsync({
				userId,
				vacationDays,
			})
			await showAlert(t('adminleavereq.alert'))
		} catch (error) {
			console.error('Błąd podczas aktualizacji liczby dni urlopu:', error)
		}
	}

	const updateLeaveRequestStatus = async (id, newStatus) => {
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
					<label style={{ marginRight: '5px' }}>{t('adminleavereq.label1')}</label>
					{loadingVacationDays ? (
						<p>Ładowanie...</p>
					) : (
						<>
							<input
								type="number"
								value={vacationDays !== null ? vacationDays : ''}
								onChange={e => {
									const value = e.target.value
									if (value === '') {
										setVacationDays(null)
									} else {
										setVacationDays(Number(value))
									}
								}}
								style={{ width: '60px', paddingLeft: '2px' }}
								className='w-full border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
							<button onClick={updateVacationDays} style={{ marginLeft: '5px' }} className="btn btn-success">
								{t('adminleavereq.btnupdatenumber')}
							</button>
						</>
					)}
					<br></br>
					<div style={{ 
						marginTop: '8px', 
						marginBottom: '8px',
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
								{t('adminleavereq.type')} {t(request.type)}
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
											if (request.type === 'leaveform.option1') {
												setShowVacationUpdateMessage(true)
											}
										}}
										style={{ marginRight: '5px' }}
										className="btn btn-success">
										{t('adminleavereq.btn1')}
									</button>

									<button
										onClick={() => {
											updateLeaveRequestStatus(request._id, 'status.rejected')
											if (request.type === 'leaveform.option1') {
												setShowVacationUpdateMessage(true)
											}
										}}
										style={{ marginRight: '5px' }}
										className="btn btn-danger">
										{t('adminleavereq.btn2')}
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
