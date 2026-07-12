import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useTeamQRCodes, useGenerateQRCode, useDeleteQRCode } from '../../hooks/useQRCode'
import Loader from '../Loader'
import './QRCode.css'

function QRCodeGenerator() {
	const { t } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const { data: qrCodes = [], isLoading } = useTeamQRCodes()
	const generateQRCode = useGenerateQRCode()
	const deleteQRCode = useDeleteQRCode()
	const [newQRName, setNewQRName] = useState('')
	const [generating, setGenerating] = useState(false)

	const handleGenerate = async () => {
		if (!newQRName.trim()) {
			await showAlert(t('settings.qrCodeNameRequired') || 'Nazwa kodu QR jest wymagana')
			return
		}

		setGenerating(true)
		try {
			await generateQRCode.mutateAsync(newQRName.trim())
			setNewQRName('')
			await showAlert(t('settings.qrCodeGenerated') || 'Kod QR został wygenerowany')
		} catch (error) {
			console.error('Error generating QR code:', error)
			await showAlert(error.response?.data?.message || t('settings.qrCodeError') || 'Błąd podczas generowania kodu QR')
		} finally {
			setGenerating(false)
		}
	}

	const handleDelete = async (id, name) => {
		const confirmMessage = t('settings.qrCodeDeleteConfirm', { name }) || `Czy na pewno chcesz usunąć kod QR "${name}"?`
		const confirmed = await showConfirm(
			confirmMessage,
			t('settings.qrCodeDeleteTitle') || 'Usuń kod QR'
		)

		if (confirmed) {
			try {
				await deleteQRCode.mutateAsync(id)
				await showAlert(t('settings.qrCodeDeleted') || 'Kod QR został usunięty')
			} catch (error) {
				console.error('Error deleting QR code:', error)
				await showAlert(error.response?.data?.message || t('settings.qrCodeDeleteError') || 'Błąd podczas usuwania kodu QR')
			}
		}
	}

	const handleDownload = (code, name) => {
		const url = `${window.location.origin}/qr-scan/${code}`
		const link = document.createElement('a')
		link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
		link.download = `qr-code-${name}-${code}.png`
		link.click()
	}

	const getQRUrl = (code) => {
		return `${window.location.origin}/qr-scan/${code}`
	}

	if (isLoading) return <Loader />

	return (
		<div className="qr-code-generator">
			<h3 className="qr-code-generator__title">
				<span>📱 {t('settings.qrCodeTitle') || 'Kody QR - Wejście/Wyjście'}</span>
			</h3>

			<p className="qr-code-generator__description">
				{t('settings.qrCodeDescription') || 'Wygeneruj kody QR do rejestracji wejścia/wyjścia pracowników. Pracownicy mogą skanować kod, aby automatycznie zarejestrować czas pracy.'}
			</p>

			<div className="qr-code-generator__form">
				<input
					type="text"
					className="qr-code-generator__input"
					value={newQRName}
					onChange={(e) => setNewQRName(e.target.value)}
					placeholder={t('settings.qrCodeNamePlaceholder') || 'Nazwa miejsca (np. Biuro główne, Wejście A)'}
					onKeyPress={(e) => {
						if (e.key === 'Enter') {
							handleGenerate()
						}
					}}
				/>
				<button
					type="button"
					className="qr-code-generator__submit"
					onClick={handleGenerate}
					disabled={generating || !newQRName.trim()}
				>
					{generating ? t('settings.generating') || 'Generowanie...' : t('settings.generateQR') || 'Generuj kod QR'}
				</button>
			</div>

			{qrCodes.length === 0 ? (
				<p className="qr-code-generator__empty">
					{t('settings.noQRCodes') || 'Brak wygenerowanych kodów QR'}
				</p>
			) : (
				<div className="qr-code-generator__grid">
					{qrCodes.map((qr) => {
						const qrUrl = getQRUrl(qr.code)
						return (
							<div key={qr._id} className="qr-code-generator__card">
								<h4 className="qr-code-generator__card-title">
									{qr.name}
								</h4>

								<div className="qr-code-generator__qr-wrap">
									<QRCodeSVG
										value={qrUrl}
										size={200}
										level="M"
										includeMargin={true}
									/>
								</div>

								<div className="qr-code-generator__code">
									{qr.code}
								</div>

								<div className="qr-code-generator__actions">
									<button
										type="button"
										className="qr-code-generator__btn qr-code-generator__btn--download"
										onClick={() => handleDownload(qr.code, qr.name)}
									>
										{t('settings.download') || 'Pobierz'}
									</button>
									<button
										type="button"
										className="qr-code-generator__btn qr-code-generator__btn--delete"
										onClick={() => handleDelete(qr._id, qr.name)}
									>
										{t('settings.delete') || 'Usuń'}
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default QRCodeGenerator
