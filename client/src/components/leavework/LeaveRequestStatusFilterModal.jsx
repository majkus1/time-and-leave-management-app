import React from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import {
	LEAVE_REQUEST_STATUS_KEYS,
	getLeaveRequestStatusStats,
} from '../../utils/leaveRequestPeriod'

const STATUS_CLASS_NAMES = {
	accepted: 'is-accepted',
	pending: 'is-pending',
	rejected: 'is-rejected',
	sent: 'is-sent',
}

function LeaveRequestStatusFilterModal({
	isOpen,
	onRequestClose,
	periodRequests,
	statusFilters,
	onStatusFiltersChange,
}) {
	const { t } = useTranslation()
	const stats = React.useMemo(() => getLeaveRequestStatusStats(periodRequests), [periodRequests])

	const toggleStatus = (status) => {
		onStatusFiltersChange({
			...statusFilters,
			[status]: !statusFilters[status],
		})
	}

	const resetStatuses = () => {
		onStatusFiltersChange(Object.fromEntries(LEAVE_REQUEST_STATUS_KEYS.map(status => [status, true])))
	}

	const visibleCount = periodRequests.filter((request) => {
		const status = String(request?.status || '').replace('status.', '')
		return statusFilters[status] !== false
	}).length

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onRequestClose}
			overlayClassName="leave-insights-modal-overlay"
			className="leave-insights-modal leave-insights-modal--status-filter"
			contentLabel={t('leaveRequestInsights.filterTitle')}
		>
			<div className="leave-insights-modal__header">
				<div>
					<h2>{t('leaveRequestInsights.filterTitle')}</h2>
					<p>{t('leaveRequestInsights.filterHint')}</p>
				</div>
				<button type="button" onClick={onRequestClose} aria-label={t('leaveRequestInsights.closeStatusFilters')}>×</button>
			</div>

			<div className="leave-insights-modal__section-heading">
				<div>
					<h3>{t('leaveRequestInsights.filterListTitle')}</h3>
				</div>
				<button type="button" onClick={resetStatuses}>{t('leaveRequestInsights.showAll')}</button>
			</div>

			<div className="leave-insights-modal__status-options">
				{LEAVE_REQUEST_STATUS_KEYS.map(status => (
					<label key={status}>
						<input
							type="checkbox"
							checked={statusFilters[status] !== false}
							onChange={() => toggleStatus(status)}
						/>
						<span className={`leave-insights-status-dot ${STATUS_CLASS_NAMES[status]}`} />
						<span>{t(`leaveRequestInsights.statuses.${status}`)}</span>
						<strong>{stats[status]}</strong>
					</label>
				))}
			</div>

			<div className="leave-insights-modal__footer">
				<span>{t('leaveRequestInsights.visible', { count: visibleCount })}</span>
				<button type="button" onClick={onRequestClose}>{t('leaveRequestInsights.done')}</button>
			</div>
		</Modal>
	)
}

export default LeaveRequestStatusFilterModal
