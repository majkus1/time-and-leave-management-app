const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

/**
 * Liczba aktywnych kont w zespole (jak przy dodawaniu użytkownika — bez soft-deleted).
 * Limity planu, freemium i UI „miejsc” opierają się na tej samej definicji.
 */
async function countTeamSeats(teamId) {
	if (!teamId || !mongoose.Types.ObjectId.isValid(String(teamId))) {
		return 0
	}
	const tid = new mongoose.Types.ObjectId(String(teamId))
	return User.countDocuments({
		teamId: tid,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	})
}

module.exports = { countTeamSeats }
