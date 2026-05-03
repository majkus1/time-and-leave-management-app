import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { preprocessAssistantMarkdownForChat } from './preprocessAssistantMarkdown'

function Bubble({ role, content, userLabel, assistantLabel, exportOffer, onIntentExport, busy, exportExcelLabel, exportPdfLabel, exportHint }) {
	const isUser = role === 'user'
	const [downloading, setDownloading] = useState(null)

	const runExport = async fmt => {
		if (!exportOffer || !onIntentExport) return
		setDownloading(fmt)
		try {
			await onIntentExport(fmt, exportOffer)
		} finally {
			setDownloading(null)
		}
	}

	const body = (
		<>
			<div className="ai-assistant-msg__role">{isUser ? userLabel : assistantLabel}</div>
			<div className={`ai-assistant-msg__body ${!isUser ? 'ai-assistant-msg__body--md' : ''}`}>
				{isUser ? (
					content
				) : (
					<div className="ai-assistant-md">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							rehypePlugins={[rehypeRaw, rehypeSanitize]}
						>
							{preprocessAssistantMarkdownForChat(content)}
						</ReactMarkdown>
					</div>
				)}
			</div>
			{!isUser && exportOffer && onIntentExport && (
				<div className="ai-assistant-msg__export">
					<p className="ai-assistant-msg__export-hint">{exportHint}</p>
					<div className="ai-assistant-msg__export-btns">
						<button
							type="button"
							className="ai-assistant-msg__export-btn"
							disabled={busy || downloading}
							onClick={() => runExport('excel')}
						>
							{downloading === 'excel' ? '…' : exportExcelLabel}
						</button>
						<button
							type="button"
							className="ai-assistant-msg__export-btn"
							disabled={busy || downloading}
							onClick={() => runExport('pdf')}
						>
							{downloading === 'pdf' ? '…' : exportPdfLabel}
						</button>
					</div>
				</div>
			)}
		</>
	)

	if (isUser) {
		return <div className="ai-assistant-msg ai-assistant-msg--user">{body}</div>
	}

	return (
		<div className="ai-assistant-msg ai-assistant-msg--assistant ai-assistant-msg--with-avatar">
			<img
				className="ai-assistant-msg__avatar"
				src="/img/planioanswer.png"
				alt=""
				aria-hidden
				draggable={false}
			/>
			<div className="ai-assistant-msg__stack">{body}</div>
		</div>
	)
}

/**
 * Scrollable message list; assistant bubbles render Markdown (GFM).
 */
function AIAssistantMessageList({ messages, onIntentExport, busy }) {
	const { t } = useTranslation()
	const bottomRef = useRef(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	return (
		<div className="ai-assistant-messages" role="log" aria-live="polite">
			{messages.length === 0 && (
				<div className="ai-assistant-empty ai-assistant-empty--with-planio">
					<img
						className="ai-assistant-empty__mascot"
						src="/img/planioask.png"
						alt=""
						draggable={false}
					/>
					<p className="ai-assistant-empty__hint">{t('aiAssistant.emptyHint')}</p>
				</div>
			)}
			{messages.map((m, i) => (
				<Bubble
					key={`ai-msg-${i}`}
					role={m.role}
					content={m.content}
					userLabel={t('aiAssistant.roleUser')}
					assistantLabel={t('aiAssistant.roleAssistant')}
					exportOffer={m.exportOffer}
					onIntentExport={onIntentExport}
					busy={busy}
					exportExcelLabel={t('aiAssistant.intentExportExcel')}
					exportPdfLabel={t('aiAssistant.intentExportPdf')}
					exportHint={t('aiAssistant.intentExportHint')}
				/>
			))}
			<div ref={bottomRef} />
		</div>
	)
}

export default AIAssistantMessageList
