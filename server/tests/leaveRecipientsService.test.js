/**
 * Blokada zachowania doboru odbiorców wniosku urlopowego.
 *
 * Oczekiwania zostały zdjęte z implementacji sprzed wydzielenia serwisu
 * (leaveController.js z commita 83c5142) i porównane 1:1 — ten plik pilnuje,
 * żeby kolejny refaktor nie zmienił reguł po cichu.
 *
 * Modele i roleService są podmieniane na atrapy PRZED załadowaniem serwisu,
 * więc test nie dotyka Mongo.
 */
const test = require('node:test')
const assert = require('node:assert')
const path = require('path')
const Module = require('module')

const SERVER = path.join(__dirname, '..')

let DB = { users: [], configs: [] }

const has = (arr, value) => Array.isArray(arr) && arr.some(item => String(item) === String(value))

function matches(doc, query) {
	for (const [key, cond] of Object.entries(query)) {
		if (key === '$or') {
			if (!cond.some(sub => matches(doc, sub))) return false
			continue
		}
		const value = key.includes('.')
			? key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), doc)
			: doc[key]

		if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
			if ('$in' in cond) {
				const target = Array.isArray(value) ? value : [value]
				if (!cond.$in.some(v => target.some(tv => String(tv) === String(v)))) return false
			}
			if ('$ne' in cond && String(value) === String(cond.$ne)) return false
			if ('$exists' in cond && (value !== undefined) !== cond.$exists) return false
		} else if (Array.isArray(value)) {
			if (!has(value, cond)) return false
		} else if (String(value) !== String(cond)) {
			return false
		}
	}
	return true
}

// Udaje mongoose'owy Query: jest thenable i ma .select()
class FakeQuery {
	constructor(docs) {
		this.docs = docs
	}
	select(fields) {
		const keep = String(fields).split(/\s+/).filter(Boolean)
		this.docs = this.docs.map(doc => {
			const projected = { _id: doc._id }
			for (const field of keep) if (field in doc) projected[field] = doc[field]
			return projected
		})
		return this
	}
	then(resolve, reject) {
		return Promise.resolve(this.docs).then(resolve, reject)
	}
}

const FakeUser = {
	find: query => new FakeQuery(DB.users.filter(user => matches(user, query))),
	findById: id => new FakeQuery(DB.users.filter(user => String(user._id) === String(id))).then(d => d[0] || null),
}

function stub(relPath, exports) {
	const resolved = require.resolve(path.join(SERVER, relPath))
	require.cache[resolved] = new Module(resolved, null)
	require.cache[resolved].filename = resolved
	require.cache[resolved].loaded = true
	require.cache[resolved].exports = exports
}

stub('db/db.js', { firmDb: {} })
stub('models/user.js', () => FakeUser)
stub('models/SupervisorConfig.js', () => ({
	find: query => new FakeQuery(DB.configs.filter(config => matches(config, query))),
}))
stub('services/roleService.js', {
	findSupervisorsForDepartment: async (department, teamId) =>
		DB.users.filter(
			user =>
				String(user.teamId) === String(teamId) &&
				user.isActive !== false &&
				has(user.roles, 'Przełożony (Supervisor)') &&
				has(Array.isArray(user.department) ? user.department : [user.department], department)
		),
	canSupervisorApproveLeaves: async supervisor => supervisor.canApprove !== false,
})

const { resolveLeaveRequestRecipients } = require(path.join(SERVER, 'services/leaveRecipientsService.js'))

const TEAM = 'team-1'
const u = (id, roles, extra = {}) => ({
	_id: id,
	username: `${id}@firma.pl`,
	firstName: id.toUpperCase(),
	lastName: 'Testowy',
	roles,
	teamId: TEAM,
	department: ['IT'],
	isActive: true,
	...extra,
})
const PRACOWNIK = u('pracownik', ['Pracownik (Employee)'])

// Uruchamia obie gałęzie na tym samym zestawie danych.
async function odbiorcy({ users, configs = [] }) {
	const pracownik = users.find(user => user._id === 'pracownik')
	const wynik = {}
	for (const [klucz, typeRequiresApproval] of [['zatwierdzanie', true], ['powiadomienie', false]]) {
		DB = { users, configs }
		const { recipients } = await resolveLeaveRequestRecipients({
			user: pracownik,
			teamId: TEAM,
			typeRequiresApproval,
		})
		wynik[klucz] = recipients.map(r => r.username)
	}
	return wynik
}

test('przełożony działu i HR trafiają na listę w obu gałęziach', async () => {
	const wynik = await odbiorcy({ users: [PRACOWNIK, u('szef', ['Przełożony (Supervisor)']), u('hr', ['HR'])] })
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szef@firma.pl', 'hr@firma.pl'])
	assert.deepStrictEqual(wynik.powiadomienie, ['szef@firma.pl', 'hr@firma.pl'])
})

test('brak przełożonych i HR — wchodzą Admini', async () => {
	const wynik = await odbiorcy({ users: [PRACOWNIK, u('admin1', ['Admin']), u('admin2', ['Admin'])] })
	assert.deepStrictEqual(wynik.zatwierdzanie, ['admin1@firma.pl', 'admin2@firma.pl'])
	assert.deepStrictEqual(wynik.powiadomienie, ['admin1@firma.pl', 'admin2@firma.pl'])
})

test('jest przełożony, brak HR — gałęzie różnią się co do Adminów (zastane zachowanie)', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szef', ['Przełożony (Supervisor)']), u('admin1', ['Admin'])],
	})
	// Przy zatwierdzaniu Admin wchodzi dopiero, gdy nie ma ANI przełożonych, ANI HR.
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szef@firma.pl'])
	// Przy powiadomieniu wystarczy brak samego HR.
	assert.deepStrictEqual(wynik.powiadomienie, ['szef@firma.pl', 'admin1@firma.pl'])
})

test('nieaktywny HR nadal dostaje powiadomienie (zastane zachowanie)', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szef', ['Przełożony (Supervisor)']), u('hr', ['HR'], { isActive: false })],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szef@firma.pl', 'hr@firma.pl'])
	assert.deepStrictEqual(wynik.powiadomienie, ['szef@firma.pl', 'hr@firma.pl'])
})

test('nieaktywny przełożony nie trafia na listę', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szef', ['Przełożony (Supervisor)'], { isActive: false }), u('hr', ['HR'])],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['hr@firma.pl'])
})

test('przełożony bez uprawnienia do zatwierdzania jest odsiewany', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szef', ['Przełożony (Supervisor)'], { canApprove: false }), u('hr', ['HR'])],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['hr@firma.pl'])
})

test('przełożony z innego działu wchodzi przez SupervisorConfig', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szefHR', ['Przełożony (Supervisor)'], { department: ['Kadry'] })],
		configs: [
			{
				teamId: TEAM,
				supervisorId: 'szefHR',
				selectedEmployees: ['pracownik'],
				permissions: { canApproveLeaves: true, canApproveLeavesSelectedEmployees: true },
			},
		],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szefHR@firma.pl'])
})

test('SupervisorConfig z wyłączonym uprawnieniem nikogo nie dodaje', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('szefHR', ['Przełożony (Supervisor)'], { department: ['Kadry'] })],
		configs: [
			{
				teamId: TEAM,
				supervisorId: 'szefHR',
				selectedEmployees: ['pracownik'],
				permissions: { canApproveLeaves: false, canApproveLeavesSelectedEmployees: true },
			},
		],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, [])
})

test('osoba będąca i przełożonym, i HR pojawia się raz', async () => {
	const wynik = await odbiorcy({ users: [PRACOWNIK, u('szefhr', ['Przełożony (Supervisor)', 'HR'])] })
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szefhr@firma.pl'])
	assert.deepStrictEqual(wynik.powiadomienie, ['szefhr@firma.pl'])
})

test('wnioskodawca nie trafia na własną listę', async () => {
	const wynik = await odbiorcy({
		users: [u('pracownik', ['Pracownik (Employee)', 'Przełożony (Supervisor)']), u('hr', ['HR'])],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['hr@firma.pl'])
})

test('pracownik w kilku działach dostaje przełożonych z każdego', async () => {
	const wynik = await odbiorcy({
		users: [
			{ ...PRACOWNIK, department: ['IT', 'Kadry'] },
			u('szefIT', ['Przełożony (Supervisor)']),
			u('szefKadry', ['Przełożony (Supervisor)'], { department: ['Kadry'] }),
		],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['szefIT@firma.pl', 'szefKadry@firma.pl'])
})

test('pracownik bez działu ma tylko HR', async () => {
	const wynik = await odbiorcy({
		users: [{ ...PRACOWNIK, department: [] }, u('szef', ['Przełożony (Supervisor)']), u('hr', ['HR'])],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['hr@firma.pl'])
})

test('przełożony z innego zespołu nie trafia na listę', async () => {
	const wynik = await odbiorcy({
		users: [PRACOWNIK, u('obcy', ['Przełożony (Supervisor)'], { teamId: 'team-2' }), u('hr', ['HR'])],
	})
	assert.deepStrictEqual(wynik.zatwierdzanie, ['hr@firma.pl'])
})

test('zespół jednoosobowy daje pustą listę', async () => {
	const wynik = await odbiorcy({ users: [PRACOWNIK] })
	assert.deepStrictEqual(wynik.zatwierdzanie, [])
	assert.deepStrictEqual(wynik.powiadomienie, [])
})

test('tryb zwracany razem z listą odpowiada rodzajowi typu', async () => {
	DB = { users: [PRACOWNIK, u('hr', ['HR'])], configs: [] }
	const zatwierdzanie = await resolveLeaveRequestRecipients({
		user: PRACOWNIK,
		teamId: TEAM,
		typeRequiresApproval: true,
	})
	DB = { users: [PRACOWNIK, u('hr', ['HR'])], configs: [] }
	const powiadomienie = await resolveLeaveRequestRecipients({
		user: PRACOWNIK,
		teamId: TEAM,
		typeRequiresApproval: false,
	})
	assert.strictEqual(zatwierdzanie.mode, 'approval')
	assert.strictEqual(powiadomienie.mode, 'notification')
})
