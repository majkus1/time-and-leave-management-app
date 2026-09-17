/**
 * Test bliźniaka selektora modułów wiedzy — te same przypadki co server/tests/productKnowledge.test.js
 * (scripts/knowledge-select-cases.json). Uruchomienie: npm run test:knowledge (node --experimental-strip-types).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { selectKnowledgeModules, isLegalQuestion, foldDiacritics } from './knowledgeSelect.ts'
import { productKnowledgeModules } from '../../data/productKnowledge.generated.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const casesPath = path.resolve(here, '../../../../scripts/knowledge-select-cases.json')

type Case = { text: string; first: string; includes?: string[]; moduleId?: string; max?: number; fallback?: string[] }

test('wspólne przypadki selektora (JSON) — wynik identyczny z serwerem', () => {
	const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')) as Case[]
	assert.ok(cases.length >= 10)
	for (const c of cases) {
		const ids = selectKnowledgeModules({
			modules: productKnowledgeModules,
			lastUserText: c.text,
			moduleId: c.moduleId ?? null,
			max: c.max ?? 3,
			fallback: c.fallback ?? [],
		}).map(m => m.id)
		assert.equal(ids[0], c.first, `${c.text}: oczekiwano ${c.first}, jest ${ids.join(',')}`)
		for (const id of c.includes ?? []) assert.ok(ids.includes(id), `${c.text}: brak ${id}`)
	}
})

test('regulaminy dokładane tylko przy pytaniach prawnych', () => {
	assert.equal(isLegalQuestion('Czy kod QR skanuje się telefonem?'), false)
	assert.equal(isLegalQuestion('ile kosztuje dla 20 osób'), false)
	assert.equal(isLegalQuestion('gdzie jest regulamin i polityka prywatności'), true)
	assert.equal(isLegalQuestion('Kto jest właścicielem serwisu?'), true)
	assert.equal(isLegalQuestion('Do you sign a DPA?'), true)
})

test('foldDiacritics zamienia polskie znaki i interpunkcję', () => {
	assert.equal(foldDiacritics('Święta, e-mail — ŻÓŁĆ'), 'swieta e mail zolc')
})
