require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('6a103826708d864767b973a9')
	const allUsers = await db.collection('users').find({ teamId }).toArray()
	const sch = await db.collection('schedules').findOne({ teamId, name: 'Czerwiec' })
	console.log(
		JSON.stringify(
			{
				allUsersEver: allUsers.map(u => ({
					name: `${u.firstName} ${u.lastName}`,
					email: u.username,
					isActive: u.isActive !== false,
					roles: u.roles,
					createdAt: u.createdAt,
				})),
				scheduleCzerwiec: sch
					? {
							name: sch.name,
							type: sch.type,
							members: sch.members,
							daysCount: (sch.days || []).length,
							autoPlanConfig: sch.autoPlanConfig,
							createdAt: sch.createdAt,
							updatedAt: sch.updatedAt,
						}
					: null,
			},
			null,
			2
		)
	)
	await mongoose.disconnect()
}

main()
