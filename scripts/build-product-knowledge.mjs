#!/usr/bin/env node
/**
 * Generuje dla landingu (Next.js, budowany na Vercelu z podkatalogu, bez dostępu do server/):
 *  - planopia-next-landing/src/data/productKnowledge.generated.ts  — baza wiedzy z wyrenderowanym cennikiem
 *  - planopia-next-landing/src/data/landingPlanPricing.generated.ts — liczby cennika z planCatalog.js
 *
 * Użycie: node scripts/build-product-knowledge.mjs [--check]
 *   --check: nie zapisuje, kończy się kodem 1, gdy pliki na dysku różnią się od świeżo wygenerowanych (CI).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const planCatalog = require(path.join(root, 'server/constants/planCatalog.js'))
const { modules, NOT_AVAILABLE_PL } = require(path.join(root, 'server/constants/productKnowledge/index.js'))
const render = require(path.join(root, 'server/utils/productKnowledgeRender.js'))

const OUT_KNOWLEDGE = path.join(root, 'planopia-next-landing/src/data/productKnowledge.generated.ts')
const OUT_PRICING = path.join(root, 'planopia-next-landing/src/data/landingPlanPricing.generated.ts')

const HEADER = `/**
 * PLIK GENEROWANY — nie edytuj ręcznie.
 * Źródło: server/constants/productKnowledge/*.js + server/constants/planCatalog.js
 * Odśwież: npm run knowledge:build (z katalogu głównego repo). CI: npm run knowledge:check
 */
`

const j = v => JSON.stringify(v)

function buildKnowledgeTs() {
	const version = render.computeKnowledgeVersion()
	const values = render.buildCatalogValues(planCatalog)
	const pl = render.compileKnowledgeSections('pl')
	const en = render.compileKnowledgeSections('en')
	const enById = new Map(en.map(s => [s.id, s]))

	const entries = modules.map(m => {
		const p = pl.find(s => s.id === m.id)
		const e = enById.get(m.id)
		return [
			'\t{',
			`\t\tid: ${j(m.id)},`,
			`\t\torder: ${m.order},`,
			`\t\ttitle: { pl: ${j(m.title.pl)}, en: ${j(m.title.en)} },`,
			`\t\tsummary: { pl: ${j(m.summary.pl)}, en: ${j(m.summary.en)} },`,
			`\t\tkeywords: { pl: ${j(m.keywords.pl)}, en: ${j(m.keywords.en)} },`,
			`\t\trequires: ${j(m.requires)},`,
			`\t\tsuggestedQuestions: { pl: ${j(m.suggestedQuestions.pl)}, en: ${j(m.suggestedQuestions.en)} },`,
			`\t\tbody: { pl: ${j(p.text)}, en: ${e.bodyLocale === 'en' ? j(e.text) : 'null'} },`,
			'\t},',
		].join('\n')
	})

	return [
		HEADER,
		`export const PRODUCT_KNOWLEDGE_VERSION = ${j(version)}`,
		'',
		'export type ProductKnowledgeLocale = \'pl\' | \'en\'',
		'',
		'export type ProductKnowledgeModuleId =',
		modules.map(m => `\t| ${j(m.id)}`).join('\n'),
		'',
		'export type ProductKnowledgeModule = {',
		'\tid: ProductKnowledgeModuleId',
		'\torder: number',
		'\ttitle: { pl: string; en: string }',
		'\tsummary: { pl: string; en: string }',
		'\tkeywords: { pl: string[]; en: string[] }',
		'\trequires: { modules: string[]; bundles: string[]; trial: boolean; freemium: boolean }',
		'\tsuggestedQuestions: { pl: string[]; en: string[] }',
		'\t/** Treść PL jest kanoniczna; en === null → model dostaje PL z instrukcją odpowiadania po angielsku */',
		'\tbody: { pl: string; en: string | null }',
		'}',
		'',
		'export const productKnowledgeModules: ProductKnowledgeModule[] = [',
		entries.join('\n'),
		']',
		'',
		'/** Wspólny blok „czego Planopia nie ma” (PL, kanoniczny) */',
		`export const PRODUCT_KNOWLEDGE_NOT_AVAILABLE_PL = ${j(render.renderKnowledgeBody(NOT_AVAILABLE_PL, values))}`,
		'',
		`export const PRODUCT_KNOWLEDGE_APP_URL = ${j(render.APP_PUBLIC_URL)}`,
		'',
	].join('\n')
}

function buildPricingTs() {
	const c = planCatalog
	const core = ['base_s', 'base_m', 'base_l']
	const bundles = ['pro', 'business']
	const lines = [
		HEADER,
		`export const LANDING_ANNUAL_MONTHS_CHARGED = ${c.ANNUAL_NET_MONTHS_CHARGED}`,
		'',
		`export const LANDING_TRIAL_DAYS = ${render.TRIAL_DAYS}`,
		'',
		'export const landingTrial = {',
		`\tmaxUsers: ${c.TRIAL.maxUsers},`,
		`\taiTrialOneOffTotal: ${c.TRIAL.aiTrialOneOffTotal},`,
		'}',
		'',
		`export const landingCoreMinMonthlyNetPln = ${Math.min(...core.map(k => c.MONTHLY_NET_PRICES_PLN[k]))}`,
		'',
		`export const landingCoreAiPoolPerMonth = ${c.AI_ASSISTANT_MODULE_MONTHLY_MESSAGES}`,
		'',
		'export const landingCoreTiers = [',
		...core.map(k => `\t{ id: ${j(k)} as const, maxUsers: ${c.PAID_PLANS[k].maxUsers}, monthlyNetPln: ${c.MONTHLY_NET_PRICES_PLN[k]} },`),
		']',
		'',
		'export const landingBundles = [',
		...bundles.map(k => `\t{ id: ${j(k)} as const, maxUsers: ${c.PAID_PLANS[k].maxUsers}, monthlyNetPln: ${c.MONTHLY_NET_PRICES_PLN[k]}, aiMessagesPerMonth: ${c.PAID_PLANS[k].aiMessagesPerMonth} },`),
		']',
		'',
		'export const landingModules = [',
		...c.MODULE_KEYS.map(k => `\t{ id: ${j(k)} as const, monthlyNetPln: ${c.MODULE_MONTHLY_NET_PRICES_PLN[k]} },`),
		']',
		'',
		'export const landingAddons = [',
		...Object.entries(c.AI_ADDON_PACKS).map(([k, v]) => `\t{ id: ${j(k)} as const, messages: ${v.messages}, pricePlnNet: ${v.pricePlnNet} },`),
		']',
		'',
		"export type CorePlanId = (typeof landingCoreTiers)[number]['id']",
		"export type ModuleId = (typeof landingModules)[number]['id']",
		'',
	]
	return lines.join('\n')
}

const outputs = [
	[OUT_KNOWLEDGE, buildKnowledgeTs()],
	[OUT_PRICING, buildPricingTs()],
]

const check = process.argv.includes('--check')
let stale = 0
for (const [file, content] of outputs) {
	const rel = path.relative(root, file)
	const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
	// Porównanie niezależne od CRLF/LF (autocrlf na Windows vs Linux w CI)
	if (current !== null && current.replace(/\r\n/g, '\n') === content) {
		console.log(`ok       ${rel}`)
		continue
	}
	if (check) {
		stale += 1
		console.error(`STALE    ${rel} — uruchom: npm run knowledge:build`)
		continue
	}
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, content)
	console.log(`written  ${rel}`)
}
if (stale > 0) process.exit(1)
