import React from 'react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config.js'
import Loader from '../Loader'

/** Biura rachunkowe — panel właściciela platformy: powiązania biuro–firma i ostatnia aktywność biur (etap 5) */
export default function AdminOffices() {
	const { t, i18n } = useTranslation()
	const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL'
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ['super', 'offices'],
		queryFn: async () => (await axios.get(`${API_URL}/api/super/partners/offices`, { withCredentials: true })).data,
		retry: false,
	})
	const date = d => (d ? new Date(d).toLocaleDateString(locale) : '—')
	const monthLabel = (y, m) => (y != null && m != null ? new Date(y, m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : '')

	if (isLoading) return <Loader />
	if (isError) return <p className="ap-muted">{error?.response?.data?.message || t('adminPartners.error')}</p>

	return (
		<>
			<section className="ap-card ap-card--wide">
				<h3>{t('adminPartners.officesLinks')}</h3>
				{data.links.length === 0 ? (
					<p className="ap-muted">{t('adminPartners.officesNoLinks')}</p>
				) : (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminPartners.office')}</th>
									<th>{t('adminPartners.company')}</th>
									<th>{t('adminPartners.status')}</th>
									<th>{t('adminPartners.since')}</th>
									<th>DPA</th>
								</tr>
							</thead>
							<tbody>
								{data.links.map(l => (
									<tr key={l.id}>
										<td>{l.officeName}</td>
										<td>{l.clientName || l.invitedEmail}</td>
										<td>{t(`adminPartners.linkStatus_${l.status}`)}</td>
										<td>{date(l.acceptedAt || l.createdAt)}</td>
										<td>{l.dpaVersion || '—'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section className="ap-card ap-card--wide">
				<h3>{t('adminPartners.officesAudit')}</h3>
				{data.audit.length === 0 ? (
					<p className="ap-muted">{t('adminPartners.officesNoAudit')}</p>
				) : (
					<div className="ap-scroll">
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminPartners.when')}</th>
									<th>{t('adminPartners.office')}</th>
									<th>{t('adminPartners.who')}</th>
									<th>{t('adminPartners.company')}</th>
									<th>{t('adminPartners.what')}</th>
								</tr>
							</thead>
							<tbody>
								{data.audit.map(e => (
									<tr key={e.id}>
										<td>{new Date(e.at).toLocaleString(locale)}</td>
										<td>{e.officeName}</td>
										<td>{e.userName}</td>
										<td>{e.clientName}</td>
										<td>{t(`officeSettings.audit_${e.action}`, { month: monthLabel(e.year, e.month) })}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</>
	)
}
