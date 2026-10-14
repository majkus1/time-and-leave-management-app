import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { usePartnerEntries, usePartnerOverview } from '../../hooks/usePartnerPortal'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import { buildPdfDocument, downloadPdf, pdfDataTable, pdfLabelValueLines, pdfTitleBlock } from '../../utils/export/pdfDownload'
import Loader from '../Loader'
import PanelPageLayout from '../shared/PanelPageLayout'
import { useTableCellLabels } from '../../hooks/useTableCellLabels'
import '../admin/AdminPartners.css'
import './PartnerPanel.css'

/** Program partnerski — panel zespołu partnera (Admin/HR): link polecający, polecone firmy, prowizje, eksport */
export default function PartnerPanel() {
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL'
	const money = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' }), [locale])
	const zl = gr => money.format((gr || 0) / 100)
	const date = d => (d ? new Date(d).toLocaleDateString(locale) : '—')
	const monthLabel = m => {
		const [y, mo] = String(m).split('-').map(Number)
		return y && mo ? new Date(y, mo - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : m
	}
	const percent = rate => `${Math.round(rate * 10000) / 100}%`

	const overview = usePartnerOverview()
	const [month, setMonth] = useState('')
	const entries = usePartnerEntries(month)
	const [copied, setCopied] = useState(false)
	const [busy, setBusy] = useState(false)
	const rootRef = useRef(null)
	useTableCellLabels(rootRef)

	// Domyślnie najnowszy miesiąc z prowizjami
	useEffect(() => {
		if (!month && overview.data?.months?.length) setMonth(overview.data.months[0].month)
	}, [overview.data, month])

	const layout = content => (
		<PanelPageLayout title={t('partnerPanel.title')} icon="/img/wallet.png" contentRef={rootRef}>
			{content}
		</PanelPageLayout>
	)

	if (overview.isLoading) return layout(<Loader />)
	if (overview.isError) {
		return layout(
			<div className="ap">
				<p className="ap-muted">{overview.error?.response?.data?.message || t('partnerPanel.error')}</p>
			</div>
		)
	}

	const { partner, totals, months, teams } = overview.data
	const terms = partner.commissionMonths
		? t('partnerPanel.terms', { rate: percent(partner.commissionRate), count: partner.commissionMonths })
		: t('partnerPanel.termsUnlimited', { rate: percent(partner.commissionRate) })
	const rows = entries.data?.entries || []
	// Okres prowizji startuje od pierwszej płatności firmy; bez limitu — „bez limitu”
	const untilLabel = tm =>
		!partner.commissionMonths ? t('partnerPanel.noLimit') : tm.commissionUntil ? date(tm.commissionUntil) : t('partnerPanel.untilAfterFirst', { count: partner.commissionMonths })
	const sourceLabel = en => `${t(`partnerPanel.src_${en.sourceType}`)}${en.kind === 'reversal' ? ` · ${t('partnerPanel.reversal')}` : ''}`

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(partner.link)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			await showAlert(partner.link)
		}
	}

	const run = async fn => {
		setBusy(true)
		try {
			await fn()
		} catch {
			await showAlert(t('partnerPanel.exportError'))
		} finally {
			setBusy(false)
		}
	}

	const entryRow = en => [date(en.occurredAt), en.teamName, sourceLabel(en), en.baseNetGrosze / 100, en.commissionGrosze / 100, t(`partnerPanel.st_${en.status}`)]
	const entryHead = () => [t('partnerPanel.date'), t('partnerPanel.company'), t('partnerPanel.source'), t('partnerPanel.base'), t('partnerPanel.commission'), t('partnerPanel.status')]

	const exportExcel = () =>
		run(async () => {
			const sheets = [
				{
					name: t('partnerPanel.sheetMonths'),
					title: `${t('partnerPanel.title')} — ${partner.name}`,
					subtitle: terms,
					colWidths: [20, 16, 16, 16, 16, 16],
					columnNumFmt: { 2: '#,##0.00', 3: '#,##0.00', 4: '#,##0.00', 5: '#,##0.00', 6: '#,##0.00' },
					rows: [
						[t('partnerPanel.month'), t('partnerPanel.base'), t('partnerPanel.st_accrued'), t('partnerPanel.st_payable'), t('partnerPanel.st_paid'), t('partnerPanel.total')],
						...months.map(m => [monthLabel(m.month), m.baseNetGrosze / 100, m.accrued / 100, m.payable / 100, m.paid / 100, m.total / 100]),
					],
				},
				{
					name: t('partnerPanel.sheetCompanies'),
					colWidths: [32, 16, 14, 16, 16],
					columnNumFmt: { 5: '#,##0.00' },
					rows: [
						[t('partnerPanel.company'), t('partnerPanel.plan'), t('partnerPanel.since'), t('partnerPanel.until'), t('partnerPanel.commission')],
						...teams.map(tm => [tm.name, t(`partnerPanel.plan_${tm.planState}`), date(tm.referredAt), untilLabel(tm), tm.commissionGrosze / 100]),
					],
				},
			]
			if (month && rows.length) {
				sheets.push({ name: month, title: monthLabel(month), colWidths: [12, 30, 22, 14, 14, 14], columnNumFmt: { 4: '#,##0.00', 5: '#,##0.00' }, rows: [entryHead(), ...rows.map(entryRow)] })
			}
			await downloadExcelWorkbook(sheets, `planopia-prowizje-${partner.code}${month ? `-${month}` : ''}.xlsx`)
		})

	const exportPdf = () =>
		run(async () => {
			const sumMonth = rows.reduce((s, en) => s + en.commissionGrosze, 0)
			const doc = buildPdfDocument({
				info: { title: `${t('partnerPanel.pdfTitle')} ${month}` },
				content: [
					...pdfTitleBlock(t('partnerPanel.pdfTitle'), `${partner.name} — ${monthLabel(month)}`),
					...pdfLabelValueLines([
						{ label: t('partnerPanel.code'), value: partner.code },
						{ label: t('partnerPanel.termsLabel'), value: terms },
						{ label: t('partnerPanel.monthTotal'), value: zl(sumMonth) },
					]),
					pdfDataTable(
						entryHead(),
						rows.map(en => {
							const r = entryRow(en)
							return [r[0], r[1], r[2], zl(en.baseNetGrosze), zl(en.commissionGrosze), r[5]]
						}),
						['auto', '*', 'auto', 'auto', 'auto', 'auto'],
						['', '', '', '', zl(sumMonth), '']
					),
					{ text: t('partnerPanel.pdfNote'), fontSize: 8, color: '#505050', margin: [0, 12, 0, 0] },
				],
			})
			await downloadPdf(doc, `planopia-prowizje-${partner.code}-${month}.pdf`)
		})

	return layout(
		<div className="ap pp">
			<p className="ap__lead">{t('partnerPanel.lead', { name: partner.name })}</p>
			{partner.status === 'paused' ? <p className="ap-note pp-paused">{t('partnerPanel.paused')}</p> : null}

			<section className="ap-card">
				<h3>{t('partnerPanel.linkTitle')}</h3>
				<div className="ap-search pp-link">
					<div className="pp-link-text" aria-label={t('partnerPanel.linkTitle')}>
						{partner.link}
					</div>
					<button type="button" className="ap-btn" onClick={copy}>
						{copied ? t('partnerPanel.copied') : t('partnerPanel.copy')}
					</button>
				</div>
				<p className="ap-muted pp-terms">{terms}</p>
			</section>

			<div className="pp-tiles">
				<div className="pp-tile pp-tile--main">
					<span>{t('partnerPanel.st_payable')}</span>
					<b>{zl(totals.payable)}</b>
				</div>
				<div className="pp-tile">
					<span>{t('partnerPanel.accruedOpen')}</span>
					<b>{zl(totals.accrued)}</b>
				</div>
				<div className="pp-tile">
					<span>{t('partnerPanel.paidTotal')}</span>
					<b>{zl(totals.paid)}</b>
				</div>
			</div>
			<p className="ap-muted pp-hint">{t('partnerPanel.invoiceHint')}</p>

			<section className="ap-card ap-card--wide">
				<div className="ap-card__head">
					<h3>{t('partnerPanel.monthsTitle')}</h3>
					<div className="ap-actions">
						<button type="button" className="ap-btn ap-btn--ghost" onClick={exportExcel} disabled={busy}>
							{t('partnerPanel.exportExcel')}
						</button>
						<button type="button" className="ap-btn ap-btn--ghost" onClick={exportPdf} disabled={busy || !month || rows.length === 0}>
							{t('partnerPanel.exportPdf')}
						</button>
					</div>
				</div>
				{months.length === 0 ? (
					<p className="ap-muted">{t('partnerPanel.noCommissions')}</p>
				) : (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('partnerPanel.month')}</th>
									<th>{t('partnerPanel.base')}</th>
									<th>{t('partnerPanel.commission')}</th>
									<th>{t('partnerPanel.status')}</th>
								</tr>
							</thead>
							<tbody>
								{months.map(m => (
									<tr key={m.month} className={`pp-click${m.month === month ? ' ap-row--on' : ''}`} onClick={() => setMonth(m.month)}>
										<td>
											<button type="button" className="ap-link" onClick={() => setMonth(m.month)}>
												{monthLabel(m.month)}
											</button>
										</td>
										<td>{zl(m.baseNetGrosze)}</td>
										<td>
											<b>{zl(m.total)}</b>
										</td>
										<td className="ap-muted">
											{[['paid', m.paid], ['payable', m.payable], ['accrued', m.accrued]]
												.filter(([, v]) => v !== 0)
												.map(([k, v]) => `${t(`partnerPanel.st_${k}`)}: ${zl(v)}`)
												.join(' · ')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{month ? (
					<>
						<h3 className="pp-sub">{t('partnerPanel.entriesTitle', { month: monthLabel(month) })}</h3>
						{entries.isLoading ? (
							<Loader />
						) : rows.length === 0 ? (
							<p className="ap-muted">{t('partnerPanel.noEntries')}</p>
						) : (
							<div className="ap-scroll">
								<table className="ap-table">
									<thead>
										<tr>
											{entryHead().map(h => (
												<th key={h}>{h}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{rows.map(en => (
											<tr key={en.id}>
												<td>{date(en.occurredAt)}</td>
												<td>{en.teamName}</td>
												<td>{sourceLabel(en)}</td>
												<td>{zl(en.baseNetGrosze)}</td>
												<td className={en.commissionGrosze < 0 ? 'ap-neg' : undefined}>
													{zl(en.commissionGrosze)} <span className="ap-muted">({percent(en.rate)})</span>
												</td>
												<td>
													{t(`partnerPanel.st_${en.status}`)}
													{en.paidAt ? <div className="ap-muted">{date(en.paidAt)}</div> : null}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				) : null}
			</section>

			<section className="ap-card ap-card--wide">
				<h3>{t('partnerPanel.companiesTitle', { count: teams.length })}</h3>
				{teams.length === 0 ? (
					<p className="ap-muted">{t('partnerPanel.noCompanies')}</p>
				) : (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('partnerPanel.company')}</th>
									<th>{t('partnerPanel.plan')}</th>
									<th>{t('partnerPanel.since')}</th>
									<th>{t('partnerPanel.until')}</th>
									<th>{t('partnerPanel.commission')}</th>
								</tr>
							</thead>
							<tbody>
								{teams.map(tm => (
									<tr key={tm.id}>
										<td>{tm.name}</td>
										<td>
											<span className={`pp-badge pp-badge--${tm.planState}`}>{t(`partnerPanel.plan_${tm.planState}`)}</span>
										</td>
										<td>{date(tm.referredAt)}</td>
										<td>{untilLabel(tm)}</td>
										<td>{zl(tm.commissionGrosze)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	)
}
