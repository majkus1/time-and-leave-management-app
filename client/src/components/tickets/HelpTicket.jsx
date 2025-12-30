import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { isAdmin } from '../../utils/roleHelpers'
import { API_URL } from '../../config.js'
import { useTickets, useTicket, useCreateTicket, useReplyToTicket, useUpdateTicketStatus } from '../../hooks/useTickets'

const HelpTicket = () => {
	const { username, role } = useAuth()
	const [selectedTicketId, setSelectedTicketId] = useState(null)
	const [newTicket, setNewTicket] = useState({ topic: '', message: '', attachments: [] })
	const [reply, setReply] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [replyFiles, setReplyFiles] = useState([])
	const replyFileInputRef = useRef(null)
	const fileInputRef = useRef(null)
	const { t } = useTranslation()

	// TanStack Query hooks
	const { data: tickets = [], isLoading: loadingTickets, error: ticketsError } = useTickets()
	const { data: selectedTicket, isLoading: loadingTicket } = useTicket(selectedTicketId)
	const createTicketMutation = useCreateTicket()
	const replyToTicketMutation = useReplyToTicket()
	const updateTicketStatusMutation = useUpdateTicketStatus()

	const loading = loadingTickets || loadingTicket

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
			setNewTicket({ topic: '', message: '', attachment: null })
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
			setSuccess(t('tickets.replySuccess'))
		} catch (err) {
			setError(t('tickets.replyError'))
		}
	}

	const handleOpenTicket = ticket => {
		setSelectedTicketId(ticket._id)
		setError('')
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

			<div className="flex-1 max-w-3xl tickets">
				<h2 className="text-2xl font-bold mb-4"><img src="img/technical-support.png" alt="ikonka w sidebar" /> {t('tickets.title')}</h2>
				<hr />
				{!selectedTicket && (
					<div className="mb-8 border bg-white rounded-xl shadow p-4">
						<h3 className="font-semibold text-lg mb-3">{t('tickets.new')}</h3>
						<form className="flex flex-col gap-3" onSubmit={handleSendNewTicket}>
							<input
								type="text"
								name="topic"
								placeholder={t('tickets.topic')}
								value={newTicket.topic}
								onChange={handleNewTicketChange}
								required
								className="input input-bordered p-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<textarea
								name="message"
								placeholder={t('tickets.description')}
								value={newTicket.message}
								onChange={handleNewTicketChange}
								required
								className="input input-bordered min-h-[80px] p-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<div>
								<label className="cursor-pointer flex items-center gap-2">
									<span>{t('tickets.addAttachment')}</span>
									<input
										type="file"
										accept="image/*,application/pdf"
										className="hidden"
										ref={fileInputRef}
										onChange={handleFileChange}
										multiple
									/>
									{newTicket.attachments && newTicket.attachments.length > 0 && (
										<ul className="ml-2 text-xs text-gray-500">
											{newTicket.attachments.map((file, idx) => (
												<li key={idx}>{file.name}</li>
											))}
										</ul>
									)}
									<button type="button" onClick={() => fileInputRef.current.click()} className="btn btn-xs ml-2">
										{t('tickets.chooseFile')}
									</button>
								</label>
							</div>
							<button className="btn btn-primary w-full mt-2" disabled={loading} type="submit">
								{loading ? 'Loading...' : `${t('tickets.sendTicket')}`}
							</button>
							{success && <div className="text-green-700">{success}</div>}
							{error && <div className="text-red-600">{error}</div>}
						</form>
					</div>
				)}

				{!selectedTicket && (
					<div>
						<h3 className="font-semibold text-lg mb-2">{t('tickets.myTickets')}</h3>
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>{t('tickets.company')}</th>
										<th>{t('tickets.topic')}</th>
										<th>Status</th>
										<th>{t('tickets.date')}</th>
										<th></th>
									</tr>
								</thead>

								<tbody>
									{tickets.length === 0 && (
										<tr>
											<td colSpan={4} className="text-center text-gray-500">
												{t('tickets.notask')}
											</td>
										</tr>
									)}
									{tickets.map(ticket => (
										<tr key={ticket._id} onClick={() => handleOpenTicket(ticket)} style={{ cursor: 'pointer' }}>
											<td>{ticket.company}</td>
											<td>{ticket.topic}</td>
											<td>
												{ticket.status === 'Otwarte'
													? t('tickets.status1')
													: ticket.status === 'Zamknięte'
													? t('tickets.status2')
													: ticket.status}
											</td>

											<td>{new Date(ticket.createdAt).toLocaleString()}</td>
											<td>
												<button className="btn btn-xs btn-info" onClick={() => handleOpenTicket(ticket)}>
													{t('tickets.details')}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{selectedTicketId && selectedTicket && (
					<div className="border bg-white rounded-xl shadow p-4 mt-6">
						<button className="btn btn-sm btn-outline mb-3" onClick={handleBackToList}>
							← {t('tickets.backToList')}
						</button>
						<h3 className="font-semibold text-lg mb-3">{selectedTicket.topic}</h3>
						<p>
							<span>{t('tickets.author')}:</span> {selectedTicket.userEmail}
						</p>
						{isAdmin(role) ? (
							<div className="mb-2">
								<label className="font-semibold mr-2">Status:</label>
								<select
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
									className="select select-sm select-bordered border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="Otwarte">{t('tickets.status1')}</option>
									<option value="Zamknięte">{t('tickets.status2')}</option>
								</select>
							</div>
						) : (
							<p className="mb-2">
								<span className="font-semibold">Status:</span>{' '}
								{selectedTicket.status === 'Otwarte'
									? t('tickets.status1')
									: selectedTicket.status === 'Zamknięte'
									? t('tickets.status2')
									: selectedTicket.status}
							</p>
						)}

						<p className="mb-2">
							<span className="font-semibold">{t('tickets.createdAt')}:</span>{' '}
							{new Date(selectedTicket.createdAt).toLocaleString()}
						</p>
						<p className="mb-2">
							<span className="font-semibold">{t('tickets.messageContent')}:</span>
						</p>
						<p className="mb-4 bg-gray-100 p-2 rounded">
							{selectedTicket.messages && selectedTicket.messages.length > 0
								? selectedTicket.messages[0].content
								: `${t('tickets.nocontent')}`}
						</p>

						{selectedTicket.messages && selectedTicket.messages[0]?.files && selectedTicket.messages[0].files.length > 0 && (
							<div className="mb-2">
								{selectedTicket.messages[0].files.map((file, idx) => (
									<a
										key={idx}
										href={`${API_URL.replace('/api', '')}/uploads/${file}`}
										target="_blank"
										rel="noopener noreferrer"
										className="underline text-blue-600 p-2">
										{t('tickets.downloadAttachment')} {idx + 1}
									</a>
								))}
							</div>
						)}

						<hr className="my-4" />

						<div>
							<h4 className="font-semibold mb-2">{t('tickets.replyHistory')}</h4>
							<div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
								{selectedTicket.messages && selectedTicket.messages.length > 1 ? (
									selectedTicket.messages.slice(1).map((msg, idx) => (
										<div
											key={idx}
											className={`rounded p-2 ${
												msg.sender === (username === selectedTicket.userEmail ? 'user' : 'admin')
													? 'bg-blue-50 text-right ml-20'
													: 'bg-gray-200 mr-20'
											}`}>
											<div className="text-sm">{msg.content}</div>

											{msg.files && msg.files.length > 0 && (
												<div className="mt-1 text-xs flex flex-col gap-1">
													{msg.files.map((file, fileIdx) => (
														<a
															key={fileIdx}
															href={`${API_URL.replace('/api', '')}/uploads/${file}`}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 underline">
															{t('tickets.downloadAttachment')} {fileIdx + 1}
														</a>
													))}
												</div>
											)}

											<div className="text-xs text-gray-500 mt-1">
												{msg.author} {' — '}
												{new Date(msg.timestamp).toLocaleString()}
											</div>
										</div>
									))
								) : (
									<div className="text-gray-400 text-sm">{t('tickets.noanswer')}</div>
								)}
							</div>
						</div>

						<form className="mt-4 flex flex-col gap-2" onSubmit={handleSendReply} encType="multipart/form-data">
							<textarea
								value={reply}
								onChange={e => setReply(e.target.value)}
								placeholder={t('tickets.writeReply')}
								className="input input-bordered min-h-[60px] p-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<label className="cursor-pointer flex items-center gap-2">
								<span>{t('tickets.addAttachment')}</span>
								<input
									type="file"
									accept="image/*,application/pdf"
									className="hidden"
									ref={replyFileInputRef}
									onChange={handleReplyFileChange}
									multiple
								/>
								{replyFiles && replyFiles.length > 0 && (
									<ul className="ml-2 text-xs text-gray-500">
										{replyFiles.map((file, idx) => (
											<li key={idx}>{file.name}</li>
										))}
									</ul>
								)}
								<button type="button" onClick={() => replyFileInputRef.current.click()} className="btn btn-xs ml-2">
									{t('tickets.chooseFile')}
								</button>
							</label>
							<button className="btn btn-success self-end" type="submit" disabled={loading || !reply.trim()}>
								{loading ? 'Loading...' : `${t('tickets.sendTicket')}`}
							</button>
						</form>
						{success && <div className="text-green-700">{success}</div>}
						{error && <div className="text-red-600">{error}</div>}
					</div>
				)}
			</div>
		</>
	)
}

export default HelpTicket
