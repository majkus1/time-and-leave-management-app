import React from 'react'
import { useTranslation } from 'react-i18next'

const PRESETS = ['week', 'month', 'year', 'all', 'custom']

/**
 * Period selector for data context (presentational).
 */
function AIAssistantPeriodBar({
	preset,
	onPresetChange,
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
	disabled,
}) {
	const { t } = useTranslation()

	return (
		<div className="ai-assistant-period">
			<span className="ai-assistant-period__label">{t('aiAssistant.dataPeriod')}</span>
			<div className="ai-assistant-period__chips">
				{PRESETS.filter(p => p !== 'default').map(key => (
					<button
						key={key}
						type="button"
						className={`ai-assistant-chip ${preset === key ? 'ai-assistant-chip--active' : ''}`}
						onClick={() => onPresetChange(key)}
						disabled={disabled}
					>
						{t(`aiAssistant.period.${key}`)}
					</button>
				))}
			</div>
			{preset === 'custom' && (
				<div className="ai-assistant-period__dates">
					<label className="ai-assistant-period__date-label">
						<span>{t('aiAssistant.dateFrom')}</span>
						<input
							type="date"
							value={dateFrom}
							onChange={e => onDateFromChange(e.target.value)}
							disabled={disabled}
						/>
					</label>
					<label className="ai-assistant-period__date-label">
						<span>{t('aiAssistant.dateTo')}</span>
						<input
							type="date"
							value={dateTo}
							onChange={e => onDateToChange(e.target.value)}
							disabled={disabled}
						/>
					</label>
				</div>
			)}
		</div>
	)
}

export default AIAssistantPeriodBar
