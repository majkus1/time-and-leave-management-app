import React from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'

function AdminUserList() {
	const navigate = useNavigate()

	// TanStack Query hook
	const { data: users = [], isLoading: loading, error } = useUsers()

	const handleUserClick = userId => {
		navigate(`/leave-plans/${userId}`)
	}

	return (
		<div>
			<h2>Lista Pracowników</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<ul>
				{users.map(user => (
					<li key={user._id} onClick={() => handleUserClick(user._id)}>
						{user.username} - {user.roles.join(', ')} - {user.position || 'Brak stanowiska'}
					</li>
				))}
			</ul>
		</div>
	)
}

export default AdminUserList
