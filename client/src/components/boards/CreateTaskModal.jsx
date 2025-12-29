import React, { useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useCreateTask } from '../../hooks/useBoards'
import { useAlert } from '../../context/AlertContext'
import axios from 'axios'
import { API_URL } from '../../config'

Modal.setAppElement('#root')

const STATUSES = [
	{ id: 'todo', label: 'Do zrobienia' },
	{ id: 'in-progress', label: 'W trakcie' },
	{ id: 'review', label: 'Do sprawdzenia' },
	{ id: 'done', label: 'Gotowe' }
]

function CreateTaskModal({ boardId, initialStatus = 'todo', onClose, onSuccess }) {
	const { t } = useTranslation()
	const { showAlert } = useAlert()
	const createTaskMutation = useCreateTask()
	
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [status, setStatus] = useState(initialStatus)
	const [selectedFile, setSelectedFile] = useState(null)

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!title.trim()) {
			await showAlert(t('boards.taskTitleRequired') || 'Tytuł zadania jest wymagany')
			return
		}

		try {
			// First create the task
			const taskData = {
				title: title.trim(),
				description: description.trim(),
				status,
				assignedTo: []
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
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0',
					maxWidth: '600px',
					width: '90%',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('boards.addTask') || 'Dodaj zadanie'}>
			<h2 style={{ 
				marginBottom: '20px', 
				color: '#2c3e50',
				fontSize: '24px',
				fontWeight: '600'
			}}>
				{t('boards.addTask') || 'Dodaj zadanie'}
			</h2>

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
								{t(`boards.status.${s.id}`) || s.label}
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
							fontSize: '14px'
						}}
					/>
					{selectedFile && (
						<div style={{ 
							marginTop: '8px', 
							padding: '8px',
							backgroundColor: '#f8f9fa',
							borderRadius: '6px',
							fontSize: '14px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center'
						}}>
							<span>📎 {selectedFile.name}</span>
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
							fontSize: '14px',
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
							backgroundColor: '#3498db',
							color: 'white',
							cursor: createTaskMutation.isPending ? 'not-allowed' : 'pointer',
							fontSize: '14px',
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

