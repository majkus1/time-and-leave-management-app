// db.js
const mongoose = require('mongoose')
require('dotenv').config()

// Użyj bazy testowej jeśli USE_TEST_DB=true i DB_URI_TEST jest ustawione
const dbUri = process.env.USE_TEST_DB === 'true' && process.env.DB_URI_TEST
	? process.env.DB_URI_TEST
	: process.env.DB_URI

if (!dbUri) {
	throw new Error('DB_URI or DB_URI_TEST environment variable is not set!')
}

const firmDb = mongoose.createConnection(dbUri)

const centralTicketConnection = mongoose.createConnection(process.env.MONGO_URI_TICKETS)

module.exports = { firmDb, centralTicketConnection }
