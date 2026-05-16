import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Chat list + new chat (localStorage-backed sessions, per userId).
 */
function AIAssistantSessionSidebar({
	sessionsSorted,
	activeId,
	onSelect,
	onNew,
	onDelete,
	getTitle,
}) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)

	return (
		<>
			<button
				type="button"
				className="ai-assistant-sessions-toggle"
				onClick={() => setOpen(o => !o)}
				aria-expanded={open}
				aria-controls="ai-assistant-sessions-panel"
			>
				{open ? t('aiAssistant.sessions.hide') : t('aiAssistant.sessions.show')}
			</button>

			<aside
				id="ai-assistant-sessions-panel"
				className={`ai-assistant-sessions ${open ? 'ai-assistant-sessions--open' : ''}`}
				aria-label={t('aiAssistant.sessions.label')}
			>
				<div className="ai-assistant-sessions__head">
					<span className="ai-assistant-sessions__title">{t('aiAssistant.sessions.title')}</span>
					<button type="button" className="ai-assistant-sessions__new" onClick={() => { onNew(); setOpen(false) }}>
						+ {t('aiAssistant.sessions.new')}
					</button>
				</div>
				<ul className="ai-assistant-sessions__list">
					{sessionsSorted.map(s => (
						<li key={s.id}>
							<button
								type="button"
								className={`ai-assistant-sessions__item ${s.id === activeId ? 'ai-assistant-sessions__item--active' : ''}`}
								onClick={() => {
									onSelect(s.id)
									setOpen(false)
								}}
							>
								<span className="ai-assistant-sessions__item-title">{getTitle(s)}</span>
								<span className="ai-assistant-sessions__item-meta">
									{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ''}
								</span>
							</button>
							<button
								type="button"
								className="ai-assistant-sessions__delete"
								onClick={e => {
									e.stopPropagation()
									onDelete(s.id)
								}}
								aria-label={t('aiAssistant.sessions.delete')}
							>
								×
							</button>
						</li>
					))}
				</ul>
			</aside>
			{open && (
				<button
					type="button"
					className="ai-assistant-sessions-backdrop"
					aria-label={t('aiAssistant.sessions.close')}
					onClick={() => setOpen(false)}
				/>
			)}
		</>
	)
}

export default AIAssistantSessionSidebar
