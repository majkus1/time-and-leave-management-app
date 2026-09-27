import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Filtr ewidencji po miejscu QR (np. jedna budowa) — ten sam wygląd co filtry czynności i zadań.
 * `places`: [[id, nazwa]] z sesji miesiąca (utils/workQrPlaceFilter.collectQrPlacesFromGrouped).
 */
function QrPlaceFilterBar({ places = [], selectedIds = [], onChange, compact = false }) {
	const { t } = useTranslation()
	if (!places.length) return null

	const toggle = id => {
		onChange(selectedIds.includes(id) ? selectedIds.filter(item => item !== id) : [...selectedIds, id])
	}

	const chipStyle = active => ({
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
				{t('workcalendar.qrPlaces.filterLabel')}
			</div>
			<div className="workcalendar-filter-bar__chips">
				<button
					type="button"
					className={`workcalendar-filter-bar__chip${!selectedIds.length ? ' is-active' : ''}`}
					onClick={() => onChange([])}
					style={chipStyle(!selectedIds.length)}
				>
					{t('workcalendar.qrPlaces.filterAll')}
				</button>
				{places.map(([id, name]) => {
					const active = selectedIds.includes(id)
					return (
						<button
							key={id}
							type="button"
							className={`workcalendar-filter-bar__chip${active ? ' is-active' : ''}`}
							onClick={() => toggle(id)}
							style={chipStyle(active)}
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

export default QrPlaceFilterBar
