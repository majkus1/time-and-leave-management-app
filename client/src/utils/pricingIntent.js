// utils/pricingIntent.js
//
// Wybór z kalkulatora na landingu (team-registration?plan=…&modules=…&users=…&billing=…) zapamiętany
// przy rejestracji — Pakiety podpowiadają go potem w swoim kalkulatorze. Tylko podpowiedź:
// nic tu nie kupuje ani nie zmienia planu. Dane z adresu walidujemy, bo może je podać każdy.

const STORAGE_KEY = 'planopia:pricingIntent'
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000
const KEY_RE = /^[a-z0-9_]{2,24}$/

/** Wybór z parametrów adresu; null, gdy nie ma niczego sensownego */
export function parsePricingIntent(searchParams) {
	if (!searchParams || typeof searchParams.get !== 'function') return null
	const planRaw = (searchParams.get('plan') || '').trim()
	const plan = KEY_RE.test(planRaw) ? planRaw : null
	const modules = (searchParams.get('modules') || '')
		.split(',')
		.map(s => s.trim())
		.filter(s => KEY_RE.test(s))
		.slice(0, 10)
	const usersNum = Math.floor(Number(searchParams.get('users')))
	const users = Number.isFinite(usersNum) && usersNum >= 1 && usersNum <= 999 ? usersNum : null
	const billingRaw = searchParams.get('billing')
	const billing = billingRaw === 'annual' || billingRaw === 'monthly' ? billingRaw : null
	if (!plan && !modules.length && users == null) return null
	return { plan, modules, users, billing }
}

export function savePricingIntent(intent, now = Date.now()) {
	if (!intent) return
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...intent, savedAt: now }))
	} catch {
		// Tryb prywatny / zablokowany storage — podpowiedź nie jest konieczna
	}
}

export function readPricingIntent(now = Date.now()) {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const data = JSON.parse(raw)
		if (!data || typeof data !== 'object' || !Number.isFinite(data.savedAt) || now - data.savedAt > MAX_AGE_MS) {
			localStorage.removeItem(STORAGE_KEY)
			return null
		}
		return {
			plan: typeof data.plan === 'string' && KEY_RE.test(data.plan) ? data.plan : null,
			modules: Array.isArray(data.modules) ? data.modules.filter(m => typeof m === 'string' && KEY_RE.test(m)) : [],
			users: Number.isInteger(data.users) && data.users >= 1 && data.users <= 999 ? data.users : null,
			billing: data.billing === 'annual' || data.billing === 'monthly' ? data.billing : null,
		}
	} catch {
		return null
	}
}

export function clearPricingIntent() {
	try {
		localStorage.removeItem(STORAGE_KEY)
	} catch {
		// jak wyżej
	}
}
