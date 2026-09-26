import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { generateScreenToken, secondsLeftInWindow, WINDOW_SEC } from '../../utils/qrScreenToken'
import './QRDisplay.css'

/*
 * /qr-display/:displayToken — wyświetlacz rotującego kodu na tablecie przy wejściu. Bez logowania (dostęp = token
 * linku, Admin może go unieważnić). Kod liczony lokalnie (WebCrypto) z poprawką na zegar serwera, więc chwilowy
 * brak sieci nie zatrzymuje wejść; dane odświeżane co kilka minut, żeby unieważniony link przestał działać.
 * Bez <header>/<main>/<footer> — globalny styl aplikacji robi header { position: fixed }.
 */
const REFRESH_MS = 5 * 60 * 1000

export default function QRDisplay() {
	const { displayToken } = useParams()
	const { t, i18n } = useTranslation()
	const [data, setData] = useState(null)
	const [status, setStatus] = useState('loading') // loading | ok | invalid | offline
	const [token, setToken] = useState('')
	const [secondsLeft, setSecondsLeft] = useState(WINDOW_SEC)
	const [now, setNow] = useState(Date.now())
	const offsetRef = useRef(0)
	const wakeLockRef = useRef(null)

	const load = useCallback(async () => {
		try {
			const started = Date.now()
			const { data: d } = await axios.get(`${API_URL}/api/qr/display/${encodeURIComponent(displayToken)}`)
			// Poprawka zegara tabletu: czas serwera + połowa czasu odpowiedzi
			offsetRef.current = d.serverTime + (Date.now() - started) / 2 - Date.now()
			setData(d)
			setStatus('ok')
		} catch (e) {
			if (e?.response?.status === 404) {
				setStatus('invalid')
				setData(null)
			} else {
				setStatus(prev => (prev === 'ok' ? 'offline' : prev === 'loading' ? 'offline' : prev))
			}
		}
	}, [displayToken])

	useEffect(() => {
		load()
		const id = setInterval(load, REFRESH_MS)
		return () => clearInterval(id)
	}, [load])

	// Co sekundę: aktualny token (zmienia się co 30 s) i odliczanie
	useEffect(() => {
		if (!data) return undefined
		let alive = true
		const tick = async () => {
			const serverNow = Date.now() + offsetRef.current
			const next = await generateScreenToken(data.secret, data.code, serverNow, data.windowSec || WINDOW_SEC)
			if (!alive) return
			setToken(next)
			setSecondsLeft(secondsLeftInWindow(serverNow, data.windowSec || WINDOW_SEC))
			setNow(serverNow)
		}
		tick()
		const id = setInterval(tick, 1000)
		return () => {
			alive = false
			clearInterval(id)
		}
	}, [data])

	// Ekran nie gaśnie (Screen Wake Lock), gdy przeglądarka to wspiera
	useEffect(() => {
		let cancelled = false
		const request = async () => {
			try {
				if ('wakeLock' in navigator && document.visibilityState === 'visible') {
					wakeLockRef.current = await navigator.wakeLock.request('screen')
				}
			} catch {
				// brak wsparcia albo odmowa — wyświetlacz działa dalej, tylko ekran może zgasnąć
			}
		}
		const onVisible = () => !cancelled && request()
		request()
		document.addEventListener('visibilitychange', onVisible)
		return () => {
			cancelled = true
			document.removeEventListener('visibilitychange', onVisible)
			wakeLockRef.current?.release?.().catch(() => {})
		}
	}, [])

	const goFullscreen = () => {
		document.documentElement.requestFullscreen?.().catch(() => {})
	}

	if (status === 'invalid') {
		return (
			<div className="po-qr-display po-qr-display--message">
				<h1>{t('qrDisplay.invalidTitle')}</h1>
				<p>{t('qrDisplay.invalidBody')}</p>
			</div>
		)
	}

	if (!data || !token) {
		return (
			<div className="po-qr-display po-qr-display--message">
				<p>{status === 'offline' ? t('qrDisplay.offline') : t('qrDisplay.loading')}</p>
			</div>
		)
	}

	const url = `${window.location.origin}/qr-scan/${encodeURIComponent(data.code)}?t=${token}`
	const windowSec = data.windowSec || WINDOW_SEC
	const progress = Math.max(0, Math.min(1, secondsLeft / windowSec))
	const clock = new Date(now).toLocaleTimeString(i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })

	return (
		<div className="po-qr-display">
			<div className="po-qr-display__head">
				<div>
					<p className="po-qr-display__team">{data.teamName}</p>
					<h1 className="po-qr-display__place">{data.name}</h1>
				</div>
				<div className="po-qr-display__clock">{clock}</div>
			</div>

			<div className="po-qr-display__main">
				<div className="po-qr-display__qr">
					<QRCodeSVG value={url} size={520} level="M" includeMargin={false} />
				</div>
				<div className="po-qr-display__timer" aria-live="off">
					<div className="po-qr-display__bar">
						<span style={{ transform: `scaleX(${progress})` }} />
					</div>
					<p>{t('qrDisplay.changesIn', { count: secondsLeft })}</p>
				</div>
				<p className="po-qr-display__hint">{t('qrDisplay.hint')}</p>
				{status === 'offline' && <p className="po-qr-display__warn">{t('qrDisplay.offlineWorking')}</p>}
			</div>

			<div className="po-qr-display__foot">
				<span>Planopia</span>
				<button type="button" className="po-qr-display__fullscreen" onClick={goFullscreen}>
					{t('qrDisplay.fullscreen')}
				</button>
			</div>
		</div>
	)
}
