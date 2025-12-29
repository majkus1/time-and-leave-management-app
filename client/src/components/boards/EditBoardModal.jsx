import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { useUpdateBoard } from '../../hooks/useBoards'
import { useAlert } from '../../context/AlertContext'

Modal.setAppElement('#root')

function EditBoardModal({ board, onClose, onSuccess }) {
	const { t } = useTranslation()
	const { teamId } = useAuth()
	const { showAlert } = useAlert()
	const { data: users = [] } = useUsers()
	const updateBoardMutation = useUpdateBoard()
	
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [selectedMembers, setSelectedMembers] = useState([])

	// Filter users to only show users from the same team
	const teamUsers = users.filter(user => user.teamId === teamId)

	useEffect(() => {
		if (board) {
			setName(board.name || '')
			setDescription(board.description || '')
			setSelectedMembers(board.members ? board.members.map(m => m._id || m) : [])
		}
	}, [board])

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
			await updateBoardMutation.mutateAsync({
				boardId: board._id,
				data: {
					name: name.trim(),
					description: description.trim(),
					memberIds: selectedMembers
				}
			})
			await showAlert(t('boards.updateSuccess') || 'Tablica została zaktualizowana pomyślnie')
			onSuccess()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.updateError') || 'Błąd podczas aktualizacji tablicy')
		}
	}

	if (!board) return null

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
			contentLabel={t('boards.editBoard') || 'Edytuj tablicę'}>
			<h2 style={{ 
				marginBottom: '20px', 
				color: '#2c3e50',
				fontSize: '24px',
				fontWeight: '600'
			}}>
				{t('boards.editBoard') || 'Edytuj tablicę'}
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
						disabled={updateBoardMutation.isPending}
						style={{
							padding: '10px 20px',
							border: 'none',
							borderRadius: '6px',
							backgroundColor: '#3498db',
							color: 'white',
							cursor: updateBoardMutation.isPending ? 'not-allowed' : 'pointer',
							fontSize: '16px',
							fontWeight: '500',
							opacity: updateBoardMutation.isPending ? 0.6 : 1
						}}>
						{updateBoardMutation.isPending ? (t('boards.updating') || 'Aktualizowanie...') : (t('boards.save') || 'Zapisz')}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default EditBoardModal




