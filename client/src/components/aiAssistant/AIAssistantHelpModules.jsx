import React from 'react'
import { useTranslation } from 'react-i18next'

/** Ikony jak w sidebarze — ten sam zestaw z /img. */
const MODULE_ICONS = {
	general: '/img/info.png',
	timeTracking: '/img/clock.png',
	qr: '/img/timer.png',
	leave: '/img/sunbed.png',
	schedules: '/img/schedule.png',
	tasks: '/img/project.png',
	chat: '/img/chat.png',
	settingsRoles: '/img/settings.png',
	packages: '/img/wallet.png',
	ai: '/img/planio.png',
}

/**
 * Chipy modułów trybu „Jak działa Planopia” + podpowiedzi wybranego modułu.
 * Lista modułów i pytań przychodzi z GET /api/ai-help/modules; etykiety z i18n (fallback: tytuł z API).
 *
 * @param {object} props
 * @param {Array<{id:string,title:string,summary:string,suggestedQuestions:string[]}>} props.modules
 * @param {string|null} props.activeModule
 * @param {(id: string|null) => void} props.onSelectModule — klik aktywnego chipa odznacza (pytanie ogólne)
 * @param {(question: string) => void} props.onAsk — klik podpowiedzi wysyła pytanie
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loadError]
 */
function AIAssistantHelpModules({ modules, activeModule, onSelectModule, onAsk, disabled, loadError }) {
	const { t } = useTranslation()
	const list = Array.isArray(modules) ? modules : []
	const active = list.find(m => m.id === activeModule) || null
	const suggestions = (active || list.find(m => m.id === 'general'))?.suggestedQuestions || []

	const labelFor = m => {
		const key = `aiAssistant.help.modules.${m.id}`
		const label = t(key)
		return label && label !== key ? label : m.title
	}

	return (
		<div className="ai-assistant-help" data-testid="ai-help-modules">
			<div className="ai-assistant-help__row">
				<span className="ai-assistant-help__label">{t('aiAssistant.help.modulesLabel')}</span>
				<div className="ai-assistant-help__chips" role="group" aria-label={t('aiAssistant.help.modulesLabel')}>
					{list.map(m => {
						const isActive = m.id === activeModule
						return (
							<button
								key={m.id}
								type="button"
								className={`ai-assistant-chip ai-assistant-help__chip${isActive ? ' ai-assistant-chip--active' : ''}`}
								aria-pressed={isActive}
								title={m.summary}
								disabled={disabled}
								onClick={() => onSelectModule(isActive ? null : m.id)}
							>
								{MODULE_ICONS[m.id] && (
									<img className="ai-assistant-help__chip-icon" src={MODULE_ICONS[m.id]} alt="" aria-hidden draggable={false} />
								)}
								<span>{labelFor(m)}</span>
							</button>
						)
					})}
				</div>
			</div>
			{loadError && (
				<p className="ai-assistant-help__error" role="status">
					{t('aiAssistant.help.modulesLoadError')}
				</p>
			)}
			{suggestions.length > 0 && (
				<div className="ai-assistant-help__row ai-assistant-help__row--suggestions">
					<span className="ai-assistant-help__label">{t('aiAssistant.help.suggestionsLabel')}</span>
					<div className="ai-assistant-help__suggestions">
						{suggestions.slice(0, 4).map(q => (
							<button
								key={q}
								type="button"
								className="ai-assistant-quick__btn ai-assistant-help__suggestion"
								disabled={disabled}
								onClick={() => onAsk(q)}
							>
								{q}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default AIAssistantHelpModules
