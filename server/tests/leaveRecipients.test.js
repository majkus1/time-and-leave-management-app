const test = require('node:test')
const assert = require('node:assert')

const { formatLeaveRecipientsForDisplay } = require('../utils/leaveRecipientsDisplay')

const supervisor = {
	_id: 'user-supervisor',
	username: 'przelozony@firma.pl',
	firstName: 'Jan',
	lastName: 'Kowalski',
	roles: ['Pracownik (Employee)', 'Przełożony (Supervisor)'],
	isActive: true,
}

const hr = {
	_id: 'user-hr',
	username: 'kadry@firma.pl',
	firstName: 'Anna',
	lastName: 'Nowak',
	roles: ['HR'],
	isActive: true,
}

test('zwraca imię, nazwisko i rolę odbiorcy', () => {
	const result = formatLeaveRecipientsForDisplay([supervisor])
	assert.deepStrictEqual(result, [
		{ id: 'user-supervisor', firstName: 'Jan', lastName: 'Kowalski', roles: ['supervisor'] },
	])
})

test('nie ujawnia adresu e-mail ani loginu', () => {
	const [entry] = formatLeaveRecipientsForDisplay([hr])
	assert.strictEqual(entry.username, undefined)
	assert.strictEqual(entry.email, undefined)
	assert.deepStrictEqual(Object.keys(entry).sort(), ['firstName', 'id', 'lastName', 'roles'])
})

test('role są zwracane w kolejności Admin > HR > przełożony', () => {
	const [entry] = formatLeaveRecipientsForDisplay([
		{ ...hr, roles: ['Przełożony (Supervisor)', 'Admin', 'HR'] },
	])
	assert.deepStrictEqual(entry.roles, ['admin', 'hr', 'supervisor'])
})

test('pomija role spoza listy prezentowanych', () => {
	const [entry] = formatLeaveRecipientsForDisplay([{ ...hr, roles: ['Pracownik (Employee)'] }])
	assert.deepStrictEqual(entry.roles, [])
})

test('odfiltrowuje nieaktywnych', () => {
	const result = formatLeaveRecipientsForDisplay([supervisor, { ...hr, isActive: false }])
	assert.deepStrictEqual(result.map(entry => entry.id), ['user-supervisor'])
})

test('brak pola isActive traktuje jako konto aktywne', () => {
	const { isActive, ...withoutFlag } = hr
	const result = formatLeaveRecipientsForDisplay([withoutFlag])
	assert.strictEqual(result.length, 1)
})

test('wyklucza pracownika, którego dotyczy wniosek', () => {
	const result = formatLeaveRecipientsForDisplay([supervisor, hr], { requesterId: 'user-hr' })
	assert.deepStrictEqual(result.map(entry => entry.id), ['user-supervisor'])
})

test('porównuje identyfikatory jako tekst, nie przez referencję', () => {
	const objectIdLike = { toString: () => 'user-hr' }
	const result = formatLeaveRecipientsForDisplay([{ ...hr, _id: objectIdLike }], { requesterId: objectIdLike })
	assert.deepStrictEqual(result, [])
})

test('brakujące imię i nazwisko zamienia na pusty tekst zamiast undefined', () => {
	const [entry] = formatLeaveRecipientsForDisplay([{ _id: 'user-x', roles: ['HR'] }])
	assert.strictEqual(entry.firstName, '')
	assert.strictEqual(entry.lastName, '')
})

test('pomija wpisy bez identyfikatora i wartości puste', () => {
	const result = formatLeaveRecipientsForDisplay([null, undefined, { username: 'brak-id@firma.pl' }, hr])
	assert.deepStrictEqual(result.map(entry => entry.id), ['user-hr'])
})

test('nie wywraca się na braku listy', () => {
	assert.deepStrictEqual(formatLeaveRecipientsForDisplay(undefined), [])
	assert.deepStrictEqual(formatLeaveRecipientsForDisplay(null), [])
})

test('bez requesterId nikogo nie wyklucza', () => {
	const result = formatLeaveRecipientsForDisplay([supervisor, hr])
	assert.strictEqual(result.length, 2)
})
