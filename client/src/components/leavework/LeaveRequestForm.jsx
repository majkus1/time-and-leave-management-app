import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function LeaveRequestForm() {
	const [type, setType] = useState('leaveform.option1')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [daysRequested, setDaysRequested] = useState(0)
	const [replacement, setReplacement] = useState('')
	const [additionalInfo, setAdditionalInfo] = useState('')
	const [leaveRequests, setLeaveRequests] = useState([])
	const [availableLeaveDays, setAvailableLeaveDays] = useState(0)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchAvailableLeaveDays()
		fetchLeaveRequests()
	}, [])

	const leaveTypeMap = {
		'Urlop wypoczynkowy': 'leaveform.option1',
		'Urlop okolicznościowy': 'leaveform.option2',
		'Urlop na żądanie': 'leaveform.option3',
		'Urlop bezpłatny': 'leaveform.option4',
		'Inna nieobecność': 'leaveform.option5',
	}

	const fetchAvailableLeaveDays = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/vacations/vacation-days`)
			setAvailableLeaveDays(response.data.vacationDays)
		} catch (error) {
			console.error('Błąd podczas pobierania dostępnych dni urlopu:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchLeaveRequests = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/requlea/ownrequestleave`)
			setLeaveRequests(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
		} catch (error) {
			console.error('Błąd podczas pobierania zgłoszeń:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (startDate && endDate) {
			const start = new Date(startDate)
			const end = new Date(endDate)
			const timeDiff = Math.abs(end - start)
			setDaysRequested(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1)
		}
	}, [startDate, endDate])

	const submitLeaveRequest = async e => {
		e.preventDefault()
		setIsSubmitting(true)
		try {
			const data = { type, startDate, endDate, daysRequested, replacement, additionalInfo }
			await axios.post(`${API_URL}/api/leaveworks/leave-request`, data)
			alert(t('leaveform.alertsucces'))
			fetchLeaveRequests()
			setType('leaveform.option1')
			setStartDate('')
			setEndDate('')
			setDaysRequested(0)
			setReplacement('')
			setAdditionalInfo('')
		} catch (error) {
			console.error('Błąd podczas wysyłania wniosku:', error)
			alert(t('leaveform.alertfail'))
		} finally {
			setIsSubmitting(false)
		}
	}

	const formatDate = date => {
		const options = { day: '2-digit', month: 'long', year: 'numeric' }
		return new Date(date).toLocaleDateString(i18n.resolvedLanguage, options)
	}

	const statusMap = {
		'status.accepted': 'accepted',
		'status.pending': 'pending',
		'status.rejected': 'rejected',
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div id="leave-request-form">
					<h2 style={{ marginTop: '0px' }}><img src="img/sunbed.png" alt="ikonka w sidebar" />{t('leaveform.header')}</h2>
					<hr />
					<p>
						{t('leaveform.availableday')}{' '}
						{availableLeaveDays === 0 ? (
							<span style={{ color: 'red' }}>{t('leaveform.nodata')}</span>
						) : (
							availableLeaveDays
						)}
					</p>

					<form onSubmit={submitLeaveRequest} id="formleave" className="space-y-6 max-w-xl">
						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.type')}</label>
							<select
								value={type}
								onChange={e => setType(e.target.value)}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
								<option value="leaveform.option1">{t('leaveform.option1')}</option>
								<option value="leaveform.option2">{t('leaveform.option2')}</option>
								<option value="leaveform.option3">{t('leaveform.option3')}</option>
								<option value="leaveform.option4">{t('leaveform.option4')}</option>
								<option value="leaveform.option5">{t('leaveform.option5')}</option>
							</select>
						</div>

						
						<div style={{ maxWidth: '400px', marginRight: '2px' }}>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.datefrom')}</label>
							<input
								type="date"
								value={startDate}
								onChange={e => setStartDate(e.target.value)}
								required
								className="w-full border border-gray-300 rounded-md px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<br></br>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.dateto')}</label>
							<input
								type="date"
								value={endDate}
								onChange={e => setEndDate(e.target.value)}
								required
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.numberdayreq')}</label>
							<input
								type="number"
								value={daysRequested}
								onChange={e => setDaysRequested(e.target.value)}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.substitute')}</label>
							<input
								type="text"
								value={replacement}
								onChange={e => setReplacement(e.target.value)}
								placeholder={t('leaveform.optional')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.addinfo')}</label>
							<textarea
								value={additionalInfo}
								onChange={e => setAdditionalInfo(e.target.value)}
								placeholder={t('leaveform.optional')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

					
						<div className="flex justify-end">
							<button
								type="submit"
								disabled={isSubmitting}
								className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
								{isSubmitting ? (
									<span className="flex items-center">
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('leaveform.submitting')}
									</span>
								) : (
									t('leaveform.submit')
								)}
							</button>
						</div>
					</form>

					<h3>{t('leaveform.listsofreq')}</h3>
					<ul>
						{leaveRequests.map((request, index) => {
							const translatedType = leaveTypeMap[request.type] ? t(leaveTypeMap[request.type]) : request.type

							return (
								<li key={index} style={{ marginTop: '25px' }}>
									<p>
										{t('leaveform.typeLabel')}: {t(request.type)}
									</p>
									<p>
										{t('leaveform.date')}: {formatDate(request.startDate)} - {formatDate(request.endDate)}
									</p>
									<p>
										{t('leaveform.daysRequested')}: {request.daysRequested}
									</p>
									<p>
										{t('leaveform.substitute')} {request.replacement || t('leaveform.empty')}
									</p>
									<p>
										{t('leaveform.additionalInfo')}: {request.additionalInfo || t('leaveform.empty')}
									</p>
									<p>
										{t('leaveform.status')}:
										<span
											className={`autocol ${
												request.status === 'status.accepted'
													? 'status-accepted'
													: request.status === 'status.pending'
													? 'status-pending'
													: 'status-rejected'
											}`}
											style={{ marginLeft: '5px' }}>
											{t(`leaveform.statuses.${statusMap[request.status]}`) || t(request.status)}
										</span>
										{request.updatedBy && (
											<span>
												{' '}
												( {t('leaveform.updatedBy')}: {request.updatedBy.firstName} {request.updatedBy.lastName} )
											</span>
										)}
									</p>
								</li>
							)
						})}
					</ul>
				</div>
			)}
		</>
	)
}

export default LeaveRequestForm
