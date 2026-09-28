import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useSetQRCodeMode } from '../../hooks/useQRCode'
import useSaveStatus from '../../hooks/useSaveStatus'
import QRSaveStatus from './QRSaveStatus'

/**
 * Sposób użycia kodu. Wybrana opcja i jej opis zmieniają się od razu, a przy etykiecie widać „Zapisywanie…”
 * i „Zapisano” — wcześniej lista trzymała starą wartość do odpowiedzi serwera i wyglądało to na zawieszenie.
 * Przy błędzie wraca wartość z serwera. Blokuje tylko pole tej karty, nie wszystkich kodów.
 */
export default function QRCodeModeField({ qr }) {
	const { t } = useTranslation()
	const { showAlert } = useAlert()
	const setMode = useSetQRCodeMode()
	const [status, track] = useSaveStatus()
	const [chosen, setChosen] = useState(null)
	const serverMode = qr.mode || 'print'
	const mode = chosen || serverMode

	// Wybór trzymamy, aż lista kodów dostanie nową wartość — bez mignięcia starej opcji
	useEffect(() => {
		if (chosen && chosen === serverMode) setChosen(null)
	}, [chosen, serverMode])

	const handleChange = async next => {
		setChosen(next)
		const saved = await track(async () => {
			try {
				await setMode.mutateAsync({ id: qr._id, mode: next })
				return true
			} catch (error) {
				await showAlert(error.response?.data?.message || t('settings.qrModeError'))
				return false
			}
		})
		if (!saved) setChosen(null)
	}

	const selectId = `qr-mode-${qr._id}`
	return (
		<>
			<div className="qr-code-generator__mode">
				<div className="qr-code-generator__field-head">
					<label htmlFor={selectId}>{t('settings.qrModeLabel')}</label>
					<QRSaveStatus status={status} />
				</div>
				<select
					id={selectId}
					value={mode}
					onChange={e => handleChange(e.target.value)}
					disabled={setMode.isPending}
					aria-busy={setMode.isPending}
				>
					<option value="print">{t('settings.qrModePrint')}</option>
					<option value="screen">{t('settings.qrModeScreen')}</option>
					<option value="screen_or_print">{t('settings.qrModeScreenOrPrint')}</option>
				</select>
			</div>
			<p className="qr-code-generator__mode-hint">{t(`settings.qrModeHint_${mode}`)}</p>
		</>
	)
}
