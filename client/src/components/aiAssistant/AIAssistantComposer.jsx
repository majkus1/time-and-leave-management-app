import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Input + send + quick prompts (controlled submit from parent).
 */
function AIAssistantComposer({ onSend, disabled, busy, placeholder, showQuickPrompts = true }) {
	const { t } = useTranslation()
	const [value, setValue] = useState('')
	const ph = placeholder || t('aiAssistant.placeholder')

	const submit = useCallback(() => {
		const v = value.trim()
		if (!v || disabled || busy) return
		onSend(v)
		setValue('')
	}, [value, disabled, busy, onSend])

	const quick = useCallback(
		text => {
			if (disabled || busy) return
			onSend(text)
		},
		[disabled, busy, onSend]
	)

	return (
		<div className="ai-assistant-composer">
			{showQuickPrompts && (
				<div className="ai-assistant-quick">
					<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.summary'))} disabled={disabled || busy}>
						{t('aiAssistant.quick.summary')}
					</button>
					<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.leaves'))} disabled={disabled || busy}>
						{t('aiAssistant.quick.leaves')}
					</button>
					<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.tasks'))} disabled={disabled || busy}>
						{t('aiAssistant.quick.tasks')}
					</button>
					<button type="button" className="ai-assistant-quick__btn" onClick={() => quick(t('aiAssistant.quick.exportFile'))} disabled={disabled || busy}>
						{t('aiAssistant.quick.exportFile')}
					</button>
				</div>
			)}
			<div className="ai-assistant-composer__row">
				<textarea
					className="ai-assistant-composer__input"
					rows={3}
					placeholder={ph}
					value={value}
					onChange={e => setValue(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							submit()
						}
					}}
					disabled={disabled || busy}
				/>
				<button type="button" className="ai-assistant-composer__send" onClick={submit} disabled={disabled || busy || !value.trim()}>
					{busy ? '…' : t('aiAssistant.send')}
				</button>
			</div>
		</div>
	)
}

export default AIAssistantComposer
