import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useSupervisorSubordinates, useUpdateSupervisorSubordinates } from '../../hooks/useSupervisor'
import { useUsers } from '../../hooks/useUsers'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'

Modal.setAppElement('#root')

function SubordinatesModal({ isOpen, onClose, supervisorId }) {
	const { t } = useTranslation()
	const { showAlert } = useAlert()
	const { data: subordinates = [], isLoading } = useSupervisorSubordinates(supervisorId, isOpen)
	const { data: allUsers = [] } = useUsers()
	const updateSubordinatesMutation = useUpdateSupervisorSubordinates()

	const [selectedSubordinates, setSelectedSubordinates] = useState([])

	useEffect(() => {
		if (subordinates && subordinates.length > 0) {
			const selected = subordinates
				.filter(user => user.isSubordinate)
				.map(user => user._id.toString())
			setSelectedSubordinates(selected)
		}
	}, [subordinates])

	const handleSubordinateToggle = (userId) => {
		setSelectedSubordinates(prev => 
			prev.includes(userId) 
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			await updateSubordinatesMutation.mutateAsync({
				supervisorId,
				subordinateIds: selectedSubordinates
			})
			await showAlert(t('logs.subordinatesUpdated') || 'Lista pracowników została zaktualizowana')
			onClose()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('logs.subordinatesError') || 'Błąd podczas aktualizacji listy pracowników')
		}
	}

	if (!isOpen) return null

	// Filtruj użytkowników z tego samego zespołu co przełożony
	const supervisor = allUsers.find(u => u._id === supervisorId)
	const teamUsers = allUsers.filter(user => 
		user._id !== supervisorId && 
		user.teamId === supervisor?.teamId
	)

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
					maxWidth: '700px',
					width: '90%',
					maxHeight: '90vh',
					overflowY: 'auto',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('logs.manageSubordinates') || 'Zarządzanie pracownikami'}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					<h2 style={{ 
						margin: 0,
						color: '#2c3e50',
						fontSize: '24px',
						fontWeight: '600'
					}}>
						{t('logs.manageSubordinates') || 'Zarządzanie pracownikami'}
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
			) : (
				<form onSubmit={handleSubmit}>
					<div style={{ marginBottom: '20px' }}>
						<p style={{ 
							color: '#7f8c8d',
							fontSize: '14px',
							marginBottom: '15px'
						}}>
							{t('logs.selectSubordinates') || 'Wybierz pracowników, dla których ten użytkownik ma być przełożonym:'}
						</p>
						<div style={{
							maxHeight: '400px',
							overflowY: 'auto',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							padding: '10px'
						}}>
							{teamUsers.length === 0 ? (
								<div style={{ 
									textAlign: 'center', 
									padding: '40px',
									color: '#7f8c8d'
								}}>
									{t('logs.noTeamUsers') || 'Brak użytkowników w zespole'}
								</div>
							) : (
								teamUsers.map(user => (
									<label
										key={user._id}
										style={{
											display: 'flex',
											alignItems: 'center',
											padding: '12px',
											cursor: 'pointer',
											borderRadius: '4px',
											transition: 'background-color 0.2s',
											marginBottom: '5px'
										}}
										onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
										onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
										<input
											type="checkbox"
											checked={selectedSubordinates.includes(user._id.toString())}
											onChange={() => handleSubordinateToggle(user._id.toString())}
											style={{ marginRight: '10px', transform: 'scale(1.2)' }}
										/>
										<div style={{ flex: 1 }}>
											<div style={{ 
												fontWeight: '500', 
												color: '#2c3e50',
												marginBottom: '3px'
											}}>
												{user.firstName} {user.lastName}
											</div>
											{user.username && (
												<div style={{ 
													fontSize: '13px', 
													color: '#7f8c8d'
												}}>
													{user.username}
												</div>
											)}
											{user.position && (
												<div style={{ 
													fontSize: '13px', 
													color: '#95a5a6',
													fontStyle: 'italic'
												}}>
													{user.position}
												</div>
											)}
										</div>
									</label>
								))
							)}
						</div>
					</div>

					<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
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
							disabled={updateSubordinatesMutation.isPending}
							style={{
								padding: '10px 20px',
								border: 'none',
								borderRadius: '6px',
								backgroundColor: '#3498db',
								color: 'white',
								cursor: updateSubordinatesMutation.isPending ? 'not-allowed' : 'pointer',
								fontSize: '16px',
								fontWeight: '500',
								opacity: updateSubordinatesMutation.isPending ? 0.6 : 1
							}}>
							{updateSubordinatesMutation.isPending ? (t('schedule.updating') || 'Aktualizowanie...') : (t('schedule.save') || 'Zapisz')}
						</button>
					</div>
				</form>
			)}
		</Modal>
	)
}

export default SubordinatesModal

