import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useSchedules, useScheduleUsers } from '../../hooks/useSchedule'
import { Link } from 'react-router-dom'
import UsersInfoModal from '../shared/UsersInfoModal'

function ScheduleList() {
	const { t } = useTranslation()
	const { data: schedules = [], isLoading } = useSchedules()
	const [usersInfoModal, setUsersInfoModal] = useState({ isOpen: false, scheduleId: null })
	
	// Hook for schedule users in modal
	const { data: scheduleUsers = [], isLoading: loadingScheduleUsers } = useScheduleUsers(
		usersInfoModal.scheduleId,
		usersInfoModal.isOpen
	)

	if (isLoading) return <Loader />

	return (
		<>
			<Sidebar />
			<div style={{ padding: '15px' }} className='schedule-container'>
				<h2 style={{
					display: 'flex',
					alignItems: 'center',
					marginBottom: '20px',
					color: '#2c3e50',
					fontSize: '28px',
					fontWeight: '600'
				}}>
					<img src="/img/project.png" alt="Schedule icon" />
					{t('schedule.title') || 'Grafiki'}
				</h2>
				<hr />
				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
					gap: '20px'
				}}>
					{schedules.length > 0 ? (
						schedules.map((schedule) => (
							<div
								key={schedule._id}
								style={{
									backgroundColor: 'white',
									borderRadius: '12px',
									padding: '20px',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
									cursor: 'pointer',
									transition: 'transform 0.2s, box-shadow 0.2s',
									position: 'relative'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-4px)'
									e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)'
									e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
								}}>
								<Link
									to={`/schedule/${schedule._id}`}
									style={{
										textDecoration: 'none',
										color: 'inherit',
										display: 'block'
									}}>
									<h3 style={{
										margin: '0 0 10px 0',
										color: '#2c3e50',
										fontSize: '20px',
										fontWeight: '600'
									}}>
										{schedule.name}
									</h3>
									{schedule.description && (
										<p style={{
											color: '#7f8c8d',
											fontSize: '16px',
											marginBottom: '10px'
										}}>
											{schedule.description}
										</p>
									)}
									<div style={{
										fontSize: '12px',
										color: '#95a5a6',
										marginTop: '10px'
									}}>
										{schedule.type === 'team' && `📋 ${t('schedule.boardType.team') || 'Grafik zespołu'}`}
										{schedule.type === 'department' && `🏢 ${t('schedule.boardType.department') || 'Grafik działu'}`}
									</div>
								</Link>
								<div style={{
									position: 'absolute',
									top: '10px',
									right: '10px',
									display: 'flex',
									gap: '8px',
									alignItems: 'center'
								}}>
									<button
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											setUsersInfoModal({ isOpen: true, scheduleId: schedule._id })
										}}
										style={{
											background: 'transparent',
											border: 'none',
											color: '#3498db',
											cursor: 'pointer',
											fontSize: '16px',
											padding: '4px 8px',
											borderRadius: '4px',
											transition: 'all 0.2s'
										}}
										onMouseEnter={(e) => {
											e.target.style.backgroundColor = '#ebf5fb'
											e.target.style.color = '#2980b9'
										}}
										onMouseLeave={(e) => {
											e.target.style.backgroundColor = 'transparent'
											e.target.style.color = '#3498db'
										}}
										title={t('boards.usersInfo') || 'Zobacz użytkowników'}>
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
											<path d="M8 12V8M8 4H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
										</svg>
									</button>
								</div>
							</div>
						))
					) : (
						<div style={{
							gridColumn: '1 / -1',
							textAlign: 'center',
							padding: '40px',
							color: '#7f8c8d'
						}}>
							<p>{t('schedule.noSchedules') || 'Brak grafików.'}</p>
						</div>
					)}
				</div>

				<UsersInfoModal
					isOpen={usersInfoModal.isOpen}
					onClose={() => setUsersInfoModal({ isOpen: false, scheduleId: null })}
					users={scheduleUsers}
					isLoading={loadingScheduleUsers}
					title={t('schedule.usersInfo') || 'Użytkownicy grafiku'}
				/>
			</div>
		</>
	)
}

export default ScheduleList

