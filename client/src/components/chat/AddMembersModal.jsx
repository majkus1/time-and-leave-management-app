import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddMembersToChannel, useRemoveMembersFromChannel, useChannels } from '../../hooks/useChat'
import { useTeamMembers } from '../../hooks/useChat'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import './Chat.css'

function AddMembersModal({ isOpen, onClose, channel, onSuccess }) {
	const { t } = useTranslation()
	const { username: currentUsername } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const [selectedMembers, setSelectedMembers] = useState([])
	const [currentChannel, setCurrentChannel] = useState(channel)
	
	const { mutate: addMembers, isLoading: isAdding } = useAddMembersToChannel()
	const { mutate: removeMembers, isLoading: isRemoving } = useRemoveMembersFromChannel()
	const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers()
	const { data: channels = [], refetch: refetchChannels } = useChannels()
	
	// Update currentChannel when channel prop changes or channels are refetched
	useEffect(() => {
		if (channel && channels.length > 0) {
			const updatedChannel = channels.find(c => c._id === channel._id)
			if (updatedChannel) {
				setCurrentChannel(updatedChannel)
			} else if (channel) {
				// If channel not found in list, keep the original
				setCurrentChannel(channel)
			}
		} else if (channel) {
			setCurrentChannel(channel)
		}
	}, [channel, channels])
	
	// Use currentChannel instead of channel for member lists
	const channelToUse = currentChannel || channel

	// Get all members (both in channel and available to add)
	const allMembers = teamMembers.filter(member => member.username !== currentUsername)
	
	// Separate members who are in the channel and who are not
	const channelMemberIds = channelToUse?.members ? channelToUse.members.map(m => {
		const memberId = m._id ? m._id.toString() : m.toString()
		return memberId
	}) : []
	
	const membersInChannel = allMembers.filter(member => 
		channelMemberIds.includes(member._id.toString())
	)
	
	const availableMembers = allMembers.filter(member => 
		!channelMemberIds.includes(member._id.toString())
	)

	const handleAddMembers = async (e) => {
		e.preventDefault()
		
		if (selectedMembers.length === 0) {
			await showAlert(t('chat.noMembersSelected'))
			return
		}

		addMembers(
			{
				channelId: channelToUse._id,
				memberIds: selectedMembers
			},
			{
				onSuccess: async () => {
					setSelectedMembers([])
					// Refetch channels to get updated member list
					await refetchChannels()
					onSuccess()
					await showAlert(t('chat.membersAdded'))
					onClose()
				},
				onError: async (error) => {
					await showAlert(error.response?.data?.message || t('chat.membersError'))
				}
			}
		)
	}

	const handleRemoveMember = async (memberId) => {
		const confirmed = await showConfirm(t('chat.removeMemberConfirm'))
		if (!confirmed) {
			return
		}

		removeMembers(
			{
				channelId: channelToUse._id,
				memberIds: [memberId]
			},
			{
				onSuccess: async () => {
					// Refetch channels to get updated member list
					await refetchChannels()
					onSuccess()
					await showAlert(t('chat.memberRemoved'))
				},
				onError: async (error) => {
					await showAlert(error.response?.data?.message || t('chat.removeMemberError'))
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

	if (!isOpen || !channelToUse) return null

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>{t('chat.addMembers')}</h3>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>
				<div className="modal-body">
					{/* Members in channel - can be removed */}
					{membersInChannel.length > 0 && (
						<div className="form-group">
							<label>{t('chat.membersInChannel')}</label>
							<div className="members-list">
								{membersInChannel.map(member => (
									<div key={member._id} className="member-item">
										<span>{member.firstName} {member.lastName} ({member.username})</span>
										<button
											type="button"
											className="btn-remove-member"
											onClick={() => handleRemoveMember(member._id)}
											disabled={isRemoving}
											title={t('chat.removeMember')}
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Available members - can be added */}
					<div className="form-group">
						<label>{t('chat.selectMembers')}</label>
						{membersLoading ? (
							<p>{t('chat.loading')}</p>
						) : availableMembers.length === 0 ? (
							<p>{t('chat.allMembersInChannel')}</p>
						) : (
							<form onSubmit={handleAddMembers}>
								<div className="members-list">
									{availableMembers.map(member => (
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
								<div className="modal-footer">
									<button type="button" onClick={onClose} disabled={isAdding || isRemoving}>
										{t('chat.cancel')}
									</button>
									<button type="submit" disabled={isAdding || isRemoving || selectedMembers.length === 0}>
										{isAdding ? t('chat.loading') : t('chat.add')}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default AddMembersModal
