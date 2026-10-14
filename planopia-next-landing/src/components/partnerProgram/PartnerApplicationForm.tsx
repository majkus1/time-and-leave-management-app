'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APPLY } from '@/data/partnerProgramCopy'
import { LANDING_SELLER } from '@/data/landingFooterData'
import { trackEvent } from '@/lib/analytics'
import { IconArrow, IconCheck } from './partnerIcons'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function PartnerApplicationForm() {
	const [status, setStatus] = useState<Status>('idle')
	const [error, setError] = useState<string | null>(null)

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (status === 'sending') return
		const data = Object.fromEntries(new FormData(e.currentTarget).entries())
		setStatus('sending')
		setError(null)
		try {
			const res = await fetch('/api/public/partner-application', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { message?: string } | null
				// Komunikat walidacji z serwera jest dla człowieka; przy 5xx pokazujemy ogólny z adresem do kontaktu
				setError(res.status < 500 && body?.message ? body.message : null)
				setStatus('error')
				return
			}
			setStatus('sent')
			trackEvent('generate_lead', { method: 'partner_application' })
		} catch {
			setError(null)
			setStatus('error')
		}
	}

	if (status === 'sent') {
		return (
			<div className="plp-success" role="status">
				<span className="plp-success__icon">
					<IconCheck size={28} />
				</span>
				<p className="plp-success__title">{APPLY.successTitle}</p>
				<p className="plp-success__text">{APPLY.successText}</p>
			</div>
		)
	}

	const f = APPLY.fields
	return (
		<form className="plp-form" onSubmit={onSubmit}>
			<label className="plp-field">
				<span className="plp-field__label">
					{f.name} <em aria-hidden="true">*</em>
				</span>
				<input className="plp-input" name="name" required minLength={2} maxLength={120} autoComplete="name" />
			</label>
			<label className="plp-field">
				<span className="plp-field__label">
					{f.email} <em aria-hidden="true">*</em>
				</span>
				<input className="plp-input" name="email" type="email" required maxLength={320} autoComplete="email" />
			</label>
			<label className="plp-field">
				<span className="plp-field__label">{f.phone}</span>
				<input className="plp-input" name="phone" type="tel" maxLength={40} autoComplete="tel" />
			</label>
			<label className="plp-field">
				<span className="plp-field__label">{f.company}</span>
				<input className="plp-input" name="company" maxLength={200} autoComplete="organization" />
			</label>

			<fieldset className="plp-field plp-field--full">
				<legend className="plp-field__label">{f.role}</legend>
				<div className="plp-chips">
					{APPLY.roles.map(role => (
						<label key={role} className="plp-chip">
							<input type="radio" name="role" value={role} />
							<span>{role}</span>
						</label>
					))}
				</div>
			</fieldset>

			<fieldset className="plp-field plp-field--full">
				<legend className="plp-field__label">{f.companies}</legend>
				<div className="plp-chips">
					{APPLY.companyRanges.map(range => (
						<label key={range} className="plp-chip">
							<input type="radio" name="companies" value={range} />
							<span>{range}</span>
						</label>
					))}
				</div>
			</fieldset>

			<label className="plp-field plp-field--full">
				<span className="plp-field__label">{f.message}</span>
				<textarea className="plp-input" name="message" rows={4} maxLength={4000} placeholder={f.messagePlaceholder} />
			</label>

			{/* Pułapka na boty — niewidoczna i pomijana przez czytniki ekranu */}
			<div className="plp-honeypot" aria-hidden="true">
				<label>
					Strona www
					<input name="website" tabIndex={-1} autoComplete="off" />
				</label>
			</div>

			{status === 'error' && (
				<p className="plp-form__error" role="alert">
					{error ?? (
						<>
							{APPLY.error} <a href={`mailto:${LANDING_SELLER.email}`}>{LANDING_SELLER.email}</a>.
						</>
					)}
				</p>
			)}

			<p className="plp-form__consent">
				{APPLY.consent} <Link href="/privacy">{APPLY.privacy}</Link>.
			</p>

			<div className="plp-form__actions">
				<button type="submit" className="plp-btn plp-btn--primary plp-form__submit" disabled={status === 'sending'}>
					{status === 'sending' ? APPLY.sending : APPLY.submit}
					{status !== 'sending' && <IconArrow size={18} />}
				</button>
			</div>
		</form>
	)
}
