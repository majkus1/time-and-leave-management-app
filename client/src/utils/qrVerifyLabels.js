import { formatDistance } from './scanGeolocation'
import { summarizeQrVerify } from './qrSessionVerify'

/**
 * Teksty weryfikacji sesji QR (plakietki w liście sesji, kolumny raportu) — wspólne, żeby lista i raport mówiły to samo.
 * `summary` z utils/qrSessionVerify.summarizeQrVerify.
 */
const locale = i18n => (i18n?.resolvedLanguage === 'en' ? 'en' : 'pl')

function sideSuffix(t, side) {
	if (side === 'entry') return ` (${t('sessions.qrVerify.sideEntry')})`
	if (side === 'exit') return ` (${t('sessions.qrVerify.sideExit')})`
	return ''
}

/** Plakietki: [{ key, text, tone }] */
export function qrVerifyBadges(t, i18n, summary) {
	if (!summary) return []
	const badges = []
	if (summary.geo) {
		const g = summary.geo
		const text = g.status === 'inside'
			? t('sessions.qrVerify.geoInside')
			: g.status === 'outside'
				? t('sessions.qrVerify.geoOutside', { distance: formatDistance(g.distanceM, locale(i18n)) })
				: g.status === 'denied'
					? t('sessions.qrVerify.geoDenied')
					: t('sessions.qrVerify.geoUnavailable')
		badges.push({ key: 'geo', text: text + sideSuffix(t, g.side), tone: g.tone })
	}
	if (summary.method) {
		const m = summary.method
		badges.push({
			key: 'method',
			text: (m.value === 'screen' ? t('sessions.qrVerify.methodScreen') : t('sessions.qrVerify.methodPrint')) + sideSuffix(t, m.side),
			tone: m.tone,
		})
	}
	return badges
}

/** Opis jednej strony sesji (wejście albo wyjście), np. „ekran, w miejscu (40 m)” — do szczegółów i raportu */
export function qrVerifySideText(t, i18n, side) {
	if (!side) return '—'
	const parts = []
	if (side.method) parts.push(side.method === 'screen' ? t('sessions.qrVerify.methodScreenShort') : t('sessions.qrVerify.methodPrintShort'))
	const g = side.geo
	if (g) {
		const dist = typeof g.distanceM === 'number' ? ` (${formatDistance(g.distanceM, locale(i18n))})` : ''
		if (g.status === 'inside') parts.push(t('sessions.qrVerify.sideInside') + dist)
		else if (g.status === 'outside') parts.push(t('sessions.qrVerify.sideOutside') + dist)
		else if (g.status === 'denied') parts.push(t('sessions.qrVerify.sideDenied'))
		else if (g.status === 'unavailable') parts.push(t('sessions.qrVerify.sideUnavailable'))
		else parts.push(t('sessions.qrVerify.sideMissing'))
	}
	return parts.length > 0 ? parts.join(', ') : '—'
}

const pad2 = n => String(n).padStart(2, '0')
const hhmm = value => {
	const d = new Date(value)
	return Number.isNaN(d.getTime()) ? '' : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * Wiersze raportu „Skany QR — weryfikacja” z odpowiedzi /timer/sessions (grouped): tylko sesje z weryfikacją,
 * od najstarszej. [data, godziny, miejsce, wejście, wyjście, nietypowe]
 */
export function qrVerifyReportRows(t, i18n, grouped) {
	const rows = []
	for (const group of grouped || []) {
		for (const session of group.sessions || []) {
			const summary = summarizeQrVerify(session.qrVerify)
			if (!summary) continue
			const start = new Date(session.startTime)
			// Dzień pracy jak w liście sesji (YYYY-MM-DD z serwera), a nie dzień startu wg zegara przeglądarki
			const ymd = typeof session.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(session.date) ? session.date.split('-').map(Number) : null
			const day = ymd ? new Date(ymd[0], ymd[1] - 1, ymd[2]) : start
			rows.push({
				sortKey: start.getTime() || 0,
				cells: [
					day.toLocaleDateString(i18n?.resolvedLanguage || 'pl', { day: '2-digit', month: '2-digit', year: 'numeric' }),
					`${hhmm(session.startTime)}–${session.endTime ? hhmm(session.endTime) : ''}`,
					session.qrCode?.name || '',
					qrVerifySideText(t, i18n, summary.entry),
					qrVerifySideText(t, i18n, summary.exit),
					summary.unusual ? t('sessions.qrVerify.reportYes') : '',
				],
			})
		}
	}
	return rows.sort((a, b) => a.sortKey - b.sortKey).map(r => r.cells)
}
