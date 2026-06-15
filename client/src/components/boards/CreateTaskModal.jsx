import React, { useEffect, useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useBoardUsers, useCreateTask } from '../../hooks/useBoards'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import { API_URL } from '../../config'

const STATUSES = [
	{ id: 'todo', label: 'Do zrobienia' },
	{ id: 'in-progress', label: 'W trakcie' },
	{ id: 'review', label: 'Do sprawdzenia' },
	{ id: 'done', label: 'Gotowe' }
]
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const ATTACH_ICON_SRC = '/img/attach-file.png'
const ATTACH_ICON_STYLE = {
	width: '16px',
	height: '16px',
	objectFit: 'contain',
	flexShrink: 0
}

function CreateTaskModal({ boardId, initialStatus = 'todo', onClose, onSuccess }) {
	const { t } = useTranslation()
	const { showAlert } = useAlert()
	const { userId } = useAuth()
	const createTaskMutation = useCreateTask()
	const { data: boardUsers = [] } = useBoardUsers(boardId, true)
	
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [status, setStatus] = useState(initialStatus)
	const [priority, setPriority] = useState('medium')
	const [assignToAllMembers, setAssignToAllMembers] = useState(false)
	const [selectedAssignees, setSelectedAssignees] = useState([])
	const [selectedFile, setSelectedFile] = useState(null)
	const [scheduleMode, setScheduleMode] = useState('none') // none | deadline | period
	const [dueDate, setDueDate] = useState('')
	const [periodStart, setPeriodStart] = useState('')
	const [periodEnd, setPeriodEnd] = useState('')

	useEffect(() => {
		if (!userId || assignToAllMembers || selectedAssignees.length > 0) return
		const currentUserInBoard = boardUsers.find((user) => String(user._id) === String(userId))
		if (currentUserInBoard) {
			setSelectedAssignees([String(userId)])
		}
	}, [userId, boardUsers, assignToAllMembers, selectedAssignees.length])

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!title.trim()) {
			await showAlert(t('boards.taskTitleRequired') || 'Tytuł zadania jest wymagany')
			return
		}
		if (!assignToAllMembers && selectedAssignees.length === 0) {
			await showAlert(t('boards.assigneeRequired') || 'Wybierz przynajmniej jedną osobę lub opcję przypisania do wszystkich')
			return
		}
		if (scheduleMode === 'deadline' && !dueDate) {
			await showAlert(t('boards.deadlineRequired') || 'Wybierz datę deadline')
			return
		}
		if (scheduleMode === 'period' && (!periodStart || !periodEnd)) {
			await showAlert(t('boards.periodRequired') || 'Podaj pełny okres (od–do)')
			return
		}

		try {
			// First create the task
			const taskData = {
				title: title.trim(),
				description: description.trim(),
				status,
				priority,
				assignToAllMembers,
				assignedTo: assignToAllMembers ? [] : selectedAssignees
			}
			
			const createdTask = await createTaskMutation.mutateAsync({
				boardId,
				data: taskData
			})

			// Then upload file if selected
			if (selectedFile && createdTask._id) {
				const formData = new FormData()
				formData.append('file', selectedFile)
				try {
					await axios.post(`${API_URL}/api/boards/tasks/${createdTask._id}/attachments`, formData, {
						withCredentials: true,
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					})
				} catch (fileError) {
					console.error('Error uploading file:', fileError)
					// Don't fail the whole operation if file upload fails
				}
			}

			await showAlert(t('boards.taskCreateSuccess') || 'Zadanie zostało utworzone pomyślnie')
			onSuccess()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.taskCreateError') || 'Błąd podczas tworzenia zadania')
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
					padding: '20px 0',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0 auto',
					maxWidth: '600px',
					width: '90%',
					maxHeight: 'calc(100vh - 40px)',
					overflowY: 'auto',
					borderRadius: '12px',
					padding: '20px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('boards.addTask') || 'Dodaj zadanie'}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h2 style={{ 
					margin: 0,
					color: '#2c3e50',
					fontSize: '24px',
					fontWeight: '600'
				}}>
					{t('boards.addTask') || 'Dodaj zadanie'}
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
						{t('boards.taskTitle') || 'Tytuł zadania'} *
					</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t('boards.taskTitlePlaceholder') || 'Wprowadź tytuł zadania'}
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
						placeholder={t('boards.taskDescriptionPlaceholder') || 'Wprowadź opis zadania (opcjonalnie)'}
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
						{t('boards.status') || 'Status'}
					</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}>
						{STATUSES.map(s => (
							<option key={s.id} value={s.id}>
								{t(`boards.status.${s.id}`)}
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.priority') || 'Priorytet'}
					</label>
					<select
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}>
						{PRIORITIES.map((priorityOption) => (
							<option key={priorityOption} value={priorityOption}>
								{t(`boards.priority.${priorityOption}`)}
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.scheduleType') || 'Termin / okres'}
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="createSched"
							checked={scheduleMode === 'none'}
							onChange={() => setScheduleMode('none')}
						/>
						<span>{t('boards.noSchedule') || 'Brak'}</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="createSched"
							checked={scheduleMode === 'deadline'}
							onChange={() => setScheduleMode('deadline')}
						/>
						<span>{t('boards.deadline') || 'Deadline'}</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="createSched"
							checked={scheduleMode === 'period'}
							onChange={() => setScheduleMode('period')}
						/>
						<span>{t('boards.workPeriod') || 'Okres realizacji'}</span>
					</label>
					{scheduleMode === 'deadline' && (
						<input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							style={{
								marginTop: '10px',
								display: 'block',
								width: '100%',
								maxWidth: '250px',
								boxSizing: 'border-box',
								padding: '10px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px'
							}}
						/>
					)}
					{scheduleMode === 'period' && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50' }}>
									{t('boards.periodFrom') || 'Od'}
								</label>
								<input
									type="date"
									value={periodStart}
									onChange={(e) => setPeriodStart(e.target.value)}
									style={{
										display: 'block',
										width: '100%',
										maxWidth: '250px',
										boxSizing: 'border-box',
										padding: '10px',
										border: '1px solid #bdc3c7',
										borderRadius: '6px',
										fontSize: '16px'
									}}
								/>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50' }}>
									{t('boards.periodTo') || 'Do'}
								</label>
								<input
									type="date"
									value={periodEnd}
									onChange={(e) => setPeriodEnd(e.target.value)}
									style={{
										display: 'block',
										width: '100%',
										maxWidth: '250px',
										boxSizing: 'border-box',
										padding: '10px',
										border: '1px solid #bdc3c7',
										borderRadius: '6px',
										fontSize: '16px'
									}}
								/>
							</div>
						</div>
					)}
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.assignTo') || 'Przypisz do'}
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={assignToAllMembers}
							onChange={(e) => {
								setAssignToAllMembers(e.target.checked)
								if (e.target.checked) setSelectedAssignees([])
							}}
						/>
						<span>{t('boards.assignToAllMembers') || t('boards.assignToAll') || 'Wszyscy członkowie tablicy'}</span>
					</label>
					{!assignToAllMembers && (
						<div style={{
							border: '1px solid #e1e8ed',
							borderRadius: '6px',
							maxHeight: '180px',
							overflowY: 'auto',
							padding: '10px',
							backgroundColor: '#fafbfd'
						}}>
							{boardUsers.length === 0 ? (
								<p style={{ margin: 0, color: '#7f8c8d' }}>{t('boards.noMembersToAssign') || 'Brak członków tablicy do przypisania'}</p>
							) : (
								boardUsers.map((user) => (
									<label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
										<input
											type="checkbox"
											checked={selectedAssignees.includes(user._id)}
											onChange={() => {
												setSelectedAssignees((prev) =>
													prev.includes(user._id)
														? prev.filter((id) => id !== user._id)
														: [...prev, user._id]
												)
											}}
										/>
										<span>{user.firstName} {user.lastName} ({user.username})</span>
									</label>
								))
							)}
						</div>
					)}
				</div>

				<div style={{ marginBottom: '20px' }}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.attachments') || 'Załączniki'}
					</label>
					<input
						type="file"
						onChange={(e) => setSelectedFile(e.target.files[0])}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}
					/>
					{selectedFile && (
						<div style={{ 
							marginTop: '8px', 
							padding: '8px',
							backgroundColor: '#f8f9fa',
							borderRadius: '6px',
							fontSize: '16px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center'
						}}>
							<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
								<img src={ATTACH_ICON_SRC} alt="" aria-hidden="true" style={ATTACH_ICON_STYLE} />
								<span>{selectedFile.name}</span>
							</span>
							<button
								type="button"
								onClick={() => setSelectedFile(null)}
								style={{
									background: 'transparent',
									border: 'none',
									color: '#dc3545',
									cursor: 'pointer',
									fontSize: '18px',
									padding: '4px 8px'
								}}>
								×
							</button>
						</div>
					)}
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
						disabled={createTaskMutation.isPending}
						style={{
							padding: '10px 20px',
							border: 'none',
							borderRadius: '6px',
							backgroundColor: '#00a846',
							color: 'white',
							cursor: createTaskMutation.isPending ? 'not-allowed' : 'pointer',
							fontSize: '16px',
							fontWeight: '500',
							opacity: createTaskMutation.isPending ? 0.6 : 1
						}}>
						{createTaskMutation.isPending ? (t('boards.creating') || 'Tworzenie...') : (t('boards.create') || 'Utwórz')}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default CreateTaskModal

