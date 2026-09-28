import React from 'react'
import { useTranslation } from 'react-i18next'

/** „Zapisywanie…” z kręciołkiem, potem „Zapisano”. Element zostaje w DOM także pusty — czytnik ekranu ogłasza zmianę */
export default function QRSaveStatus({ status }) {
	const { t } = useTranslation()
	return (
		<span className={`qr-save-status${status ? ` qr-save-status--${status}` : ''}`} role="status" aria-live="polite">
			{status === 'saving' && (
				<>
					<span className="qr-save-status__spinner" aria-hidden="true" />
					{t('settings.qrSaving')}
				</>
			)}
			{status === 'saved' && (
				<>
					<span aria-hidden="true">✓</span>
					{t('settings.qrSaved')}
				</>
			)}
		</span>
	)
}
