import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateChannel } from '../../hooks/useChat'
import { useTeamMembers } from '../../hooks/useChat'
import { useAuth } from '../../context/AuthContext'
import './Chat.css'

function CreateChannelModal({ isOpen, onClose, onSuccess }) {
	const { t } = useTranslation()
	const { username: currentUsername } = useAuth()
	const [channelName, setChannelName] = useState('')
	const [description, setDescription] = useState('')
	const [channelType, setChannelType] = useState('general')
	const [selectedMembers, setSelectedMembers] = useState([])
	
	const { mutate: createChannel, isLoading: isCreating } = useCreateChannel()
	const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers()

	const handleSubmit = (e) => {
		e.preventDefault()
		
		if (!channelName.trim()) {
			alert(t('chat.channelNameRequired'))
			return
		}

		if (channelType === 'private' && selectedMembers.length === 0) {
			alert(t('chat.noMembersSelected'))
			return
		}

		createChannel(
			{
				name: channelName.trim(),
				type: channelType,
				description: description.trim(),
				memberIds: (channelType === 'private' || channelType === 'general') ? selectedMembers : []
			},
			{
				onSuccess: () => {
					setChannelName('')
					setDescription('')
					setChannelType('general')
					setSelectedMembers([])
					onSuccess()
					onClose()
				},
				onError: (error) => {
					alert(error.response?.data?.message || t('chat.channelError'))
				}
			}
		)
	}

	const toggleMember = (userId) => {
		setSelectedMembers(prev =>
			prev.includes(userId)
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		)
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>{t('chat.createChannel')}</h3>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>
				<form onSubmit={handleSubmit} className="modal-body">
					<div className="form-group">
						<label>{t('chat.channelName')}</label>
						<input
							type="text"
							value={channelName}
							onChange={(e) => setChannelName(e.target.value)}
							required
							placeholder="#channel-name"
						/>
					</div>
					
					<div className="form-group">
						<label>{t('chat.channelDescription')}</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows="3"
							placeholder={t('chat.channelDescription')}
						/>
					</div>

					<div className="form-group">
						<label>{t('chat.channelType')}</label>
						<select
							value={channelType}
							onChange={(e) => setChannelType(e.target.value)}
							disabled
							style={{
								appearance: 'none',
								WebkitAppearance: 'none',
								MozAppearance: 'none',
								backgroundImage: 'none'
							}}
						>
							<option value="general">{t('chat.channelTypeGeneral')}</option>
							<option value="private">{t('chat.channelTypePrivate')}</option>
						</select>
					</div>

					{(channelType === 'private' || channelType === 'general') && (
						<div className="form-group">
							<label>
								{channelType === 'private' 
									? t('chat.selectMembers') 
									: t('chat.selectMembers') + ' ' + t('chat.optional')}
							</label>
							{membersLoading ? (
								<p>{t('chat.loading')}</p>
							) : (
								<div className="members-list">
									{teamMembers
										.filter(member => member.username !== currentUsername)
										.map(member => (
											<label key={member._id} className="member-checkbox">
												<input
													type="checkbox"
													checked={selectedMembers.includes(member._id)}
													onChange={() => toggleMember(member._id)}
												/>
												<span>{member.firstName} {member.lastName} ({member.username})</span>
											</label>
										))}
								</div>
							)}
						</div>
					)}

					<div className="modal-footer">
						<button type="button" onClick={onClose} disabled={isCreating}>
							{t('chat.cancel')}
						</button>
						<button type="submit" disabled={isCreating}>
							{isCreating ? t('chat.loading') : t('chat.create')}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default CreateChannelModal

