import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { useUpdateSchedule } from '../../hooks/useSchedule'
import { useAlert } from '../../context/AlertContext'

function EditScheduleModal({ schedule, onClose, onSuccess }) {
	const { t } = useTranslation()
	const { teamId } = useAuth()
	const { showAlert } = useAlert()
	const { data: users = [] } = useUsers()
	const updateScheduleMutation = useUpdateSchedule()
	
	const [name, setName] = useState('')
	const [selectedMembers, setSelectedMembers] = useState([])

	// Filter users to only show users from the same team
	const teamUsers = users.filter(user => user.teamId === teamId)

	useEffect(() => {
		if (schedule) {
			setName(schedule.name || '')
			setSelectedMembers(schedule.members ? schedule.members.map(m => m._id || m) : [])
		}
	}, [schedule])

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
			await showAlert(t('schedule.nameRequired') || 'Nazwa grafiku jest wymagana')
			return
		}

		try {
			await updateScheduleMutation.mutateAsync({
				scheduleId: schedule._id,
				data: {
					name: name.trim(),
					memberIds: selectedMembers
				}
			})
			await showAlert(t('schedule.updateSuccess') || 'Grafik został zaktualizowany pomyślnie')
			onSuccess()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.updateError') || 'Błąd podczas aktualizacji grafiku')
		}
	}

	if (!schedule) return null

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
			contentLabel={t('schedule.editSchedule') || 'Edytuj grafik'}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h2 style={{ 
					margin: 0,
					color: '#2c3e50',
					fontSize: '24px',
					fontWeight: '600'
				}}>
					{t('schedule.editSchedule') || 'Edytuj grafik'}
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

			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('schedule.scheduleName') || 'Nazwa grafiku'} *
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t('schedule.scheduleNamePlaceholder') || 'Wprowadź nazwę grafiku'}
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
						{t('schedule.selectMembers') || 'Wybierz członków'}
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
								<span>{user.firstName} {user.lastName}{user.position ? ` - ${user.position}` : ''}</span>
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
						{t('schedule.cancel') || 'Anuluj'}
					</button>
					<button
						type="submit"
						disabled={updateScheduleMutation.isPending}
						style={{
							padding: '10px 20px',
							border: 'none',
							borderRadius: '6px',
							backgroundColor: '#3498db',
							color: 'white',
							cursor: updateScheduleMutation.isPending ? 'not-allowed' : 'pointer',
							fontSize: '16px',
							fontWeight: '500',
							opacity: updateScheduleMutation.isPending ? 0.6 : 1
						}}>
						{updateScheduleMutation.isPending ? (t('schedule.updating') || 'Aktualizowanie...') : (t('schedule.save') || 'Zapisz')}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default EditScheduleModal

