import React, { useEffect, useId, useRef, useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { escapeMarkdownLinkLabel, sanitizeTicketLinkUrl } from './ticketMarkdownUtils'

export default function TicketLinkModal({ isOpen, initialLabel = '', onClose, onInsert }) {
	const { t } = useTranslation()
	const urlInputRef = useRef(null)
	const titleId = useId()
	const [label, setLabel] = useState(initialLabel)
	const [url, setUrl] = useState('')
	const [error, setError] = useState('')

	useEffect(() => {
		if (!isOpen) return
		setLabel(initialLabel)
		setUrl('')
		setError('')
		const timer = setTimeout(() => urlInputRef.current?.focus(), 50)
		return () => clearTimeout(timer)
	}, [isOpen, initialLabel])

	const handleSubmit = (e) => {
		e.preventDefault()
		const safeUrl = sanitizeTicketLinkUrl(url)
		if (!safeUrl) {
			setError(t('tickets.markdownLinkUnsafe'))
			return
		}
		const trimmedLabel = label.trim() || t('tickets.markdownLinkLabel')
		onInsert({
			label: escapeMarkdownLinkLabel(trimmedLabel),
			url: safeUrl,
		})
		onClose()
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			overlayClassName="help-center__link-modal-overlay"
			className="help-center__link-modal"
			contentLabel={t('tickets.markdownLinkModalTitle')}
			aria={{ labelledby: titleId }}
		>
			<div className="help-center__link-modal-head">
				<h2 id={titleId} className="help-center__link-modal-title">
					{t('tickets.markdownLinkModalTitle')}
				</h2>
				<button type="button" className="help-center__link-modal-close" onClick={onClose} aria-label={t('tickets.markdownLinkCancel')}>
					×
				</button>
			</div>

			<form className="help-center__link-modal-form" onSubmit={handleSubmit}>
				<div className="help-center__field">
					<label htmlFor="ticket-link-label">{t('tickets.markdownLinkTextLabel')}</label>
					<input
						id="ticket-link-label"
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						className="help-center__input"
						placeholder={t('tickets.markdownLinkLabel')}
						autoComplete="off"
					/>
				</div>
				<div className="help-center__field">
					<label htmlFor="ticket-link-url">{t('tickets.markdownLinkUrl')}</label>
					<input
						id="ticket-link-url"
						ref={urlInputRef}
						type="url"
						inputMode="url"
						value={url}
						onChange={(e) => {
							setUrl(e.target.value)
							if (error) setError('')
						}}
						className="help-center__input"
						placeholder="https://"
						autoComplete="off"
						required
					/>
				</div>

				{error && (
					<div className="help-center__alert help-center__alert--err" role="alert">
						{error}
					</div>
				)}

				<div className="help-center__link-modal-actions">
					<button type="button" className="help-center__btn-ghost" onClick={onClose}>
						{t('tickets.markdownLinkCancel')}
					</button>
					<button type="submit" className="help-center__btn-primary">
						{t('tickets.markdownLinkInsert')}
					</button>
				</div>
			</form>
		</Modal>
	)
}
