const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

// Małe limity, żeby test był szybki — limitery czytają env przy ładowaniu modułu
process.env.QR_DISPLAY_PER_15MIN = '8'
process.env.QR_DISPLAY_INVALID_PER_15MIN = '5'

const GOOD = 'dobry-link-wyswietlacza-1'
const GOOD_2 = 'dobry-link-wyswietlacza-2'

function stubModule(relPath, exports) {
	const file = require.resolve(relPath)
	require.cache[file] = { id: file, filename: file, loaded: true, exports }
}

// Prawdziwa trasa z qrRoutes.js (test pilnuje też podpięcia limiterów) ze świeżymi limiterami; kontroler i auth
// podmienione, bo auth pociąga db/db.js. Aplikacja jak na produkcji: trust proxy 1
async function startApp() {
	for (const rel of ['../utils/rateLimiters', '../routes/qrRoutes']) delete require.cache[require.resolve(rel)]
	const noop = (req, res) => res.status(204).end()
	const getDisplayData = (req, res) => {
		if ([GOOD, GOOD_2].includes(req.params.displayToken)) return res.json({ ok: true })
		res.status(404).json({ message: 'Link wyświetlacza jest nieaktualny' })
	}
	stubModule('../controllers/qrController', new Proxy({ getDisplayData }, { get: (t, k) => t[k] || noop }))
	stubModule('../middleware/authMiddleware', { authenticateToken: (req, res, next) => next() })
	const app = express()
	app.set('trust proxy', 1)
	app.use('/api/qr', require('../routes/qrRoutes'))
	const server = await new Promise(resolve => {
		const s = app.listen(0, '127.0.0.1', () => resolve(s))
	})
	const base = `http://127.0.0.1:${server.address().port}`
	// Proxy Rendera dopisuje adres klienta na końcu X-Forwarded-For — wcześniejsze wpisy może podrobić klient
	const get = async (token, clientIp, spoofed) => {
		const res = await fetch(`${base}/api/qr/display/${token}`, {
			headers: { 'X-Forwarded-For': spoofed ? `${spoofed}, ${clientIp}` : clientIp },
		})
		await res.arrayBuffer()
		return res.status
	}
	return { get, close: () => new Promise(resolve => server.close(resolve)) }
}

const bad = i => `wymyslony-token-${i}-${Math.random().toString(36).slice(2)}`

describe('limity publicznego wyświetlacza QR', () => {
	it('wymyślone linki z jednego IP zatrzymują się na limicie; inny adres działa dalej', async () => {
		const app = await startApp()
		try {
			for (let i = 0; i < 5; i++) assert.equal(await app.get(bad(i), '203.0.113.10'), 404)
			assert.equal(await app.get(bad(99), '203.0.113.10'), 429)
			assert.equal(await app.get(GOOD, '203.0.113.20'), 200)
		} finally {
			await app.close()
		}
	})

	it('działający tablet nie zużywa puli nieudanych odczytów', async () => {
		const app = await startApp()
		try {
			for (let i = 0; i < 7; i++) assert.equal(await app.get(GOOD, '203.0.113.30'), 200)
			for (let i = 0; i < 5; i++) assert.equal(await app.get(bad(i), '203.0.113.30'), 404)
			assert.equal(await app.get(bad(99), '203.0.113.30'), 429)
		} finally {
			await app.close()
		}
	})

	it('pula per link i IP: dwa tablety za jednym adresem nie dzielą limitu, ten sam link z innego IP też nie', async () => {
		const app = await startApp()
		try {
			for (let i = 0; i < 8; i++) assert.equal(await app.get(GOOD, '203.0.113.40'), 200)
			assert.equal(await app.get(GOOD, '203.0.113.40'), 429)
			assert.equal(await app.get(GOOD_2, '203.0.113.40'), 200)
			assert.equal(await app.get(GOOD, '203.0.113.41'), 200)
		} finally {
			await app.close()
		}
	})

	it('podrobiony początek X-Forwarded-For nie daje nowej puli (liczy się adres dopisany przez proxy)', async () => {
		const app = await startApp()
		try {
			for (let i = 0; i < 5; i++) assert.equal(await app.get(bad(i), '203.0.113.50', `198.51.100.${i}`), 404)
			assert.equal(await app.get(bad(99), '203.0.113.50', '198.51.100.99'), 429)
		} finally {
			await app.close()
		}
	})
})
