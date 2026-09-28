import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'
import { useSetQRCodeGeo } from '../../hooks/useQRCode'
import useSaveStatus from '../../hooks/useSaveStatus'
import { getScanPosition } from '../../utils/scanGeolocation'
import QRSaveStatus from './QRSaveStatus'

const POLICIES = ['off', 'record', 'flag', 'block']
const RADIUS_OPTIONS = [50, 100, 150, 300, 500, 1000, 2000]
// Powyżej tej dokładności pozycja miejsca jest mało wiarygodna (telefon w budynku, brak GPS)
const SITE_ACCURACY_WARN_M = 100

// „52.2297, 21.0122” albo „52.2297 21.0122” — tak kopiują współrzędne Google Maps i OpenStreetMap
function parseCoords(text) {
	const m = String(text || '').trim().match(/^(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/)
	if (!m) return null
	const lat = Number(m[1].replace(',', '.'))
	const lng = Number(m[2].replace(',', '.'))
	if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) return null
	return { lat, lng }
}

/**
 * Lokalizacja przy skanie dla jednego kodu: polityka, pozycja miejsca i promień.
 * Pozycję ustawia się świadomie (potwierdzenie „stoję na miejscu” albo wklejone współrzędne) — samo wybranie
 * polityki nie może zapisać pozycji biurka Admina jako miejsca pracy. Polityka wybrana przy kodzie bez pozycji
 * czeka lokalnie (pendingPolicy) i zapisuje się razem z pozycją.
 * Wybrana polityka i promień widać od razu (chosen), a przy polu „Zapisywanie…” / „Zapisano”; przy błędzie
 * wraca wartość z serwera.
 */
export default function QRCodeGeoSettings({ qr }) {
	const { t } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const setGeo = useSetQRCodeGeo()
	const [status, track] = useSaveStatus()
	const [statusField, setStatusField] = useState(null)
	const [chosen, setChosen] = useState({})
	const [locating, setLocating] = useState(false)
	const [coordsText, setCoordsText] = useState('')
	const [pendingPolicy, setPendingPolicy] = useState(null)
	const geo = qr.geo || {}
	const policy = POLICIES.includes(geo.policy) ? geo.policy : 'off'
	const hasSite = typeof geo.lat === 'number' && typeof geo.lng === 'number'
	const radiusM = geo.radiusM || 150
	const busy = setGeo.isPending || locating
	const shownPolicy = chosen.policy ?? pendingPolicy ?? policy
	const shownRadius = chosen.radiusM ?? radiusM
	const fieldStatus = field => (statusField === field ? status : null)

	// Wybór trzymamy, aż lista kodów dostanie nową wartość — bez mignięcia starej opcji
	useEffect(() => {
		setChosen(c => {
			const next = { ...c }
			if (next.policy === policy) delete next.policy
			if (next.radiusM === radiusM) delete next.radiusM
			return Object.keys(next).length === Object.keys(c).length ? c : next
		})
	}, [policy, radiusM, chosen])

	const save = async (body, field) => {
		setStatusField(field)
		const ok = await track(async () => {
			try {
				await setGeo.mutateAsync({ id: qr._id, ...body })
				if (body.lat !== undefined) setPendingPolicy(null)
				return true
			} catch (error) {
				await showAlert(error.response?.data?.message || t('settings.qrGeoError'))
				return false
			}
		})
		if (!ok) setChosen({})
		return ok
	}

	// Pozycja z telefonu Admina — tylko po potwierdzeniu, że stoi w miejscu kodu
	const captureSite = async extra => {
		const ok = await showConfirm(t('settings.qrGeoSetSiteConfirm', { name: qr.name }), t('settings.qrGeoSetSiteTitle'))
		if (!ok) return false
		setLocating(true)
		const pos = await getScanPosition()
		setLocating(false)
		if (pos.error) {
			await showAlert(pos.error === 'denied' ? t('settings.qrGeoPermissionDenied') : t('settings.qrGeoUnavailable'))
			return false
		}
		const saved = await save({ ...extra, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy }, 'site')
		if (saved && pos.accuracy > SITE_ACCURACY_WARN_M) {
			await showAlert(t('settings.qrGeoLowAccuracy', { accuracy: Math.round(pos.accuracy) }))
		}
		return saved
	}

	const handlePolicyChange = async next => {
		if (next !== 'off' && !hasSite) {
			setPendingPolicy(next)
			return
		}
		setPendingPolicy(null)
		setChosen(c => ({ ...c, policy: next }))
		await save({ policy: next }, 'policy')
	}

	const handleRadiusChange = async next => {
		setChosen(c => ({ ...c, radiusM: next }))
		await save({ radiusM: next }, 'radius')
	}

	const withPending = body => (pendingPolicy ? { ...body, policy: pendingPolicy } : body)

	const handlePasteCoords = async () => {
		const coords = parseCoords(coordsText)
		if (!coords) {
			await showAlert(t('settings.qrGeoCoordsInvalid'))
			return
		}
		if (await save(withPending({ lat: coords.lat, lng: coords.lng }), 'site')) setCoordsText('')
	}

	const mapUrl = hasSite
		? `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=17/${geo.lat}/${geo.lng}`
		: null
	const policyId = `qr-geo-policy-${qr._id}`
	const radiusId = `qr-geo-radius-${qr._id}`

	return (
		<div className="qr-code-generator__geo">
			<div className="qr-code-generator__mode">
				<div className="qr-code-generator__field-head">
					<label htmlFor={policyId}>{t('settings.qrGeoLabel')}</label>
					<QRSaveStatus status={fieldStatus('policy')} />
				</div>
				<select id={policyId} value={shownPolicy} onChange={e => handlePolicyChange(e.target.value)} disabled={busy} aria-busy={busy}>
					{POLICIES.map(p => (
						<option key={p} value={p}>{t(`settings.qrGeoPolicy_${p}`)}</option>
					))}
				</select>
			</div>
			<p className="qr-code-generator__mode-hint">{t(`settings.qrGeoHint_${shownPolicy}`)}</p>

			{(policy !== 'off' || hasSite || pendingPolicy) && (
				<div className="qr-code-generator__geo-site">
					{hasSite ? (
						<p className="qr-code-generator__geo-line">
							{t('settings.qrGeoSite')}{' '}
							<a className="qr-code-generator__nowrap" href={mapUrl} target="_blank" rel="noopener noreferrer">
								{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
							</a>
							{geo.siteAccuracyM ? <span className="qr-code-generator__nowrap"> (±{geo.siteAccuracyM} m)</span> : null}{' '}
							<QRSaveStatus status={fieldStatus('site')} />
						</p>
					) : (
						<p className="qr-code-generator__geo-line qr-code-generator__geo-line--warn">
							{t('settings.qrGeoNoSite')} <QRSaveStatus status={fieldStatus('site')} />
						</p>
					)}
					{hasSite && geo.siteAccuracyM > SITE_ACCURACY_WARN_M && (
						<p className="qr-code-generator__geo-line qr-code-generator__geo-line--warn">
							{t('settings.qrGeoLowAccuracyShort')}
						</p>
					)}
					<button type="button" className="qr-code-generator__link-btn" onClick={() => captureSite(withPending({}))} disabled={busy}>
						{locating ? t('settings.qrGeoLocating') : t('settings.qrGeoSetSite')}
					</button>
					<p className="qr-code-generator__geo-line">{t('settings.qrGeoCoordsLabel')}</p>
					<div className="qr-code-generator__geo-coords">
						<input
							type="text"
							inputMode="decimal"
							value={coordsText}
							onChange={e => setCoordsText(e.target.value)}
							placeholder={t('settings.qrGeoCoordsPlaceholder')}
							aria-label={t('settings.qrGeoCoordsPlaceholder')}
						/>
						<button type="button" className="qr-code-generator__link-btn" onClick={handlePasteCoords} disabled={busy || !coordsText.trim()}>
							{t('settings.qrGeoCoordsSave')}
						</button>
					</div>
					<div className="qr-code-generator__geo-radius">
						<label htmlFor={radiusId}>{t('settings.qrGeoRadius')}</label>
						<select id={radiusId} value={shownRadius} onChange={e => handleRadiusChange(Number(e.target.value))} disabled={busy} aria-busy={busy}>
							{[...new Set([...RADIUS_OPTIONS, radiusM])].sort((a, b) => a - b).map(r => (
								<option key={r} value={r}>{r >= 1000 ? `${r / 1000} km` : `${r} m`}</option>
							))}
						</select>
						<QRSaveStatus status={fieldStatus('radius')} />
					</div>
				</div>
			)}
		</div>
	)
}
