import React from 'react'
import { useTranslation } from 'react-i18next'
import ManualActivityBlocksEditor from './ManualActivityBlocksEditor'
import ManualTaskBlocksEditor from './ManualTaskBlocksEditor'
import { teamHasWorkActivities } from '../../utils/workActivities'

function WorkdayHoursWithActivities({
	settings,
	workActivities = [],
	splitByActivity,
	onSplitByActivityChange,
	activityBlocks,
	onActivityBlocksChange,
	tasksModuleEnabled = false,
	timesheetTasks = [],
	splitByTask = false,
	onSplitByTaskChange,
	taskBlocks = [],
	onTaskBlocksChange,
	hoursWorked,
	onHoursWorkedChange,
	additionalWorked,
	onAdditionalWorkedChange,
	realTimeDayWorked,
	workTimeFrom,
	workTimeTo,
	onWorkTimeFromChange,
	onWorkTimeToChange,
	onRealTimeDayWorkedChange,
	selectedWorkHoursIndex,
	onSelectedWorkHoursIndexChange,
	disabled = false,
	hasAbsenceEntryInput = false,
	showWorkHoursPresets = true,
}) {
	const { t } = useTranslation()
	const activitiesEnabled = teamHasWorkActivities({ workActivities })
	const tasksEnabled = tasksModuleEnabled && timesheetTasks.length > 0
	const useBlockSplit = (activitiesEnabled && splitByActivity) || (tasksEnabled && splitByTask)

	return (
		<div
			style={{
				opacity: hasAbsenceEntryInput ? 0.55 : 1,
				transition: 'opacity 0.2s ease',
			}}
		>
			{activitiesEnabled && (
				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
						<input
							type="checkbox"
							checked={splitByActivity}
							onChange={e => onSplitByActivityChange(e.target.checked)}
							disabled={disabled}
						/>
						<span className="text-sm font-medium text-gray-800">{t('workcalendar.activities.splitToggle')}</span>
					</label>
					{!splitByActivity && !splitByTask && (
						<p className="text-sm text-gray-600 mt-1">{t('workcalendar.activities.simpleModeHint')}</p>
					)}
				</div>
			)}

			{activitiesEnabled && splitByActivity ? (
				<ManualActivityBlocksEditor
					blocks={activityBlocks}
					onChange={onActivityBlocksChange}
					activities={workActivities}
					disabled={disabled}
				/>
			) : null}

			{tasksEnabled && (
				<div style={{ marginTop: activitiesEnabled && splitByActivity ? '16px' : 0, marginBottom: '16px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
						<input
							type="checkbox"
							checked={splitByTask}
							onChange={e => onSplitByTaskChange?.(e.target.checked)}
							disabled={disabled}
						/>
						<span className="text-sm font-medium text-gray-800">{t('workcalendar.tasks.splitToggle')}</span>
					</label>
				</div>
			)}

			{tasksEnabled && splitByTask ? (
				<ManualTaskBlocksEditor
					blocks={taskBlocks}
					onChange={onTaskBlocksChange}
					tasks={timesheetTasks}
					disabled={disabled}
				/>
			) : null}

			{!useBlockSplit && (
				<>
					<h2 className="text-lg font-semibold mb-2 text-gray-800">{t('workcalendar.h2modal')}</h2>
					<input
						type="number"
						min="0"
						max="24"
						step="0.5"
						placeholder={t('workcalendar.placeholder1') || 'np. 8 lub 8.5'}
						value={hoursWorked}
						onChange={e => onHoursWorkedChange(e.target.value)}
						disabled={disabled}
						className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
				</>
			)}

			<div style={{ marginTop: '12px' }}>
				<input
					type="number"
					min="0"
					step="0.5"
					placeholder={t('workcalendar.placeholder2') || 'np. 1 lub 1.5'}
					value={additionalWorked}
					onChange={e => onAdditionalWorkedChange(e.target.value)}
					disabled={disabled}
					className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
			</div>

			{!useBlockSplit && showWorkHoursPresets && settings?.workHours && Array.isArray(settings.workHours) && settings.workHours.length > 1 && (
				<div style={{
					marginTop: '15px',
					padding: '12px',
					backgroundColor: '#e3f2fd',
					border: '1px solid #90caf9',
					borderRadius: '6px',
				}}>
					<label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
						{t('workcalendar.selectWorkHours') || 'Wybierz godziny pracy:'}
					</label>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{settings.workHours.map((workHours, index) => (
							<label
								key={index}
								style={{
									display: 'flex',
									alignItems: 'center',
									cursor: disabled ? 'not-allowed' : 'pointer',
									padding: '8px',
									borderRadius: '4px',
									backgroundColor: selectedWorkHoursIndex === index ? '#bbdefb' : 'white',
									border: `1px solid ${selectedWorkHoursIndex === index ? '#2196f3' : '#dee2e6'}`,
								}}
							>
								<input
									type="radio"
									name="workHours"
									checked={selectedWorkHoursIndex === index}
									onChange={() => {
										onSelectedWorkHoursIndexChange(index)
										onRealTimeDayWorkedChange(`${workHours.timeFrom}-${workHours.timeTo}`)
										if (workHours.hours) onHoursWorkedChange(String(workHours.hours))
									}}
									disabled={disabled}
									style={{ marginRight: '10px' }}
								/>
								<span style={{ fontSize: '14px', color: '#2c3e50', flex: 1 }}>
									{workHours.timeFrom} - {workHours.timeTo} ({workHours.hours} h)
								</span>
							</label>
						))}
					</div>
				</div>
			)}

			{!useBlockSplit && (
				<div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
					<select
						value={workTimeFrom}
						onChange={e => onWorkTimeFromChange(e.target.value)}
						disabled={disabled}
						className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
					>
						<option value="">{t('workcalendar.bulkFill.timeFrom')}</option>
						{Array.from({ length: 48 }, (_, index) => {
							const totalMinutes = index * 30
							const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
							const minutes = String(totalMinutes % 60).padStart(2, '0')
							const time = `${hours}:${minutes}`
							return <option key={`wf-${time}`} value={time}>{time}</option>
						})}
					</select>
					<select
						value={workTimeTo}
						onChange={e => onWorkTimeToChange(e.target.value)}
						disabled={disabled}
						className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
					>
						<option value="">{t('workcalendar.bulkFill.timeTo')}</option>
						{Array.from({ length: 48 }, (_, index) => {
							const totalMinutes = index * 30
							const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
							const minutes = String(totalMinutes % 60).padStart(2, '0')
							const time = `${hours}:${minutes}`
							return <option key={`wt-${time}`} value={time}>{time}</option>
						})}
					</select>
				</div>
			)}
		</div>
	)
}

export default WorkdayHoursWithActivities
