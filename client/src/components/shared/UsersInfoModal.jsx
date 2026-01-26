import React from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function UsersInfoModal({ isOpen, onClose, users, isLoading, title }) {
	const { t } = useTranslation()

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			style={{
				overlay: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0',
					maxWidth: '500px',
					maxHeight: '80vh',
					width: '90%',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
					overflow: 'auto',
				},
			}}
			contentLabel={title || t('usersInfo.title') || 'Lista użytkowników'}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h2 style={{ 
					margin: 0,
					color: '#2c3e50',
					fontSize: '24px',
					fontWeight: '600'
				}}>
					{title || t('usersInfo.title') || 'Lista użytkowników'}
				</h2>
				<button
					onClick={onClose}
					style={{
						background: 'transparent',
						border: 'none',
						fontSize: '28px',
						cursor: 'pointer',
						color: '#7f8c8d',
						lineHeight: '1',
						padding: '0',
						width: '30px',
						height: '30px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
					onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
					onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}>
					×
				</button>
			</div>

			{isLoading ? (
				<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
					<Loader />
				</div>
			) : users && users.length > 0 ? (
				<div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
					{users.map((user, index) => (
						<div
							key={user._id || index}
							style={{
								padding: '15px',
								borderBottom: index < users.length - 1 ? '1px solid #e9ecef' : 'none',
								backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
								transition: 'background-color 0.2s'
							}}
							onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
							onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'}>
							<div style={{ 
								fontWeight: '600', 
								color: '#2c3e50',
								marginBottom: '5px',
								fontSize: '16px'
							}}>
								{user.firstName} {user.lastName}
							</div>
							{user.username && (
								<div style={{ 
									fontSize: '14px', 
									color: '#7f8c8d',
									marginBottom: user.position ? '3px' : '0'
								}}>
									{user.username}
								</div>
							)}
							{user.position && (
								<div style={{ 
									fontSize: '14px', 
									color: '#95a5a6',
									fontStyle: 'italic'
								}}>
									{user.position}
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div style={{ 
					textAlign: 'center', 
					padding: '40px',
					color: '#7f8c8d'
				}}>
					{t('usersInfo.noUsers') || 'Brak użytkowników'}
				</div>
			)}

			<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
				<button
					onClick={onClose}
					style={{
						padding: '10px 20px',
						backgroundColor: '#3498db',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontSize: '14px',
						fontWeight: '500',
						transition: 'background-color 0.2s'
					}}
					onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
					onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}>
					{t('usersInfo.close') || t('boards.cancel') || 'Zamknij'}
				</button>
			</div>
		</Modal>
	)
}

export default UsersInfoModal

