import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function AdminLeaveRequests() {
	const { userId } = useParams()
	const [user, setUser] = useState(null)
	const [leaveRequests, setLeaveRequests] = useState([])
	const [vacationDays, setVacationDays] = useState(null)
	const [loadingVacationDays, setLoadingVacationDays] = useState(true)
	const [showVacationUpdateMessage, setShowVacationUpdateMessage] = useState(false)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchLeaveRequests()
		fetchVacationDays()
		fetchUserDetails()
	}, [userId])

	const fetchUserDetails = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/${userId}`)

			setUser(response.data)
		} catch (error) {
			console.error('Failed to fetch user details:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchLeaveRequests = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/leaveworks/leave-requests/${userId}`)

			const sortedRequests = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			setLeaveRequests(sortedRequests)
		} catch (error) {
			console.error('Błąd podczas pobierania zgłoszeń:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchVacationDays = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/vacations/${userId}/vacation-days`)
			setVacationDays(response.data.vacationDays)
		} catch (error) {
			console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		} finally {
			setLoadingVacationDays(false)
		}
	}

	const updateVacationDays = async () => {
		try {
			await axios.patch(
				`${API_URL}/api/vacations/${userId}/vacation-days`,
				{ vacationDays }
			)
			alert(t('adminleavereq.alert'))
			fetchVacationDays()
		} catch (error) {
			console.error('Błąd podczas aktualizacji liczby dni urlopu:', error)
		}
	}

	const updateLeaveRequestStatus = async (id, newStatus) => {
		try {
			const response = await axios.patch(`${API_URL}/api/leaveworks/leave-requests/${id}`, { status: newStatus })

			// Aktualizuj lokalnie stan przed odświeżeniem listy
			if (response.data.leaveRequest) {
				setLeaveRequests(prevRequests =>
					prevRequests.map(request =>
						request._id === id ? { ...request, ...response.data.leaveRequest } : request
					)
				)
			}

			// Odśwież listę aby mieć najnowsze dane
			await fetchLeaveRequests()
		} catch (error) {
			console.error('Błąd podczas aktualizacji statusu zgłoszenia:', error)
			alert(t('adminleavereq.updateError') || 'Nie udało się zaktualizować statusu wniosku')
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
