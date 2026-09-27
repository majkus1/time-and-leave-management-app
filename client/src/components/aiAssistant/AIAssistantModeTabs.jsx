import React from 'react'
import { useTranslation } from 'react-i18next'

/** Tryby asystenta — ikony z tego samego zestawu co sidebar. */
const MODES = [
	{ id: 'chat', icon: '/img/chat.png' },
	{ id: 'leave', icon: '/img/sunbed.png' },
	{ id: 'workday', icon: '/img/clock.png' },
	{ id: 'help', icon: '/img/info.png' },
]

/**
 * Zakładki trybów (czat z danymi / wniosek urlopowy / ewidencja / pomoc) — jeden rząd zamiast przycisków
 * „włącz / wyjdź z trybu”. Wniosek i ewidencja wymagają czatu z danymi (limit AI, moduł planu).
 */
function AIAssistantModeTabs({ mode, onChange, dataDisabled, busy }) {
	const { t } = useTranslation()
	return (
		<div className="ai-assistant-modes" role="tablist" aria-label={t('aiAssistant.modes.label')}>
			{MODES.map(m => {
				const active = mode === m.id
				const needsData = m.id === 'leave' || m.id === 'workday'
				return (
					<button
						key={m.id}
						type="button"
						role="tab"
						aria-selected={active}
						className={`ai-assistant-modes__tab${active ? ' ai-assistant-modes__tab--active' : ''}`}
						disabled={busy || (needsData && dataDisabled)}
						onClick={() => !active && onChange(m.id)}
					>
						<img className="ai-assistant-modes__icon" src={m.icon} alt="" aria-hidden draggable={false} />
						<span className="ai-assistant-modes__label">{t(`aiAssistant.modes.${m.id}`)}</span>
					</button>
				)
			})}
		</div>
	)
}

export default AIAssistantModeTabs
