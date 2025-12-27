import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'

function AdminUserList() {
	const navigate = useNavigate()
	const { t } = useTranslation()

	// TanStack Query hook
	const { data: users = [], isLoading: loading, error } = useUsers()

	const handleUserClick = userId => {
		navigate(`/work-calendars/${userId}`)
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
					<h3><img src="img/schedule time works.png" alt="ikonka w sidebar" /> {t('evidencework.h3')}</h3>
					<hr />
					{error && <p style={{ color: 'red' }}>{t('list.error')}</p>}
					<p>{t('planslist.emplo')}</p>
					<ul style={{ listStyle: 'inherit', marginLeft: '20px' }}>
						{users.map(user => (
							<li key={user._id} onClick={() => handleUserClick(user._id)} style={{ cursor: 'pointer', marginBottom: '5px' }}>
								{user.firstName} {user.lastName} – {user.position || t('newuser.noPosition')}
							</li>
						))}
					</ul>
				</div>
			)}
		</>
	)
}

export default AdminUserList
