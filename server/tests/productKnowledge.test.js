const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const planCatalog = require('../constants/planCatalog')
const { modules, NOT_AVAILABLE_PL } = require('../constants/productKnowledge')
const render = require('../utils/productKnowledgeRender')

const REQUIRED_IDS = ['general', 'timeTracking', 'qr', 'leave', 'schedules', 'tasks', 'chat', 'settingsRoles', 'packages', 'ai']

test('każdy moduł ma komplet pól i obowiązkowe sekcje', () => {
	assert.deepEqual(modules.map(m => m.id), REQUIRED_IDS)
	for (const m of modules) {
		assert.equal(typeof m.order, 'number', m.id)
		for (const loc of ['pl', 'en']) {
			assert.ok(m.title?.[loc], `${m.id}: title.${loc}`)
			assert.ok(m.summary?.[loc], `${m.id}: summary.${loc}`)
			assert.ok(Array.isArray(m.keywords?.[loc]) && m.keywords[loc].length >= 5, `${m.id}: keywords.${loc}`)
			assert.ok(Array.isArray(m.suggestedQuestions?.[loc]) && m.suggestedQuestions[loc].length >= 3, `${m.id}: suggestedQuestions.${loc}`)
		}
		assert.ok(Array.isArray(m.requires?.modules), `${m.id}: requires.modules`)
		for (const key of m.requires.modules) assert.ok(planCatalog.isModuleKey(key), `${m.id}: nieznany moduł ${key}`)
		for (const key of m.requires.bundles) assert.ok(planCatalog.isBundlePlanKey(key), `${m.id}: nieznany pakiet ${key}`)
		assert.equal(typeof m.body?.pl, 'string', `${m.id}: body.pl`)
		assert.match(m.body.pl, /### Czego NIE robi/, `${m.id}: brak sekcji „Czego NIE robi”`)
		assert.match(m.body.pl, /### Gdzie w aplikacji/, `${m.id}: brak sekcji „Gdzie w aplikacji”`)
	}
})

test('treść renderuje się w obu locale bez nieznanych placeholderów', () => {
	for (const loc of ['pl', 'en']) {
		const sections = render.compileKnowledgeSections(loc)
		assert.equal(sections.length, modules.length)
		for (const s of sections) {
			assert.ok(!/\{\{/.test(s.text), `${s.id}/${loc}: został placeholder`)
			assert.ok(s.text.length > 300, `${s.id}/${loc}: podejrzanie krótka treść`)
		}
	}
	assert.ok(!/\{\{/.test(render.renderNotAvailable()))
	assert.throws(() => render.renderKnowledgeBody('x {{price.plan.nope}} y', render.buildCatalogValues()), /nieznany placeholder/)
})

test('cennik w bazie wiedzy pochodzi wyłącznie z planCatalog (brak liczb wpisanych ręcznie, brak Enterprise)', () => {
	const packages = render.compileKnowledgeSections('pl').find(s => s.id === 'packages').text
	const expected = [
		...['base_s', 'base_m', 'base_l', 'pro', 'business'].map(k => `${planCatalog.MONTHLY_NET_PRICES_PLN[k]} zł`),
		...Object.values(planCatalog.MODULE_MONTHLY_NET_PRICES_PLN).map(v => `${v} zł`),
		...Object.values(planCatalog.AI_ADDON_PACKS).map(p => `${p.pricePlnNet} zł`),
		`do ${planCatalog.PAID_PLANS.pro.maxUsers}`,
		`do ${planCatalog.PAID_PLANS.business.maxUsers}`,
		`${planCatalog.PAID_PLANS.business.aiMessagesPerMonth}`,
		`${planCatalog.ANNUAL_NET_MONTHS_CHARGED} miesięcy`,
	]
	for (const e of expected) assert.ok(packages.includes(e), `packages: brak „${e}”`)
	assert.ok(!/enterprise/i.test(packages.replace(/Nie ma pakietu „Enterprise”/, '')), 'packages: Enterprise poza zdaniem zaprzeczającym')
	assert.ok(!packages.includes(String(planCatalog.MONTHLY_NET_PRICES_PLN.enterprise)), 'packages: cena enterprise')

	// W źródłach modułów liczby cennika mają być placeholderami, nie literałami
	const priceLiterals = new Set(
		[...Object.values(planCatalog.MONTHLY_NET_PRICES_PLN), ...Object.values(planCatalog.MODULE_MONTHLY_NET_PRICES_PLN)].map(String)
	)
	for (const m of modules) {
		for (const n of priceLiterals) {
			const re = new RegExp(`(^|[^0-9{.])${n} zł`, 'm')
			assert.ok(!re.test(m.body.pl), `${m.id}: literał ceny „${n} zł” zamiast placeholdera`)
		}
	}
})

test('długość triala w bazie wiedzy zgadza się z teamController', () => {
	const src = fs.readFileSync(path.join(__dirname, '../controllers/teamController.js'), 'utf8')
	assert.ok(src.includes(`${render.TRIAL_DAYS} * 24 * 60 * 60 * 1000`), 'teamController ma inną długość triala niż TRIAL_DAYS')
})

test('wybór modułów: pytanie o QR daje qr jako pierwszy, pytania o cenę — packages', () => {
	const pick = (q, o) => render.selectKnowledgeModules({ lastUserText: q, ...o }).map(m => m.id)
	assert.equal(pick('Czy kod QR skanuje się zwykłym telefonem i czy mogę mieć osobne kody na różne budowy?')[0], 'qr')
	assert.equal(pick('Czy QR sprawdza GPS?')[0], 'qr')
	assert.equal(pick('ile kosztuje dla 20 osob')[0], 'packages')
	assert.equal(pick('Which plan for 45 people?')[0], 'packages')
	assert.equal(pick('czy urlop mozna wziac na kilka godzin')[0], 'leave')
	assert.equal(pick('jak dodać pracownika bez dostępu')[0], 'settingsRoles')
	assert.equal(pick('czy wysyłacie maile z powiadomieniami')[0], 'chat')
	assert.deepEqual(pick('hej', { fallback: ['general'] }), ['general'])
	assert.deepEqual(pick('czy QR działa w darmowym planie', { moduleId: 'packages', max: 2 }).slice(0, 2), ['packages', 'qr'])
	assert.ok(pick('x', { max: 3 }).length <= 3)
})

test('wspólne przypadki selektora (JSON dla bliźniaka TS na landingu) przechodzą', () => {
	const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scripts/knowledge-select-cases.json'), 'utf8'))
	assert.ok(cases.length >= 10)
	for (const c of cases) {
		const ids = render.selectKnowledgeModules({ lastUserText: c.text, moduleId: c.moduleId || null, max: c.max || 3, fallback: c.fallback || [] }).map(m => m.id)
		assert.equal(ids[0], c.first, `${c.text}: oczekiwano ${c.first}, jest ${ids.join(',')}`)
		if (c.includes) for (const id of c.includes) assert.ok(ids.includes(id), `${c.text}: brak ${id}`)
	}
})

test('blok wiedzy do promptu: indeks + wybrane moduły + alwaysInclude + „czego nie ma”', () => {
	const { text, moduleIds } = render.buildProductKnowledgeBlock({
		locale: 'pl',
		lastUserText: 'Czy kod QR skanuje się zwykłym telefonem?',
		max: 2,
		alwaysInclude: ['ai'],
		fallback: ['general'],
	})
	assert.equal(moduleIds[0], 'qr')
	assert.ok(moduleIds.includes('ai'))
	assert.ok(text.includes('- packages: '), 'indeks zawiera wszystkie moduły')
	assert.ok(text.includes('## Kody QR'), 'pełna treść wybranego modułu')
	assert.ok(text.includes('Nie sprawdza lokalizacji GPS'))
	assert.ok(text.includes('### Czego Planopia nie ma'))
	assert.ok(!text.includes('{{'))

	const en = render.buildProductKnowledgeBlock({ locale: 'en', lastUserText: 'Does QR check GPS?' })
	assert.equal(en.moduleIds[0], 'qr')
	assert.ok(en.text.includes('Source text in Polish'), 'brak wersji EN → instrukcja językowa')
	assert.ok(en.text.includes('## QR codes'))

	const empty = render.buildProductKnowledgeBlock({ locale: 'pl', lastUserText: 'hej', fallback: ['general'] })
	assert.deepEqual(empty.moduleIds, ['general'])
})

test('wersja wiedzy jest stabilna i zmienia się z treścią', () => {
	const v1 = render.computeKnowledgeVersion()
	assert.match(v1, /^[0-9a-f]{12}$/)
	assert.equal(render.computeKnowledgeVersion(), v1)
	const altered = modules.map(m => (m.id === 'qr' ? { ...m, body: { ...m.body, pl: m.body.pl + '\nzmiana' } } : m))
	assert.notEqual(render.computeKnowledgeVersion({ modules: altered }), v1)
	assert.ok(NOT_AVAILABLE_PL.includes('GPS'))
})

test('wygenerowany plik landingu jest aktualny (npm run knowledge:build)', () => {
	const script = path.join(__dirname, '../../scripts/build-product-knowledge.mjs')
	assert.doesNotThrow(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }), 'wygenerowane pliki landingu są nieaktualne')
})
