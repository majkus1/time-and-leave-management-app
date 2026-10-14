import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useOfficeAction, useOfficeClientMonth, useOfficeClients } from '../../hooks/useOffice'
import { computeTeamTotalsForMonth, aggregateYearTeamTotals } from '../../utils/teamWorkCalendarSummary'
import { workingDatesInRange } from '../../utils/calendarDay'
import Loader from '../Loader'
import '../admin/AdminPartners.css'
import './OfficePanel.css'

const MAIN_LEAVE_TYPE = 'leaveform.option1'

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
	const monthQuery = useOfficeClientMonth(clientTeamId, year, month)
	const data = monthQuery.data

	useEffect(() => {
		const list = clients.data?.clients || []
		if (list.length && !list.some(c => c.clientTeamId === clientTeamId)) setClientTeamId(list[0].clientTeamId)
		if (!list.length && clientTeamId) setClientTeamId('')
	}, [clients.data, clientTeamId])

	const settings = data?.settings
	const generateDateRangeForCalendar = useCallback((start, end) => workingDatesInRange(start, end, settings), [settings])

	const rows = useMemo(() => {
		if (!data) return []
		return data.users.map(u => {
			const totals = computeTeamTotalsForMonth({
				workdays: data.workdays.filter(w => w.userId === u.id),
				acceptedLeaveRequests: data.leaves.filter(l => l.userId === u.id),
				month: data.month,
				year: data.year,
				settings,
				t,
				i18n,
				generateDateRangeForCalendar,
			})
			const mainLeave = u.leaveLimits.find(l => l.typeId === MAIN_LEAVE_TYPE) || null
			return { user: u, totals, mainLeave }
		})
	}, [data, settings, t, i18n, generateDateRangeForCalendar])
	const sum = useMemo(() => (rows.length ? aggregateYearTeamTotals(rows.map(r => r.totals)) : null), [rows])
	const confirmedCount = rows.filter(r => r.user.confirmed).length

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

	if (clients.isLoading) return <Loader />
	if (clients.isError) {
		return (
			<div className="ap">
				<h2 className="ap__title">{t('officePanel.title')}</h2>
				<p className="ap-muted">{errorText(clients.error)}</p>
			</div>
		)
	}

	const list = clients.data.clients
	const selected = list.find(c => c.clientTeamId === clientTeamId)
	const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`
	const leaveCell = r => {
		// Bez przydzielonego limitu (0 i nic nie wykorzystano) — nie pokazujemy mylącego „0 / 0”
		if (!r.mainLeave || (!r.mainLeave.limit && !r.mainLeave.used)) return '—'
		const unit = r.mainLeave.unit === 'hours' ? t('officePanel.hoursShort') : t('officePanel.daysShort')
		return `${num(r.mainLeave.remaining)} / ${num(r.mainLeave.limit)} ${unit}`
	}

	return (
		<div className="ap op">
			<h2 className="ap__title">{t('officePanel.title')}</h2>
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
