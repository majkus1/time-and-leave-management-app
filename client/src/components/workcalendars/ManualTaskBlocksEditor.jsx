import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
	createDefaultTaskBlock,
	resolveTaskBlockHours,
	sumTaskBlockHours,
} from '../../utils/manualTaskBlocks'
import { calculateHoursFromRange } from '../../utils/manualActivityBlockTime'

const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
	const totalMinutes = index * 30
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
	const minutes = String(totalMinutes % 60).padStart(2, '0')
	return `${hours}:${minutes}`
})

const fieldClassName = 'manual-split-blocks-editor__field'
const removeButtonClassName = 'manual-split-blocks-editor__remove'

function ManualTaskBlocksEditor({
	blocks,
	onChange,
	tasks = [],
	disabled = false,
}) {
	const { t } = useTranslation()
	const totalHours = useMemo(() => sumTaskBlockHours(blocks), [blocks])

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
		const defaultId = tasks[0]?._id ? String(tasks[0]._id) : ''
		onChange([...blocks, createDefaultTaskBlock(defaultId)])
	}

	const removeBlock = (index) => {
		if (blocks.length <= 1) return
		onChange(blocks.filter((_, i) => i !== index))
	}

	if (!tasks.length) return null

	return (
		<div className="manual-split-blocks-editor manual-split-blocks-editor--tasks">
			<div className="manual-split-blocks-editor__header">
				<div className="manual-split-blocks-editor__intro">
					<h3 className="manual-split-blocks-editor__title">
						{t('workcalendar.tasks.splitTitle')}
					</h3>
					<p className="manual-split-blocks-editor__hint">{t('workcalendar.tasks.splitHint')}</p>
				</div>
				<div className="manual-split-blocks-editor__total manual-split-blocks-editor__total--tasks">
					{t('workcalendar.tasks.dayTotal')}: {totalHours || 0} h
				</div>
			</div>

			<div className="manual-split-blocks-editor__rows">
				{blocks.map((block, index) => (
					<div key={`task-block-${index}`} className="manual-split-blocks-editor__row">
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.tasks.taskLabel')}
							</label>
							<select
								value={block.taskId}
								onChange={e => updateBlock(index, { taskId: e.target.value })}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">{t('workcalendar.tasks.selectTask')}</option>
								{tasks.map(task => (
									<option key={task._id} value={String(task._id)}>
										{task.title}
									</option>
								))}
							</select>
						</div>
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.tasks.hoursLabel')}
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
								{t('workcalendar.tasks.timeFrom')}
							</label>
							<select
								value={block.timeFrom}
								onChange={e => handleTimeChange(index, 'timeFrom', e.target.value)}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">—</option>
								{halfHourOptions.map(time => (
									<option key={`task-from-${index}-${time}`} value={time}>{time}</option>
								))}
							</select>
						</div>
						<div className="manual-split-blocks-editor__field-wrap">
							<label className="manual-split-blocks-editor__label">
								{t('workcalendar.tasks.timeTo')}
							</label>
							<select
								value={block.timeTo}
								onChange={e => handleTimeChange(index, 'timeTo', e.target.value)}
								disabled={disabled}
								className={fieldClassName}
							>
								<option value="">—</option>
								{halfHourOptions.map(time => (
									<option key={`task-to-${index}-${time}`} value={time}>{time}</option>
								))}
							</select>
						</div>
						<button
							type="button"
							onClick={() => removeBlock(index)}
							disabled={disabled || blocks.length <= 1}
							className={removeButtonClassName}
							title={t('workcalendar.tasks.removeRow')}
						>
							×
						</button>
						{resolveTaskBlockHours(block) != null && block.timeFrom && block.timeTo && (
							<div className="manual-split-blocks-editor__computed">
								{t('workcalendar.tasks.computedFromTime', { hours: resolveTaskBlockHours(block) })}
							</div>
						)}
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={addBlock}
				disabled={disabled}
				className="manual-split-blocks-editor__add manual-split-blocks-editor__add--tasks"
			>
				+ {t('workcalendar.tasks.addRow')}
			</button>
		</div>
	)
}

export default ManualTaskBlocksEditor
