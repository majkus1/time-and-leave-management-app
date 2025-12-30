import React, { useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { useCreateBoard } from '../../hooks/useBoards'
import { useAlert } from '../../context/AlertContext'

Modal.setAppElement('#root')

function CreateBoardModal({ onClose, onSuccess }) {
	const { t } = useTranslation()
	const { teamId } = useAuth()
	const { showAlert } = useAlert()
	const { data: users = [] } = useUsers()
	const createBoardMutation = useCreateBoard()
	
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [selectedMembers, setSelectedMembers] = useState([])

	// Filter users to only show users from the same team
	const teamUsers = users.filter(user => user.teamId === teamId)

	const handleMemberToggle = (userId) => {
		setSelectedMembers(prev => 
			prev.includes(userId) 
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!name.trim()) {
			await showAlert(t('boards.nameRequired') || 'Nazwa tablicy jest wymagana')
			return
		}

		try {
			await createBoardMutation.mutateAsync({
				name: name.trim(),
				description: description.trim(),
				memberIds: selectedMembers
			})
			await showAlert(t('boards.createSuccess') || 'Tablica została utworzona pomyślnie')
			onSuccess()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.createError') || 'Błąd podczas tworzenia tablicy')
		}
	}

	return (
		<Modal
			isOpen={true}
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
					width: '90%',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('boards.createBoard') || 'Utwórz nową tablicę'}>
			<h2 style={{ 
				marginBottom: '20px', 
				color: '#2c3e50',
				fontSize: '24px',
				fontWeight: '600'
			}}>
				{t('boards.createBoard') || 'Utwórz nową tablicę'}
			</h2>

			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.boardName') || 'Nazwa tablicy'} *
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t('boards.boardNamePlaceholder') || 'Wprowadź nazwę tablicy'}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}
						required
					/>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.description') || 'Opis'}
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t('boards.descriptionPlaceholder') || 'Wprowadź opis tablicy (opcjonalnie)'}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px',
							minHeight: '100px',
							resize: 'vertical'
						}}
					/>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.selectMembers') || 'Wybierz członków'}
					</label>
					<div style={{
						maxHeight: '200px',
						overflowY: 'auto',
						border: '1px solid #bdc3c7',
						borderRadius: '6px',
						padding: '10px'
					}}>
						{teamUsers.map(user => (
							<label
								key={user._id}
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: '8px',
									cursor: 'pointer',
									borderRadius: '4px',
									transition: 'background-color 0.2s'
								}}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
								<input
									type="checkbox"
									checked={selectedMembers.includes(user._id)}
									onChange={() => handleMemberToggle(user._id)}
									style={{ marginRight: '10px', transform: 'scale(1.2)' }}
								/>
								<span>{user.username}</span>
							</label>
						))}
					</div>
				</div>

				<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: '10px 20px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							backgroundColor: 'white',
							color: '#2c3e50',
							cursor: 'pointer',
							fontSize: '16px',
							fontWeight: '500'
						}}>
						{t('boards.cancel') || 'Anuluj'}
					</button>
					<button
						type="submit"
						disabled={createBoardMutation.isPending}
						style={{
							padding: '10px 20px',
							border: 'none',
							borderRadius: '6px',
							backgroundColor: '#3498db',
							color: 'white',
							cursor: createBoardMutation.isPending ? 'not-allowed' : 'pointer',
							fontSize: '16px',
							fontWeight: '500',
							opacity: createBoardMutation.isPending ? 0.6 : 1
						}}>
						{createBoardMutation.isPending ? (t('boards.creating') || 'Tworzenie...') : (t('boards.create') || 'Utwórz')}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default CreateBoardModal





