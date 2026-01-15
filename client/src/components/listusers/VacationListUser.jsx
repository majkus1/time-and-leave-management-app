import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'

function VacationListUser() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()

	// TanStack Query hook
	const { data: users = [], isLoading: loading, error } = useUsers()

	const handleUserClick = userId => {
		navigate(`/leave-requests/${userId}`)
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id="list-employee">
				<h3><img src="img/trip.png" alt="ikonka w sidebar" /> {t('vacationlisteq.h3')}</h3>
				<hr />
				{error && <p style={{ color: 'red' }}>{t('list.error')}</p>}
				<h3 style={{ marginTop: '35px' }}>{t('vacationlisteq.request')}</h3>
				<p>{t('planslist.emplo')}</p>
				<ul style={{ listStyle: 'none', marginLeft: '20px', padding: 0 }}>
					{users.map(user => (
						<li 
							key={user._id} 
							onClick={() => handleUserClick(user._id)} 
							className="clickable-user-item"
							style={{ marginBottom: '8px' }}
							title={t('vacationlisteq.clickToView')}
						>
							<span className="user-icon">→</span>
							<span className="user-text">
								{user.firstName} {user.lastName} - {user.position || t('newuser.noPosition')}
							</span>
							<span className="user-hint">{t('vacationlisteq.clickToView')}</span>
						</li>
					))}
				</ul>
			</div>
			)}
		</>
	)
}

export default VacationListUser
