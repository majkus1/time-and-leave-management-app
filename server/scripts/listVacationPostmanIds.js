require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)

async function main() {
	const uri = process.env.USE_TEST_DB === 'true' ? process.env.DB_URI_TEST : process.env.DB_URI
	await mongoose.connect(uri)

	const me = await User.findOne({ username: 'michalipka1@gmail.com' })
		.select('_id teamId roles vacationDays leaveTypeDays firstName lastName')
		.lean()
	if (!me) {
		console.log('Brak użytkownika michalipka1@gmail.com w tej bazie')
		process.exit(1)
	}

	const myTeam = await Team.findById(me.teamId).select('name').lean()

	const foreign = await User.findOne({
		teamId: { $ne: me.teamId },
		isActive: { $ne: false },
		$or: [
			{ vacationDays: { $exists: true, $ne: null } },
			{ 'leaveTypeDays.0': { $exists: true } },
			{ leaveTypeDays: { $exists: true, $not: { $size: 0 } } },
		],
	})
		.select('_id username teamId vacationDays leaveTypeDays firstName')
		.sort({ vacationDays: -1 })
		.lean()

	if (!foreign) {
		const anyForeign = await User.findOne({ teamId: { $ne: me.teamId }, isActive: { $ne: false } })
			.select('_id username teamId vacationDays leaveTypeDays')
			.lean()
		if (!anyForeign) {
			console.log('Brak usera z innego zespołu')
			process.exit(1)
		}
		Object.assign(foreign || {}, anyForeign)
	}

	const foreignTeam = await Team.findById(foreign.teamId).select('name').lean()

	const sameTeamOther = await User.findOne({
		teamId: me.teamId,
		_id: { $ne: me._id },
		isActive: { $ne: false },
	})
		.select('_id username vacationDays leaveTypeDays firstName')
		.lean()

	console.log(
		JSON.stringify(
			{
				you: {
					userId: String(me._id),
					email: 'michalipka1@gmail.com',
					teamId: String(me.teamId),
					teamName: myTeam?.name,
					roles: me.roles,
					vacationDays: me.vacationDays,
					leaveTypeDays: me.leaveTypeDays,
				},
				foreignTeamUser: {
					userId: String(foreign._id),
					email: foreign.username,
					teamId: String(foreign.teamId),
					teamName: foreignTeam?.name,
					vacationDays: foreign.vacationDays,
					leaveTypeDays: foreign.leaveTypeDays,
				},
				sameTeamUser: sameTeamOther
					? {
							userId: String(sameTeamOther._id),
							email: sameTeamOther.username,
							vacationDays: sameTeamOther.vacationDays,
							leaveTypeDays: sameTeamOther.leaveTypeDays,
						}
					: null,
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
