/**
 * Czyste funkcje czatu landingu — node --test bez vitest (npm run test:knowledge uruchamia oba pliki).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { trimLandingHistory } from './history.ts'
import { extractCtaMarkers, hidePartialCtaMarker } from './cta.ts'
import { isAllowedLandingOrigin, allowedLandingOrigins } from './origin.ts'
import { landingChatGlobalBudget, _resetLandingChatGlobalBudget } from './rateLimit.ts'

const msg = (role: 'user' | 'assistant', content: string) => ({ role, content })

test('trimLandingHistory: przycina najstarsze, zostawia ostatnią wiadomość użytkownika', () => {
	const many = Array.from({ length: 30 }, (_, i) => msg(i % 2 ? 'assistant' : 'user', `m${i}`))
	const r = trimLandingHistory(many, { maxTurns: 12, maxChars: 12000 })
	assert.equal(r.messages.length, 12)
	assert.equal(r.trimmed, true)
	assert.equal(r.messages[r.messages.length - 1].content, 'm29')

	const big = [msg('user', 'a'.repeat(9000)), msg('assistant', 'b'.repeat(9000)), msg('user', 'ostatnia')]
	const r2 = trimLandingHistory(big, { maxTurns: 12, maxChars: 12000 })
	assert.deepEqual(r2.messages.map(m => m.content.length), [9000, 8])
	assert.equal(r2.trimmed, true)

	const huge = [msg('user', 'x'.repeat(20000))]
	assert.equal(trimLandingHistory(huge, { maxChars: 100 }).messages.length, 1)
	assert.equal(trimLandingHistory([]).trimmed, false)
	assert.equal(trimLandingHistory([msg('user', 'hej')]).trimmed, false)
})

test('extractCtaMarkers: usuwa znacznik, zwraca rodzaj, znosi końcowe białe znaki', () => {
	assert.deepEqual(extractCtaMarkers('Dla 20 osób: Core M lub Pro.\n\n[[CTA:register]]'), {
		text: 'Dla 20 osób: Core M lub Pro.',
		cta: 'register',
	})
	assert.deepEqual(extractCtaMarkers('Powyżej 100 osób — wycena. [[ cta : Contact ]]'), {
		text: 'Powyżej 100 osób — wycena.',
		cta: 'contact',
	})
	assert.deepEqual(extractCtaMarkers('Bez znacznika.'), { text: 'Bez znacznika.', cta: null })
	assert.equal(extractCtaMarkers('[[CTA:nope]] tekst').cta, null)
	assert.equal(hidePartialCtaMarker('Odpowiedź.\n[[CTA:reg'), 'Odpowiedź.')
	assert.equal(hidePartialCtaMarker('Odpowiedź [[pełny]] tekst'), 'Odpowiedź [[pełny]] tekst')
})

test('origin: Origin/Referer z planopia.pl i localhost w dev przechodzą, brak nagłówków i obce hosty nie', () => {
	const prod = { NEXT_PUBLIC_SITE_URL: 'https://planopia.pl', NODE_ENV: 'production' } as NodeJS.ProcessEnv
	const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null })
	assert.equal(isAllowedLandingOrigin(h({ origin: 'https://planopia.pl' }), prod), true)
	assert.equal(isAllowedLandingOrigin(h({ origin: 'https://www.planopia.pl' }), prod), true)
	assert.equal(isAllowedLandingOrigin(h({ referer: 'https://planopia.pl/blog/x' }), prod), true)
	assert.equal(isAllowedLandingOrigin(h({ origin: 'https://evil.example' }), prod), false)
	assert.equal(isAllowedLandingOrigin(h({ origin: 'https://planopia.pl.evil.example' }), prod), false)
	assert.equal(isAllowedLandingOrigin(h({}), prod), false)
	assert.equal(isAllowedLandingOrigin(h({ origin: 'http://localhost:3002' }), prod), false)
	// Sam host to za mało — http://planopia.pl nie jest naszą stroną na produkcji
	assert.equal(isAllowedLandingOrigin(h({ origin: 'http://planopia.pl' }), prod), false)

	const dev = { NODE_ENV: 'development' } as NodeJS.ProcessEnv
	assert.equal(isAllowedLandingOrigin(h({ origin: 'http://localhost:3002' }), dev), true)
	const preview = { NODE_ENV: 'production', VERCEL_URL: 'planopia-abc123.vercel.app' } as NodeJS.ProcessEnv
	assert.ok(allowedLandingOrigins(preview).has('https://planopia-abc123.vercel.app'))
})

test('globalny budżet dobowy czatu: 503 po przekroczeniu, reset o północy UTC', () => {
	_resetLandingChatGlobalBudget()
	const env = { LANDING_CHAT_DAILY_GLOBAL_MAX: '3' } as NodeJS.ProcessEnv
	const day1 = new Date('2026-09-17T10:00:00Z')
	assert.equal(landingChatGlobalBudget(env, day1).ok, true)
	assert.equal(landingChatGlobalBudget(env, day1).ok, true)
	assert.equal(landingChatGlobalBudget(env, day1).ok, true)
	const blocked = landingChatGlobalBudget(env, day1)
	assert.equal(blocked.ok, false)
	if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 60 && blocked.retryAfterSec <= 14 * 3600)
	assert.equal(landingChatGlobalBudget(env, new Date('2026-09-18T00:00:01Z')).ok, true)
	_resetLandingChatGlobalBudget()
})
