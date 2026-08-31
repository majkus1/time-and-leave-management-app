const test = require('node:test')
const assert = require('node:assert')

const { findDuplicateOpenLeaveRequest } = require('../utils/leaveRequestConflicts')

/** Atrapa modelu — zapamietuje zapytanie zamiast odpytywac baze. */
function fakeModel(result = null) {
	const calls = []
	return {
		calls,
		findOne(query) {
			calls.push(query)
			return Promise.resolve(result)
		},
	}
}

const szukaj = (LeaveRequest, overrides = {}) =>
	findDuplicateOpenLeaveRequest({
		LeaveRequest,
		userId: 'u1',
		type: 'wypoczynkowy',
		startDate: '2026-09-03',
		endDate: '2026-09-04',
		...overrides,
	})

test('szuka tylko wnioskow zywych — oczekujacych i wyslanych', async () => {
	const model = fakeModel()
	await szukaj(model)
	assert.deepStrictEqual(model.calls[0].status, { $in: ['status.pending', 'status.sent'] })
})

test('zakres dat obejmuje caly dzien w UTC, niezaleznie od godziny zapisanej w bazie', async () => {
	const model = fakeModel()
	await szukaj(model)
	const { startDate, endDate } = model.calls[0]
	assert.strictEqual(startDate.$gte.toISOString(), '2026-09-03T00:00:00.000Z')
	assert.strictEqual(startDate.$lte.toISOString(), '2026-09-03T23:59:59.999Z')
	assert.strictEqual(endDate.$gte.toISOString(), '2026-09-04T00:00:00.000Z')
	assert.strictEqual(endDate.$lte.toISOString(), '2026-09-04T23:59:59.999Z')
})

test('wniosek dniowy nie porownuje sie z godzinowymi', async () => {
	const model = fakeModel()
	await szukaj(model, { hoursRequested: null })
	const query = model.calls[0]
	assert.strictEqual(query.hoursRequested, undefined)
	assert.deepStrictEqual(query.$or, [
		{ hoursRequested: { $exists: false } },
		{ hoursRequested: null },
		{ hoursRequested: { $lte: 0 } },
	])
})

test('wniosek godzinowy jest duplikatem dopiero przy tej samej liczbie godzin', async () => {
	const model = fakeModel()
	await szukaj(model, { hoursRequested: 4 })
	assert.strictEqual(model.calls[0].hoursRequested, 4)
})

test('istniejacy wniosek jest zwracany, brak duplikatu daje null', async () => {
	assert.strictEqual(await szukaj(fakeModel(null)), null)
	assert.deepStrictEqual(await szukaj(fakeModel({ _id: 'x' })), { _id: 'x' })
})

test('przy edycji mozna pominac wlasny wniosek', async () => {
	const model = fakeModel()
	await szukaj(model, { excludeRequestId: 'abc' })
	assert.deepStrictEqual(model.calls[0]._id, { $ne: 'abc' })
})
