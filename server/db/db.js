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

/**
 * Osobna baza / cluster na zgłoszenia (centrum pomocy).
 * Obsługiwane nazwy zmiennych (pierwsza ustawiona wygrywa):
 * MONGO_URI_TICKETS, TICKETS_MONGO_URI, MONGO_TICKETS_URI, DB_URI_TICKETS
 */
function getTicketsMongoUri() {
	const raw =
		process.env.MONGO_URI_TICKETS ||
		process.env.TICKETS_MONGO_URI ||
		process.env.MONGO_TICKETS_URI ||
		process.env.DB_URI_TICKETS
	if (!raw || typeof raw !== 'string') return null
	const s = raw.trim()
	return s.length ? s : null
}

const ticketsMongoUri = getTicketsMongoUri()
/** Brak URI = endpointy ticketów zwracają 503 (ticketController). */
const centralTicketConnection = ticketsMongoUri ? mongoose.createConnection(ticketsMongoUri) : null

module.exports = { firmDb, centralTicketConnection, getTicketsMongoUri }
