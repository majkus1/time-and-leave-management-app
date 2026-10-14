import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useOfficeAction, useOfficeClientMonth, useOfficeClients } from '../../hooks/useOffice'
import { buildOfficeMonthRows, leavesInMonth, workdaysInMonth } from '../../utils/officeMonthReport'
import Loader from '../Loader'
import PanelPageLayout from '../shared/PanelPageLayout'
import { useTableCellLabels } from '../../hooks/useTableCellLabels'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import { buildPdfDocument, downloadPdf, pdfDataTable, pdfTitleBlock } from '../../utils/export/pdfDownload'
import { safeFilenamePart } from '../../utils/export/reportFilename'
import '../admin/AdminPartners.css'
import './OfficePanel.css'

function currentYearMonth() {
	const d = new Date()
	return { year: d.getFullYear(), month: d.getMonth() }
}

/**
 * Biuro rachunkowe — panel tylko do odczytu: firmy, które udostępniły dane, i miesiąc per pracownik
 * (dni pracy, godziny, nadgodziny, nieobecności, saldo urlopu, potwierdzenie miesiąca). Sumy liczone tymi samymi
 * funkcjami co lista ewidencji w aplikacji firmy.
 */
export default function OfficePanel() {
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL'
	const num = v => Number(v || 0).toLocaleString(locale, { maximumFractionDigits: 2 })
	const date = d => (d ? new Date(d).toLocaleDateString(locale) : '—')
	const errorText = e => e?.response?.data?.message || t('officePanel.error')

	const clients = useOfficeClients()
	const action = useOfficeAction()
	const [clientTeamId, setClientTeamId] = useState('')
	const [{ year, month }, setYm] = useState(currentYearMonth)
	const [email, setEmail] = useState('')
	const [exporting, setExporting] = useState(false)
	const rootRef = useRef(null)
	useTableCellLabels(rootRef)
	const monthQuery = useOfficeClientMonth(clientTeamId, year, month)
	const data = monthQuery.data

	useEffect(() => {
		const list = clients.data?.clients || []
		if (list.length && !list.some(c => c.clientTeamId === clientTeamId)) setClientTeamId(list[0].clientTeamId)
		if (!list.length && clientTeamId) setClientTeamId('')
	}, [clients.data, clientTeamId])

	const settings = data?.settings
	const { rows, sum, confirmedCount } = useMemo(() => buildOfficeMonthRows(data, { t, i18n }), [data, t, i18n])

	const invite = async e => {
		e.preventDefault()
		try {
			await action.mutateAsync({ action: 'invite', email: email.trim() })
			setEmail('')
			await showAlert(t('officePanel.invited'))
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const end = async (id, question) => {
		if (!(await showConfirm(question, { confirmText: t('officePanel.confirmYes'), cancelText: t('officePanel.cancel') }))) return
		try {
			await action.mutateAsync({ action: 'end', id })
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const layout = content => (
		<PanelPageLayout title={t('officePanel.title')} icon="/img/business.png" contentRef={rootRef}>
			{content}
		</PanelPageLayout>
	)

	if (clients.isLoading) return layout(<Loader />)
	if (clients.isError) {
		return layout(
			<div className="ap">
				<p className="ap-muted">{errorText(clients.error)}</p>
			</div>
		)
	}

	const list = clients.data.clients
	const selected = list.find(c => c.clientTeamId === clientTeamId)
	const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`
	const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })

	/**
	 * Eksport: serwer wydaje dane miesiąca i zapisuje eksport w logu audytowym firmy. Wszystkie arkusze liczymy z tej
	 * jednej odpowiedzi (buildOfficeMonthRows — te same obliczenia co tabela), więc plik zgadza się sam ze sobą.
	 */
	const exportMonth = async format => {
		setExporting(true)
		try {
			const { data: exp } = await axios.post(
				`${API_URL}/api/biuro/clients/${clientTeamId}/export`,
				{ year: String(year), month: String(month), format },
				{ withCredentials: true }
			)
			const nameOf = new Map(exp.users.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim()]))
			const report = buildOfficeMonthRows(exp, { t, i18n })
			const leaveHoursMode = exp.settings?.leaveCalculationMode === 'hours'
			const head = [
				t('officePanel.employee'),
				t('officePanel.workDays'),
				t('officePanel.hours'),
				t('officePanel.overtime'),
				leaveHoursMode ? t('officePanel.leaveHours') : t('officePanel.leaveDays'),
				t('officePanel.otherAbsences'),
				t('officePanel.leaveLeft'),
				t('officePanel.confirmed'),
			]
			const summaryRows = report.rows.map(r => {
				const u = r.user
				const tt = r.totals
				return [
					nameOf.get(u.id) + (u.position ? ` (${u.position})` : ''),
					tt.totalWorkDays,
					Number(tt.totalHours.toFixed(2)),
					Number(tt.overtime.toFixed(2)),
					leaveHoursMode ? Number(tt.leaveHours.toFixed(2)) : tt.leaveDays,
					tt.otherAbsences,
					leaveCell(r),
					u.confirmed ? date(u.confirmedAt) : t('officePanel.notConfirmed'),
				]
			})
			const es = report.sum
			const total = es
				? [t('officePanel.total'), es.totalWorkDays, Number(es.totalHours.toFixed(2)), Number(es.overtime.toFixed(2)), leaveHoursMode ? Number(es.leaveHours.toFixed(2)) : es.leaveDays, es.otherAbsences, '', `${report.confirmedCount}/${report.rows.length}`]
				: null
			// Dni pracy i nieobecności tylko z tego miesiąca (ten sam podział co w sumach — czas lokalny przeglądarki)
			const days = workdaysInMonth(exp.workdays, exp.year, exp.month)
				.sort((a, b) => (nameOf.get(a.userId) || '').localeCompare(nameOf.get(b.userId) || '') || new Date(a.date) - new Date(b.date))
				.map(w => [nameOf.get(w.userId) || '—', date(w.date), Number(w.hoursWorked || 0), Number(w.additionalWorked || 0), w.absenceType || ''])
			const absences = leavesInMonth(exp.leaves, exp.year, exp.month)
				.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
				.map(l => {
					const hourly = Number(l.hoursRequested) > 0
					return [
						nameOf.get(l.userId) || '—',
						date(l.startDate),
						date(l.endDate),
						getLeaveRequestTypeName(exp.settings, l.type, t, i18n.resolvedLanguage),
						hourly ? `${num(l.hoursRequested)} ${t('officePanel.hoursShort')}` : `${num(l.daysRequested)} ${t('officePanel.daysShort')}`,
					]
				})
			const title = `${exp.company.name} — ${monthLabel}`
			const fileBase = `planopia-${safeFilenamePart(exp.company.name, 'firma')}-${monthValue}`
			if (format === 'xlsx') {
				await downloadExcelWorkbook(
					[
						{ name: t('officePanel.sheetSummary'), title, colWidths: [34, 10, 10, 12, 12, 14, 18, 16], rows: [head, ...summaryRows, ...(total ? [total] : [])] },
						{ name: t('officePanel.sheetDays'), colWidths: [30, 12, 10, 12, 24], rows: [[t('officePanel.employee'), t('officePanel.date'), t('officePanel.hours'), t('officePanel.overtime'), t('officePanel.absence')], ...days] },
						{ name: t('officePanel.sheetAbsences'), colWidths: [30, 12, 12, 26, 14], rows: [[t('officePanel.employee'), t('officePanel.from'), t('officePanel.to'), t('officePanel.type'), t('officePanel.amount')], ...absences] },
					],
					`${fileBase}.xlsx`
				)
			} else {
				const doc = buildPdfDocument({
					pageOrientation: 'landscape',
					info: { title },
					content: [
						...pdfTitleBlock(title, `${t('officePanel.pdfSubtitle', { office: clients.data.office.name })} · ${t('officePanel.confirmedSummary', { confirmed: report.confirmedCount, total: report.rows.length })}`),
						pdfDataTable(head, summaryRows.map(r => r.map(c => (typeof c === 'number' ? num(c) : c))), ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], total ? total.map(c => (typeof c === 'number' ? num(c) : c)) : undefined),
						...(absences.length
							? [
									{ text: t('officePanel.sheetAbsences'), bold: true, margin: [0, 14, 0, 0] },
									pdfDataTable([t('officePanel.employee'), t('officePanel.from'), t('officePanel.to'), t('officePanel.type'), t('officePanel.amount')], absences, ['*', 'auto', 'auto', '*', 'auto']),
								]
							: []),
						{ text: t('officePanel.readOnlyNote'), fontSize: 8, color: '#505050', margin: [0, 12, 0, 0] },
					],
				})
				await downloadPdf(doc, `${fileBase}.pdf`)
			}
		} catch (err) {
			await showAlert(errorText(err))
		} finally {
			setExporting(false)
		}
	}
	const leaveCell = r => {
		// Bez przydzielonego limitu (0 i nic nie wykorzystano) — nie pokazujemy mylącego „0 / 0”
		if (!r.mainLeave || (!r.mainLeave.limit && !r.mainLeave.used)) return '—'
		const unit = r.mainLeave.unit === 'hours' ? t('officePanel.hoursShort') : t('officePanel.daysShort')
		return `${num(r.mainLeave.remaining)} / ${num(r.mainLeave.limit)} ${unit}`
	}

	return layout(
		<div className="ap op">
			<p className="ap__lead">{t('officePanel.lead', { name: clients.data.office.name })}</p>

			{list.length === 0 ? (
				<section className="ap-card">
					<h3>{t('officePanel.noClientsTitle')}</h3>
					<p className="ap-muted">{t('officePanel.noClients')}</p>
				</section>
			) : (
				<section className="ap-card">
					<div className="ap-card__head">
						<h3>{selected ? selected.name : t('officePanel.title')}</h3>
						<div className="ap-actions">
							{list.length > 1 ? (
								<select className="ap-input op-select" value={clientTeamId} onChange={e => setClientTeamId(e.target.value)} aria-label={t('officePanel.company')}>
									{list.map(c => (
										<option key={c.clientTeamId} value={c.clientTeamId}>
											{c.name}
										</option>
									))}
								</select>
							) : null}
							<input
								type="month"
								className="ap-input ap-input--month"
								value={monthValue}
								onChange={e => {
									const [y, m] = e.target.value.split('-').map(Number)
									if (y && m) setYm({ year: y, month: m - 1 })
								}}
								aria-label={t('officePanel.month')}
							/>
						</div>
					</div>
					{selected ? <p className="ap-muted">{t('officePanel.since', { date: date(selected.since) })}</p> : null}

					{monthQuery.isLoading ? (
						<Loader />
					) : monthQuery.isError ? (
						<p className="ap-muted">{errorText(monthQuery.error)}</p>
					) : rows.length === 0 ? (
						<p className="ap-muted">{t('officePanel.noEmployees')}</p>
					) : (
						<>
							<p className="ap-muted">{t('officePanel.confirmedSummary', { confirmed: confirmedCount, total: rows.length })}</p>
							<div className="ap-scroll">
								<table className="ap-table op-table">
									<thead>
										<tr>
											<th>{t('officePanel.employee')}</th>
											<th>{t('officePanel.workDays')}</th>
											<th>{t('officePanel.hours')}</th>
											<th>{t('officePanel.overtime')}</th>
											<th>{settings?.leaveCalculationMode === 'hours' ? t('officePanel.leaveHours') : t('officePanel.leaveDays')}</th>
											<th>{t('officePanel.otherAbsences')}</th>
											<th>{t('officePanel.leaveLeft')}</th>
											<th>{t('officePanel.confirmed')}</th>
										</tr>
									</thead>
									<tbody>
										{rows.map(r => (
											<tr key={r.user.id}>
												<td>
													<b>
														{r.user.firstName} {r.user.lastName}
													</b>
													{r.user.position ? <div className="ap-muted">{r.user.position}</div> : null}
												</td>
												<td>{r.totals.totalWorkDays}</td>
												<td>{num(r.totals.totalHours)}</td>
												<td>{num(r.totals.overtime)}</td>
												<td>{settings?.leaveCalculationMode === 'hours' ? num(r.totals.leaveHours) : r.totals.leaveDays}</td>
												<td>{r.totals.otherAbsences}</td>
												<td title={r.user.leaveLimits.map(l => `${l.typeName}: ${num(l.remaining)} / ${num(l.limit)}`).join('\n')}>{leaveCell(r)}</td>
												<td>
													{r.user.confirmed ? (
														<span className="op-ok" title={date(r.user.confirmedAt)}>
															✓ {date(r.user.confirmedAt)}
														</span>
													) : (
														<span className="ap-muted">{t('officePanel.notConfirmed')}</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
									{sum ? (
										<tfoot>
											<tr>
												<td>{t('officePanel.total')}</td>
												<td>{sum.totalWorkDays}</td>
												<td>{num(sum.totalHours)}</td>
												<td>{num(sum.overtime)}</td>
												<td>{settings?.leaveCalculationMode === 'hours' ? num(sum.leaveHours) : sum.leaveDays}</td>
												<td>{sum.otherAbsences}</td>
												<td />
												<td>
													{confirmedCount}/{rows.length}
												</td>
											</tr>
										</tfoot>
									) : null}
								</table>
							</div>
							<p className="ap-muted op-note">{t('officePanel.readOnlyNote')}</p>
							<div className="op-export">
								<button type="button" className="ap-btn ap-btn--ghost" disabled={exporting} onClick={() => exportMonth('xlsx')}>
									{t('officePanel.exportExcel')}
								</button>
								<button type="button" className="ap-btn ap-btn--ghost" disabled={exporting} onClick={() => exportMonth('pdf')}>
									{t('officePanel.exportPdf')}
								</button>
								<span className="ap-muted">{t('officePanel.exportLogged')}</span>
							</div>
						</>
					)}
					{selected ? (
						<button type="button" className="ap-link ap-link--danger op-end" onClick={() => end(selected.id, t('officePanel.endConfirm', { name: selected.name }))}>
							{t('officePanel.end')}
						</button>
					) : null}
				</section>
			)}

			<section className="ap-card ap-card--wide">
				<h3>{t('officePanel.inviteTitle')}</h3>
				<p className="ap-muted">{t('officePanel.inviteLead')}</p>
				<form className="ap-search" onSubmit={invite}>
					<input className="ap-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('officePanel.invitePlaceholder')} required />
					<button type="submit" className="ap-btn" disabled={action.isPending || !email.trim()}>
						{t('officePanel.invite')}
					</button>
				</form>
				{clients.data.invites.length ? (
					<ul className="ap-results">
						{clients.data.invites.map(inv => (
							<li key={inv.id}>
								<span>
									{inv.email} <span className="ap-muted">{t('officePanel.invitePending', { date: date(inv.createdAt) })}</span>
								</span>
								<button type="button" className="ap-link" onClick={() => end(inv.id, t('officePanel.cancelInviteConfirm', { email: inv.email }))}>
									{t('officePanel.cancelInvite')}
								</button>
							</li>
						))}
					</ul>
				) : null}
			</section>
		</div>
	)
}
