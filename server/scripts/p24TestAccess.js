/**
 * Test credentiale P24 (GET /api/v1/testAccess).
 * Uruchom: node scripts/p24TestAccess.js
 * Więcej szczegółów przy błędzie: node scripts/p24TestAccess.js --verbose
 * albo: set P24_TEST_VERBOSE=1 (Windows: set P24_TEST_VERBOSE=1)
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const { getP24Config } = require('../services/przelewy24/p24Config')

function headerObject(res) {
	const out = {}
	try {
		res.headers.forEach((value, key) => {
			out[key] = value
		})
	} catch {
		// ignore
	}
	return out
}

function printSafeCredentialHints(cfg) {
	console.error('\n--- Podpowiedzi (bez wartości sekretów) ---')
	console.error('Endpoint:', `${cfg.apiBase}/testAccess`)
	console.error('P24_SANDBOX:', cfg.sandbox)
	console.error('Login Basic (= P24_POS_ID):', cfg.posId)
	console.error('P24_MERCHANT_ID (do JSON register, nie do Basic):', cfg.merchantId)
	console.error('Długość P24_API_KEY (klucz do raportów):', cfg.apiKey.length, 'znaków')
	console.error('Długość P24_CRC:', cfg.crc.length, 'znaków')
	const keyTrim = cfg.apiKey.trim()
	if (keyTrim.length !== cfg.apiKey.length) {
		console.error('UWAGA: P24_API_KEY ma spacje/tabulacje na początku lub końcu — usuń w .env')
	}
	if (cfg.apiKey.includes('\n') || cfg.apiKey.includes('\r')) {
		console.error('UWAGA: P24_API_KEY zawiera znak nowej linii — usuń, wklej jedną linię')
	}
	console.error(
		'\nP24 przy 401 zwykle zwraca tylko ogólny komunikat (bezpieczeństwo). ' +
			'Sprawdź w panelu (sandbox vs prod) login = posId, hasło = klucz do raportów.'
	)
}

async function main() {
	const verbose = process.argv.includes('--verbose') || process.env.P24_TEST_VERBOSE === '1'

	const cfg = getP24Config()
	if (!cfg.credsOk) {
		console.error('Brak kompletnych zmiennych P24_MERCHANT_ID, P24_POS_ID, P24_CRC, P24_API_KEY')
		process.exit(1)
	}

	const url = `${cfg.apiBase}/testAccess`
	const auth = Buffer.from(`${cfg.posId}:${cfg.apiKey}`, 'utf8').toString('base64')

	console.log(`Środowisko: ${cfg.sandbox ? 'SANDBOX' : 'PRODUKCJA'}, API: ${cfg.apiBase}`)

	const res = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Basic ${auth}`,
			Accept: 'application/json',
		},
	})

	const text = await res.text()
	let json
	try {
		json = text ? JSON.parse(text) : {}
	} catch {
		json = null
	}

	console.log('HTTP status:', res.status)
	if (verbose) {
		console.log('Nagłówki odpowiedzi:', JSON.stringify(headerObject(res), null, 2))
	}
	console.log('Body:', json ?? `(nie-JSON, ${text.length} bajtów) ${text.slice(0, 500)}`)

	const ok = res.status === 200 && json != null && Number(json.responseCode) === 0 && json.data === true

	if (!ok) {
		printSafeCredentialHints(cfg)
		if (verbose) {
			console.error('\n--- Surowe body (pełne) ---')
			console.error(text)
		} else {
			console.error('\nUruchom z --verbose aby zobaczyć pełne nagłówki i surową odpowiedź.')
		}
		process.exit(1)
	}

	console.log('OK: połączenie z Przelewy24 działa.')
}

main().catch(e => {
	console.error(e)
	process.exit(1)
})
