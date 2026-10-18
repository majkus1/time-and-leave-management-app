const { test } = require('node:test')
const assert = require('node:assert/strict')
const { buildFounderWelcomeText } = require('../utils/founderWelcomeText')

const base = {
	adminFirstName: 'Anna',
	teamName: 'Budex',
	phone: '',
	calendarUrl: 'https://app.planopia.pl/umow-rozmowe',
	founderName: 'Michał Lipka',
	replyEmail: 'biuro@planopia.pl',
}

test('powitanie po imieniu, nazwa zespołu i podpis z adresem biura', () => {
	const text = buildFounderWelcomeText(base)
	assert.match(text, /^Dzień dobry, Anna!/)
	assert.match(text, /zespołu „Budex”/)
	assert.match(text, /Michał Lipka\ntwórca Planopii\nbiuro@planopia\.pl$/)
})

test('bez zbędnego „Planopia jest tutaj” i bez prywatnej skrzynki', () => {
	const text = buildFounderWelcomeText(base)
	assert.doesNotMatch(text, /Planopia jest tutaj/)
	assert.doesNotMatch(text, /gmail\.com/)
})

test('trzy kroki z nazwami przycisków z aplikacji', () => {
	const text = buildFounderWelcomeText(base)
	assert.match(text, /1\. Dodajcie pracowników — w menu „Dodaj użytkownika”/)
	assert.match(text, /Pracownicy bez dostępu/)
	assert.match(text, /2\. .*„Czas pracy”/)
	assert.match(text, /3\. .*„Zgłoś urlop”.*„Wnioskach urlopowych”/)
})

test('link do rozmowy tylko gdy jest, telefon tylko gdy podany', () => {
	const noExtras = buildFounderWelcomeText({ ...base, calendarUrl: '', phone: '' })
	assert.doesNotMatch(noExtras, /Wystarczy wybrać termin/)
	assert.doesNotMatch(noExtras, /zadzwonię/)
	const withPhone = buildFounderWelcomeText({ ...base, phone: '500 600 700' })
	assert.match(withPhone, /Numer 500 600 700 mam zapisany — zadzwonię/)
	assert.match(withPhone, /Wystarczy wybrać termin: https:\/\/app\.planopia\.pl\/umow-rozmowe/)
})

test('bez imienia — neutralne powitanie', () => {
	assert.match(buildFounderWelcomeText({ ...base, adminFirstName: '  ' }), /^Dzień dobry!/)
})
