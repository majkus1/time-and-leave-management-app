import React from 'react'
import { useTranslation } from 'react-i18next'
import { getWorkActivityName } from '../../utils/workActivities'

function ActivityFilterBar({ activities = [], selectedIds = [], onChange, compact = false }) {
	const { t, i18n } = useTranslation()
	if (!activities.length) return null

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
			<div style={{ fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
				{t('workcalendar.activities.filterLabel')}
			</div>
			<div className="workcalendar-filter-bar__chips">
				<button
					type="button"
					onClick={() => onChange([])}
					style={chipStyle(!selectedIds.length)}
				>
					{t('workcalendar.activities.filterAll')}
				</button>
				{activities.map(activity => {
					const name = getWorkActivityName(activity, i18n.language)
					return (
					<button
						key={activity.id}
						type="button"
						onClick={() => toggle(activity.id)}
						style={chipStyle(selectedIds.includes(activity.id))}
						title={name}
					>
						{name}
					</button>
					)
				})}
			</div>
		</div>
	)
}

export default ActivityFilterBar
