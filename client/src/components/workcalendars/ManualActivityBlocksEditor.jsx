import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { findWorkActivityById, getEnabledWorkActivities, getWorkActivityName, WORK_ACTIVITY_GROUPS } from '../../utils/workActivities'
import {
	createDefaultActivityBlock,
	resolveBlockHours,
	sumBlockHours,
} from '../../utils/manualActivityBlocks'
import { calculateHoursFromRange } from '../../utils/manualActivityBlockTime'

const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
	const totalMinutes = index * 30
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
	const minutes = String(totalMinutes % 60).padStart(2, '0')
	return `${hours}:${minutes}`
})

const fieldClassName = 'manual-split-blocks-editor__field'
const removeButtonClassName = 'manual-split-blocks-editor__remove'

function ManualActivityBlocksEditor({
	blocks,
	onChange,
	activities = [],
	disabled = false,
}) {
	const { t, i18n } = useTranslation()
	const enabledActivities = useMemo(() => getEnabledWorkActivities(activities), [activities])
	const totalHours = useMemo(() => sumBlockHours(blocks), [blocks])

	const updateBlock = (index, patch) => {
		const next = blocks.map((block, i) => (i === index ? { ...block, ...patch } : block))
		onChange(next)
	}

	const handleTimeChange = (index, field, value) => {
		const block = blocks[index]
		const nextBlock = { ...block, [field]: value }
		const from = field === 'timeFrom' ? value : block.timeFrom
		const to = field === 'timeTo' ? value : block.timeTo
		if (from?.trim() && to?.trim()) {
			const computed = calculateHoursFromRange(from.trim(), to.trim())
			if (computed != null) nextBlock.hours = String(computed)
		}
		updateBlock(index, nextBlock)
	}

	const addBlock = () => {
		onChange([...blocks, createDefaultActivityBlock(enabledActivities[0]?.id || '')])
	}

	const removeBlock = (index) => {
		if (blocks.length <= 1) return
		onChange(blocks.filter((_, i) => i !== index))
	}

	if (!enabledActivities.length) return null

	return (
		<div className="manual-split-blocks-editor manual-split-blocks-editor--activities">
			<div className="manual-split-blocks-editor__header">
				<div className="manual-split-blocks-editor__intro">
					<h3 className="manual-split-blocks-editor__title">
						{t('workcalendar.activities.splitTitle')}
					</h3>
					<p className="manual-split-blocks-editor__hint">{t('workcalendar.activities.splitHint')}</p>
				</div>
				<div className="manual-split-blocks-editor__total manual-split-blocks-editor__total--activities">
					{t('workcalendar.activities.dayTotal')}: {totalHours || 0} h
				</div>
			</div>

			<div className="manual-split-blocks-editor__rows">
				{blocks.map((block, index) => (
					<div key={`activity-block-${index}`} className={`manual-split-blocks-editor__row ${findWorkActivityById(enabledActivities, block.activityId)?.trackQuantity ? 'manual-split-blocks-editor__row--quantity' : ''}`}>
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.activities.activityLabel')}
							</label>
							<select
								value={block.activityId}
								onChange={e => updateBlock(index, { activityId: e.target.value })}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">{t('workcalendar.activities.selectActivity')}</option>
								{enabledActivities.map(activity => (
									<option key={activity.id} value={activity.id}>
										{getWorkActivityName(activity, i18n.language)}
										{activity.group && activity.group !== 'other'
											? ` (${t(WORK_ACTIVITY_GROUPS.find(g => g.id === activity.group)?.labelKey || '')})`
											: ''}
									</option>
								))}
							</select>
						</div>
						{findWorkActivityById(enabledActivities, block.activityId)?.trackQuantity && (
							<div className="manual-split-blocks-editor__field-wrap">
								<label className="manual-split-blocks-editor__label">
									{t('workcalendar.activities.quantityLabel')} ({findWorkActivityById(enabledActivities, block.activityId)?.unit})
								</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={block.quantity}
									onChange={e => updateBlock(index, { quantity: e.target.value })}
									disabled={disabled}
									placeholder="0"
									className={fieldClassName}
								/>
							</div>
						)}
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.activities.hoursLabel')}
							</label>
							<input
								type="number"
								min="0"
								max="24"
								step="0.5"
								value={block.hours}
								onChange={e => updateBlock(index, { hours: e.target.value })}
								disabled={disabled}
								placeholder="8"
								className={fieldClassName}
							/>
						</div>
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.activities.timeFrom')}
							</label>
							<select
								value={block.timeFrom}
								onChange={e => handleTimeChange(index, 'timeFrom', e.target.value)}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">—</option>
								{halfHourOptions.map(time => (
									<option key={`from-${index}-${time}`} value={time}>{time}</option>
								))}
							</select>
						</div>
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.activities.timeTo')}
							</label>
							<select
								value={block.timeTo}
								onChange={e => handleTimeChange(index, 'timeTo', e.target.value)}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">—</option>
								{halfHourOptions.map(time => (
									<option key={`to-${index}-${time}`} value={time}>{time}</option>
								))}
							</select>
						</div>
						<button
							type="button"
							onClick={() => removeBlock(index)}
							disabled={disabled || blocks.length <= 1}
							className={removeButtonClassName}
							title={t('workcalendar.activities.removeRow')}
						>
							×
						</button>
						{resolveBlockHours(block) != null && block.timeFrom && block.timeTo && (
							<div className="manual-split-blocks-editor__computed">
								{t('workcalendar.activities.computedFromTime', { hours: resolveBlockHours(block) })}
							</div>
						)}
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={addBlock}
				disabled={disabled}
				className="manual-split-blocks-editor__add manual-split-blocks-editor__add--activities"
			>
				+ {t('workcalendar.activities.addRow')}
			</button>
		</div>
	)
}

export default ManualActivityBlocksEditor
