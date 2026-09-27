import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { recommendPlan, pricingFromCatalog } from './pricingCalculator'

// Bliźniaczy zestaw do planopia-next-landing/src/lib/pricingCalculator.test.mts — wspólne przypadki z JSON.
// Katalog budujemy tak jak API (/api/billing/catalog), bez bazy, więc test pilnuje też kształtu odpowiedzi.
// jsdom podaje import.meta.url jako http — ścieżki od __dirname (wstrzykuje go vitest)
const repoRoot = path.resolve(__dirname, '../../..')
const require = createRequire(path.join(repoRoot, 'package.json'))
const { buildPublicCatalog } = require(path.join(repoRoot, 'server/services/billingCatalogService.js'))
const casesPath = path.join(repoRoot, 'scripts/pricing-calculator-cases.json')
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'))
const pricing = pricingFromCatalog(buildPublicCatalog())

describe('recommendPlan — wspólne przypadki z landingiem', () => {
	it('ma komplet przypadków', () => {
		expect(cases.length).toBeGreaterThanOrEqual(10)
	})

	for (const c of cases) {
		it(c.label, () => {
			const r = recommendPlan(c.users, c.needs, pricing)
			expect(r.kind).toBe(c.kind)
			if (r.kind === 'core') {
				expect(r.core.planKey).toBe(c.planKey)
				expect(r.core.monthlyNetPln).toBe(c.monthlyNetPln)
				expect(r.core.modules).toEqual(c.modules ?? [])
			}
			if (r.kind === 'bundle') {
				expect(r.bundle.planKey).toBe(c.planKey)
				expect(r.bundle.monthlyNetPln).toBe(c.monthlyNetPln)
				expect(r.core.monthlyNetPln).toBe(c.coreMonthlyNetPln)
			}
		})
	}
})

describe('pricingFromCatalog', () => {
	it('bierze z katalogu tylko plany w sprzedaży (bez Enterprise i starych nazw)', () => {
		expect(pricing.freeMaxUsers).toBe(5)
		expect(pricing.coreTiers.map(t => t.id)).toEqual(['base_5', 'base_s', 'base_m', 'base_50', 'base_l'])
		expect(pricing.bundles.map(t => t.id)).toEqual(['pro_15', 'pro', 'pro_50', 'business'])
		expect(pricing.modules.map(m => m.id)).toEqual(['timer_qr', 'schedules_ai', 'tasks_chat'])
	})

	it('pusty katalog nie wywraca kalkulatora i nie poleca planu darmowego', () => {
		const empty = pricingFromCatalog(null)
		expect(recommendPlan(3, {}, empty)).toEqual({ kind: 'custom' })
		expect(recommendPlan(3, { leave: true }, empty)).toEqual({ kind: 'custom' })
	})
})
