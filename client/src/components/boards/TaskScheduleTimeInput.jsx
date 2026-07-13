import React, { useMemo } from 'react'

const selectStyle = {
	boxSizing: 'border-box',
	padding: '10px 8px',
	border: '1px solid var(--po-input-border, #bdc3c7)',
	borderRadius: '6px',
	fontSize: '16px',
	backgroundColor: 'var(--po-input-bg, #fff)',
	color: 'var(--po-input-text, #2c3e50)',
	minWidth: 0,
}

function parseTimeValue(value) {
	if (!value || typeof value !== 'string') return { hour: '', minute: '' }
	const match = value.trim().match(/^(\d{1,2}):(\d{2})/)
	if (!match) return { hour: '', minute: '' }
	return { hour: match[1].padStart(2, '0'), minute: match[2] }
}

function buildTimeValue(hour, minute) {
	if (!hour) return ''
	const h = String(hour).padStart(2, '0')
	const m = minute ? String(minute).padStart(2, '0') : '00'
	return `${h}:${m}`
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/**
 * @param {{ value: string, onChange: (v: string) => void, id?: string, label?: string, t: (k: string) => string }} props
 */
function TaskScheduleTimeInput({ value, onChange, id = 'task-schedule-time', label, t }) {
	const { hour, minute } = useMemo(() => parseTimeValue(value), [value])
	const hourId = `${id}-hour`
	const minuteId = `${id}-minute`

	const handleHourChange = (e) => {
		const nextHour = e.target.value
		if (!nextHour) {
			onChange('')
			return
		}
		onChange(buildTimeValue(nextHour, minute || '00'))
	}

	const handleMinuteChange = (e) => {
		if (!hour) return
		onChange(buildTimeValue(hour, e.target.value || '00'))
	}

	const handleClear = () => onChange('')

	return (
		<div className="task-schedule-time-input" style={{ marginTop: '8px' }}>
			<label htmlFor={hourId} style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--po-text, #2c3e50)', fontSize: '14px' }}>
				{label || t('boards.scheduleTimeOptional') || 'Godzina (opcjonalnie)'}
			</label>
			<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
				<select
					id={hourId}
					value={hour}
					onChange={handleHourChange}
					style={{ ...selectStyle, width: '5.5rem' }}
					aria-label={t('boards.scheduleTimeHour') || 'Godzina (24h)'}
				>
					<option value="">{t('boards.scheduleTimeEmpty') || '—'}</option>
					{HOURS.map((h) => (
						<option key={h} value={h}>
							{h}
						</option>
					))}
				</select>
				<span style={{ color: 'var(--po-text-muted, #7f8c8d)', fontWeight: 700 }} aria-hidden="true">
					:
				</span>
				<select
					id={minuteId}
					value={hour ? (minute || '00') : ''}
					onChange={handleMinuteChange}
					disabled={!hour}
					style={{ ...selectStyle, width: '5.5rem', opacity: hour ? 1 : 0.55 }}
					aria-label={t('boards.scheduleTimeMinute') || 'Minuty'}
				>
					{MINUTES.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</select>
				{value && (
					<button
						type="button"
						onClick={handleClear}
						style={{
							padding: '8px 10px',
							fontSize: '13px',
							border: '1px solid var(--po-border, #bdc3c7)',
							borderRadius: '6px',
							background: 'var(--po-surface-muted, #f9fafb)',
							color: 'var(--po-text-secondary, #495057)',
							cursor: 'pointer',
						}}
					>
						{t('boards.scheduleTimeClear') || 'Wyczyść'}
					</button>
				)}
			</div>
		</div>
	)
}

export default TaskScheduleTimeInput
