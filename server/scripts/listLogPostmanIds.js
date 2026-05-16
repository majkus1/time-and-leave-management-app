require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Log = require('../models/log')(firmDb)
const Team = require('../models/Team')(firmDb)

async function main() {
	const uri = process.env.USE_TEST_DB === 'true' ? process.env.DB_URI_TEST : process.env.DB_URI
	await mongoose.connect(uri)

	const admins = await User.find({
		roles: 'Admin',
		isActive: { $ne: false },
	}).select('username teamId firstName lastName').limit(80).lean()

	const byTeam = {}
	for (const a of admins) {
		const tid = String(a.teamId)
		if (!byTeam[tid]) byTeam[tid] = []
		byTeam[tid].push(a)
	}

	const teamIds = Object.keys(byTeam)
	if (teamIds.length < 2) {
		console.log('Potrzebne co najmniej 2 zespoły z Adminem')
		process.exit(1)
	}

	const t1 = teamIds[0]
	const t2 = teamIds[1]
	const admin1 = byTeam[t1][0]
	const admin2 = byTeam[t2][0]
	const team1 = await Team.findById(t1).select('name').lean()
	const team2 = await Team.findById(t2).select('name').lean()
	const foreignUser = await User.findOne({
		teamId: t2,
		_id: { $ne: admin2._id },
		isActive: { $ne: false },
	}).select('username firstName').lean()

	const t2UserIds = await User.find({ teamId: t2 }).distinct('_id')
	const logCountAll = await Log.countDocuments()
	const foreignLogCount = foreignUser
		? await Log.countDocuments({ user: foreignUser._id })
		: 0
	const t1LogViaAgg = await Log.aggregate([
		{ $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'u' } },
		{ $unwind: '$u' },
		{ $match: { 'u.teamId': new mongoose.Types.ObjectId(t1) } },
		{ $count: 'n' },
	])
	const t2LogViaAgg = await Log.aggregate([
		{ $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'u' } },
		{ $unwind: '$u' },
		{ $match: { 'u.teamId': new mongoose.Types.ObjectId(t2) } },
		{ $count: 'n' },
	])

	console.log(
		JSON.stringify(
			{
				teamA: {
					id: t1,
					name: team1?.name,
					adminId: String(admin1._id),
					adminEmail: admin1.username,
					logCountInTeam: t1LogViaAgg[0]?.n ?? 0,
				},
				teamB: {
					id: t2,
					name: team2?.name,
					adminId: String(admin2._id),
					adminEmail: admin2.username,
					foreignUserId: foreignUser ? String(foreignUser._id) : null,
					foreignUserEmail: foreignUser?.username ?? null,
					logCountInTeam: t2LogViaAgg[0]?.n ?? 0,
					foreignUserLogCount: foreignLogCount,
				},
				globalLogCount: logCountAll,
			},
			null,
			2
		)
	)

	await mongoose.disconnect()
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
