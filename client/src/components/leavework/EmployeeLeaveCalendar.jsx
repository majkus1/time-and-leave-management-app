import React, { useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'
import { useUser } from '../../hooks/useUsers'
import { useUserLeavePlans } from '../../hooks/useLeavePlans'
import { useUserAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'

function EmployeeLeaveCalendar() {
	const { userId } = useParams()
	const currentYear = new Date().getFullYear()
	const { t, i18n } = useTranslation()

	// TanStack Query hooks
	const { data: user, isLoading: loadingUser } = useUser(userId)
	const { data: leavePlans = [], isLoading: loadingPlans } = useUserLeavePlans(userId)
	const { data: acceptedLeaveRequests = [], isLoading: loadingRequests } = useUserAcceptedLeaveRequests(userId)

	const loading = loadingUser || loadingPlans || loadingRequests
	
	// Odśwież kalendarze gdy sidebar się zmienia lub okno się zmienia
	useEffect(() => {
		const updateCalendarsSize = () => {
			// FullCalendar automatycznie nasłuchuje na window resize, więc wywołajmy event resize
			// Użyj setTimeout aby dać czas na zakończenie animacji CSS
			setTimeout(() => {
				window.dispatchEvent(new Event('resize'))
			}, 350) // 350ms to czas animacji sidebaru (0.3s + mały buffer)
		}

		// Obserwuj zmiany klasy body (sidebar-collapsed)
		const observer = new MutationObserver(() => {
			updateCalendarsSize()
		})

		// Obserwuj zmiany klasy body
		if (document.body) {
			observer.observe(document.body, {
				attributes: true,
				attributeFilter: ['class']
			})
		}

		// Obserwuj zmiany rozmiaru okna
		const handleResize = () => {
			updateCalendarsSize()
		}
		window.addEventListener('resize', handleResize)

		// Odśwież po załadowaniu
		updateCalendarsSize()

		return () => {
			observer.disconnect()
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	const renderMonths = () => {
	return Array.from({ length: 12 }, (_, month) => (
		<div key={month} className="month-calendar allleaveplans" style={{ margin: '10px', border: '1px solid #ddd' }}>
			<FullCalendar
				plugins={[dayGridPlugin]}
				initialView="dayGridMonth"
				initialDate={new Date(currentYear, month)}
				locale={i18n.resolvedLanguage}
				height="auto"
				showNonCurrentDates={false}
				firstDay={1}
				events={[
					// Plany urlopów
					...leavePlans.map(date => ({
						title: `${t('leaveplanner.vactiontitle')} (Plan)`,
						start: date,
						allDay: true,
						backgroundColor: 'blue',
						extendedProps: { type: 'plan', date: date }
					})),
					// Zaakceptowane wnioski urlopowe
					...acceptedLeaveRequests
						.filter(request => request.startDate && request.endDate) // Sprawdź czy daty istnieją
						.map(request => {
							// FullCalendar traktuje end jako exclusive, więc dodajemy 1 dzień aby pokazać ostatni dzień
							const endDate = new Date(request.endDate)
							endDate.setDate(endDate.getDate() + 1)
							const endDateStr = endDate.toISOString().split('T')[0]
							
							return {
								title: `${t(request.type)}`,
								start: request.startDate,
								end: endDateStr,
								allDay: true,
								backgroundColor: 'green',
								borderColor: 'darkgreen',
								extendedProps: { type: 'request', requestId: request._id }
							}
						})
				]}
			/>
		</div>
	))
}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div className="leave-calendar-plans-one-employee">
				{user && (
					<h3 style={{ paddingBottom: '20px' }}>
						<img src="/img/schedule.png" alt="ikonka w sidebar" /> {t('leaveplanone.h3')} {user.firstName} {user.lastName}
					</h3>
				)}

				{/* Sekcja zaakceptowanych wniosków */}
				{acceptedLeaveRequests.length > 0 && (
					<div style={{ padding: '0 20px 20px 20px' }}>
						<h4 style={{ color: 'green', marginBottom: '15px', fontSize: '18px' }}>
							{t('leaveplanner.acceptedRequests')}
						</h4>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
							{acceptedLeaveRequests.map(request => (
								<div
									key={request._id}
									style={{
										padding: '10px 15px',
										border: '2px solid #4ade80',
										backgroundColor: '#f0fdf4',
										borderRadius: '8px',
										minWidth: '250px',
										boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
									}}>
									<div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#059669' }}>
										{t(request.type)}
									</div>
									<div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
										{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
									</div>
									<div style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
										{request.daysRequested} {t('leaveplanner.days')}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>{renderMonths()}</div>
				
			</div>
			)}
		</>
	)
}

export default EmployeeLeaveCalendar
