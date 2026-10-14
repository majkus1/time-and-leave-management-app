import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config.js'
import { useAlert } from '../../context/AlertContext'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'

const API = `${API_URL}/api/super/partners`
const opts = { withCredentials: true }

function currentMonth() {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function todayIso() {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** „149,90” → 14990 gr; null gdy to nie kwota */
function plnToGrosze(text) {
	const n = Number(String(text ?? '').replace(/\s/g, '').replace(',', '.'))
	return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
}

function nonce() {
	return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Prowizje partnerów: raport miesiąca, zamknięcie, wypłata, cofnięcia i faktury poza aplikacją (etap 2) */
export default function AdminCommissions({ partners }) {
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL'
	const money = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' }), [locale])
	const zl = gr => money.format((gr || 0) / 100)
	const date = d => (d ? new Date(d).toLocaleDateString(locale) : '—')
	const errorText = e => e?.response?.data?.message || t('adminPartners.error')

	const [month, setMonth] = useState(currentMonth())
	const [report, setReport] = useState(null)
	const [selected, setSelected] = useState(null) // wiersz raportu
	const [entries, setEntries] = useState(null)
	const [payout, setPayout] = useState({ paidAt: todayIso(), note: '' })
	const [invoices, setInvoices] = useState([])
	const [invForm, setInvForm] = useState({ teamId: '', teamName: '', invoiceNumber: '', net: '', paidAt: todayIso(), note: '' })
	const [teamQuery, setTeamQuery] = useState('')
	const [teamResults, setTeamResults] = useState([])
	const [busy, setBusy] = useState(false)
	// Cofnięcie: { entry, amount, note, nonce } — nonce powstaje przy otwarciu formularza, więc ponowne wysłanie
	// (np. po timeoutcie) nie utworzy drugiego cofnięcia
	const [reversal, setReversal] = useState(null)
	const [retry, setRetry] = useState({ sourceType: 'stripe_invoice', sourceId: '' })

	const loadReport = useCallback(async () => {
		const { data } = await axios.get(`${API}/commissions`, { params: { month }, ...opts })
		setReport(data.report)
	}, [month])

	const loadEntries = useCallback(async partnerId => {
		const { data } = await axios.get(`${API}/commissions/entries`, { params: { partnerId }, ...opts })
		setEntries(data)
	}, [])

	const loadInvoices = useCallback(async () => {
		const { data } = await axios.get(`${API}/commissions/manual-invoices`, opts)
		setInvoices(data.invoices)
	}, [])

	useEffect(() => {
		loadReport().catch(e => showAlert(errorText(e)))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadReport])

	useEffect(() => {
		loadInvoices().catch(e => showAlert(errorText(e)))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadInvoices])

	// Po zamknięciu miesiąca albo wypłacie kwoty wybranego partnera muszą pochodzić z nowego raportu
	useEffect(() => {
		if (!report) return
		setSelected(prev => (prev ? report.partners.find(r => r.partnerId === prev.partnerId) || { ...prev, payableGrosze: 0, openAccruedGrosze: 0 } : prev))
	}, [report])

	const refresh = async () => {
		await Promise.all([loadReport(), selected ? loadEntries(selected.partnerId) : null])
	}

	const run = async fn => {
		setBusy(true)
		try {
			await fn()
		} catch (e) {
			await showAlert(errorText(e))
		} finally {
			setBusy(false)
		}
	}

	const openPartner = row =>
		run(async () => {
			setSelected(row)
			await loadEntries(row.partnerId)
		})

	const closeMonth = async () => {
		if (!(await showConfirm(t('adminCommissions.closeConfirm', { month })))) return
		await run(async () => {
			const { data } = await axios.post(`${API}/commissions/close-month`, { month }, opts)
			await refresh()
			await showAlert(t('adminCommissions.closed', { count: data.updated }))
		})
	}

	const markPaid = async e => {
		e.preventDefault()
		if (!(await showConfirm(t('adminCommissions.payoutConfirm', { name: selected.name, amount: zl(selected.payableGrosze) })))) return
		await run(async () => {
			await axios.post(`${API}/${selected.partnerId}/payout`, payout, opts)
			setPayout({ paidAt: todayIso(), note: '' })
			await refresh()
			await showAlert(t('adminPartners.saved'))
		})
	}

	const openReversal = entry =>
		setReversal({ entry, amount: (entry.baseNetGrosze / 100).toFixed(2).replace('.', ','), note: '', nonce: nonce() })

	const submitReversal = async e => {
		e.preventDefault()
		const gr = plnToGrosze(reversal.amount)
		if (!gr) return showAlert(t('adminCommissions.badAmount'))
		await run(async () => {
			await axios.post(
				`${API}/commissions/entries/${reversal.entry.id}/reverse`,
				{ refundedNetGrosze: gr, nonce: reversal.nonce, note: reversal.note.trim() },
				opts
			)
			setReversal(null)
			await refresh()
		})
	}

	const searchTeams = async e => {
		e.preventDefault()
		await run(async () => {
			const { data } = await axios.get(`${API}/teams/search`, { params: { q: teamQuery }, ...opts })
			setTeamResults(data.teams)
		})
	}

	const saveInvoice = async e => {
		e.preventDefault()
		const gr = plnToGrosze(invForm.net)
		if (!invForm.teamId) return showAlert(t('adminCommissions.pickTeam'))
		if (!gr) return showAlert(t('adminCommissions.badAmount'))
		await run(async () => {
			const { data } = await axios.post(
				`${API}/commissions/manual-invoices`,
				{ teamId: invForm.teamId, invoiceNumber: invForm.invoiceNumber, netGrosze: gr, paidAt: invForm.paidAt, note: invForm.note },
				opts
			)
			setInvForm({ teamId: '', teamName: '', invoiceNumber: '', net: '', paidAt: todayIso(), note: '' })
			setTeamResults([])
			setTeamQuery('')
			await Promise.all([loadInvoices(), refresh()])
			await showAlert(t('adminCommissions.invoiceSaved', { amount: zl(data.entry.commissionGrosze) }))
		})
	}

	const retryAccrual = async e => {
		e.preventDefault()
		await run(async () => {
			const { data } = await axios.post(`${API}/commissions/retry`, { sourceType: retry.sourceType, sourceId: retry.sourceId.trim() }, opts)
			setRetry(r => ({ ...r, sourceId: '' }))
			await refresh()
			await showAlert(t('adminCommissions.retryDone', { amount: zl(data.entry.commissionGrosze) }))
		})
	}

	const exportExcel = () =>
		run(async () => {
			const head = [t('adminPartners.name'), t('adminPartners.code'), t('adminCommissions.base'), t('adminCommissions.monthTotal'), t('adminCommissions.openAccrued'), t('adminCommissions.payable')]
			const rows = (report?.partners || []).map(r => [r.name, r.code, r.month.baseNetGrosze / 100, r.month.total / 100, r.openAccruedGrosze / 100, r.payableGrosze / 100])
			const sheets = [{ name: month, title: t('adminCommissions.reportTitle', { month }), colWidths: [30, 16, 16, 16, 16, 16], columnNumFmt: { 3: '#,##0.00', 4: '#,##0.00', 5: '#,##0.00', 6: '#,##0.00' }, rows: [head, ...rows] }]
			if (selected && entries) {
				sheets.push({
					name: selected.code,
					title: selected.name,
					colWidths: [12, 30, 16, 12, 14, 8, 14, 12, 12],
					columnNumFmt: { 5: '#,##0.00', 7: '#,##0.00' },
					rows: [
						[t('adminCommissions.date'), t('adminPartners.team'), t('adminCommissions.source'), t('adminCommissions.kind'), t('adminCommissions.base'), t('adminPartners.rate'), t('adminCommissions.commission'), t('adminCommissions.month'), t('adminPartners.status')],
						...entries.entries.map(en => [date(en.occurredAt), en.teamName, t(`adminCommissions.src_${en.sourceType}`), t(`adminCommissions.kind_${en.kind}`), en.baseNetGrosze / 100, `${Math.round(en.rate * 10000) / 100}%`, en.commissionGrosze / 100, en.month, t(`adminCommissions.st_${en.status}`)]),
					],
				})
			}
			await downloadExcelWorkbook(sheets, `prowizje-${month}.xlsx`)
		})

	const partnerName = id => partners.find(p => p.id === id)?.name || '—'

	// Ile już cofnięto z każdej prowizji — przy w całości cofniętej nie pokazujemy „Cofnij”
	const reversedByAccrual = useMemo(() => {
		const map = new Map()
		for (const en of entries?.entries || []) {
			if (en.kind === 'reversal' && en.accrualId) map.set(en.accrualId, (map.get(en.accrualId) || 0) - en.commissionGrosze)
		}
		return map
	}, [entries])

	return (
		<>
			<section className="ap-card ap-card--wide">
				<div className="ap-card__head">
					<h3>{t('adminCommissions.reportTitle', { month })}</h3>
					<div className="ap-actions">
						<input type="month" className="ap-input ap-input--month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} />
						<button type="button" className="ap-btn ap-btn--ghost" onClick={exportExcel} disabled={busy || !report}>
							{t('adminCommissions.export')}
						</button>
						<button type="button" className="ap-btn" onClick={closeMonth} disabled={busy}>
							{t('adminCommissions.closeMonth')}
						</button>
					</div>
				</div>
				<p className="ap-muted">{t('adminCommissions.lead')}</p>
				{!report ? null : report.partners.length === 0 ? (
					<p className="ap-muted">{t('adminCommissions.empty')}</p>
				) : (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminPartners.name')}</th>
									<th>{t('adminCommissions.base')}</th>
									<th>{t('adminCommissions.monthTotal')}</th>
									<th>{t('adminCommissions.openAccrued')}</th>
									<th>{t('adminCommissions.payable')}</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{report.partners.map(r => (
									<tr key={r.partnerId} className={selected?.partnerId === r.partnerId ? 'ap-row--on' : undefined}>
										<td>{r.name}</td>
										<td>{zl(r.month.baseNetGrosze)}</td>
										<td>{zl(r.month.total)}</td>
										<td>{zl(r.openAccruedGrosze)}</td>
										<td>
											<b>{zl(r.payableGrosze)}</b>
										</td>
										<td>
											<div className="ap-actions">
												<button type="button" className="ap-link" onClick={() => openPartner(r)}>
													{t('adminCommissions.details')}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{selected && entries ? (
				<section className="ap-card ap-card--wide">
					<h3>{t('adminCommissions.entriesTitle', { name: selected.name })}</h3>
					<p className="ap-muted">
						{t('adminCommissions.summary', { accrued: zl(entries.summary.accrued), payable: zl(entries.summary.payable), paid: zl(entries.summary.paid) })}
					</p>
					{entries.entries.length === 0 ? (
						<p className="ap-muted">{t('adminCommissions.noEntries')}</p>
					) : (
						<div className="ap-scroll">
							<table className="ap-table">
								<thead>
									<tr>
										<th>{t('adminCommissions.date')}</th>
										<th>{t('adminPartners.team')}</th>
										<th>{t('adminCommissions.source')}</th>
										<th>{t('adminCommissions.base')}</th>
										<th>{t('adminCommissions.commission')}</th>
										<th>{t('adminCommissions.month')}</th>
										<th>{t('adminPartners.status')}</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{entries.entries.map(en => (
										<tr key={en.id}>
											<td>{date(en.occurredAt)}</td>
											<td>{en.teamName}</td>
											<td>
												{t(`adminCommissions.src_${en.sourceType}`)}
												{en.kind === 'reversal' ? ` · ${t('adminCommissions.kind_reversal')}` : ''}
												{en.note ? <div className="ap-muted">{en.note}</div> : null}
											</td>
											<td>{zl(en.baseNetGrosze)}</td>
											<td className={en.commissionGrosze < 0 ? 'ap-neg' : undefined}>
												{zl(en.commissionGrosze)} <span className="ap-muted">({Math.round(en.rate * 10000) / 100}%)</span>
											</td>
											<td>{en.month}</td>
											<td>
												{t(`adminCommissions.st_${en.status}`)}
												{en.paidAt ? <div className="ap-muted">{date(en.paidAt)}</div> : null}
											</td>
											<td>
												<div className="ap-actions">
													{en.kind === 'accrual' && (reversedByAccrual.get(en.id) || 0) < en.commissionGrosze ? (
														<button type="button" className="ap-link ap-link--danger" onClick={() => openReversal(en)} disabled={busy}>
															{t('adminCommissions.reverse')}
														</button>
													) : null}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{selected.payableGrosze < 0 ? (
						<p className="ap-note">{t('adminCommissions.negativeBalance', { amount: zl(selected.payableGrosze) })}</p>
					) : null}
					{reversal ? (
						<form className="ap-reverse" onSubmit={submitReversal}>
							<b>{t('adminCommissions.reverseTitle', { team: reversal.entry.teamName, date: date(reversal.entry.occurredAt), amount: zl(reversal.entry.commissionGrosze) })}</b>
							<div className="ap-search">
								<label className="ap-field">
									<span>{t('adminCommissions.reverseAmount')}</span>
									<input className="ap-input" inputMode="decimal" value={reversal.amount} onChange={e => setReversal(r => ({ ...r, amount: e.target.value }))} required />
								</label>
								<label className="ap-field ap-field--grow">
									<span>{t('adminCommissions.reverseNote')}</span>
									<input className="ap-input" value={reversal.note} onChange={e => setReversal(r => ({ ...r, note: e.target.value }))} placeholder={t('adminCommissions.reverseNotePlaceholder')} required maxLength={500} />
								</label>
							</div>
							<div className="ap-actions ap-actions--start">
								<button type="submit" className="ap-btn" disabled={busy || !reversal.note.trim()}>
									{t('adminCommissions.reverseSubmit')}
								</button>
								<button type="button" className="ap-link" onClick={() => setReversal(null)}>
									{t('adminCommissions.cancel')}
								</button>
							</div>
						</form>
					) : null}

					<form className="ap-search" onSubmit={markPaid} hidden={selected.payableGrosze < 0}>
						<input type="date" className="ap-input" value={payout.paidAt} onChange={e => setPayout(p => ({ ...p, paidAt: e.target.value }))} required />
						<input className="ap-input" value={payout.note} onChange={e => setPayout(p => ({ ...p, note: e.target.value }))} placeholder={t('adminCommissions.payoutNote')} />
						<button type="submit" className="ap-btn" disabled={busy || selected.payableGrosze <= 0}>
							{t('adminCommissions.markPaid', { amount: zl(selected.payableGrosze) })}
						</button>
					</form>
				</section>
			) : null}

			<section className="ap-card ap-card--wide">
				<h3>{t('adminCommissions.retryTitle')}</h3>
				<p className="ap-muted">{t('adminCommissions.retryLead')}</p>
				<form className="ap-search" onSubmit={retryAccrual}>
					<select className="ap-input" value={retry.sourceType} onChange={e => setRetry(r => ({ ...r, sourceType: e.target.value }))}>
						<option value="stripe_invoice">{t('adminCommissions.src_stripe_invoice')}</option>
						<option value="p24_session">{t('adminCommissions.src_p24_session')}</option>
					</select>
					<input
						className="ap-input"
						value={retry.sourceId}
						onChange={e => setRetry(r => ({ ...r, sourceId: e.target.value }))}
						placeholder={retry.sourceType === 'stripe_invoice' ? 'in_…' : t('adminCommissions.retrySessionPlaceholder')}
						required
					/>
					<button type="submit" className="ap-btn ap-btn--ghost" disabled={busy || retry.sourceId.trim().length < 3}>
						{t('adminCommissions.retry')}
					</button>
				</form>
			</section>

			<section className="ap-card ap-card--wide">
				<h3>{t('adminCommissions.invoicesTitle')}</h3>
				<p className="ap-muted">{t('adminCommissions.invoicesLead')}</p>
				<form className="ap-search" onSubmit={searchTeams}>
					<input className="ap-input" value={teamQuery} onChange={e => setTeamQuery(e.target.value)} placeholder={t('adminPartners.searchPlaceholder')} />
					<button type="submit" className="ap-btn ap-btn--ghost" disabled={busy || teamQuery.trim().length < 2}>
						{t('adminPartners.search')}
					</button>
				</form>
				{teamResults.length > 0 ? (
					<ul className="ap-results">
						{teamResults.map(r => (
							<li key={r.id}>
								<span>
									<b>{r.name}</b>{' '}
									<span className="ap-muted">{r.referredByPartnerId ? partnerName(r.referredByPartnerId) : t('adminCommissions.noPartner')}</span>
								</span>
								<button type="button" className="ap-link" onClick={() => setInvForm(f => ({ ...f, teamId: r.id, teamName: r.name }))}>
									{invForm.teamId === r.id ? t('adminPartners.assigned') : t('adminCommissions.pick')}
								</button>
							</li>
						))}
					</ul>
				) : null}
				<form onSubmit={saveInvoice} className="ap-invoice">
					<p className="ap-muted">
						{t('adminPartners.team')}: <b>{invForm.teamName || t('adminPartners.none')}</b>
					</p>
					<div className="ap-row">
						<label className="ap-field">
							<span>{t('adminCommissions.invoiceNumber')}</span>
							<input className="ap-input" value={invForm.invoiceNumber} onChange={e => setInvForm(f => ({ ...f, invoiceNumber: e.target.value }))} required />
						</label>
						<label className="ap-field">
							<span>{t('adminCommissions.netPln')}</span>
							<input className="ap-input" inputMode="decimal" value={invForm.net} onChange={e => setInvForm(f => ({ ...f, net: e.target.value }))} required />
						</label>
					</div>
					<div className="ap-row">
						<label className="ap-field">
							<span>{t('adminCommissions.paidAt')}</span>
							<input type="date" className="ap-input" value={invForm.paidAt} onChange={e => setInvForm(f => ({ ...f, paidAt: e.target.value }))} required />
						</label>
						<label className="ap-field">
							<span>{t('adminPartners.notes')}</span>
							<input className="ap-input" value={invForm.note} onChange={e => setInvForm(f => ({ ...f, note: e.target.value }))} />
						</label>
					</div>
					<button type="submit" className="ap-btn" disabled={busy}>
						{t('adminCommissions.saveInvoice')}
					</button>
				</form>
				{invoices.length > 0 ? (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminCommissions.paidAt')}</th>
									<th>{t('adminPartners.team')}</th>
									<th>{t('adminCommissions.invoiceNumber')}</th>
									<th>{t('adminCommissions.net')}</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map(inv => (
									<tr key={inv.id}>
										<td>{date(inv.paidAt)}</td>
										<td>{inv.teamName}</td>
										<td>{inv.invoiceNumber}</td>
										<td>{zl(inv.netGrosze)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}
			</section>
		</>
	)
}
