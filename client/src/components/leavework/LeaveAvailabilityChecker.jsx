import React, { useEffect, useMemo, useRef, useState } from 'react'
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

const PENDING_STATUSES = new Set(['status.pending', 'pending'])
const ACCEPTED_STATUSES = new Set(['status.accepted', 'accepted'])
const SENT_STATUSES = new Set(['status.sent', 'sent'])

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
	initialCollapsed = true,
	variant = 'panel',
}) {
	const { t, i18n } = useTranslation()
	const isModalVariant = variant === 'modal'
	const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
	const [mode, setMode] = useState('single')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const contentRef = useRef(null)
	const [contentHeight, setContentHeight] = useState(0)

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

	useEffect(() => {
		if (!contentRef.current) return
		setContentHeight(contentRef.current.scrollHeight)
	}, [mode, startDate, endDate, analysis.state, analysis.totalConflicts, analysis.holidays?.length, requests, settings])

	return (
		<div className={isModalVariant ? 'leave-availability-checker leave-availability-checker--modal' : 'leave-availability-checker'} style={{
			marginTop: '16px',
			marginBottom: '18px',
			padding: '16px',
			borderRadius: '12px',
			border: '1px solid #dbeafe',
			backgroundColor: '#f8fbff',
            maxWidth: '1000px',
			cursor: !isModalVariant && isCollapsed ? 'pointer' : 'default',
		}}
		onClick={(e) => {
			if (isModalVariant) return
			if (!isCollapsed) return
			if (e.target.closest('button')) return
			setIsCollapsed(false)
		}}>
			{!isModalVariant && (
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
					<h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>
						{t(titleKey) || 'Asystent terminu urlopu'}
					</h4>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								setIsCollapsed(prev => !prev)
							}}
							aria-expanded={!isCollapsed}
							aria-label={isCollapsed ? 'Rozwiń asystenta terminu urlopu' : 'Zwiń asystenta terminu urlopu'}
							title={isCollapsed ? 'Rozwiń' : 'Zwiń'}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '34px',
								height: '34px',
								borderRadius: '8px',
								border: '1px solid #86efac',
								backgroundColor: isCollapsed ? '#dcfce7' : '#bbf7d0',
								color: '#15803d',
								cursor: 'pointer',
								boxShadow: isCollapsed ? '0 1px 6px rgba(34, 197, 94, 0.18)' : '0 2px 8px rgba(34, 197, 94, 0.25)',
								transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
								transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#bbf7d0'
								e.currentTarget.style.borderColor = '#22c55e'
								e.currentTarget.style.boxShadow = '0 3px 10px rgba(34, 197, 94, 0.3)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = isCollapsed ? '#dcfce7' : '#bbf7d0'
								e.currentTarget.style.borderColor = '#86efac'
								e.currentTarget.style.boxShadow = isCollapsed
									? '0 1px 6px rgba(34, 197, 94, 0.18)'
									: '0 2px 8px rgba(34, 197, 94, 0.25)'
							}}
							onFocus={(e) => {
								e.currentTarget.style.outline = '2px solid #22c55e'
								e.currentTarget.style.outlineOffset = '2px'
							}}
							onBlur={(e) => {
								e.currentTarget.style.outline = 'none'
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
								<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</button>
					</div>
				</div>
			)}
			{scopeHint && (isModalVariant || !isCollapsed) ? (
				<div style={{ marginTop: '6px', marginBottom: '2px' }}>
					<span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{scopeHint}</span>
				</div>
			) : null}
			<div
				style={{
					maxHeight: isModalVariant ? 'none' : (isCollapsed ? '0px' : `${contentHeight}px`),
					opacity: isModalVariant || !isCollapsed ? 1 : 0,
					overflow: 'hidden',
					transition: 'max-height 0.28s ease, opacity 0.2s ease, margin-top 0.2s ease',
					marginTop: isModalVariant || !isCollapsed ? '8px' : '0px',
				}}
			>
				<div ref={contentRef}>
					{!isModalVariant && (
						<p style={{ margin: '0 0 14px 0', color: '#64748b', fontSize: '14px' }}>
							{t('leaveplanner.availabilityChecker.description') || 'Wybierz datę lub zakres, a system automatycznie sprawdzi konflikty nieobecności.'}
						</p>
					)}

					<div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', alignItems: 'end' }}>
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
									style={{ width: '80%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
										style={{ width: '80%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
									/>
								</div>
							)}
						</div>
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
												{SENT_STATUSES.has(item.status)
													? (t('leaveform.statuses.sent') || 'Wysłano')
													: PENDING_STATUSES.has(item.status)
														? (t('leaveform.statuses.pending') || 'Oczekuje')
														: ACCEPTED_STATUSES.has(item.status)
															? (t('leaveform.statuses.accepted') || 'Zaakceptowano')
															: (item.status || '-')}
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
			</div>
		</div>
	)
}

export default LeaveAvailabilityChecker

