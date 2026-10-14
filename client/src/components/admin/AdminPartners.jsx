import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config.js'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import AdminCommissions from './AdminCommissions'
import AdminOffices from './AdminOffices'
import './AdminPartners.css'

const EMPTY_FORM = { name: '', email: '', code: '', nip: '', ratePercent: '20', commissionMonths: '', status: 'active', notes: '' }

function toForm(p) {
	return {
		name: p.name,
		email: p.email,
		code: p.code,
		nip: p.nip || '',
		ratePercent: String(Math.round(p.commissionRate * 10000) / 100),
		commissionMonths: p.commissionMonths ? String(p.commissionMonths) : '',
		status: p.status,
		notes: p.notes || '',
	}
}

/** Program partnerski — panel właściciela platformy: partnerzy, stawki, przypisania zespołów (etap 1) */
export default function AdminPartners() {
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const [partners, setPartners] = useState(null)
	const [editingId, setEditingId] = useState(null) // null = nowy
	const [form, setForm] = useState(EMPTY_FORM)
	const [saving, setSaving] = useState(false)
	const [selected, setSelected] = useState(null)
	const [teams, setTeams] = useState([])
	const [query, setQuery] = useState('')
	const [results, setResults] = useState([])
	const [tab, setTab] = useState('partners')

	const errorText = e => e?.response?.data?.message || t('adminPartners.error')
	const appBase = typeof window !== 'undefined' ? window.location.origin.replace('app.', '') : ''

	const loadPartners = useCallback(async () => {
		const { data } = await axios.get(`${API_URL}/api/super/partners`, { withCredentials: true })
		setPartners(data.partners)
	}, [])

	const loadTeams = useCallback(async partnerId => {
		const { data } = await axios.get(`${API_URL}/api/super/partners/${partnerId}/teams`, { withCredentials: true })
		setTeams(data.teams)
	}, [])

	useEffect(() => {
		loadPartners().catch(e => showAlert(errorText(e)))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadPartners])

	const startNew = () => {
		setEditingId(null)
		setForm(EMPTY_FORM)
	}

	const startEdit = p => {
		setEditingId(p.id)
		setForm(toForm(p))
	}

	const save = async e => {
		e.preventDefault()
		setSaving(true)
		const body = {
			name: form.name,
			email: form.email,
			code: form.code,
			nip: form.nip,
			commissionRate: Number(String(form.ratePercent).replace(',', '.')) / 100,
			commissionMonths: form.commissionMonths === '' ? null : Number(form.commissionMonths),
			status: form.status,
			notes: form.notes,
		}
		try {
			if (editingId) await axios.patch(`${API_URL}/api/super/partners/${editingId}`, body, { withCredentials: true })
			else await axios.post(`${API_URL}/api/super/partners`, body, { withCredentials: true })
			await loadPartners()
			startNew()
			await showAlert(t('adminPartners.saved'))
		} catch (err) {
			await showAlert(errorText(err))
		} finally {
			setSaving(false)
		}
	}

	const select = async p => {
		setSelected(p)
		setResults([])
		setQuery('')
		try {
			await loadTeams(p.id)
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const search = async e => {
		e.preventDefault()
		try {
			const { data } = await axios.get(`${API_URL}/api/super/partners/teams/search`, { params: { q: query }, withCredentials: true })
			setResults(data.teams)
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const assign = async (teamId, partnerId) => {
		try {
			await axios.put(`${API_URL}/api/super/partners/teams/${teamId}/partner`, { partnerId }, { withCredentials: true })
			await Promise.all([loadTeams(selected.id), loadPartners()])
			setResults(prev => prev.map(r => (r.id === teamId ? { ...r, referredByPartnerId: partnerId } : r)))
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const setOrganizationType = async (teamId, organizationType) => {
		try {
			await axios.put(`${API_URL}/api/super/partners/teams/${teamId}/organization-type`, { organizationType }, { withCredentials: true })
			setResults(prev => prev.map(r => (r.id === teamId ? { ...r, organizationType } : r)))
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const setPartnerTeam = async teamId => {
		try {
			const { data } = await axios.patch(`${API_URL}/api/super/partners/${selected.id}`, { partnerTeamId: teamId }, { withCredentials: true })
			setSelected(data.partner)
			await loadPartners()
		} catch (err) {
			await showAlert(errorText(err))
		}
	}

	const date = d => (d ? new Date(d).toLocaleDateString(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL') : '—')
	const field = (key, props = {}) => (
		<input className="ap-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
	)

	if (!partners) return <Loader />

	return (
		<div className="ap">
			<h2 className="ap__title">{t('adminPartners.title')}</h2>
			<p className="ap__lead">{t('adminPartners.lead')}</p>

			<div className="ap-tabs" role="tablist">
				{['partners', 'commissions', 'offices'].map(key => (
					<button key={key} type="button" role="tab" aria-selected={tab === key} className={`ap-tab${tab === key ? ' ap-tab--on' : ''}`} onClick={() => setTab(key)}>
						{t(`adminPartners.tab_${key}`)}
					</button>
				))}
			</div>

			{tab === 'commissions' ? <AdminCommissions partners={partners} /> : null}
			{tab === 'offices' ? <AdminOffices /> : null}

			<div className="ap__grid" hidden={tab !== 'partners'}>
				<section className="ap-card">
					<div className="ap-card__head">
						<h3>{t('adminPartners.listTitle')}</h3>
						<button type="button" className="ap-btn ap-btn--ghost" onClick={startNew}>
							{t('adminPartners.new')}
						</button>
					</div>
					{partners.length === 0 ? (
						<p className="ap-muted">{t('adminPartners.empty')}</p>
					) : (
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminPartners.name')}</th>
									<th>{t('adminPartners.code')}</th>
									<th>{t('adminPartners.rate')}</th>
									<th>{t('adminPartners.referred')}</th>
									<th>{t('adminPartners.status')}</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{partners.map(p => (
									<tr key={p.id} className={selected?.id === p.id ? 'ap-row--on' : undefined}>
										<td>{p.name}</td>
										<td>
											<code>{p.code}</code>
										</td>
										<td>
											{Math.round(p.commissionRate * 10000) / 100}%
											{p.commissionMonths ? ` · ${t('adminPartners.monthsShort', { count: p.commissionMonths })}` : ''}
										</td>
										<td>{p.referredCount}</td>
										<td>{t(`adminPartners.status_${p.status}`)}</td>
										<td>
											<div className="ap-actions">
												<button type="button" className="ap-link" onClick={() => startEdit(p)}>
													{t('adminPartners.edit')}
												</button>
												<button type="button" className="ap-link" onClick={() => select(p)}>
													{t('adminPartners.teams')}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>

				<form className="ap-card" onSubmit={save}>
					<h3>{editingId ? t('adminPartners.editTitle') : t('adminPartners.newTitle')}</h3>
					<label className="ap-field">
						<span>{t('adminPartners.name')}</span>
						{field('name', { required: true })}
					</label>
					<label className="ap-field">
						<span>{t('adminPartners.email')}</span>
						{field('email', { type: 'email', required: true })}
					</label>
					<label className="ap-field">
						<span>{t('adminPartners.code')}</span>
						{field('code', { required: true, placeholder: 'biuro123' })}
						<small className="ap-muted">{t('adminPartners.codeHint', { link: `${appBase}/?ref=${form.code || 'kod'}` })}</small>
					</label>
					<label className="ap-field">
						<span>{t('adminPartners.nip')}</span>
						{field('nip')}
					</label>
					<div className="ap-row">
						<label className="ap-field">
							<span>{t('adminPartners.ratePercent')}</span>
							{field('ratePercent', { inputMode: 'decimal', required: true })}
						</label>
						<label className="ap-field">
							<span>{t('adminPartners.months')}</span>
							{field('commissionMonths', { inputMode: 'numeric', placeholder: t('adminPartners.monthsUnlimited') })}
						</label>
					</div>
					<label className="ap-field">
						<span>{t('adminPartners.status')}</span>
						<select className="ap-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
							<option value="active">{t('adminPartners.status_active')}</option>
							<option value="paused">{t('adminPartners.status_paused')}</option>
						</select>
					</label>
					<label className="ap-field">
						<span>{t('adminPartners.notes')}</span>
						<textarea className="ap-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
					</label>
					<button type="submit" className="ap-btn" disabled={saving}>
						{saving ? t('adminPartners.saving') : t('adminPartners.save')}
					</button>
				</form>
			</div>

			{selected && tab === 'partners' ? (
				<section className="ap-card ap-card--wide">
					<h3>{t('adminPartners.teamsTitle', { name: selected.name })}</h3>
					<p className="ap-muted">
						{t('adminPartners.partnerTeam')}: {selected.partnerTeamId ? <code>{selected.partnerTeamId}</code> : t('adminPartners.none')}
					</p>
					{teams.length === 0 ? (
						<p className="ap-muted">{t('adminPartners.noTeams')}</p>
					) : (
						<table className="ap-table">
							<thead>
								<tr>
									<th>{t('adminPartners.team')}</th>
									<th>{t('adminPartners.plan')}</th>
									<th>{t('adminPartners.since')}</th>
									<th>{t('adminPartners.source')}</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{teams.map(tm => (
									<tr key={tm.id}>
										<td>{tm.name}</td>
										<td>{tm.planKey || '—'}</td>
										<td>{date(tm.referredAt)}</td>
										<td>{t(`adminPartners.source_${tm.referralSource || 'admin'}`)}</td>
										<td>
											<div className="ap-actions">
												<button type="button" className="ap-link ap-link--danger" onClick={() => assign(tm.id, null)}>
													{t('adminPartners.unassign')}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}

					<form className="ap-search" onSubmit={search}>
						<input className="ap-input" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('adminPartners.searchPlaceholder')} />
						<button type="submit" className="ap-btn ap-btn--ghost" disabled={query.trim().length < 2}>
							{t('adminPartners.search')}
						</button>
					</form>
					{results.length > 0 ? (
						<ul className="ap-results">
							{results.map(r => (
								<li key={r.id}>
									<span>
										<b>{r.name}</b> <span className="ap-muted">{r.adminEmail}</span>
										{r.organizationType === 'office' ? <span className="ap-muted"> · {t('adminPartners.officeBadge')}</span> : null}
									</span>
									<span className="ap-actions">
										{r.referredByPartnerId === selected.id ? (
											<span className="ap-muted">{t('adminPartners.assigned')}</span>
										) : (
											<button type="button" className="ap-link" onClick={() => assign(r.id, selected.id)}>
												{t('adminPartners.assign')}
											</button>
										)}
										<button type="button" className="ap-link" onClick={() => setPartnerTeam(r.id)}>
											{t('adminPartners.setPartnerTeam')}
										</button>
										<button type="button" className="ap-link" onClick={() => setOrganizationType(r.id, r.organizationType === 'office' ? 'company' : 'office')}>
											{r.organizationType === 'office' ? t('adminPartners.unmarkOffice') : t('adminPartners.markOffice')}
										</button>
									</span>
								</li>
							))}
						</ul>
					) : null}
				</section>
			) : null}
		</div>
	)
}
