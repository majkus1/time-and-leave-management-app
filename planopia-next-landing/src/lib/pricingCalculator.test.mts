/**
 * Kalkulator cennika — wspólne przypadki z aplikacją (scripts/pricing-calculator-cases.json), ceny z generatu planCatalog.
 * Uruchomienie: npm test (node --experimental-strip-types).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { recommendPlan, type PricingData } from './pricingCalculator.ts'
import { landingBundles, landingCoreTiers, landingModules, landingTrial } from '../data/landingPlanPricing.generated.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const casesPath = path.resolve(here, '../../../scripts/pricing-calculator-cases.json')

type Case = { label: string; users: number; needs: object; kind: string; planKey?: string; modules?: string[]; monthlyNetPln?: number; coreMonthlyNetPln?: number }

const pricing: PricingData = {
	freeMaxUsers: landingTrial.maxUsers,
	coreTiers: landingCoreTiers,
	bundles: landingBundles,
	modules: landingModules,
}

test('wspólne przypadki kalkulatora (JSON) — ten sam wynik co w aplikacji', () => {
	const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')) as Case[]
	assert.ok(cases.length >= 10)
	for (const c of cases) {
		const r = recommendPlan(c.users, c.needs, pricing)
		assert.equal(r.kind, c.kind, c.label)
		if (r.kind === 'core') {
			assert.equal(r.core.planKey, c.planKey, c.label)
			assert.equal(r.core.monthlyNetPln, c.monthlyNetPln, c.label)
			assert.deepEqual(r.core.modules, c.modules ?? [], c.label)
		}
		if (r.kind === 'bundle') {
			assert.equal(r.bundle.planKey, c.planKey, c.label)
			assert.equal(r.bundle.monthlyNetPln, c.monthlyNetPln, c.label)
			assert.equal(r.core.monthlyNetPln, c.coreMonthlyNetPln, c.label)
		}
	}
})
