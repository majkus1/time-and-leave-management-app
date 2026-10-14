import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useCompanyOfficeAction, useCompanyOfficeLinks } from '../../hooks/useOffice'
import './OfficeAccessSettingsSection.css'

const DPA_URL = 'https://planopia.pl/dpa'

/**
 * Ustawienia firmy → Biuro rachunkowe (tylko Admin): dodanie biura po kodzie, zaproszenia od biura,
 * zgoda na udostępnienie danych kadrowych i odebranie dostępu jednym kliknięciem.
 */
export default function OfficeAccessSettingsSection() {
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const { data, isLoading } = useCompanyOfficeLinks()
	const action = useCompanyOfficeAction()
	const [code, setCode] = useState('')
	// Zgoda dla: { kind: 'connect', code } albo { kind: 'accept', id, name }
	const [consentFor, setConsentFor] = useState(null)
	const [agreed, setAgreed] = useState(false)
	const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL'
	const date = d => (d ? new Date(d).toLocaleDateString(locale) : '—')
	const errorText = e => e?.response?.data?.message || t('officeSettings.error')

	const links = data?.links || []
	const pending = links.filter(l => l.status === 'pending')
	const active = links.filter(l => l.status === 'active')

	const openConsent = target => {
		setAgreed(false)
		setConsentFor(target)
	}

	const confirmConsent = async () => {
		try {
			if (consentFor.kind === 'connect') {
				const res = await action.mutateAsync({ action: 'connect', code: consentFor.code, consent: true })
				setCode('')
				await showAlert(t('officeSettings.connected', { name: res.officeName }))
			} else {
				await action.mutateAsync({ action: 'accept', id: consentFor.id, consent: true })
				await showAlert(t('officeSettings.connected', { name: consentFor.name }))
			}
			setConsentFor(null)
		} catch (e) {
			await showAlert(errorText(e))
		}
	}

	const end = async (link, question) => {
		if (!(await showConfirm(question, { confirmText: t('officeSettings.confirmYes'), cancelText: t('officeSettings.cancel') }))) return
		try {
			await action.mutateAsync({ action: 'end', id: link.id })
		} catch (e) {
			await showAlert(errorText(e))
		}
	}

	return (
		<div className="po-settings-panel osp">
			<h3 id="settings-office-section" className="osp__title">
				{t('officeSettings.title')}
			</h3>
			<p className="osp__lead">{t('officeSettings.lead')}</p>

			{isLoading ? null : (
				<>
					{pending.map(l => (
						<div key={l.id} className="osp-row osp-row--invite">
							<span>
								<b>{l.teamName}</b> {t('officeSettings.invites')}
							</span>
							<span className="osp-actions">
								<button type="button" className="osp-btn" onClick={() => openConsent({ kind: 'accept', id: l.id, name: l.teamName })}>
									{t('officeSettings.review')}
								</button>
								<button type="button" className="osp-link" onClick={() => end(l, t('officeSettings.declineConfirm', { name: l.teamName }))}>
									{t('officeSettings.decline')}
								</button>
							</span>
						</div>
					))}

					{active.length === 0 && pending.length === 0 ? <p className="osp-muted">{t('officeSettings.none')}</p> : null}
					{active.map(l => (
						<div key={l.id} className="osp-row">
							<span>
								<b>{l.teamName}</b> <span className="osp-muted">{t('officeSettings.since', { date: date(l.acceptedAt) })}</span>
							</span>
							<button type="button" className="osp-link osp-link--danger" onClick={() => end(l, t('officeSettings.revokeConfirm', { name: l.teamName }))}>
								{t('officeSettings.revoke')}
							</button>
						</div>
					))}

					<form
						className="osp-add"
						onSubmit={e => {
							e.preventDefault()
							if (code.trim().length >= 3) openConsent({ kind: 'connect', code: code.trim() })
						}}>
						<label className="osp-field">
							<span>{t('officeSettings.codeLabel')}</span>
							<input className="osp-input" value={code} onChange={e => setCode(e.target.value)} placeholder={t('officeSettings.codePlaceholder')} />
						</label>
						<button type="submit" className="osp-btn" disabled={code.trim().length < 3}>
							{t('officeSettings.next')}
						</button>
					</form>

					{consentFor ? (
						<div className="osp-consent" role="dialog" aria-labelledby="osp-consent-title">
							<h4 id="osp-consent-title">{t('officeSettings.consentTitle')}</h4>
							<p>{t('officeSettings.consentIntro')}</p>
							<ul>
								<li>{t('officeSettings.shareEmployees')}</li>
								<li>{t('officeSettings.shareTime')}</li>
								<li>{t('officeSettings.shareLeave')}</li>
								<li>{t('officeSettings.shareConfirm')}</li>
								<li>{t('officeSettings.shareConfig')}</li>
							</ul>
							<p className="osp-muted">{t('officeSettings.consentRules')}</p>
							<label className="osp-check">
								<input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
								<span>
									{t('officeSettings.consentCheck')}{' '}
									<a href={DPA_URL} target="_blank" rel="noopener noreferrer">
										{t('officeSettings.dpa')}
										{data?.dpaVersion ? ` ${data.dpaVersion}` : ''}
									</a>
									.
								</span>
							</label>
							<div className="osp-actions">
								<button type="button" className="osp-btn" disabled={!agreed || action.isPending} onClick={confirmConsent}>
									{t('officeSettings.share')}
								</button>
								<button type="button" className="osp-link" onClick={() => setConsentFor(null)}>
									{t('officeSettings.cancel')}
								</button>
							</div>
						</div>
					) : null}

					{data?.history?.length ? (
						<details className="osp-history">
							<summary>{t('officeSettings.history')}</summary>
							<ul>
								{data.history.map(h => (
									<li key={h.id}>
										{h.teamName} — {t(`officeSettings.ended_${h.status}`, { date: date(h.endedAt) })}
									</li>
								))}
							</ul>
						</details>
					) : null}
				</>
			)}
		</div>
	)
}
