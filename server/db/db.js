// db.js
const mongoose = require('mongoose')
require('dotenv').config()


const firmDb = mongoose.createConnection(process.env.DB_URI)


const centralTicketConnection = mongoose.createConnection(process.env.MONGO_URI_TICKETS)


module.exports = { firmDb, centralTicketConnection }
