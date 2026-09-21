import React, { useState } from 'react'
import { useAlert } from '../../context/AlertContext'
import {
	useBillingSuperPaymentReminderPreview,
	useBillingSuperPaymentReminderSend,
} from '../../hooks/useBilling'

/*
 * Panel właściciela (jak SuperAdminActivityPanel — bez i18n, tylko michalipka1@gmail.com):
 * podgląd i ręczna wysyłka przypomnienia o nieudanej płatności kartą. Pola wstępnie wypełnione pod IRONSKY,
 * ale edytowalne — ten sam mail przyda się przy kolejnych past_due.
 */
const DEFAULTS = {
	toEmail: 'ag.ironsky@gmail.com',
	teamName: 'IRONSKY',
	planLabel: 'Pro',
	retryAt: '22 września ok. godz. 2:00',
	graceEnd: '26 września 2026',
}

const inputStyle = {
	width: '100%',
	padding: '8px 10px',
	border: '1px solid #d1d5db',
	borderRadius: '8px',
	fontSize: '0.9rem',
}

function Field({ label, value, onChange }) {
	return (
		<label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
			{label}
			<input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, marginTop: '4px' }} />
		</label>
	)
}

export default function SuperAdminPaymentReminderPanel() {
	const { showAlert } = useAlert()
	const [form, setForm] = useState(DEFAULTS)
	const [preview, setPreview] = useState(null)
	const [sentTo, setSentTo] = useState('')
	const previewMutation = useBillingSuperPaymentReminderPreview()
	const sendMutation = useBillingSuperPaymentReminderSend()
	const set = key => value => {
		setForm(prev => ({ ...prev, [key]: value }))
		setPreview(null)
	}

	const loadPreview = async () => {
		try {
			setPreview(await previewMutation.mutateAsync(form))
		} catch (e) {
			void showAlert(e?.response?.data?.message || 'Nie udało się wygenerować podglądu.')
		}
	}

	const send = async () => {
		if (!window.confirm(`Wysłać przypomnienie na ${form.toEmail}?`)) return
		try {
			await sendMutation.mutateAsync(form)
			setSentTo(form.toEmail)
		} catch (e) {
			void showAlert(e?.response?.data?.message || 'Wysyłka nie powiodła się.')
		}
	}

	return (
		<section
			className="super-admin-payment-reminder-panel"
			style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}
			aria-labelledby="payment-reminder-heading"
		>
			<h2 id="payment-reminder-heading" style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>
				Przypomnienie o nieudanej płatności kartą
			</h2>
			<p style={{ margin: '0 0 16px', color: '#6b7280', maxWidth: '44rem', fontSize: '0.95rem' }}>
				Ręczna wysyłka do administratora zespołu w stanie past_due. Najpierw podgląd, potem wysyłka — mail idzie z
				adresu systemowego, z przyciskiem do Pakietów i rozliczeń.
			</p>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxWidth: '60rem' }}>
				<Field label="Adres e-mail odbiorcy" value={form.toEmail} onChange={set('toEmail')} />
				<Field label="Nazwa zespołu" value={form.teamName} onChange={set('teamName')} />
				<Field label="Pakiet" value={form.planLabel} onChange={set('planLabel')} />
				<Field label="Ponowienie obciążenia (tekst)" value={form.retryAt} onChange={set('retryAt')} />
				<Field label="Ostatni dzień na płatność (tekst)" value={form.graceEnd} onChange={set('graceEnd')} />
			</div>

			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
				<button type="button" className="btn btn-outline-secondary" onClick={loadPreview} disabled={previewMutation.isPending}>
					{previewMutation.isPending ? 'Generowanie…' : 'Pokaż podgląd'}
				</button>
				<button
					type="button"
					className="btn btn-primary"
					onClick={send}
					disabled={!preview || sendMutation.isPending}
					title={!preview ? 'Najpierw wygeneruj podgląd' : undefined}
				>
					{sendMutation.isPending ? 'Wysyłanie…' : `Wyślij na ${form.toEmail}`}
				</button>
				{sentTo && (
					<span role="status" style={{ color: '#047857', fontSize: '0.9rem' }}>
						Wysłano na {sentTo}.
					</span>
				)}
			</div>

			{preview && (
				<div style={{ marginTop: '20px', maxWidth: '60rem' }}>
					<div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '6px' }}>
						Temat: <strong style={{ color: '#111827' }}>{preview.subject}</strong>
					</div>
					<iframe
						title="Podgląd wiadomości"
						srcDoc={preview.html}
						sandbox=""
						style={{ width: '100%', height: '640px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}
					/>
					<div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '6px' }}>
						Link z przycisku: <a href={preview.packagesUrl} target="_blank" rel="noreferrer">{preview.packagesUrl}</a>
					</div>
				</div>
			)}
		</section>
	)
}
