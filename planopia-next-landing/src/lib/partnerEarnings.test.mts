/**
 * Kalkulator zarobku partnera i walidacja zgłoszenia z /program-partnerski.
 * Uruchomienie: npm run test:partner (node --experimental-strip-types).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { firmsLabel, formatPln, formatPlnSmart, partnerEarnings } from './partnerEarnings.ts'
import { validatePartnerApplication } from './validations/partnerApplication.ts'

const TERMS = { initialRate: 0.25, initialMonths: 12, laterRate: 0.1 }

test('10 firm na planie 189 zł: 25% przez rok, potem 10%', () => {
	const r = partnerEarnings({ companies: 10, monthlyNetPln: 189, ...TERMS })
	assert.equal(r.monthlyInitial, 472.5)
	assert.equal(r.monthlyLater, 189)
	assert.deepEqual(r.years, [5670, 2268, 2268])
	assert.equal(r.total, 10206)
})

test('okres krótszy niż rok dzieli pierwszy rok na dwie stawki', () => {
	const r = partnerEarnings({ companies: 1, monthlyNetPln: 100, initialRate: 0.25, initialMonths: 6, laterRate: 0.1 })
	assert.deepEqual(r.years, [6 * 25 + 6 * 10, 120, 120])
})

test('bez stawki późniejszej prowizja kończy się po okresie', () => {
	const r = partnerEarnings({ companies: 3, monthlyNetPln: 119, initialRate: 0.25, initialMonths: 12, laterRate: 0 })
	assert.deepEqual(r.years, [1071, 0, 0])
})

test('grosze zaokrąglane, bez błędów zmiennoprzecinkowych', () => {
	const r = partnerEarnings({ companies: 7, monthlyNetPln: 119, ...TERMS })
	assert.equal(r.monthlyInitial, 208.25)
	assert.equal(r.years[0], 2499)
})

test('ujemne wejście nie daje ujemnej prowizji', () => {
	const r = partnerEarnings({ companies: -2, monthlyNetPln: 189, ...TERMS })
	assert.equal(r.total, 0)
})

test('formatowanie kwot po polsku z twardą spacją', () => {
	assert.equal(formatPln(5670), '5 670 zł')
	assert.equal(formatPln(472.5, 2), '472,50 zł')
	assert.equal(formatPln(1234567.891, 2), '1 234 567,89 zł')
	assert.equal(formatPlnSmart(189), '189 zł')
	assert.equal(formatPlnSmart(47.25), '47,25 zł')
	assert.equal(formatPlnSmart(120 * 0.1), '12 zł')
	assert.equal(formatPlnSmart(189 * 0.1), '18,90 zł')
})

test('odmiana „firma”', () => {
	assert.deepEqual([1, 2, 4, 5, 12, 14, 22, 25, 50].map(firmsLabel), ['firma', 'firmy', 'firmy', 'firm', 'firm', 'firm', 'firmy', 'firm', 'firm'])
})

test('zgłoszenie: poprawne dane', () => {
	const r = validatePartnerApplication({ name: ' Anna Nowak ', email: 'anna@biuro.pl', role: 'Biuro rachunkowe', companies: '6–20', phone: '', message: 'Mamy 30 klientów' })
	assert.equal(r.ok, true)
	if (r.ok) {
		assert.equal(r.spam, false)
		assert.equal(r.value.name, 'Anna Nowak')
		assert.equal(r.value.phone, null)
		assert.equal(r.value.companies, '6–20')
	}
})

test('zgłoszenie: brak imienia lub złego e-maila', () => {
	assert.equal(validatePartnerApplication({ name: 'A', email: 'a@b.pl' }).ok, false)
	assert.equal(validatePartnerApplication({ name: 'Anna', email: 'nie-mail' }).ok, false)
	assert.equal(validatePartnerApplication(null).ok, false)
})

test('zgłoszenie: wartości spoza listy i za długie pola odrzucone', () => {
	assert.equal(validatePartnerApplication({ name: 'Anna', email: 'a@b.pl', role: '<script>' }).ok, false)
	assert.equal(validatePartnerApplication({ name: 'Anna', email: 'a@b.pl', companies: '1000' }).ok, false)
	assert.equal(validatePartnerApplication({ name: 'Anna', email: 'a@b.pl', message: 'x'.repeat(4001) }).ok, false)
})

test('zgłoszenie: wypełnione pole-pułapka oznacza spam', () => {
	const r = validatePartnerApplication({ name: 'Bot', email: 'bot@spam.pl', website: 'http://spam' })
	assert.equal(r.ok && r.spam, true)
})
