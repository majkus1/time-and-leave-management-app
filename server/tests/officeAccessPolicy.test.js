const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { canUseOfficePanel, canManageOfficeLinks, parseYearMonth, monthQueryRange, canAcceptInvite, canEndLink } = require('../utils/officeAccessPolicy')

const OFFICE = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const CLIENT = 'bbbbbbbbbbbbbbbbbbbbbbbb'

describe('biuro rachunkowe — reguły dostępu', () => {
	it('panel biura: tylko Admin/HR zespołu typu biuro', () => {
		assert.equal(canUseOfficePanel({ roles: ['Admin'], organizationType: 'office' }), true)
		assert.equal(canUseOfficePanel({ roles: ['HR'], organizationType: 'office' }), true)
		assert.equal(canUseOfficePanel({ roles: ['Przełożony (Supervisor)'], organizationType: 'office' }), false)
		assert.equal(canUseOfficePanel({ roles: ['Pracownik (Worker)'], organizationType: 'office' }), false)
		assert.equal(canUseOfficePanel({ roles: ['Admin'], organizationType: 'company' }), false)
		assert.equal(canUseOfficePanel({ roles: 'Admin', organizationType: 'office' }), false)
	})

	it('powiązaniami po stronie firmy zarządza tylko Admin', () => {
		assert.equal(canManageOfficeLinks(['Admin']), true)
		assert.equal(canManageOfficeLinks(['HR']), false)
		assert.equal(canManageOfficeLinks(undefined), false)
	})

	it('rok i miesiąc z zapytania: tylko liczby w zakresie, bez obiektów', () => {
		assert.deepEqual(parseYearMonth('2026', '9'), { year: 2026, month: 9 })
		assert.deepEqual(parseYearMonth('2026', '0'), { year: 2026, month: 0 })
		assert.equal(parseYearMonth('2026', '12'), null)
		assert.equal(parseYearMonth('1999', '1'), null)
		assert.equal(parseYearMonth({ $gt: '' }, '1'), null)
		assert.equal(parseYearMonth('2026', ['1']), null)
		assert.equal(parseYearMonth('2026.5', '1'), null)
	})

	it('zakres miesiąca w czasie polskim z dniem zapasu (październik ze zmianą czasu)', () => {
		const r = monthQueryRange(2026, 9)
		assert.equal(r.start.toISOString(), '2026-09-30T22:00:00.000Z')
		assert.equal(r.end.toISOString(), '2026-10-31T23:00:00.000Z')
		assert.equal(r.queryStart.toISOString(), '2026-09-29T22:00:00.000Z')
		assert.equal(r.queryEnd.toISOString(), '2026-11-01T23:00:00.000Z')
	})

	it('przyjęcie zaproszenia: oczekujące od biura, na e-mail administratora tej firmy', () => {
		const invite = { status: 'pending', initiatedBy: 'office', clientTeamId: null, invitedEmail: 'szef@firma.pl', officeTeamId: OFFICE }
		assert.equal(canAcceptInvite(invite, 'Szef@Firma.pl'), true)
		assert.equal(canAcceptInvite(invite, 'inny@firma.pl'), false)
		assert.equal(canAcceptInvite(invite, ''), false)
		assert.equal(canAcceptInvite({ ...invite, invitedEmail: '' }, ''), false)
		assert.equal(canAcceptInvite({ ...invite, status: 'revoked' }, 'szef@firma.pl'), false)
		assert.equal(canAcceptInvite({ ...invite, initiatedBy: 'company' }, 'szef@firma.pl'), false)
	})

	it('zakończenie powiązania: każda strona tylko swojego, otwartego', () => {
		const link = { status: 'active', clientTeamId: CLIENT, officeTeamId: OFFICE }
		assert.equal(canEndLink(link, { teamId: CLIENT, side: 'company' }), true)
		assert.equal(canEndLink(link, { teamId: OFFICE, side: 'office' }), true)
		assert.equal(canEndLink(link, { teamId: OFFICE, side: 'company' }), false)
		assert.equal(canEndLink({ ...link, status: 'revoked' }, { teamId: CLIENT, side: 'company' }), false)
		const invite = { status: 'pending', officeTeamId: OFFICE, clientTeamId: null, invitedEmail: 'szef@firma.pl' }
		assert.equal(canEndLink(invite, { teamId: CLIENT, side: 'company', adminEmail: 'szef@firma.pl' }), true)
		assert.equal(canEndLink(invite, { teamId: CLIENT, side: 'company', adminEmail: 'obcy@firma.pl' }), false)
		assert.equal(canEndLink(invite, { teamId: OFFICE, side: 'office' }), true)
	})
})
