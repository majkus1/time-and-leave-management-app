import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import {
	useAnnouncements,
	useCreateAnnouncement,
	useDeleteAnnouncement,
	useMarkAnnouncementsSeen,
} from '../../hooks/useAnnouncements'
import { useTeamMembers } from '../../hooks/useChat'
import { useDepartments } from '../../hooks/useDepartments'
import { API_URL } from '../../config'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024

const formatDateTime = (value, language) => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return date.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US')
}

function Announcements() {
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const { teamId, role, userId } = useAuth()
	const { data: announcements = [], isLoading } = useAnnouncements()
	const { data: teamMembers = [] } = useTeamMembers()
	const { data: departments = [] } = useDepartments(teamId)
	const createAnnouncementMutation = useCreateAnnouncement()
	const deleteAnnouncementMutation = useDeleteAnnouncement()
	const markAnnouncementsSeenMutation = useMarkAnnouncementsSeen()
	const canCreateAnnouncements = isAdmin(role) || isHR(role) || isSupervisor(role)
	const canDeleteAnyAnnouncement = isAdmin(role) || isHR(role)

	const [title, setTitle] = useState('')
	const [content, setContent] = useState('')
	const [targetScope, setTargetScope] = useState('all')
	const [targetDepartment, setTargetDepartment] = useState('')
	const [targetUsers, setTargetUsers] = useState([])
	const [attachments, setAttachments] = useState([])
	const [isCreateFormVisible, setIsCreateFormVisible] = useState(false)
	const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null)

	const sortedMembers = useMemo(
		() =>
			[...teamMembers].sort((a, b) =>
				`${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`)
			),
		[teamMembers]
	)

	useEffect(() => {
		markAnnouncementsSeenMutation.mutate()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const resetForm = () => {
		setTitle('')
		setContent('')
		setTargetScope('all')
		setTargetDepartment('')
		setTargetUsers([])
		setAttachments([])
		setIsCreateFormVisible(false)
	}

	const handleSelectFiles = async (event) => {
		const incomingFiles = Array.from(event.target.files || [])
		if (incomingFiles.length === 0) return

		if (attachments.length + incomingFiles.length > MAX_FILES) {
			await showAlert(t('announcements.tooManyFiles') || 'Możesz dodać maksymalnie 5 załączników.')
			event.target.value = ''
			return
		}

		const invalidFile = incomingFiles.find((file) => file.size > MAX_FILE_SIZE)
		if (invalidFile) {
			await showAlert(t('announcements.fileTooLarge') || 'Maksymalny rozmiar jednego pliku to 10 MB.')
			event.target.value = ''
			return
		}

		setAttachments((prev) => [...prev, ...incomingFiles])
		event.target.value = ''
	}

	const removeAttachment = (index) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index))
	}

	const toggleUser = (userId) => {
		setTargetUsers((prev) =>
			prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
		)
	}

	const getAudienceLabel = (announcement) => {
		if (announcement.targetScope === 'all') return t('announcements.targetAll')
		if (announcement.targetScope === 'department') {
			return `${t('announcements.targetDepartment')}: ${announcement.targetDepartment || '-'}`
		}
		if (announcement.targetScope === 'users') {
			const users = Array.isArray(announcement.targetUsers) ? announcement.targetUsers : []
			if (users.length === 0) return t('announcements.targetUsers')
			const names = users.map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username).join(', ')
			return `${t('announcements.targetUsers')}: ${names}`
		}
		return '-'
	}

	const handleSubmit = async (event) => {
		event.preventDefault()
		const trimmedTitle = title.trim()
		const trimmedContent = content.trim()

		if (!trimmedTitle || !trimmedContent) {
			await showAlert(t('announcements.validationRequired') || 'Uzupełnij tytuł i opis komunikatu.')
			return
		}
		if (targetScope === 'department' && !targetDepartment) {
			await showAlert(t('announcements.validationDepartment') || 'Wybierz dział dla komunikatu.')
			return
		}
		if (targetScope === 'users' && targetUsers.length === 0) {
			await showAlert(t('announcements.validationUsers') || 'Wybierz przynajmniej jednego użytkownika.')
			return
		}

		try {
			await createAnnouncementMutation.mutateAsync({
				title: trimmedTitle,
				content: trimmedContent,
				targetScope,
				targetDepartment: targetScope === 'department' ? targetDepartment : '',
				targetUsers: targetScope === 'users' ? targetUsers : [],
				attachments,
			})
			resetForm()
			await showAlert(t('announcements.createSuccess') || 'Komunikat został dodany.')
		} catch (error) {
			await showAlert(error?.response?.data?.message || t('announcements.createError') || 'Nie udało się dodać komunikatu.')
		}
	}

	const handleDeleteAnnouncement = async (announcementId) => {
		const confirmed = await showConfirm(
			t('announcements.deleteConfirm') || 'Czy na pewno chcesz usunąć ten komunikat?'
		)
		if (!confirmed) return

		try {
			setDeletingAnnouncementId(announcementId)
			await deleteAnnouncementMutation.mutateAsync(announcementId)
			await showAlert(t('announcements.deleteSuccess') || 'Komunikat został usunięty.')
		} catch (error) {
			await showAlert(
				error?.response?.data?.message || t('announcements.deleteError') || 'Nie udało się usunąć komunikatu.'
			)
		} finally {
			setDeletingAnnouncementId(null)
		}
	}

	if (isLoading) {
		return (
			<>
				<Sidebar />
				<div className="content-with-loader">
					<Loader />
				</div>
			</>
		)
	}

	return (
		<>
			<Sidebar />
			<div className="container-fluid p-0">
				<div className="board-list" style={{ maxWidth: '900px', padding: '15px' }}>
					<div style={{ marginBottom: '30px' }}>
						<h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '28px', fontWeight: '600' }}>
							<img src="/img/announcement.png" alt="Announcements" />{' '}
							{t('announcements.title') || 'Komunikaty'}
						</h2>
						<hr />
					</div>

					{canCreateAnnouncements && (
					<div
						style={{
							backgroundColor: 'white',
							borderRadius: '12px',
							padding: '20px',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
							marginBottom: '20px',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: '12px',
								flexWrap: 'wrap',
							}}
						>
							<h3 style={{ marginBottom: 0, color: '#2c3e50' }}>
								{t('announcements.newAnnouncement') || 'Nowy komunikat'}
							</h3>
							<button
								type="button"
								onClick={() => {
									if (isCreateFormVisible) {
										resetForm()
									} else {
										setIsCreateFormVisible(true)
									}
								}}
								style={{
									padding: '10px 14px',
									borderRadius: '8px',
									border: 'none',
									backgroundColor: isCreateFormVisible ? '#64748b' : '#00a846',
									color: 'white',
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								{isCreateFormVisible
									? t('announcements.closeForm') || 'Zamknij formularz'
									: t('announcements.openForm') || 'Dodaj nowy komunikat'}
							</button>
						</div>

						{isCreateFormVisible && (
							<form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder={t('announcements.titlePlaceholder') || 'Tytuł komunikatu'}
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d6dbe0',
										borderRadius: '8px',
									}}
								/>
								<textarea
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder={t('announcements.contentPlaceholder') || 'Opis komunikatu'}
									rows={4}
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d6dbe0',
										borderRadius: '8px',
										resize: 'vertical',
									}}
								/>
							</div>

							<div style={{ marginTop: '16px' }}>
								<label style={{ fontWeight: 600, color: '#2c3e50' }}>
									{t('announcements.recipients') || 'Odbiorcy'}
								</label>
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
									<label>
										<input
											type="radio"
											name="targetScope"
											value="all"
											checked={targetScope === 'all'}
											onChange={(e) => setTargetScope(e.target.value)}
										/>{' '}
										{t('announcements.targetAll') || 'Wszyscy'}
									</label>
									<label>
										<input
											type="radio"
											name="targetScope"
											value="department"
											checked={targetScope === 'department'}
											onChange={(e) => setTargetScope(e.target.value)}
										/>{' '}
										{t('announcements.targetDepartment') || 'Dział'}
									</label>
									<label>
										<input
											type="radio"
											name="targetScope"
											value="users"
											checked={targetScope === 'users'}
											onChange={(e) => setTargetScope(e.target.value)}
										/>{' '}
										{t('announcements.targetUsers') || 'Użytkownicy'}
									</label>
								</div>
							</div>

							{targetScope === 'department' && (
								<div style={{ marginTop: '12px' }}>
									<select
										value={targetDepartment}
										onChange={(e) => setTargetDepartment(e.target.value)}
										style={{
											width: '100%',
											padding: '10px 12px',
											border: '1px solid #d6dbe0',
											borderRadius: '8px',
										}}
									>
										<option value="">{t('announcements.selectDepartment') || 'Wybierz dział'}</option>
										{departments.map((department) => (
											<option key={department} value={department}>
												{department}
											</option>
										))}
									</select>
								</div>
							)}

							{targetScope === 'users' && (
								<div
									style={{
										marginTop: '12px',
										padding: '12px',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										maxHeight: '220px',
										overflowY: 'auto',
										backgroundColor: '#f8fafc',
									}}
								>
									{sortedMembers.map((member) => {
										const fullName =
											`${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username
										return (
											<label key={member._id} style={{ display: 'block', marginBottom: '8px' }}>
												<input
													type="checkbox"
													checked={targetUsers.includes(member._id)}
													onChange={() => toggleUser(member._id)}
												/>{' '}
												{fullName}
											</label>
										)
									})}
								</div>
							)}

							<div style={{ marginTop: '12px' }}>
								<label
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '8px',
										cursor: 'pointer',
										color: '#2c3e50',
										fontWeight: 500,
									}}
								>
									<img src="/img/attach-file.png" alt={t('announcements.attachments') || 'Załączniki'} style={{ width: '18px', height: '18px' }} />
									{t('announcements.addAttachment') || 'Dodaj załącznik'}
									<input type="file" multiple onChange={handleSelectFiles} style={{ display: 'none' }} />
								</label>
								{attachments.length > 0 && (
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
										{attachments.map((file, index) => (
											<div
												key={`${file.name}-${index}`}
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: '8px',
													padding: '6px 10px',
													borderRadius: '14px',
													backgroundColor: '#eef2ff',
												}}
											>
												<span style={{ fontSize: '13px' }}>{file.name}</span>
												<button
													type="button"
													onClick={() => removeAttachment(index)}
													style={{
														border: 'none',
														background: 'transparent',
														cursor: 'pointer',
														color: '#dc2626',
													}}
												>
													×
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<button
								type="submit"
								disabled={createAnnouncementMutation.isPending}
								style={{
									marginTop: '16px',
									width: '100%',
									padding: '12px 16px',
									borderRadius: '8px',
									border: 'none',
									backgroundColor: createAnnouncementMutation.isPending ? '#94a3b8' : '#00a846',
									color: '#fff',
									fontWeight: 600,
									cursor: createAnnouncementMutation.isPending ? 'not-allowed' : 'pointer',
								}}
							>
								{createAnnouncementMutation.isPending
									? t('announcements.saving') || 'Zapisywanie...'
									: t('announcements.create') || 'Dodaj komunikat'}
							</button>
							</form>
						)}
					</div>
					)}

					<div style={{ display: 'grid', gap: '16px' }}>
						{announcements.map((announcement) => {
							const creatorName =
								`${announcement?.createdBy?.firstName || ''} ${announcement?.createdBy?.lastName || ''}`.trim() ||
								announcement?.createdBy?.username ||
								'-'
							const creatorId = announcement?.createdBy?._id || announcement?.createdBy
							const isAuthor = creatorId && userId && creatorId.toString() === userId.toString()
							const isDeletingThisAnnouncement = deletingAnnouncementId === announcement._id
							return (
								<div
									key={announcement._id}
									style={{
										backgroundColor: 'white',
										borderRadius: '12px',
										padding: '18px',
										boxShadow: '0 4px 6px rgba(0, 0, 0, 0.08)',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
										<h4 style={{ margin: 0, color: '#1f2937', overflowWrap: 'anywhere' }}>{announcement.title}</h4>
										<span style={{ color: '#64748b', fontSize: '13px' }}>
											{formatDateTime(announcement.createdAt, i18n.resolvedLanguage)}
										</span>
									</div>
									<div style={{ marginTop: '8px', color: '#475569', whiteSpace: 'pre-wrap' }}>{announcement.content}</div>
									<div style={{ marginTop: '10px', fontSize: '13px', color: '#475569' }}>
										<strong>{t('announcements.createdBy') || 'Autor'}:</strong> {creatorName}
									</div>
									<div style={{ marginTop: '4px', fontSize: '13px', color: '#475569' }}>
										<strong>{t('announcements.recipients') || 'Odbiorcy'}:</strong> {getAudienceLabel(announcement)}
									</div>
									{(canDeleteAnyAnnouncement || isAuthor) && (
										<div style={{ marginTop: '10px' }}>
											<button
												type="button"
												onClick={() => handleDeleteAnnouncement(announcement._id)}
												disabled={isDeletingThisAnnouncement}
												style={{
													backgroundColor: '#dc2626',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													padding: '8px 12px',
													cursor: isDeletingThisAnnouncement ? 'not-allowed' : 'pointer',
													fontSize: '13px',
													fontWeight: 600,
												}}
											>
												{isDeletingThisAnnouncement
													? t('announcements.deleting') || 'Usuwanie...'
													: t('announcements.delete') || 'Usuń'}
											</button>
										</div>
									)}
									{Array.isArray(announcement.attachments) && announcement.attachments.length > 0 && (
										<div style={{ marginTop: '10px' }}>
											<div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
												{t('announcements.attachments') || 'Załączniki'}
											</div>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
												{announcement.attachments.map((file, index) => (
													<a
														key={`${file.path}-${index}`}
														href={`${API_URL}/uploads/${file.path}`}
														target="_blank"
														rel="noreferrer"
														style={{ color: '#2563eb', textDecoration: 'none', overflowWrap: 'anywhere' }}
													>
														📎 {file.filename}
													</a>
												))}
											</div>
										</div>
									)}
								</div>
							)
						})}
					</div>

					{announcements.length === 0 && (
						<div
							style={{
								marginTop: '20px',
								textAlign: 'center',
								color: '#64748b',
								padding: '24px',
								backgroundColor: 'white',
								borderRadius: '12px',
							}}
						>
							{canCreateAnnouncements
								? t('announcements.emptyAdmin') || 'Brak komunikatów w zespole.'
								: t('announcements.emptyUser') || 'Brak komunikatów dla Ciebie.'}
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default Announcements
