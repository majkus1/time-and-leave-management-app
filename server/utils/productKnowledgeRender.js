/**
 * Renderowanie bazy wiedzy produktowej (constants/productKnowledge) — czyste funkcje, bez bazy.
 * Placeholdery {{…}} w treści są zastępowane wartościami z planCatalog.js, żeby cennik istniał tylko w jednym miejscu.
 */
const crypto = require('crypto')
const planCatalog = require('../constants/planCatalog')
const { modules: KNOWLEDGE_MODULES, NOT_AVAILABLE_PL } = require('../constants/productKnowledge')

const APP_PUBLIC_URL = 'https://app.planopia.pl'
/** Długość triala nie jest w planCatalog — ustawiana w teamController.registerTeam (30 dni); test pilnuje zgodności. */
const TRIAL_DAYS = 30

const LOCALES = ['pl', 'en']
const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g

/** Publiczne plany — enterprise świadomie pominięty (nie jest w ofercie publicznej). */
const PUBLIC_PLAN_KEYS = ['base_s', 'base_m', 'base_l', 'pro', 'business']

function buildCatalogValues(catalog = planCatalog) {
	const values = {
		'app.url': APP_PUBLIC_URL,
		'trial.days': TRIAL_DAYS,
		'trial.maxUsers': catalog.TRIAL.maxUsers,
		'trial.aiMessages': catalog.TRIAL.aiTrialOneOffTotal,
		'ai.coreModulePool': catalog.AI_ASSISTANT_MODULE_MONTHLY_MESSAGES,
		'annual.monthsCharged': catalog.ANNUAL_NET_MONTHS_CHARGED,
	}
	for (const key of PUBLIC_PLAN_KEYS) {
		const plan = catalog.PAID_PLANS[key]
		if (!plan) throw new Error(`productKnowledge: brak planu ${key} w planCatalog`)
		values[`price.plan.${key}`] = catalog.MONTHLY_NET_PRICES_PLN[key]
		values[`maxUsers.plan.${key}`] = plan.maxUsers
		values[`ai.plan.${key}`] = plan.aiMessagesPerMonth
	}
	for (const key of catalog.MODULE_KEYS) {
		values[`price.module.${key}`] = catalog.MODULE_MONTHLY_NET_PRICES_PLN[key]
	}
	for (const [id, pack] of Object.entries(catalog.AI_ADDON_PACKS)) {
		values[`addon.${id}.messages`] = pack.messages
		values[`addon.${id}.price`] = pack.pricePlnNet
	}
	for (const [k, v] of Object.entries(values)) {
		if (v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v))) {
			throw new Error(`productKnowledge: brak wartości dla ${k}`)
		}
	}
	return values
}

function renderKnowledgeBody(text, values) {
	if (typeof text !== 'string') return ''
	return text.replace(PLACEHOLDER_RE, (_, key) => {
		if (!Object.prototype.hasOwnProperty.call(values, key)) {
			throw new Error(`productKnowledge: nieznany placeholder {{${key}}}`)
		}
		return String(values[key])
	})
}

function pickLocale(obj, locale) {
	if (!obj) return ''
	return obj[locale] ?? obj.pl ?? ''
}

/**
 * Polskie znaki → ASCII, interpunkcja → spacja, żeby „swieta” trafiało w „święt”, a „e-mail” w „mail”.
 * Spacja na początku/końcu słowa kluczowego oznacza granicę wyrazu (np. ' ai ', ' hr ').
 */
function foldDiacritics(s) {
	return String(s || '')
		.toLowerCase()
		.replace(/ą/g, 'a')
		.replace(/ć/g, 'c')
		.replace(/ę/g, 'e')
		.replace(/ł/g, 'l')
		.replace(/ń/g, 'n')
		.replace(/ó/g, 'o')
		.replace(/ś/g, 's')
		.replace(/ż/g, 'z')
		.replace(/ź/g, 'z')
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/ {2,}/g, ' ')
}

function normalizeTextForMatch(text) {
	return ` ${foldDiacritics(text).trim()} `
}

function scoreModule(mod, normalizedText) {
	const keywords = [...(mod.keywords?.pl || []), ...(mod.keywords?.en || [])]
	let score = 0
	for (const kw of keywords) {
		const k = foldDiacritics(kw)
		if (k.trim() && normalizedText.includes(k)) score += 1
	}
	return score
}

/**
 * Wybór modułów do promptu: jawnie wskazany moduł zawsze pierwszy, potem trafienia po słowach kluczowych.
 * `fallback` — id modułów dokładane, gdy nic nie trafiło (np. ['general']).
 */
function selectKnowledgeModules({ modules = KNOWLEDGE_MODULES, moduleId = null, lastUserText = '', max = 3, fallback = [] } = {}) {
	const byId = new Map(modules.map(m => [m.id, m]))
	const picked = []
	const explicit = moduleId ? byId.get(moduleId) : null
	if (explicit) picked.push(explicit)

	const normalized = normalizeTextForMatch(lastUserText)
	if (normalized.trim()) {
		const scored = modules
			.filter(m => !explicit || m.id !== explicit.id)
			.map(m => ({ m, score: scoreModule(m, normalized) }))
			.filter(x => x.score > 0)
			.sort((a, b) => b.score - a.score || a.m.order - b.m.order)
		for (const { m } of scored) {
			if (picked.length >= max) break
			picked.push(m)
		}
	}
	if (picked.length === 0) {
		for (const id of fallback) {
			const m = byId.get(id)
			if (m && picked.length < max) picked.push(m)
		}
	}
	return picked
}

function buildKnowledgeIndex(modules = KNOWLEDGE_MODULES, locale = 'pl') {
	return modules
		.map(m => `- ${m.id}: ${pickLocale(m.title, locale)} — ${pickLocale(m.summary, locale)}`)
		.join('\n')
}

const compiledCache = new Map()

/**
 * Wyrenderowane moduły per locale (cache w procesie). `bodyLocale` mówi, w jakim języku jest treść —
 * gdy brak wersji EN, model dostaje PL i instrukcję odpowiadania po angielsku.
 */
function compileKnowledgeSections(locale = 'pl', { modules = KNOWLEDGE_MODULES, catalog = planCatalog } = {}) {
	const loc = LOCALES.includes(locale) ? locale : 'pl'
	const cacheKey = `${loc}:${modules === KNOWLEDGE_MODULES && catalog === planCatalog ? 'default' : 'custom'}`
	if (cacheKey.endsWith('default') && compiledCache.has(cacheKey)) return compiledCache.get(cacheKey)
	const values = buildCatalogValues(catalog)
	const sections = modules.map(m => {
		const hasLocale = typeof m.body?.[loc] === 'string' && m.body[loc].trim() !== ''
		const raw = hasLocale ? m.body[loc] : m.body.pl
		return {
			id: m.id,
			order: m.order,
			title: pickLocale(m.title, loc),
			summary: pickLocale(m.summary, loc),
			bodyLocale: hasLocale ? loc : 'pl',
			text: renderKnowledgeBody(raw, values),
			requires: m.requires,
			suggestedQuestions: m.suggestedQuestions?.[loc] || m.suggestedQuestions?.pl || [],
		}
	})
	if (cacheKey.endsWith('default')) compiledCache.set(cacheKey, sections)
	return sections
}

function renderNotAvailable(catalog = planCatalog) {
	return renderKnowledgeBody(NOT_AVAILABLE_PL, buildCatalogValues(catalog))
}

/**
 * Blok WIEDZA O PLANOPII do promptu: indeks wszystkich modułów + pełna treść modułów dopasowanych
 * do ostatniego pytania (+ `alwaysInclude`) + wspólna lista „czego nie ma”.
 * Używany przez czat z danymi i tryb pomocy; kolejność: jawny moduł, trafienia, alwaysInclude.
 * `all: true` = wszystkie moduły w stałej kolejności (stabilny prefiks promptu → cache OpenAI; tryb pomocy).
 */
function buildProductKnowledgeBlock({
	locale = 'pl',
	lastUserText = '',
	moduleId = null,
	max = 3,
	alwaysInclude = [],
	fallback = [],
	all = false,
	modules = KNOWLEDGE_MODULES,
	catalog = planCatalog,
} = {}) {
	const loc = LOCALES.includes(locale) ? locale : 'pl'
	const sections = compileKnowledgeSections(loc, { modules, catalog })
	const byId = new Map(sections.map(s => [s.id, s]))
	const ids = all
		? [...sections].sort((a, b) => a.order - b.order).map(s => s.id)
		: selectKnowledgeModules({ modules, moduleId, lastUserText, max, fallback }).map(m => m.id)
	if (!all) for (const id of alwaysInclude) if (!ids.includes(id)) ids.push(id)

	const header = all
		? loc === 'en'
			? 'Index of Planopia feature modules (full text of every module follows):'
			: 'Indeks modułów funkcji Planopii (poniżej pełna treść wszystkich modułów):'
		: loc === 'en'
			? 'Index of Planopia feature modules (full text below only for the modules relevant to the last question; for another module answer from its summary and point to the "How Planopia works" help mode):'
			: 'Indeks modułów funkcji Planopii (pełna treść poniżej tylko dla modułów pasujących do ostatniego pytania; przy pytaniu o inny moduł odpowiadaj z opisu i wskaż tryb pomocy „Jak działa Planopia”):'
	const parts = [header, buildKnowledgeIndex(modules, loc), '']
	for (const id of ids) {
		const s = byId.get(id)
		if (!s) continue
		parts.push(`## ${s.title}`)
		if (loc === 'en' && s.bodyLocale !== 'en') {
			parts.push('(Source text in Polish — answer in English, using the feature names from the English UI.)')
		}
		parts.push(s.text, '')
	}
	parts.push(renderKnowledgeBody(NOT_AVAILABLE_PL, buildCatalogValues(catalog)))
	return { text: parts.join('\n'), moduleIds: ids }
}

let versionCache = null

/** Skrót treści bazy + cennika → prompt_cache_key i pole knowledgeVersion w logach użycia. */
function computeKnowledgeVersion({ modules = KNOWLEDGE_MODULES, catalog = planCatalog } = {}) {
	const isDefault = modules === KNOWLEDGE_MODULES && catalog === planCatalog
	if (isDefault && versionCache) return versionCache
	const payload = LOCALES.map(loc => compileKnowledgeSections(loc, { modules, catalog }).map(s => [s.id, s.bodyLocale, s.text, s.summary]))
	payload.push(renderKnowledgeBody(NOT_AVAILABLE_PL, buildCatalogValues(catalog)))
	const version = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 12)
	if (isDefault) versionCache = version
	return version
}

module.exports = {
	APP_PUBLIC_URL,
	TRIAL_DAYS,
	LOCALES,
	PUBLIC_PLAN_KEYS,
	buildCatalogValues,
	renderKnowledgeBody,
	foldDiacritics,
	selectKnowledgeModules,
	buildKnowledgeIndex,
	compileKnowledgeSections,
	renderNotAvailable,
	buildProductKnowledgeBlock,
	computeKnowledgeVersion,
}
