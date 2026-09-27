/**
 * Podsumowanie weryfikacji sesji QR (Workday.timeEntries[].qrVerify z serwera, utils/qrGeoCheck.buildSessionQrVerify)
 * do plakietek w liście sesji i raportu. Bez tekstów — etykiety składa komponent przez i18n.
 */

// Im wyżej, tym gorzej — plakietka pokazuje najgorszy wynik z wejścia i wyjścia
const GEO_SEVERITY = { inside: 0, missing: 1, unavailable: 1, denied: 2, outside: 3 }

function usableGeo(geo) {
	return geo && geo.status && geo.status !== 'not_configured' ? geo : null
}

/**
 * @returns {null | {
 *   geo: null | { status, distanceM, side: 'entry'|'exit'|'both'|null, tone: 'ok'|'warn'|'info' },
 *   method: null | { value: 'screen'|'print', side: 'entry'|'exit'|'both'|null, tone: 'ok'|'warn' },
 *   unusual: boolean,
 *   entry: { method, geo }, exit: { method, geo }
 * }}
 */
export function summarizeQrVerify(qrVerify) {
	if (!qrVerify) return null
	const entryGeo = usableGeo(qrVerify.entryGeo)
	const exitGeo = usableGeo(qrVerify.exitGeo)

	let geo = null
	const sides = [['entry', entryGeo], ['exit', exitGeo]].filter(([, g]) => g)
	if (sides.length > 0) {
		const [worstSide, worst] = sides.reduce((a, b) => (GEO_SEVERITY[b[1].status] > GEO_SEVERITY[a[1].status] ? b : a))
		const ok = worst.status === 'inside'
		const bothSame = sides.length === 2 && sides.every(([, g]) => g.status === worst.status)
		geo = {
			status: worst.status,
			distanceM: worst.distanceM ?? null,
			side: ok ? null : bothSame ? 'both' : worstSide,
			// „Tylko zapisuj” to informacja, nie alarm — alarm przy polityce oznaczania/blokady
			tone: ok ? 'ok' : worst.policy === 'record' ? 'info' : 'warn',
		}
	}

	let method = null
	const entryMethod = qrVerify.entryMethod || null
	const exitMethod = qrVerify.exitMethod || null
	if (entryMethod || exitMethod) {
		const printEntry = entryMethod === 'print'
		const printExit = exitMethod === 'print'
		method = printEntry || printExit
			? { value: 'print', side: printEntry && printExit ? 'both' : printEntry ? 'entry' : 'exit', tone: 'warn' }
			: { value: 'screen', side: null, tone: 'ok' }
	}

	if (!geo && !method) return null
	return {
		geo,
		method,
		unusual: Boolean((geo && geo.status !== 'inside') || method?.value === 'print'),
		entry: { method: entryMethod, geo: entryGeo },
		exit: { method: exitMethod, geo: exitGeo },
	}
}
