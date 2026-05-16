function parseStripePriceMapJson() {
	const raw = (process.env.STRIPE_PRICE_MAP_JSON || '').trim()
	if (!raw) return {}
	try {
		const parsed = JSON.parse(raw)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch (parseErr) {
		console.error('[stripe] Invalid STRIPE_PRICE_MAP_JSON:', parseErr?.message || parseErr)
		const err = new Error('Stripe price map is not configured')
		err.code = 'STRIPE_CONFIG'
		throw err
	}
}

function listStripePriceMap() {
	const map = parseStripePriceMapJson()
	return Object.entries(map).map(([priceId, def]) => ({
		priceId,
		kind: def?.kind || null,
		planKey: def?.planKey || null,
		billingCycle: def?.billingCycle || null,
		addonId: def?.addonId || null,
		moduleKey: def?.moduleKey || null,
	}))
}

function findStripePriceIdByIntent(intent) {
	const { kind, planKey, billingCycle, addonId, moduleKey } = intent || {}
	const rows = listStripePriceMap()
	let row
	if (kind === 'plan') {
		row = rows.find(r => r.kind === 'plan' && r.planKey === planKey && r.billingCycle === billingCycle)
	} else if (kind === 'addon') {
		row = rows.find(r => r.kind === 'addon' && r.addonId === addonId)
	} else if (kind === 'module') {
		row = rows.find(
			r => r.kind === 'module' && r.moduleKey === moduleKey && r.billingCycle === billingCycle
		)
	}
	if (!row?.priceId) {
		console.error('[stripe] No priceId mapping for purchase intent:', intent)
		const err = new Error('Stripe price map is not configured')
		err.code = 'STRIPE_CONFIG'
		throw err
	}
	return row.priceId
}

function getStripePriceDefinition(priceId) {
	const pid = String(priceId || '').trim()
	if (!pid) {
		const err = new Error('Missing Stripe priceId')
		err.code = 'VALIDATION'
		throw err
	}
	const map = parseStripePriceMapJson()
	const def = map[pid]
	if (!def || typeof def !== 'object') {
		const err = new Error(`Unknown Stripe priceId: ${pid}`)
		err.code = 'VALIDATION'
		throw err
	}
	if (def.kind === 'plan') {
		return {
			priceId: pid,
			kind: 'plan',
			planKey: def.planKey,
			billingCycle: def.billingCycle,
		}
	}
	if (def.kind === 'addon') {
		return {
			priceId: pid,
			kind: 'addon',
			addonId: def.addonId,
		}
	}
	if (def.kind === 'module') {
		return {
			priceId: pid,
			kind: 'module',
			moduleKey: def.moduleKey,
			billingCycle: def.billingCycle,
		}
	}
	console.error('[stripe] Invalid map kind for priceId:', pid)
	const err = new Error('Stripe price map is not configured')
	err.code = 'STRIPE_CONFIG'
	throw err
}

module.exports = {
	getStripePriceDefinition,
	listStripePriceMap,
	findStripePriceIdByIntent,
}
