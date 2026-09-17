#!/usr/bin/env node
/**
 * „Złote pytania” do asystenta — uruchamiane ręcznie (każde wywołanie kosztuje tokeny OpenAI), nie w node --test.
 *
 * Cele:
 *   landing   → POST {LANDING_URL}/api/public/landing-chat        (domyślnie http://localhost:3000)
 *   app-help  → POST {APP_API_URL}/api/ai-help/chat               (od Fazy 2; wymaga logowania kontem z env)
 *
 * Użycie:
 *   node scripts/ai-golden-questions.mjs --target=landing [--only=qr-phone-many-codes,price-20-people] [--out=wynik.json]
 *   node scripts/ai-golden-questions.mjs --target=app-help   (env: APP_API_URL, GOLDEN_APP_EMAIL, GOLDEN_APP_PASSWORD)
 *
 * Każde pytanie ma `mustMatch` (wszystkie regexy muszą trafić, case-insensitive) i `mustNotMatch`.
 * Kod wyjścia 1, gdy którekolwiek pytanie nie przeszło. Wynik można zapisać (--out) jako baseline przed zmianą modelu.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(
	process.argv.slice(2).map(a => {
		const m = a.match(/^--([^=]+)(?:=(.*))?$/)
		return m ? [m[1], m[2] ?? true] : [a, true]
	}),
)

const target = args.target
if (!['landing', 'app-help'].includes(target)) {
	console.error('Podaj --target=landing albo --target=app-help')
	process.exit(2)
}

const LANDING_URL = (process.env.LANDING_URL || 'http://localhost:3000').replace(/\/$/, '')
const APP_API_URL = (process.env.APP_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const all = JSON.parse(fs.readFileSync(path.join(here, 'ai-golden-questions.json'), 'utf8'))
const only = typeof args.only === 'string' ? new Set(args.only.split(',').map(s => s.trim())) : null
const questions = all.filter(q => q.targets.includes(target) && (!only || only.has(q.id)))

async function askLanding(q) {
	const res = await fetch(`${LANDING_URL}/api/public/landing-chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Origin: LANDING_URL },
		body: JSON.stringify({ locale: q.locale, module: q.module || undefined, messages: [{ role: 'user', content: q.question }] }),
	})
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
	const data = await res.json()
	return { answer: data.message, meta: data.meta }
}

/** Logowanie jak klient aplikacji: cookie sesji + token CSRF (nazwy endpointów zgodne z server/routes). */
let appSession = null
async function loginApp() {
	if (appSession) return appSession
	const email = process.env.GOLDEN_APP_EMAIL
	const password = process.env.GOLDEN_APP_PASSWORD
	if (!email || !password) throw new Error('Ustaw GOLDEN_APP_EMAIL i GOLDEN_APP_PASSWORD')
	// Każdy POST (także login) przechodzi przez csrfProtection: najpierw sekret w cookie + token z nagłówka.
	const csrfRes = await fetch(`${APP_API_URL}/api/csrf-token`)
	if (!csrfRes.ok) throw new Error(`csrf HTTP ${csrfRes.status}`)
	const csrf = (await csrfRes.json()).csrfToken
	const csrfCookie = (csrfRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
	const res = await fetch(`${APP_API_URL}/api/users/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Cookie: csrfCookie, 'X-CSRF-Token': csrf },
		body: JSON.stringify({ username: email, password }),
	})
	if (!res.ok) throw new Error(`login HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
	const authCookies = (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0])
	appSession = { cookie: [csrfCookie, ...authCookies].filter(Boolean).join('; '), csrf }
	return appSession
}

async function askAppHelp(q) {
	const s = await loginApp()
	const res = await fetch(`${APP_API_URL}/api/ai-help/chat`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: s.cookie,
			...(s.csrf ? { 'X-CSRF-Token': s.csrf } : {}),
		},
		body: JSON.stringify({ locale: q.locale, module: q.module || null, messages: [{ role: 'user', content: q.question }] }),
	})
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
	const data = await res.json()
	return { answer: data.reply, meta: data.meta }
}

function check(q, answer) {
	const failures = []
	for (const re of q.mustMatch || []) {
		if (!new RegExp(re, 'i').test(answer)) failures.push(`brak: /${re}/`)
	}
	for (const re of q.mustNotMatch || []) {
		if (new RegExp(re, 'i').test(answer)) failures.push(`niedozwolone: /${re}/`)
	}
	return failures
}

const results = []
let failed = 0
for (const q of questions) {
	const t0 = Date.now()
	let answer = ''
	let meta = null
	let error = null
	try {
		const r = target === 'landing' ? await askLanding(q) : await askAppHelp(q)
		answer = String(r.answer || '')
		meta = r.meta || null
	} catch (e) {
		error = e.message
	}
	const failures = error ? [`błąd: ${error}`] : check(q, answer)
	const ok = failures.length === 0
	if (!ok) failed += 1
	results.push({ id: q.id, locale: q.locale, ok, failures, ms: Date.now() - t0, meta, answer })
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${q.id.padEnd(24)} ${String(Date.now() - t0).padStart(5)} ms${failures.length ? '  — ' + failures.join('; ') : ''}`)
	if (!ok && answer) console.log('      ' + answer.replace(/\s+/g, ' ').slice(0, 400))
}

console.log(`\n${questions.length - failed}/${questions.length} przeszło (${target})`)
if (typeof args.out === 'string') {
	fs.writeFileSync(args.out, JSON.stringify({ target, at: new Date().toISOString(), results }, null, 2))
	console.log(`zapisano ${args.out}`)
}
process.exit(failed > 0 ? 1 : 0)
