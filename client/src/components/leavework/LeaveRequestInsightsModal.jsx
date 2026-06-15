import React from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import {
	LEAVE_REQUEST_STATUS_KEYS,
	countLeaveRequestDaysInPeriod,
	getLeaveRequestDurationStats,
	getLeaveRequestLimitUsageStats,
	getLeaveRequestStatusStats,
	getLeaveRequestTypeStats,
	getLeaveRequestYears,
	filterLeaveRequestsByStatuses,
} from '../../utils/leaveRequestPeriod'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import { buildPdfDocument, downloadPdf } from '../../utils/export/pdfDownload'
import { PDF_REPORT_THEME } from '../../utils/export/pdfReportTheme'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import { buildReportFilename, safeFilenamePart } from '../../utils/export/reportFilename'

const STATUS_CLASS_NAMES = {
	accepted: 'is-accepted',
	pending: 'is-pending',
	rejected: 'is-rejected',
	sent: 'is-sent',
}

function LeaveRequestInsightsModal({
	isOpen,
	onRequestClose,
	requests,
	periodRequests,
	selectedYear,
	selectedMonth,
	onYearChange,
	onMonthChange,
	settings,
	leaveTypeDays,
	reportSubject,
	statusFilters,
}) {
	const { t, i18n } = useTranslation()
	const [exporting, setExporting] = React.useState(null)
	const years = React.useMemo(() => getLeaveRequestYears(requests), [requests])
	const effectiveStatusFilters = React.useMemo(
		() => statusFilters || Object.fromEntries(LEAVE_REQUEST_STATUS_KEYS.map(status => [status, true])),
		[statusFilters]
	)
	const activeStatusKeys = React.useMemo(
		() => LEAVE_REQUEST_STATUS_KEYS.filter(status => effectiveStatusFilters[status] !== false),
		[effectiveStatusFilters]
	)
	const visiblePeriodRequests = React.useMemo(
		() => filterLeaveRequestsByStatuses(periodRequests, effectiveStatusFilters),
		[periodRequests, effectiveStatusFilters]
	)
	const stats = React.useMemo(() => getLeaveRequestStatusStats(visiblePeriodRequests), [visiblePeriodRequests])
	const durationStats = React.useMemo(
		() => getLeaveRequestDurationStats(visiblePeriodRequests, selectedYear, selectedMonth, settings),
		[visiblePeriodRequests, selectedYear, selectedMonth, settings]
	)
	const typeStats = React.useMemo(
		() => getLeaveRequestTypeStats(visiblePeriodRequests, selectedYear, selectedMonth, settings),
		[visiblePeriodRequests, selectedYear, selectedMonth, settings]
	)
	const limitUsageStats = React.useMemo(
		() => getLeaveRequestLimitUsageStats(visiblePeriodRequests, selectedYear, selectedMonth, settings, leaveTypeDays),
		[visiblePeriodRequests, selectedYear, selectedMonth, settings, leaveTypeDays]
	)
	const durationUnit = settings?.leaveCalculationMode === 'hours'
		? t('leaveRequestInsights.hours')
		: t('leaveRequestInsights.days')
	const limitUnit = t('leaveRequestInsights.days')
	const formatDuration = (value) => (
		new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 }).format(value)
	)
	const maxTypeDuration = Math.max(...typeStats.map(stat => stat.duration), 0)
	const statusLabels = React.useMemo(() => ({
		accepted: t('leaveRequestInsights.statuses.accepted'),
		pending: t('leaveRequestInsights.statuses.pending'),
		rejected: t('leaveRequestInsights.statuses.rejected'),
		sent: t('leaveRequestInsights.statuses.sent'),
	}), [t])
	const activeStatusLabel = activeStatusKeys.length === LEAVE_REQUEST_STATUS_KEYS.length
		? (i18n.resolvedLanguage === 'pl' ? 'Wszystkie statusy' : 'All statuses')
		: activeStatusKeys.map(status => statusLabels[status]).join(', ')
	const statusColors = {
		accepted: '#22c55e',
		pending: '#f59e0b',
		rejected: '#991b1b',
		sent: '#8b5cf6',
	}
	const requestRows = React.useMemo(() => (
		[...visiblePeriodRequests]
			.sort((a, b) => new Date(a?.startDate || 0) - new Date(b?.startDate || 0))
			.map((request) => {
				const statusKey = String(request?.status || '').replace('status.', '')
				const daysInPeriod = countLeaveRequestDaysInPeriod(request, selectedYear, selectedMonth, settings)
				const duration = settings?.leaveCalculationMode === 'hours'
					? daysInPeriod * (Number(settings?.leaveHoursPerDay) || 8)
					: daysInPeriod
				return {
					id: request?._id,
					type: getLeaveRequestTypeName(settings, request?.type, t, i18n.resolvedLanguage),
					statusKey,
					status: statusLabels[statusKey] || request?.status || '-',
					startDate: request?.startDate,
					endDate: request?.endDate,
					duration,
					daysInPeriod,
					replacement: request?.replacement || '-',
					additionalInfo: request?.additionalInfo || '-',
					submittedBy: [request?.submittedBy?.firstName, request?.submittedBy?.lastName].filter(Boolean).join(' ') || '-',
					updatedBy: [request?.updatedBy?.firstName, request?.updatedBy?.lastName].filter(Boolean).join(' ') || '-',
				}
			})
	), [visiblePeriodRequests, selectedYear, selectedMonth, settings, t, i18n.resolvedLanguage, statusLabels])
	const yearlyBreakdownEnabled = selectedYear !== 'all' && selectedMonth === 'all'
	const monthlySummaryRows = React.useMemo(() => {
		if (!yearlyBreakdownEnabled) return []
		const multiplier = settings?.leaveCalculationMode === 'hours'
			? Number(settings?.leaveHoursPerDay) || 8
			: 1
		return Array.from({ length: 12 }, (_, month) => {
			const monthRequests = []
			const totals = {
				month,
				requests: 0,
				total: 0,
				accepted: 0,
				pending: 0,
				rejected: 0,
				sent: 0,
			}
			for (const request of visiblePeriodRequests) {
				const days = countLeaveRequestDaysInPeriod(request, selectedYear, month, settings)
				if (!days) continue
				const statusKey = String(request?.status || '').replace('status.', '')
				const duration = days * multiplier
				monthRequests.push(request)
				totals.total += duration
				if (LEAVE_REQUEST_STATUS_KEYS.includes(statusKey)) totals[statusKey] += duration
			}
			totals.requests = monthRequests.length
			return totals
		})
	}, [yearlyBreakdownEnabled, visiblePeriodRequests, selectedYear, settings])

	const formatDate = (value) => {
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) return '-'
		return date.toLocaleDateString(i18n.resolvedLanguage, { day: '2-digit', month: '2-digit', year: 'numeric' })
	}
	const formatMonthName = (month) => {
		const name = new Date(Date.UTC(2020, month, 1)).toLocaleString(i18n.resolvedLanguage, {
			month: 'long',
			timeZone: 'UTC',
		})
		return name.charAt(0).toUpperCase() + name.slice(1)
	}
	const getPeriodLabel = () => {
		if (selectedYear === 'all') return t('leaveRequestFilter.allYears')
		if (selectedMonth === 'all') return String(selectedYear)
		return `${formatMonthName(Number(selectedMonth))} ${selectedYear}`
	}
	const getReportSubject = () => reportSubject || (i18n.resolvedLanguage === 'pl' ? 'Moje wnioski urlopowe' : 'My leave requests')
	const filename = (extension) => buildReportFilename({
		locale: i18n.resolvedLanguage,
		pl: 'raport-urlopy',
		en: 'leave-report',
		parts: [safeFilenamePart(getReportSubject()), getPeriodLabel()],
		extension,
	})
	const buildInsightText = () => {
		const acceptedDuration = durationStats.accepted || 0
		const pendingDuration = durationStats.pending || 0
		const topType = typeStats[0]
		const lines = []
		lines.push(`Zaakceptowane nieobecności: ${formatDuration(acceptedDuration)} ${durationUnit}.`)
		if (pendingDuration > 0) lines.push(`Do decyzji pozostaje ${stats.pending} wniosków na ${formatDuration(pendingDuration)} ${durationUnit}.`)
		if (topType) {
			lines.push(`Największy udział ma ${getLeaveRequestTypeName(settings, topType.type, t, i18n.resolvedLanguage)}: ${formatDuration(topType.duration)} ${durationUnit}.`)
		}
		if (yearlyBreakdownEnabled && monthlySummaryRows.length > 0) {
			const topMonth = monthlySummaryRows.reduce((best, row) => row.total > best.total ? row : best, monthlySummaryRows[0])
			if (topMonth?.total > 0) {
				lines.push(`Największe obciążenie urlopowe w roku przypada na ${formatMonthName(topMonth.month)}: ${formatDuration(topMonth.total)} ${durationUnit}.`)
			}
		}
		const exceeded = limitUsageStats.find(item => item.isExceeded)
		const atRisk = limitUsageStats.find(item => item.isAtRisk)
		if (exceeded) lines.push(`Uwaga: przekroczony limit dla typu ${getLeaveRequestTypeName(settings, exceeded.type, t, i18n.resolvedLanguage)}.`)
		else if (atRisk) lines.push(`Ryzyko przekroczenia limitu dla typu ${getLeaveRequestTypeName(settings, atRisk.type, t, i18n.resolvedLanguage)} po akceptacji oczekujących wniosków.`)
		return lines
	}
	const buildPdf = () => {
		const theme = PDF_REPORT_THEME
		const kpiCards = [
			{ label: 'Wszystkie wnioski', value: stats.total, sub: `${formatDuration(durationStats.total)} ${durationUnit}`, color: theme.navy },
			...activeStatusKeys.map(status => ({
				label: statusLabels[status],
				value: stats[status],
				sub: `${formatDuration(durationStats[status])} ${durationUnit}`,
				color: status === 'accepted' ? theme.green : status === 'pending' ? theme.amber : status === 'rejected' ? theme.red : theme.purple,
			})),
		]
		const tableLayout = {
			hLineColor: () => theme.line,
			vLineColor: () => theme.line,
			fillColor: rowIndex => rowIndex === 0 ? theme.navy : (rowIndex % 2 === 0 ? theme.softRow : null),
		}
		const content = [
			{
				table: {
					widths: ['*', 170],
					body: [[
						{
							stack: [
								{ text: 'RAPORT URLOPÓW I NIEOBECNOŚCI', fontSize: 8, bold: true, color: theme.headerEyebrow, characterSpacing: 1 },
								{ text: getReportSubject(), fontSize: 20, bold: true, color: '#ffffff', margin: [0, 5, 0, 0] },
								{ text: `Okres: ${getPeriodLabel()}`, fontSize: 10, color: theme.headerSubtitle, margin: [0, 4, 0, 0] },
							],
							border: [false, false, false, false],
							margin: [16, 14, 12, 14],
						},
						{
							stack: [
								{ text: `Wygenerowano: ${new Date().toLocaleString(i18n.resolvedLanguage)}`, fontSize: 8, color: theme.headerSubtitle },
								{ text: `Jednostka: ${durationUnit}`, fontSize: 8, color: theme.headerSubtitle, margin: [0, 5, 0, 0] },
								{ text: `Statusy: ${activeStatusLabel}`, fontSize: 8, color: theme.headerSubtitle, margin: [0, 5, 0, 0] },
							],
							border: [false, false, false, false],
							alignment: 'right',
							margin: [10, 18, 16, 10],
						},
					]],
				},
				layout: { fillColor: () => theme.navy, hLineWidth: () => 0, vLineWidth: () => 0 },
				margin: [0, 0, 0, 18],
			},
			{
				table: {
					widths: kpiCards.map(() => '*'),
					body: [[
						...kpiCards.map(card => ({
							stack: [
								{ text: card.label, fontSize: 8, bold: true, color: theme.muted },
								{ text: String(card.value), fontSize: 17, bold: true, color: theme.navy, margin: [0, 3, 0, 0] },
								{ text: card.sub, fontSize: 8, bold: true, color: theme.navy, margin: [0, 2, 0, 0] },
								{ canvas: [{ type: 'rect', x: 0, y: 0, w: 58, h: 3, r: 1.5, color: card.color }], margin: [0, 5, 0, 0] },
							],
							border: [false, false, false, false],
							margin: [8, 7, 8, 7],
						})),
					]],
				},
				layout: { hLineColor: () => theme.line, vLineColor: () => theme.line },
				margin: [0, 0, 0, 14],
			},
			{
				stack: [
					{ text: 'Najważniejsze informacje', style: 'sectionTitle' },
					...buildInsightText().map(line => ({ text: `• ${line}`, margin: [0, 2, 0, 0] })),
				],
				fillColor: theme.soft,
				margin: [0, 0, 0, 16],
			},
		]
		if (yearlyBreakdownEnabled && monthlySummaryRows.length > 0) {
			const topMonth = monthlySummaryRows.reduce((best, row) => row.total > best.total ? row : best, monthlySummaryRows[0])
			content.push(
				{ text: 'Podsumowanie miesięczne', style: 'sectionTitle' },
				{
					text: topMonth?.total > 0
						? `Najwięcej czasu urlopowego w roku: ${formatMonthName(topMonth.month)} (${formatDuration(topMonth.total)} ${durationUnit}).`
						: 'Brak wykorzystania urlopów w miesiącach spełniających wybrane filtry.',
					color: theme.muted,
					fontSize: 8.5,
					margin: [0, 0, 0, 5],
				},
				{
					table: {
						headerRows: 1,
						widths: ['*', 42, 55, ...activeStatusKeys.map(() => 55)],
						body: [
							[
								'Miesiąc',
								'Wnioski',
								`Łącznie (${durationUnit})`,
								...activeStatusKeys.map(status => `${statusLabels[status]} (${durationUnit})`),
							].map(text => ({ text, bold: true, color: '#ffffff' })),
							...monthlySummaryRows.map(row => [
								formatMonthName(row.month),
								row.requests,
								formatDuration(row.total),
								...activeStatusKeys.map(status => formatDuration(row[status] || 0)),
							]),
						],
					},
					layout: tableLayout,
					fontSize: 7.5,
					margin: [0, 4, 0, 14],
				}
			)
		}
		if (typeStats.length > 0) {
			content.push(
				{ text: 'Urlopy według typu', style: 'sectionTitle' },
				{
					table: {
						headerRows: 1,
						widths: ['*', 55, 70, 70, 70],
						body: [
							['Typ', 'Wnioski', `Łącznie (${durationUnit})`, `Zaakcept. (${durationUnit})`, `Oczek. (${durationUnit})`].map(text => ({ text, bold: true, color: '#ffffff' })),
							...typeStats.map(row => [
								getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
								row.requests,
								formatDuration(row.duration),
								formatDuration(row.accepted),
								formatDuration(row.pending),
							]),
						],
					},
					layout: tableLayout,
					fontSize: 8,
					margin: [0, 4, 0, 14],
				}
			)
		}
		if (limitUsageStats.length > 0) {
			content.push(
				{ text: 'Wykorzystanie dostępnej puli', style: 'sectionTitle' },
				{
					table: {
						headerRows: 1,
						widths: ['*', 55, 55, 55, 65],
						body: [
							['Typ', 'Limit', 'Wykorzystano', 'Oczekuje', 'Pozostało'].map(text => ({ text, bold: true, color: '#ffffff' })),
							...limitUsageStats.map(row => [
								getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
								formatDuration(row.limit),
								formatDuration(row.used),
								formatDuration(row.pending),
								formatDuration(row.remaining),
							]),
						],
					},
					layout: tableLayout,
					fontSize: 8,
					margin: [0, 4, 0, 14],
				}
			)
		}
		content.push(
			{ text: 'Lista wniosków w okresie', style: 'sectionTitle' },
			{
				table: {
					headerRows: 1,
					widths: [76, 48, 48, 62, 42, '*', '*'],
					body: [
						['Typ', 'Od', 'Do', 'Status', durationUnit, 'Zastępstwo', 'Uwagi'].map(text => ({ text, bold: true, color: '#ffffff' })),
						...(requestRows.length > 0 ? requestRows.map(row => [
							row.type,
							formatDate(row.startDate),
							formatDate(row.endDate),
							{ text: row.status, color: statusColors[row.statusKey] || theme.navy, bold: true },
							formatDuration(row.duration),
							row.replacement,
							row.additionalInfo,
						]) : [[{ text: 'Brak wniosków w wybranym okresie.', colSpan: 7, alignment: 'center', color: theme.muted }, '', '', '', '', '', '']]),
					],
				},
				layout: tableLayout,
				fontSize: 7.5,
				margin: [0, 4, 0, 0],
			}
		)
		return buildPdfDocument({
			pageOrientation: 'landscape',
			pageMargins: [28, 28, 28, 34],
			info: { title: `Raport urlopów - ${getReportSubject()} - ${getPeriodLabel()}` },
			styles: {
				sectionTitle: { fontSize: 13, bold: true, color: theme.navy, margin: [0, 0, 0, 4] },
			},
			footer: (currentPage, pageCount) => ({
				columns: [
					{ text: 'Planopia', color: theme.muted, fontSize: 8 },
					{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: theme.muted, fontSize: 8 },
				],
				margin: [28, 0, 28, 0],
			}),
			content,
		})
	}
	const handleExportPdf = async () => {
		setExporting('pdf')
		try {
			await downloadPdf(buildPdf(), filename('pdf'))
		} finally {
			setExporting(null)
		}
	}
	const handleExportExcel = async () => {
		setExporting('excel')
		try {
			await downloadExcelWorkbook([
				{
					name: 'Podsumowanie',
					title: `Raport urlopów - ${getReportSubject()}`,
					subtitle: `Okres: ${getPeriodLabel()}`,
					executive: true,
					colWidths: [24, 18, 18, 18],
					rows: [
						['Obszar', 'Wskaźnik', 'Wartość', 'Jednostka'],
						['Metadane', 'Okres', getPeriodLabel(), ''],
						['Metadane', 'Statusy', activeStatusLabel, ''],
						['KPI', 'Wszystkie wnioski', stats.total, 'wnioski'],
						...activeStatusKeys.map(status => ['KPI', statusLabels[status], stats[status], 'wnioski']),
						['Czas', 'Łącznie', durationStats.total, durationUnit],
						...activeStatusKeys.map(status => ['Czas', statusLabels[status], durationStats[status], durationUnit]),
					],
				},
				...(yearlyBreakdownEnabled ? [{
					name: 'Miesiące',
					title: `Podsumowanie miesięczne - ${getPeriodLabel()}`,
					subtitle: `Statusy: ${activeStatusLabel}`,
					colWidths: [18, 12, 18, ...activeStatusKeys.map(() => 18)],
					rows: [
						[
							'Miesiąc',
							'Wnioski',
							`Łącznie (${durationUnit})`,
							...activeStatusKeys.map(status => `${statusLabels[status]} (${durationUnit})`),
						],
						...monthlySummaryRows.map(row => [
							formatMonthName(row.month),
							row.requests,
							row.total,
							...activeStatusKeys.map(status => row[status] || 0),
						]),
					],
				}] : []),
				{
					name: 'Typy urlopów',
					title: `Urlopy według typu - ${getPeriodLabel()}`,
					colWidths: [30, 14, 18, 18, 18, 18],
					rows: [
						['Typ', 'Wnioski', `Łącznie (${durationUnit})`, `Zaakceptowane (${durationUnit})`, `Oczekujące (${durationUnit})`, `Odrzucone (${durationUnit})`],
						...typeStats.map(row => [
							getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
							row.requests,
							row.duration,
							row.accepted,
							row.pending,
							row.rejected,
						]),
					],
				},
				{
					name: 'Limity',
					title: `Wykorzystanie dostępnej puli - ${getPeriodLabel()}`,
					colWidths: [30, 14, 16, 16, 16, 16],
					rows: [
						['Typ', 'Limit', 'Wykorzystano', 'Oczekuje', 'Pozostało', 'Wykorzystanie %'],
						...limitUsageStats.map(row => [
							getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
							row.limit,
							row.used,
							row.pending,
							row.remaining,
							Math.round(row.usagePercent),
						]),
					],
				},
				{
					name: 'Wnioski',
					title: `Lista wniosków - ${getPeriodLabel()}`,
					colWidths: [28, 13, 13, 17, 12, 22, 22, 30],
					rows: [
						['Typ', 'Data od', 'Data do', 'Status', durationUnit, 'Zastępstwo', 'Zgłoszono przez', 'Uwagi'],
						...requestRows.map(row => [
							row.type,
							formatDate(row.startDate),
							formatDate(row.endDate),
							row.status,
							row.duration,
							row.replacement,
							row.submittedBy,
							row.additionalInfo,
						]),
					],
				},
			], filename('xlsx'))
		} finally {
			setExporting(null)
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onRequestClose}
			overlayClassName="leave-insights-modal-overlay"
			className="leave-insights-modal"
			contentLabel={t('leaveRequestInsights.title')}
		>
			<div className="leave-insights-modal__header">
				<div>
					<h2>{t('leaveRequestInsights.title')}</h2>
					<p>{t('leaveRequestInsights.subtitle')}</p>
				</div>
				<button type="button" className="leave-insights-modal__close" onClick={onRequestClose} aria-label={t('leaveRequestInsights.close')}>×</button>
			</div>

			<div className="leave-insights-modal__export-actions">
				<button
					type="button"
					className="leave-insights-export-button is-excel"
					onClick={handleExportExcel}
					disabled={exporting !== null}
				>
					{exporting === 'excel' ? 'Generowanie...' : 'Excel'}
				</button>
				<button
					type="button"
					className="leave-insights-export-button is-pdf"
					onClick={handleExportPdf}
					disabled={exporting !== null}
				>
					{exporting === 'pdf' ? 'Generowanie...' : 'PDF'}
				</button>
			</div>

			<div className="leave-insights-modal__period">
				<label>
					<span>{t('leaveRequestFilter.year')}</span>
					<select
						value={selectedYear}
						onChange={(event) => {
							const value = event.target.value
							onYearChange(value === 'all' ? 'all' : Number(value))
							if (value === 'all') onMonthChange('all')
						}}
					>
						<option value="all">{t('leaveRequestFilter.allYears')}</option>
						{years.map(year => <option key={year} value={year}>{year}</option>)}
					</select>
				</label>
				<label>
					<span>{t('leaveRequestFilter.month')}</span>
					<select
						className="calendar-month-select"
						value={selectedMonth}
						disabled={selectedYear === 'all'}
						onChange={(event) => onMonthChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
					>
						<option value="all">{t('leaveRequestFilter.allMonths')}</option>
						{Array.from({ length: 12 }, (_, month) => {
							const name = new Date(Date.UTC(2020, month, 1)).toLocaleString(i18n.resolvedLanguage, {
								month: 'long',
								timeZone: 'UTC',
							})
							return <option key={month} value={month}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
						})}
					</select>
				</label>
			</div>
			<div className="leave-insights-modal__active-statuses">
				<span>Statusy w statystykach:</span>
				<strong>{activeStatusLabel}</strong>
			</div>

			<div className="leave-insights-modal__stats">
				<div className="leave-insights-stat is-total">
					<strong>{stats.total}</strong>
					<span>{t('leaveRequestInsights.total')}</span>
					<small>{formatDuration(durationStats.total)} {durationUnit}</small>
				</div>
				{activeStatusKeys.map(status => (
					<div key={status} className={`leave-insights-stat ${STATUS_CLASS_NAMES[status]}`}>
						<strong>{stats[status]}</strong>
						<span>{t(`leaveRequestInsights.statuses.${status}`)}</span>
						<small>{formatDuration(durationStats[status])} {durationUnit}</small>
					</div>
				))}
			</div>

			<div className="leave-insights-modal__section">
				<div className="leave-insights-modal__section-heading">
					<div>
						<h3>{t('leaveRequestInsights.limitTitle')}</h3>
						<p>{t('leaveRequestInsights.limitHint')}</p>
					</div>
				</div>
				{limitUsageStats.length > 0 ? (
					<div className="leave-insights-limit-list">
						{limitUsageStats.map(stat => (
							<div
								key={stat.type}
								className={`leave-insights-limit-card ${stat.isExceeded ? 'is-exceeded' : ''} ${stat.isAtRisk ? 'is-at-risk' : ''}`}
							>
								<div className="leave-insights-limit-card__top">
									<strong>{getLeaveRequestTypeName(settings, stat.type, t, i18n.resolvedLanguage)}</strong>
									<span>{formatDuration(stat.used)} / {formatDuration(stat.limit)} {limitUnit}</span>
								</div>
								<div className="leave-insights-limit-card__progress" aria-hidden="true">
									<span style={{ width: `${stat.usagePercent}%` }} />
								</div>
								<div className="leave-insights-limit-card__details">
									<span>{t('leaveRequestInsights.limitRemaining', { count: formatDuration(Math.max(0, stat.remaining)), unit: limitUnit })}</span>
									{stat.pending > 0 && (
										<span>{t('leaveRequestInsights.limitPending', { count: formatDuration(stat.pending), unit: limitUnit })}</span>
									)}
								</div>
								{stat.isExceeded && <small>{t('leaveRequestInsights.limitExceeded')}</small>}
								{stat.isAtRisk && <small>{t('leaveRequestInsights.limitAtRisk')}</small>}
							</div>
						))}
					</div>
				) : (
					<div className="leave-insights-empty">{t('leaveRequestInsights.limitEmpty')}</div>
				)}
			</div>

			<div className="leave-insights-modal__section">
				<div className="leave-insights-modal__section-heading">
					<div>
						<h3>Terminy wniosków</h3>
						<p>Konkretne przedziały dat zgodne z wybranym okresem i aktywnymi statusami.</p>
					</div>
				</div>
				{requestRows.length > 0 ? (
					<div className="leave-insights-date-list">
						{requestRows.map(row => (
							<div key={row.id || `${row.type}-${row.startDate}-${row.endDate}`} className="leave-insights-date-row">
								<div className="leave-insights-date-row__main">
									<strong>{row.type}</strong>
									<span>{formatDate(row.startDate)} - {formatDate(row.endDate)}</span>
								</div>
								<div className="leave-insights-date-row__meta">
									<span className={`leave-insights-date-status ${STATUS_CLASS_NAMES[row.statusKey] || ''}`}>{row.status}</span>
									<small>{formatDuration(row.duration)} {durationUnit}</small>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="leave-insights-empty">Brak terminów dla aktywnych statusów.</div>
				)}
			</div>

			<div className="leave-insights-modal__section">
				<div className="leave-insights-modal__section-heading">
					<div>
						<h3>{t('leaveRequestInsights.typeTitle')}</h3>
						<p>{t('leaveRequestInsights.typeHint')}</p>
					</div>
				</div>
				{typeStats.length > 0 ? (
					<div className="leave-insights-type-list">
						{typeStats.map(stat => {
							const barWidth = maxTypeDuration > 0 ? Math.max(8, (stat.duration / maxTypeDuration) * 100) : 0
							return (
								<div key={stat.type} className="leave-insights-type-row">
									<div className="leave-insights-type-row__meta">
										<strong>{getLeaveRequestTypeName(settings, stat.type, t, i18n.resolvedLanguage)}</strong>
										<span>
											{formatDuration(stat.duration)} {durationUnit} · {t('leaveRequestInsights.requestCount', { count: stat.requests })}
										</span>
									</div>
									<div className="leave-insights-type-row__bar" aria-hidden="true">
										<span style={{ width: `${barWidth}%` }} />
									</div>
								</div>
							)
						})}
					</div>
				) : (
					<div className="leave-insights-empty">{t('leaveRequestInsights.typeEmpty')}</div>
				)}
			</div>

			<div className="leave-insights-modal__footer">
				<span>{t('leaveRequestInsights.periodTotal', { count: visiblePeriodRequests.length })}</span>
				<button type="button" onClick={onRequestClose}>{t('leaveRequestInsights.done')}</button>
			</div>
		</Modal>
	)
}

export default LeaveRequestInsightsModal
