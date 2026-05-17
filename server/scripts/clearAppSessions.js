/**
 * Usuwa wszystkie dokumenty z kolekcji appsessions (monitor aktywności).
 * Użycie: node server/scripts/clearAppSessions.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const AppSession = require('../models/AppSession')(firmDb)

async function run() {
	if (firmDb.readyState !== 1) {
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve)
			firmDb.once('error', reject)
		})
	}

	const count = await AppSession.countDocuments()
	console.log('Sesje do usunięcia:', count)
	if (count === 0) {
		console.log('Kolekcja appsessions jest już pusta.')
		return
	}

	const result = await AppSession.deleteMany({})
	console.log('Usunięto sesji:', result.deletedCount)
	console.log('Pozostało:', await AppSession.countDocuments())
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
