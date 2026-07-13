import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	applyTextareaEdit,
	prefixTextareaLines,
	wrapTextareaSelection,
} from './ticketMarkdownUtils'
import TicketLinkModal from './TicketLinkModal'

function ToolbarButton({ title, onClick, children, active }) {
	return (
		<button
			type="button"
			className={`help-center__md-btn${active ? ' is-active' : ''}`}
			onClick={onClick}
			title={title}
			aria-label={title}
		>
			{children}
		</button>
	)
}

export default function TicketMarkdownEditor({
	id,
	value,
	onChange,
	placeholder,
	className = '',
	minRows = 5,
	required = false,
}) {
	const { t } = useTranslation()
	const textareaRef = useRef(null)
	const linkSelectionRef = useRef({ start: 0, end: 0 })
	const [linkModalOpen, setLinkModalOpen] = useState(false)
	const [linkModalLabel, setLinkModalLabel] = useState('')

	const runEdit = (editFn) => {
		const textarea = textareaRef.current
		if (!textarea) return
		const { next, cursorStart, cursorEnd } = editFn(textarea)
		onChange(next)
		requestAnimationFrame(() => {
			applyTextareaEdit(textarea, next, cursorStart, cursorEnd)
		})
	}

	const wrap = (before, after, placeholderText) => {
		runEdit((ta) => wrapTextareaSelection(ta, before, after, placeholderText))
	}

	const openLinkModal = () => {
		const textarea = textareaRef.current
		if (!textarea) return
		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		linkSelectionRef.current = { start, end }
		const selected = textarea.value.slice(start, end)
		setLinkModalLabel(selected)
		setLinkModalOpen(true)
	}

	const handleInsertLink = ({ label, url }) => {
		const textarea = textareaRef.current
		if (!textarea) return
		const { start, end } = linkSelectionRef.current
		const valueNow = textarea.value
		const insertion = `[${label}](${url})`
		const next = valueNow.slice(0, start) + insertion + valueNow.slice(end)
		onChange(next)
		requestAnimationFrame(() => {
			const pos = start + insertion.length
			applyTextareaEdit(textarea, next, pos, pos)
		})
	}

	return (
		<div className="help-center__md-editor">
			<div className="help-center__md-toolbar" role="toolbar" aria-label={t('tickets.markdownToolbar')}>
				<ToolbarButton title={t('tickets.markdownBold')} onClick={() => wrap('**', '**', t('tickets.markdownBoldSample'))}>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton title={t('tickets.markdownItalic')} onClick={() => wrap('*', '*', t('tickets.markdownItalicSample'))}>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton
					title={t('tickets.markdownBulletList')}
					onClick={() => runEdit((ta) => prefixTextareaLines(ta, '- '))}
				>
					<span aria-hidden>•</span>
				</ToolbarButton>
				<ToolbarButton title={t('tickets.markdownLink')} onClick={openLinkModal}>
					🔗
				</ToolbarButton>
			</div>
			<TicketLinkModal
				isOpen={linkModalOpen}
				initialLabel={linkModalLabel}
				onClose={() => setLinkModalOpen(false)}
				onInsert={handleInsertLink}
			/>
			<textarea
				id={id}
				ref={textareaRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`help-center__textarea help-center__md-textarea ${className}`.trim()}
				rows={minRows}
				required={required}
			/>
		</div>
	)
}
