import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { isAdmin } from '../../utils/roleHelpers'
import { API_URL } from '../../config.js'
import { useTickets, useTicket, useCreateTicket, useReplyToTicket, useUpdateTicketStatus } from '../../hooks/useTickets'
import './HelpTicket.css'

const uploadsBase = API_URL.replace(/\/api\/?$/, '')

const MailIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
		<path
			d="M4 6h16v12H4V6zm2 0 6 5 6-5"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)

const HelpTicket = () => {
	const { username, role } = useAuth()
	const [selectedTicketId, setSelectedTicketId] = useState(null)
	const [newTicket, setNewTicket] = useState({ topic: '', message: '', attachments: [] })
	const [reply, setReply] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [replyFiles, setReplyFiles] = useState([])
	const [mobileIntroOpen, setMobileIntroOpen] = useState(false)
	const replyFileInputRef = useRef(null)
	const fileInputRef = useRef(null)
	const { t } = useTranslation()

	const canChangeTicketStatus =
		isAdmin(role) || (username && username.trim().toLowerCase() === 'michalipka1@gmail.com')

	const { data: tickets = [], isLoading: loadingTickets, error: ticketsError } = useTickets()
	const { data: selectedTicket, isLoading: loadingTicket } = useTicket(selectedTicketId)
	const createTicketMutation = useCreateTicket()
	const replyToTicketMutation = useReplyToTicket()
	const updateTicketStatusMutation = useUpdateTicketStatus()

	const loadingDetail = loadingTicket
	const creating = createTicketMutation.isPending
	const replying = replyToTicketMutation.isPending

	const handleReplyFileChange = e => {
		setReplyFiles(Array.from(e.target.files))
	}

	const handleNewTicketChange = e => {
		const { name, value } = e.target
		setNewTicket(prev => ({ ...prev, [name]: value }))
	}

	const handleFileChange = e => {
		setNewTicket(prev => ({
			...prev,
			attachments: Array.from(e.target.files),
		}))
	}

	const handleSendNewTicket = async e => {
		e.preventDefault()
		setSuccess('')
		setError('')
		try {
			const formData = new FormData()
			formData.append('topic', newTicket.topic)
			formData.append('message', newTicket.message)
			if (newTicket.attachments && newTicket.attachments.length > 0) {
				newTicket.attachments.forEach(file => {
					formData.append('attachments', file)
				})
			}

			await createTicketMutation.mutateAsync(formData)
			setSuccess(t('tickets.createSuccess'))
			setNewTicket({ topic: '', message: '', attachments: [] })
			if (fileInputRef.current) fileInputRef.current.value = ''
		} catch (err) {
			setError(t('tickets.createError'))
		}
	}

	const handleSendReply = async e => {
		e.preventDefault()
		setError('')
		if (!selectedTicketId) return

		try {
			const formData = new FormData()
			formData.append('message', reply)
			replyFiles.forEach(file => formData.append('attachments', file))
			await replyToTicketMutation.mutateAsync({ ticketId: selectedTicketId, formData })
			setReply('')
			setReplyFiles([])
			if (replyFileInputRef.current) replyFileInputRef.current.value = ''
			setSuccess(t('tickets.replySuccess'))
		} catch (err) {
			setError(t('tickets.replyError'))
		}
	}

	const handleOpenTicket = ticket => {
		setSelectedTicketId(ticket._id)
		setError('')
		setSuccess('')
	}

	const handleBackToList = () => {
		setSelectedTicketId(null)
		setReply('')
		setError('')
		setSuccess('')
	}

	return (
		<>
			<Sidebar />

			<div className="content p-3 flex-1 min-w-0">
				<div className="help-center tickets">
					<div className="help-center__shell">
					{!(selectedTicketId && selectedTicket && !loadingDetail) && (
						<header className="help-center__hero">
							<div className="help-center__hero-inner">
								<img className="help-center__hero-icon" src="img/technical-support.png" alt="" />
								<div>
									<h1>{t('tickets.title')}</h1>
									<p className="help-center__subtitle">{t('tickets.subtitle')}</p>
								</div>
							</div>
						</header>
					)}

					{ticketsError && (
						<div className="help-center__alert help-center__alert--err" role="alert">
							{ticketsError.response?.status === 503
								? t('tickets.dbUnavailable')
								: t('tickets.fetchError')}
						</div>
					)}

					{!selectedTicket && (
						<section className="help-center__intro">
							<button
								type="button"
								className="help-center__intro-mobile-toggle"
								aria-expanded={mobileIntroOpen}
								onClick={() => setMobileIntroOpen(o => !o)}>
								<span>{t('tickets.introMobileToggle')}</span>
								<span className="help-center__intro-mobile-toggle-icon" aria-hidden>
									{mobileIntroOpen ? '▲' : '▼'}
								</span>
							</button>
							<div
								className={`help-center__intro-stack ${mobileIntroOpen ? 'help-center__intro-stack--open' : ''}`}>
								<p className="help-center__intro-lead">{t('tickets.introLead')}</p>
								<ul className="help-center__bullets">
									<li>{t('tickets.bulletBugs')}</li>
									<li>{t('tickets.bulletIdeas')}</li>
									<li>{t('tickets.bulletIntegrations')}</li>
									<li>{t('tickets.bulletOpen')}</li>
								</ul>
								<div className="help-center__email-note">
									<MailIcon />
									<span>{t('tickets.emailNotifyHint')}</span>
								</div>
							</div>
						</section>
					)}

					{!selectedTicket && (
						<div className="help-center__grid">
							<section className="help-center__card">
								<h2>{t('tickets.new')}</h2>
								<form className="help-center__form" onSubmit={handleSendNewTicket}>
									<div className="help-center__field">
										<label htmlFor="help-topic">{t('tickets.topicLabel')}</label>
										<input
											id="help-topic"
											type="text"
											name="topic"
											placeholder={t('tickets.topic')}
											value={newTicket.topic}
											onChange={handleNewTicketChange}
											required
											className="help-center__input"
										/>
									</div>
									<div className="help-center__field">
										<label htmlFor="help-message">{t('tickets.messageLabel')}</label>
										<textarea
											id="help-message"
											name="message"
											placeholder={t('tickets.description')}
											value={newTicket.message}
											onChange={handleNewTicketChange}
											required
											className="help-center__textarea"
										/>
									</div>
									<div className="help-center__attachments-row">
										<input
											type="file"
											accept="image/*,application/pdf"
											className="hidden"
											ref={fileInputRef}
											onChange={handleFileChange}
											multiple
										/>
										<button
											type="button"
											className="help-center__btn-ghost"
											onClick={() => fileInputRef.current?.click()}>
											{t('tickets.chooseFile')}
										</button>
										<span className="text-gray-500 text-sm">{t('tickets.addAttachment')}</span>
									</div>
									{newTicket.attachments && newTicket.attachments.length > 0 && (
										<ul className="text-xs text-gray-500 mt-1 mb-2 list-disc pl-4">
											{newTicket.attachments.map((file, idx) => (
												<li key={idx}>{file.name}</li>
											))}
										</ul>
									)}
									<button className="help-center__btn-primary" disabled={creating} type="submit">
										{creating ? t('tickets.sending') : t('tickets.sendTicket')}
									</button>
									{success && (
										<div className="help-center__alert help-center__alert--ok mt-3">{success}</div>
									)}
									{error && <div className="help-center__alert help-center__alert--err mt-3">{error}</div>}
								</form>
							</section>

							<section className="help-center__card">
								<h2>{t('tickets.myTickets')}</h2>
								{loadingTickets ? (
									<p className="text-gray-500 text-sm">{t('tickets.loadingList')}</p>
								) : tickets.length === 0 ? (
									<p className="text-gray-500 text-sm">{t('tickets.notask')}</p>
								) : (
									<div className="help-center__ticket-list">
										{tickets.map(ticket => (
											<button
												key={ticket._id}
												type="button"
												className="help-center__ticket-card"
												onClick={() => handleOpenTicket(ticket)}>
												<div className="help-center__ticket-card-top">
													<span className="help-center__ticket-topic">{ticket.topic}</span>
													<span
														className={`help-center__badge ${
															ticket.status === 'Zamknięte'
																? 'help-center__badge--closed'
																: 'help-center__badge--open'
														}`}>
														{ticket.status === 'Otwarte'
															? t('tickets.status1')
															: ticket.status === 'Zamknięte'
																? t('tickets.status2')
																: ticket.status}
													</span>
												</div>
												<div className="help-center__ticket-meta">
													{ticket.company} · {new Date(ticket.createdAt).toLocaleString()}
												</div>
											</button>
										))}
									</div>
								)}
							</section>
						</div>
					)}

					{selectedTicketId && loadingDetail && (
						<p className="text-gray-500 text-sm">{t('tickets.loadingList')}</p>
					)}

					{selectedTicketId && selectedTicket && !loadingDetail && (
						<div className="help-center__card help-center__detail">
							<button type="button" className="help-center__back" onClick={handleBackToList}>
								← {t('tickets.backToList')}
							</button>
							<h2 className="text-lg font-semibold text-gray-800 mb-2">{selectedTicket.topic}</h2>
							<p className="text-sm text-gray-600 mb-3">
								<span className="font-medium text-gray-700">{t('tickets.author')}:</span>{' '}
								{selectedTicket.userEmail}
							</p>
							{canChangeTicketStatus ? (
								<div className="mb-3 flex flex-wrap items-center gap-2">
									<label className="text-sm font-medium text-gray-700" htmlFor="ticket-status">
										{t('tickets.status')}:
									</label>
									<select
										id="ticket-status"
										value={selectedTicket?.status || ''}
										onChange={async e => {
											const newStatus = e.target.value
											if (!selectedTicketId) return
											try {
												await updateTicketStatusMutation.mutateAsync({
													ticketId: selectedTicketId,
													status: newStatus,
												})
											} catch (err) {
												setError(t('tickets.statusUpdateError'))
											}
										}}
										disabled={updateTicketStatusMutation.isPending}
										className="help-center__input max-w-[200px] py-1 text-sm">
										<option value="Otwarte">{t('tickets.status1')}</option>
										<option value="Zamknięte">{t('tickets.status2')}</option>
									</select>
								</div>
							) : (
								<p className="mb-3 text-sm">
									<span className="font-medium text-gray-700">{t('tickets.status')}:</span>{' '}
									{selectedTicket.status === 'Otwarte'
										? t('tickets.status1')
										: selectedTicket.status === 'Zamknięte'
											? t('tickets.status2')
											: selectedTicket.status}
								</p>
							)}

							<p className="text-sm text-gray-600 mb-2">
								<span className="font-medium text-gray-700">{t('tickets.createdAt')}:</span>{' '}
								{new Date(selectedTicket.createdAt).toLocaleString()}
							</p>
							<p className="text-sm font-medium text-gray-700 mb-1">{t('tickets.messageContent')}</p>
							<div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-800 mb-4">
								{selectedTicket.messages && selectedTicket.messages.length > 0
									? selectedTicket.messages[0].content
									: t('tickets.nocontent')}
							</div>

							{selectedTicket.messages && selectedTicket.messages[0]?.files && selectedTicket.messages[0].files.length > 0 && (
								<div className="flex flex-wrap gap-2 mb-4">
									{selectedTicket.messages[0].files.map((file, idx) => (
										<a
											key={idx}
											href={`${uploadsBase}/uploads/${file}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-teal-700 underline">
											{t('tickets.downloadAttachment')} {idx + 1}
										</a>
									))}
								</div>
							)}

							<hr className="border-gray-200 my-4" />

							<h3 className="text-sm font-semibold text-gray-800 mb-2">{t('tickets.replyHistory')}</h3>
							<div className="help-center__thread">
								{selectedTicket.messages && selectedTicket.messages.length > 1 ? (
									selectedTicket.messages.slice(1).map((msg, idx) => (
										<div
											key={idx}
											className={`help-center__bubble flex flex-col gap-1 ${
												msg.sender === 'admin' ? 'help-center__bubble--staff' : 'help-center__bubble--user'
											}`}>
											<div className="text-sm whitespace-pre-wrap text-gray-800">{msg.content}</div>
											{msg.files && msg.files.length > 0 && (
												<div className="flex flex-col gap-1">
													{msg.files.map((file, fileIdx) => (
														<a
															key={fileIdx}
															href={`${uploadsBase}/uploads/${file}`}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs text-teal-700 underline">
															{t('tickets.downloadAttachment')} {fileIdx + 1}
														</a>
													))}
												</div>
											)}
											<div className="text-xs text-gray-500">
												{msg.author} — {new Date(msg.timestamp).toLocaleString()}
											</div>
										</div>
									))
								) : (
									<div className="text-gray-400 text-sm">{t('tickets.noanswer')}</div>
								)}
							</div>

							<form className="mt-4 flex flex-col gap-2" onSubmit={handleSendReply} encType="multipart/form-data">
								<label className="text-sm font-medium text-gray-700" htmlFor="help-reply">
									{t('tickets.writeReply')}
								</label>
								<textarea
									id="help-reply"
									value={reply}
									onChange={e => setReply(e.target.value)}
									placeholder={t('tickets.writeReply')}
									className="help-center__textarea min-h-[4.5rem]"
								/>
								<div className="help-center__attachments-row">
									<input
										type="file"
										accept="image/*,application/pdf"
										className="hidden"
										ref={replyFileInputRef}
										onChange={handleReplyFileChange}
										multiple
									/>
									<button
										type="button"
										className="help-center__btn-ghost"
										onClick={() => replyFileInputRef.current?.click()}>
										{t('tickets.chooseFile')}
									</button>
									{replyFiles && replyFiles.length > 0 && (
										<ul className="text-xs text-gray-500 flex flex-wrap gap-2 list-none p-0 m-0">
											{replyFiles.map((file, idx) => (
												<li key={idx}>{file.name}</li>
											))}
										</ul>
									)}
								</div>
								<button
									className="help-center__btn-primary max-w-xs self-end"
									type="submit"
									disabled={replying || !reply.trim()}>
									{replying ? t('tickets.sending') : t('tickets.sendReply')}
								</button>
							</form>
							{success && (
								<div className="help-center__alert help-center__alert--ok mt-3">{success}</div>
							)}
							{error && <div className="help-center__alert help-center__alert--err mt-3">{error}</div>}
						</div>
					)}
					</div>
				</div>
			</div>
		</>
	)
}

export default HelpTicket
