import React, { useEffect, useMemo, useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'

const formatDateLocal = (date) => {
	const d = date instanceof Date ? date : new Date(date)
	if (Number.isNaN(d.getTime())) return ''
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const getFirstWorkHours = (settings) => {
	if (Array.isArray(settings?.workHours) && settings.workHours.length > 0) {
		return settings.workHours[0]
	}
	if (settings?.workHours?.timeFrom && settings?.workHours?.timeTo) {
		return settings.workHours
	}
	return null
}

const getWorkHoursOptions = (settings) => {
	if (Array.isArray(settings?.workHours)) return settings.workHours.filter(item => item?.timeFrom && item?.timeTo)
	if (settings?.workHours?.timeFrom && settings?.workHours?.timeTo) return [settings.workHours]
	return []
}

const calculateHoursFromRange = (timeFrom, timeTo) => {
	if (!timeFrom || !timeTo) return ''
	const [fromH, fromM] = timeFrom.split(':').map(Number)
	const [toH, toM] = timeTo.split(':').map(Number)
	if ([fromH, fromM, toH, toM].some(Number.isNaN)) return ''
	let minutes = (toH * 60 + toM) - (fromH * 60 + fromM)
	if (minutes < 0) minutes += 24 * 60
	if (minutes === 0) return ''
	const hours = minutes / 60
	return Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 2) / 2)
}

const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
	const totalMinutes = index * 30
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
	const minutes = String(totalMinutes % 60).padStart(2, '0')
	return `${hours}:${minutes}`
})

const isHalfHourStep = (value) => {
	const doubled = Number(value) * 2
	return Number.isFinite(doubled) && Math.abs(doubled - Math.round(doubled)) < 0.01
}

function BulkFillWorkdaysModal({
	isOpen,
	onClose,
	onSubmit,
	settings,
	currentMonth,
	currentYear,
	isPending = false,
	disabledReason = '',
}) {
	const { t, i18n } = useTranslation()
	const firstWorkHours = useMemo(() => getFirstWorkHours(settings), [settings])
	const workHoursOptions = useMemo(() => getWorkHoursOptions(settings), [settings])
	const calendarMonthStart = useMemo(
		() => formatDateLocal(new Date(currentYear, currentMonth, 1)),
		[currentMonth, currentYear]
	)
	const calendarMonthEnd = useMemo(
		() => formatDateLocal(new Date(currentYear, currentMonth + 1, 0)),
		[currentMonth, currentYear]
	)
	const today = formatDateLocal(new Date())
	const defaultWeekDate = useMemo(() => {
		return today >= calendarMonthStart && today <= calendarMonthEnd ? today : calendarMonthStart
	}, [calendarMonthEnd, calendarMonthStart, today])

	const [rangeType, setRangeType] = useState('month')
	const [pickMonth, setPickMonth] = useState(currentMonth)
	const [pickYear, setPickYear] = useState(currentYear)
	const [dayDate, setDayDate] = useState(today)
	const [weekDate, setWeekDate] = useState(today)
	const [customStart, setCustomStart] = useState(calendarMonthStart)
	const [customEnd, setCustomEnd] = useState(calendarMonthEnd)
	const [timeFrom, setTimeFrom] = useState('')
	const [timeTo, setTimeTo] = useState('')
	const [hoursWorked, setHoursWorked] = useState('')
	const [additionalWorked, setAdditionalWorked] = useState('')
	const [absenceType, setAbsenceType] = useState('')
	const [notes, setNotes] = useState('')
	const [error, setError] = useState('')
	const [selectedWorkHoursIndex, setSelectedWorkHoursIndex] = useState(0)

	useEffect(() => {
		if (!isOpen) return
		setRangeType(settings?.workdayEntriesOnlyToday === true ? 'day' : 'month')
		setPickMonth(currentMonth)
		setPickYear(currentYear)
		setDayDate(today)
		setWeekDate(defaultWeekDate)
		setCustomStart(calendarMonthStart)
		setCustomEnd(calendarMonthEnd)
		setTimeFrom(firstWorkHours?.timeFrom || '')
		setTimeTo(firstWorkHours?.timeTo || '')
		setHoursWorked(firstWorkHours?.hours != null ? String(firstWorkHours.hours) : '')
		setAdditionalWorked('')
		setAbsenceType('')
		setNotes('')
		setError('')
		setSelectedWorkHoursIndex(0)
	}, [isOpen, firstWorkHours, calendarMonthStart, calendarMonthEnd, currentMonth, currentYear, defaultWeekDate, settings?.workdayEntriesOnlyToday, today])

	const fillMonthStart = useMemo(
		() => formatDateLocal(new Date(pickYear, pickMonth, 1)),
		[pickMonth, pickYear]
	)
	const fillMonthEnd = useMemo(
		() => formatDateLocal(new Date(pickYear, pickMonth + 1, 0)),
		[pickMonth, pickYear]
	)

	const selectedRange = useMemo(() => {
		if (rangeType === 'day') return { startDate: dayDate, endDate: dayDate }
		if (rangeType === 'week') {
			const base = new Date(weekDate)
			if (Number.isNaN(base.getTime())) return { startDate: '', endDate: '' }
			const monday = new Date(base)
			const day = monday.getDay() || 7
			monday.setDate(monday.getDate() - day + 1)
			const sunday = new Date(monday)
			sunday.setDate(monday.getDate() + 6)
			return {
				startDate: formatDateLocal(monday),
				endDate: formatDateLocal(sunday),
			}
		}
		if (rangeType === 'custom') return { startDate: customStart, endDate: customEnd }
		return { startDate: fillMonthStart, endDate: fillMonthEnd }
	}, [customEnd, customStart, dayDate, fillMonthEnd, fillMonthStart, rangeType, weekDate])

	const selectedRangeLabel = selectedRange.startDate === selectedRange.endDate
		? selectedRange.startDate
		: `${selectedRange.startDate} - ${selectedRange.endDate}`

	const handleTimeChange = (nextFrom, nextTo) => {
		const matchedOptionIndex = workHoursOptions.findIndex(
			(option) => option.timeFrom === nextFrom && option.timeTo === nextTo
		)
		setTimeFrom(nextFrom)
		setTimeTo(nextTo)
		setAbsenceType('')
		setSelectedWorkHoursIndex(matchedOptionIndex)
		const calculated = calculateHoursFromRange(nextFrom, nextTo)
		setHoursWorked(calculated || '')
	}

	const applyWorkHoursOption = (index) => {
		const option = workHoursOptions[index]
		if (!option) return
		setSelectedWorkHoursIndex(index)
		setTimeFrom(option.timeFrom || '')
		setTimeTo(option.timeTo || '')
		setHoursWorked(option.hours != null ? String(option.hours) : '')
		setAdditionalWorked('')
		setAbsenceType('')
	}

	const handleAbsenceChange = (value) => {
		setAbsenceType(value)
		if (value.trim()) {
			setHoursWorked('')
			setAdditionalWorked('')
			setTimeFrom('')
			setTimeTo('')
			setSelectedWorkHoursIndex(-1)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (disabledReason) {
			setError(disabledReason)
			return
		}
		if (!selectedRange.startDate || !selectedRange.endDate || selectedRange.startDate > selectedRange.endDate) {
			setError(t('workcalendar.bulkFill.errors.invalidDateRange'))
			return
		}
		const cleanAbsenceType = absenceType.trim()
		const isAbsenceEntry = cleanAbsenceType.length > 0
		const cleanHoursWorked = isAbsenceEntry ? '' : String(hoursWorked || '').trim()
		const cleanAdditionalWorked = isAbsenceEntry ? '' : String(additionalWorked || '').trim()
		const cleanTimeFrom = isAbsenceEntry ? '' : timeFrom
		const cleanTimeTo = isAbsenceEntry ? '' : timeTo
		const hours = parseFloat(cleanHoursWorked)
		const overtime = cleanAdditionalWorked === '' ? 0 : parseFloat(cleanAdditionalWorked)
		if (!cleanAbsenceType && (Number.isNaN(hours) || hours <= 0 || hours > 24 || !isHalfHourStep(hours))) {
			setError(t('workcalendar.bulkFill.errors.invalidHours'))
			return
		}
		if (!cleanAbsenceType && (Number.isNaN(overtime) || overtime < 0 || overtime > 100 || !isHalfHourStep(overtime))) {
			setError(t('workcalendar.bulkFill.errors.invalidOvertime'))
			return
		}

		const realTimeDayWorked = !cleanAbsenceType && cleanTimeFrom && cleanTimeTo ? `${cleanTimeFrom}-${cleanTimeTo}` : ''
		await onSubmit({
			startDate: selectedRange.startDate,
			endDate: selectedRange.endDate,
			hoursWorked: cleanAbsenceType ? '' : hours,
			additionalWorked: cleanAbsenceType ? '' : overtime,
			realTimeDayWorked,
			absenceType: cleanAbsenceType,
			notes: notes.trim(),
		})
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="bulk-fill-workdays-modal"
			overlayClassName="managed-workday-modal-overlay"
			style={{
				overlay: {
					position: 'fixed',
					inset: 0,
					zIndex: 100000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '24px',
					backgroundColor: 'rgba(15, 23, 42, 0.38)',
					overflowY: 'auto',
				},
				content: {
					position: 'relative',
					inset: 'auto',
					width: 'min(820px, calc(100vw - 32px))',
					maxWidth: '820px',
					maxHeight: 'calc(100vh - 48px)',
					margin: 0,
					padding: 0,
					border: 0,
					borderRadius: '12px',
					background: '#fff',
					boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
					overflow: 'auto',
				},
			}}
			contentLabel={t('workcalendar.bulkFill.title')}
		>
			<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', padding: '22px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
					<div>
						<h2 style={{ margin: 0, fontSize: '22px', color: '#0f2747' }}>{t('workcalendar.bulkFill.title')}</h2>
						<p style={{ margin: '6px 0 0', color: '#5f6f84', fontSize: '14px' }}>
							{t('workcalendar.bulkFill.description')}
						</p>
					</div>
					<button type="button" onClick={onClose} className="monthly-calendar-modal__close">×</button>
				</div>

				{disabledReason && (
					<div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '8px', padding: '10px 12px' }}>
						{disabledReason}
					</div>
				)}

				{error && (
					<div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', color: '#c0392b', borderRadius: '8px', padding: '10px 12px' }}>
						{error}
					</div>
				)}

				<div style={{ display: 'grid', gap: '10px' }}>
					<span style={{ fontWeight: 700, color: '#13294b' }}>{t('workcalendar.bulkFill.range')}</span>
					<div className="bulk-fill-range-options">
						{[
							['day', t('workcalendar.bulkFill.types.day')],
							['week', t('workcalendar.bulkFill.types.week')],
							['month', t('workcalendar.bulkFill.types.month')],
							['custom', t('workcalendar.bulkFill.types.custom')],
						].map(([value, label]) => (
							<button
								key={value}
								type="button"
								onClick={() => {
									setRangeType(value)
									if (value === 'day') setDayDate(today)
									if (value === 'week') setWeekDate(defaultWeekDate)
									if (value === 'month') {
										setPickMonth(currentMonth)
										setPickYear(currentYear)
									}
								}}
								style={{
									border: rangeType === value ? '2px solid #0d6efd' : '1px solid #d7dde5',
									background: rangeType === value ? '#eef6ff' : '#fff',
									color: '#13294b',
									borderRadius: '8px',
									padding: '10px 12px',
									fontWeight: 700,
								}}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{rangeType === 'day' && (
					<label>
						<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.date')}</span>
						<input type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2" />
					</label>
				)}

				{rangeType === 'week' && (
					<label>
						<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.dayInWeek')}</span>
						<input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2" />
					</label>
				)}

				{rangeType === 'custom' && (
					<div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.dateFrom')}</span>
							<input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2" />
						</label>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.dateTo')}</span>
							<input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2" />
						</label>
					</div>
				)}

				{rangeType === 'month' && (
					<div className="bulk-fill-month-pick">
						<select
							value={pickMonth}
							onChange={(e) => setPickMonth(Number(e.target.value))}
							className="bulk-fill-month-pick__select"
							aria-label={t('workcalendar.bulkFill.month')}
						>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
										.replace(/^./, (str) => str.toUpperCase())}
								</option>
							))}
						</select>
						<select
							value={pickYear}
							onChange={(e) => setPickYear(Number(e.target.value))}
							className="bulk-fill-month-pick__select bulk-fill-month-pick__select--year"
							aria-label={t('workcalendar.bulkFill.year')}
						>
							{Array.from({ length: 20 }, (_, i) => {
								const year = new Date().getFullYear() - 10 + i
								return (
									<option key={year} value={year}>
										{year}
									</option>
								)
							})}
						</select>
					</div>
				)}

				{rangeType === 'week' && (
					<div
						className="bulk-fill-target-range"
						style={{
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							padding: '12px',
							color: '#334155',
							fontSize: '14px',
							lineHeight: 1.45,
						}}
					>
						<span className="bulk-fill-target-range__label" style={{ fontWeight: 600, marginRight: '6px' }}>
							{t('workcalendar.bulkFill.targetRange')}:
						</span>
						<strong className="bulk-fill-target-range__dates">{selectedRangeLabel}</strong>
					</div>
				)}

				<div className="bulk-fill-entry-card">
					<div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.hoursWorkedPerDay')}</span>
							<input
								type="number"
								step="0.5"
								min="0"
								max="24"
								placeholder={t('workcalendar.bulkFill.hoursPlaceholderShort') || 'np. 10'}
								value={hoursWorked}
								onChange={(e) => {
									setHoursWorked(e.target.value)
									setAbsenceType('')
								}}
								className="w-full border border-gray-300 rounded-md px-4 py-2"
							/>
						</label>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.overtimePerDay')}</span>
							<input
								type="number"
								step="0.5"
								min="0"
								placeholder={t('workcalendar.bulkFill.overtimePlaceholderShort') || 'np. 2'}
								value={additionalWorked}
								onChange={(e) => {
									setAdditionalWorked(e.target.value)
									setAbsenceType('')
								}}
								className="w-full border border-gray-300 rounded-md px-4 py-2"
							/>
						</label>
					</div>

					{workHoursOptions.length > 0 && (
						<div className="bulk-fill-work-hours-options">
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>{t('workcalendar.selectWorkHours')}</span>
							{workHoursOptions.map((workHours, index) => (
								<label
									key={`${workHours.timeFrom}-${workHours.timeTo}-${index}`}
									className={`bulk-fill-work-hours-option ${selectedWorkHoursIndex === index ? 'is-selected' : ''}`}
								>
									<input
										type="radio"
										name="bulkFillWorkHours"
										checked={selectedWorkHoursIndex === index}
										onChange={() => applyWorkHoursOption(index)}
									/>
									<span>{workHours.timeFrom} - {workHours.timeTo} ({workHours.hours} {t('workcalendar.allfrommonthhours')})</span>
								</label>
							))}
						</div>
					)}

					<div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.timeFrom')}</span>
							<select
								value={timeFrom}
								onChange={(e) => handleTimeChange(e.target.value, timeTo)}
								className="w-full border border-gray-300 rounded-md px-4 py-2"
							>
								<option value="">{t('workcalendar.bulkFill.select')}</option>
								{halfHourOptions.map(option => (
									<option key={`from-${option}`} value={option}>{option}</option>
								))}
							</select>
						</label>
						<label>
							<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.bulkFill.timeTo')}</span>
							<select
								value={timeTo}
								onChange={(e) => handleTimeChange(timeFrom, e.target.value)}
								className="w-full border border-gray-300 rounded-md px-4 py-2"
							>
								<option value="">{t('workcalendar.bulkFill.select')}</option>
								{halfHourOptions.map(option => (
									<option key={`to-${option}`} value={option}>{option}</option>
								))}
							</select>
						</label>
					</div>
				</div>

				<div className="bulk-fill-absence-card">
					<label>
						<span style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#13294b' }}>{t('workcalendar.bulkFill.absence')}</span>
						<span style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
							{t('workcalendar.bulkFill.absenceHint')}
						</span>
						<input
							type="text"
							value={absenceType}
							onChange={(e) => handleAbsenceChange(e.target.value)}
							placeholder={t('workcalendar.bulkFill.absencePlaceholder')}
							className="w-full border border-gray-300 rounded-md px-4 py-2"
						/>
					</label>
				</div>

				<label>
					<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('workcalendar.notes')}</span>
					<input
						type="text"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder={t('leaveform.optional')}
						className="w-full border border-gray-300 rounded-md px-4 py-2"
					/>
				</label>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
					<button type="button" className="btn btn-secondary" onClick={onClose}>{t('workcalendar.cancel')}</button>
					<button type="submit" className="btn btn-primary" disabled={isPending || !!disabledReason}>
						{isPending ? t('workcalendar.bulkFill.filling') : t('workcalendar.bulkFill.fill')}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default BulkFillWorkdaysModal
