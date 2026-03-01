import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import { getHolidaysInRange } from '../../utils/holidays'

const toIsoDate = (value) => {
	if (!value) return null
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return null
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const formatDate = (value, locale) => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return date.toLocaleDateString(locale)
}

function LeaveAvailabilityChecker({
	requests = [],
	settings,
	showUserName = true,
	scopeHint,
	titleKey = 'leaveplanner.availabilityChecker.title',
}) {
	const { t, i18n } = useTranslation()
	const [mode, setMode] = useState('single')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')

	const analysis = useMemo(() => {
		if (!startDate) {
			return { state: 'idle', conflicts: [], conflictUsers: 0, totalConflicts: 0 }
		}

		const normalizedStart = toIsoDate(startDate)
		const normalizedEnd = mode === 'single' ? normalizedStart : toIsoDate(endDate)
		if (!normalizedStart || !normalizedEnd) {
			return { state: 'invalid', reason: t('leaveplanner.availabilityChecker.invalidDate'), conflicts: [], conflictUsers: 0, totalConflicts: 0, holidays: [] }
		}
		if (normalizedEnd < normalizedStart) {
			return { state: 'invalid', reason: t('leaveplanner.availabilityChecker.invalidRange'), conflicts: [], conflictUsers: 0, totalConflicts: 0, holidays: [] }
		}

		const holidays = getHolidaysInRange(normalizedStart, normalizedEnd, settings)

		const overlaps = (Array.isArray(requests) ? requests : [])
			.filter((request) => {
				const requestStart = toIsoDate(request?.startDate)
				const requestEnd = toIsoDate(request?.endDate)
				if (!requestStart || !requestEnd) return false
				return requestStart <= normalizedEnd && requestEnd >= normalizedStart
			})
			.map((request) => {
				let userName = ''
				if (request?.userId && typeof request.userId === 'object') {
					userName = `${request.userId.firstName || ''} ${request.userId.lastName || ''}`.trim() || request.userId.username || ''
				}
				return {
					id: request._id,
					userName,
					typeName: getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage),
					status: request.status,
					sortStart: toIsoDate(request.startDate),
					startDate: formatDate(request.startDate, i18n.resolvedLanguage),
					endDate: formatDate(request.endDate, i18n.resolvedLanguage),
				}
			})
			.sort((a, b) => String(a.sortStart || '').localeCompare(String(b.sortStart || '')))

		const conflictUsers = new Set(overlaps.map((item) => item.userName).filter(Boolean)).size
		if (overlaps.length === 0) {
			return { state: 'ok', conflicts: [], conflictUsers: 0, totalConflicts: 0, holidays }
		}
		return {
			state: 'conflicts',
			conflicts: overlaps,
			conflictUsers,
			totalConflicts: overlaps.length,
			holidays,
		}
	}, [startDate, endDate, mode, requests, settings, t, i18n.resolvedLanguage])

	return (
		<div style={{
			marginTop: '16px',
			marginBottom: '18px',
			padding: '16px',
			borderRadius: '12px',
			border: '1px solid #dbeafe',
			backgroundColor: '#f8fbff',
            maxWidth: '1000px'
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
				<h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>
					{t(titleKey) || 'Asystent terminu urlopu'}
				</h4>
				{scopeHint ? (
					<span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{scopeHint}</span>
				) : null}
			</div>
			<p style={{ margin: '8px 0 14px 0', color: '#64748b', fontSize: '14px' }}>
				{t('leaveplanner.availabilityChecker.description') || 'Wybierz datę lub zakres, a system automatycznie sprawdzi konflikty nieobecności.'}
			</p>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', alignItems: 'end' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
					<input
						type="radio"
						name="leave-checker-mode"
						checked={mode === 'single'}
						onChange={() => setMode('single')}
					/>
					{t('leaveplanner.availabilityChecker.singleDate') || 'Jedna data'}
				</label>
				<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
					<input
						type="radio"
						name="leave-checker-mode"
						checked={mode === 'range'}
						onChange={() => setMode('range')}
					/>
					{t('leaveplanner.availabilityChecker.dateRange') || 'Zakres dat'}
				</label>
				<div>
					<label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
						{t('leaveplanner.availabilityChecker.from') || 'Od'}
					</label>
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
					/>
				</div>
				{mode === 'range' && (
					<div>
						<label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
							{t('leaveplanner.availabilityChecker.to') || 'Do'}
						</label>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
						/>
					</div>
				)}
			</div>

			<div style={{
				marginTop: '12px',
				padding: '12px',
				borderRadius: '10px',
				border: analysis.state === 'conflicts' ? '1px solid #fca5a5' : '1px solid #bbf7d0',
				backgroundColor: analysis.state === 'conflicts' ? '#fef2f2' : '#f0fdf4',
			}}>
				{analysis.state === 'idle' && (
					<span style={{ color: '#64748b', fontSize: '14px' }}>
						{t('leaveplanner.availabilityChecker.idle') || 'Wybierz termin, aby sprawdzić dostępność.'}
					</span>
				)}
				{analysis.state === 'invalid' && (
					<span style={{ color: '#b91c1c', fontSize: '14px', fontWeight: '600' }}>{analysis.reason}</span>
				)}
				{analysis.state === 'ok' && (
					<span style={{ color: '#166534', fontSize: '14px', fontWeight: '600' }}>
						{t('leaveplanner.availabilityChecker.noConflicts') || 'Brak konfliktów nieobecności w tym terminie.'}
					</span>
				)}
				{analysis.state === 'conflicts' && (
					<div>
						<div style={{ color: '#991b1b', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
							{t('leaveplanner.availabilityChecker.conflictsFound') || 'W tym terminie są nieobecności.'}{' '}
							({analysis.totalConflicts} / {t('leaveplanner.availabilityChecker.people') || 'osób'}: {analysis.conflictUsers})
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
							{analysis.conflicts.map((item) => (
								<div
									key={item.id}
									style={{
										padding: '8px 10px',
										borderRadius: '8px',
										border: '1px solid #fecaca',
										backgroundColor: '#fff',
										minWidth: '220px',
									}}
								>
									<div style={{ fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
										{showUserName && item.userName ? `${item.userName} - ` : ''}
										{item.typeName}
									</div>
									<div style={{ color: '#64748b', fontSize: '13px' }}>
										{item.startDate} - {item.endDate}
									</div>
									<div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>
										{item.status === 'status.sent'
											? (t('leaveform.statuses.sent') || 'Wysłano')
											: (t('leaveform.statuses.accepted') || 'Zaakceptowano')}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
				{analysis.state !== 'idle' && analysis.state !== 'invalid' && Array.isArray(analysis.holidays) && analysis.holidays.length > 0 && (
					<div style={{
						marginTop: '10px',
						paddingTop: '10px',
						borderTop: '1px dashed #f59e0b'
					}}>
						<div style={{ color: '#92400e', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
							{t('leaveplanner.availabilityChecker.holidaysFound') || 'W wybranym terminie wypadają święta:'}
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
							{analysis.holidays.map((holiday) => (
								<div
									key={`${holiday.date}-${holiday.name}`}
									style={{
										padding: '4px 8px',
										borderRadius: '999px',
										border: '1px solid #fcd34d',
										backgroundColor: '#fffbeb',
										color: '#92400e',
										fontSize: '12px',
										fontWeight: '600',
									}}
								>
									{formatDate(holiday.date, i18n.resolvedLanguage)} - {holiday.name}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default LeaveAvailabilityChecker

