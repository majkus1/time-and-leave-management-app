import React from 'react'
import { useTranslation } from 'react-i18next'

function TaskFilterBar({ tasks = [], selectedIds = [], onChange, compact = false }) {
	const { t } = useTranslation()
	if (!tasks.length) return null

	const toggle = (id) => {
		if (selectedIds.includes(id)) {
			onChange(selectedIds.filter(item => item !== id))
		} else {
			onChange([...selectedIds, id])
		}
	}

	const chipStyle = (active) => ({
		padding: compact ? '4px 10px' : '6px 12px',
		borderRadius: '999px',
		border: `1px solid ${active ? '#00a846' : '#d1d5db'}`,
		background: active ? '#ecfdf5' : '#fff',
		color: active ? '#213555' : '#374151',
		fontSize: compact ? '12px' : '13px',
		fontWeight: active ? 600 : 500,
		cursor: 'pointer',
		lineHeight: 1.3,
		transition: 'all 0.15s ease',
		maxWidth: '100%',
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	})

	return (
		<div className="workcalendar-filter-bar" style={{ marginBottom: compact ? '10px' : '14px' }}>
			<div className="workcalendar-filter-bar__label" style={{ fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
				{t('workcalendar.tasks.filterLabel')}
			</div>
			<div className="workcalendar-filter-bar__chips">
				<button
					type="button"
					className={`workcalendar-filter-bar__chip${!selectedIds.length ? ' is-active' : ''}`}
					onClick={() => onChange([])}
					style={chipStyle(!selectedIds.length)}
				>
					{t('workcalendar.tasks.filterAll')}
				</button>
				{tasks.map(task => {
					const active = selectedIds.includes(task.id)
					return (
					<button
						key={task.id}
						type="button"
						className={`workcalendar-filter-bar__chip${active ? ' is-active' : ''}`}
						onClick={() => toggle(task.id)}
						style={chipStyle(active)}
						title={task.title}
					>
						{task.title}
					</button>
					)
				})}
			</div>
		</div>
	)
}

export default TaskFilterBar
