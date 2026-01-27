import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useTeamQRCodes, useGenerateQRCode, useDeleteQRCode } from '../../hooks/useQRCode'
import Loader from '../Loader'

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
		const confirmed = await showConfirm(
			t('settings.qrCodeDeleteConfirm') || `Czy na pewno chcesz usunąć kod QR "${name}"?`,
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
		// Create download link
		const url = `${window.location.origin}/qr-scan/${code}`
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		
		// Create QR code as image
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.setAttribute('width', '300')
		svg.setAttribute('height', '300')
		const qrSvg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
		
		// Use QRCodeSVG component to generate
		// For download, we'll use a simpler approach with canvas
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
		<div style={{
			backgroundColor: 'white',
			borderRadius: '12px',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
			padding: '20px',
			marginBottom: '20px'
		}}>
			<h3 style={{
				color: '#2c3e50',
				marginBottom: '20px',
				fontSize: '20px',
				fontWeight: '600',
				display: 'flex',
				alignItems: 'center',
				gap: '10px',
				flexWrap: 'wrap'
			}}>
				<span>📱 {t('settings.qrCodeTitle') || 'Kody QR - Wejście/Wyjście'}</span>
				<span style={{
					fontSize: '12px',
					fontWeight: '400',
					color: '#e67e22',
					backgroundColor: '#fff3e0',
					padding: '4px 8px',
					borderRadius: '4px',
					border: '1px solid #ffb74d'
				}}>
					{t('settings.qrCodeModernizationInfo') || 'Trwają prace modernizacyjne nad funkcją - koniec prac 28.01'}
				</span>
			</h3>

			<p style={{ color: '#7f8c8d', marginBottom: '20px', fontSize: '14px' }}>
				{t('settings.qrCodeDescription') || 'Wygeneruj kody QR do rejestracji wejścia/wyjścia pracowników. Pracownicy mogą skanować kod, aby automatycznie zarejestrować czas pracy.'}
			</p>

			{/* Form to generate new QR code */}
			<div style={{
				display: 'flex',
				gap: '10px',
				marginBottom: '30px',
				flexWrap: 'wrap'
			}}>
				<input
					type="text"
					value={newQRName}
					onChange={(e) => setNewQRName(e.target.value)}
					placeholder={t('settings.qrCodeNamePlaceholder') || 'Nazwa miejsca (np. Biuro główne, Wejście A)'}
					style={{
						flex: 1,
						minWidth: '200px',
						padding: '10px 15px',
						border: '1px solid #ddd',
						borderRadius: '6px',
						fontSize: '14px'
					}}
					onKeyPress={(e) => {
						if (e.key === 'Enter') {
							handleGenerate()
						}
					}}
				/>
				<button
					onClick={handleGenerate}
					disabled={generating || !newQRName.trim()}
					style={{
						backgroundColor: '#3498db',
						color: 'white',
						border: 'none',
						padding: '10px 20px',
						borderRadius: '6px',
						fontSize: '14px',
						fontWeight: '500',
						cursor: generating || !newQRName.trim() ? 'not-allowed' : 'pointer',
						opacity: generating || !newQRName.trim() ? 0.6 : 1,
						transition: 'all 0.2s'
					}}
					onMouseEnter={(e) => {
						if (!generating && newQRName.trim()) {
							e.target.style.backgroundColor = '#2980b9'
						}
					}}
					onMouseLeave={(e) => {
						if (!generating && newQRName.trim()) {
							e.target.style.backgroundColor = '#3498db'
						}
					}}
				>
					{generating ? t('settings.generating') || 'Generowanie...' : t('settings.generateQR') || 'Generuj kod QR'}
				</button>
			</div>

			{/* List of existing QR codes */}
			{qrCodes.length === 0 ? (
				<p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px' }}>
					{t('settings.noQRCodes') || 'Brak wygenerowanych kodów QR'}
				</p>
			) : (
				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
					gap: '20px'
				}}>
					{qrCodes.map((qr) => {
						const qrUrl = getQRUrl(qr.code)
						return (
							<div
								key={qr._id}
								style={{
									border: '1px solid #e0e0e0',
									borderRadius: '8px',
									padding: '15px',
									backgroundColor: '#f9f9f9',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '15px'
								}}
							>
								<h4 style={{
									margin: 0,
									fontSize: '16px',
									fontWeight: '600',
									color: '#2c3e50',
									textAlign: 'center'
								}}>
									{qr.name}
								</h4>

								<div style={{
									backgroundColor: 'white',
									padding: '10px',
									borderRadius: '8px',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center'
								}}>
									<QRCodeSVG
										value={qrUrl}
										size={200}
										level="M"
										includeMargin={true}
									/>
								</div>

								<div style={{
									fontSize: '12px',
									color: '#7f8c8d',
									wordBreak: 'break-all',
									textAlign: 'center',
									maxWidth: '100%'
								}}>
									{qr.code}
								</div>

								<div style={{
									display: 'flex',
									gap: '10px',
									width: '100%'
								}}>
									<button
										onClick={() => handleDownload(qr.code, qr.name)}
										style={{
											flex: 1,
											backgroundColor: '#27ae60',
											color: 'white',
											border: 'none',
											padding: '8px 12px',
											borderRadius: '6px',
											fontSize: '12px',
											cursor: 'pointer',
											transition: 'all 0.2s'
										}}
										onMouseEnter={(e) => {
											e.target.style.backgroundColor = '#229954'
										}}
										onMouseLeave={(e) => {
											e.target.style.backgroundColor = '#27ae60'
										}}
									>
										{t('settings.download') || 'Pobierz'}
									</button>
									<button
										onClick={() => handleDelete(qr._id, qr.name)}
										style={{
											flex: 1,
											backgroundColor: '#e74c3c',
											color: 'white',
											border: 'none',
											padding: '8px 12px',
											borderRadius: '6px',
											fontSize: '12px',
											cursor: 'pointer',
											transition: 'all 0.2s'
										}}
										onMouseEnter={(e) => {
											e.target.style.backgroundColor = '#c0392b'
										}}
										onMouseLeave={(e) => {
											e.target.style.backgroundColor = '#e74c3c'
										}}
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
