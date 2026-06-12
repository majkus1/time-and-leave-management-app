require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('6a1f1e08245ebd4b698caa49')
	const userIds = [
		'6a1f1e08245ebd4b698caa4b',
		'6a1f1e98245ebd4b698cab9a',
		'6a1f1ece245ebd4b698cac65',
	].map(id => new mongoose.Types.ObjectId(id))

	const users = await db.collection('users').find({ teamId }).toArray()
	const workdays = await db
		.collection('workdays')
		.find({ userId: { $in: users.map(u => u._id) } })
		.sort({ date: 1 })
		.toArray()

	const byUser = {}
	for (const w of workdays) {
		const uid = String(w.userId)
		if (!byUser[uid]) byUser[uid] = { count: 0, dates: [], totalHours: 0 }
		byUser[uid].count++
		byUser[uid].dates.push(w.date)
		byUser[uid].totalHours += w.hoursWorked || 0
	}

	const nameById = Object.fromEntries(
		users.map(u => [String(u._id), `${u.firstName} ${u.lastName} (${u.username})${u.isActive === false ? ' [deleted]' : ''}`])
	)

	const schedules = await db.collection('schedules').find({ teamId }).toArray()
	const scheduleShifts = []
	for (const sch of schedules) {
		const entries = sch.entries || sch.shifts || sch.scheduleEntries || []
		if (Array.isArray(entries) && entries.length) {
			scheduleShifts.push({ schedule: sch.name, entries: entries.length })
		}
	}

	const allTasks = await db
		.collection('tasks')
		.find({ boardId: { $in: (await db.collection('boards').find({ teamId }).toArray()).map(b => b._id) } })
		.toArray()

	console.log(
		JSON.stringify(
			{
				allUsersIncludingDeleted: users.map(u => ({
					name: `${u.firstName} ${u.lastName}`,
					email: u.username,
					isActive: u.isActive !== false,
					roles: u.roles,
				})),
				workdaysByUser: Object.fromEntries(
					Object.entries(byUser).map(([id, v]) => [
						nameById[id] || id,
						{
							days: v.count,
							totalHours: v.totalHours,
							firstDate: v.dates[0],
							lastDate: v.dates[v.dates.length - 1],
						},
					])
				),
				tasksTotal: allTasks.length,
				tasks: allTasks.map(t => ({ title: t.title, status: t.status, createdAt: t.createdAt })),
				scheduleMeta: schedules.map(s => ({
					name: s.name,
					hasEntries: !!(s.entries?.length || s.shifts?.length),
					keys: Object.keys(s).filter(k => !['_id', '__v', 'teamId', 'name', 'type', 'departmentName', 'isActive', 'createdAt', 'updatedAt'].includes(k)),
				})),
			},
			null,
			2
		)
	)
	await mongoose.disconnect()
}

main().catch(e => {
	console.error(e)
	process.exit(1)
})
