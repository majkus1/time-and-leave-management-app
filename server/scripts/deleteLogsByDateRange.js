/**
 * Usuwa logi z podanego zakresu dat (pole timestamp).
 * Użycie: node server/scripts/deleteLogsByDateRange.js 2026-05-16 2026-05-17
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const Log = require('../models/log')(firmDb)

const dates = process.argv.slice(2)
if (dates.length === 0) {
	console.error('Podaj daty YYYY-MM-DD, np.: node deleteLogsByDateRange.js 2026-05-16 2026-05-17')
	process.exit(1)
}

function dayStart(isoDate) {
	return new Date(`${isoDate}T00:00:00+02:00`)
}

async function run() {
	const sorted = [...dates].sort()
	const start = dayStart(sorted[0])
	const last = sorted[sorted.length - 1]
	const end = new Date(dayStart(last))
	end.setDate(end.getDate() + 1)

	const filter = { timestamp: { $gte: start, $lt: end } }

	if (firmDb.readyState !== 1) {
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve)
			firmDb.once('error', reject)
		})
	}

	console.log('Zakres (Europe/Warsaw):', start.toISOString(), '→', end.toISOString())
	const count = await Log.countDocuments(filter)
	console.log('Do usunięcia:', count)

	if (count === 0) {
		console.log('Brak logów w tym zakresie.')
		return
	}

	const result = await Log.deleteMany(filter)
	console.log('Usunięto:', result.deletedCount)
	console.log('Pozostało logów w kolekcji:', await Log.countDocuments())
}

async function closeDb() {
	await firmDb.close()
	if (centralTicketConnection?.readyState === 1) {
		await centralTicketConnection.close()
	}
}

run()
	.then(closeDb)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err)
		closeDb().finally(() => process.exit(1))
	})
