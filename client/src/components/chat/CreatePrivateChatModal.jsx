import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreatePrivateChat } from '../../hooks/useChat'
import { useTeamMembers } from '../../hooks/useChat'
import { useAuth } from '../../context/AuthContext'
import './Chat.css'

function CreatePrivateChatModal({ isOpen, onClose, onSuccess }) {
	const { t } = useTranslation()
	const { username: currentUsername } = useAuth()
	const [selectedUserId, setSelectedUserId] = useState('')
	
	const { mutate: createPrivateChat, isLoading: isCreating } = useCreatePrivateChat()
	const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers()

	const handleSubmit = (e) => {
		e.preventDefault()
		
		if (!selectedUserId) {
			alert(t('chat.selectUser'))
			return
		}

		createPrivateChat(
			{ userId: selectedUserId },
			{
				onSuccess: (channel) => {
					setSelectedUserId('')
					onSuccess(channel)
					onClose()
				},
				onError: (error) => {
					alert(error.response?.data?.message || t('chat.privateChatError'))
				}
			}
		)
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>{t('chat.createPrivateChat')}</h3>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>
				<form onSubmit={handleSubmit} className="modal-body">
					<div className="form-group">
						<label>{t('chat.selectUser')}</label>
						{membersLoading ? (
							<p>{t('chat.loading')}</p>
						) : (
							<select
								value={selectedUserId}
								onChange={(e) => setSelectedUserId(e.target.value)}
								required
							>
								<option value="">{t('chat.selectUser')}</option>
								{teamMembers
									.filter(member => member.username !== currentUsername)
									.map(member => (
										<option key={member._id} value={member._id}>
											{member.firstName} {member.lastName} ({member.username})
										</option>
									))}
							</select>
						)}
					</div>

					<div className="modal-footer">
						<button type="button" onClick={onClose} disabled={isCreating}>
							{t('chat.cancel')}
						</button>
						<button type="submit" disabled={isCreating || !selectedUserId}>
							{isCreating ? t('chat.loading') : t('chat.create')}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default CreatePrivateChatModal




















