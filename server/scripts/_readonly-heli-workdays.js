require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const piotr = new mongoose.Types.ObjectId('6a103826708d864767b973ab')
	const olha = new mongoose.Types.ObjectId('6a1d8471b801bb63b7803d0a')
	const wds = await db
		.collection('workdays')
		.find({ userId: { $in: [piotr, olha] } })
		.sort({ date: 1 })
		.toArray()
	console.log(
		JSON.stringify(
			wds.map(w => ({
				userId: String(w.userId),
				date: w.date,
				hours: w.hoursWorked,
				additional: w.additionalWorked,
				absence: w.absenceType,
				notes: w.notes || null,
				updatedAt: w.updatedAt,
			})),
			null,
			2
		)
	)
	await mongoose.disconnect()
}

main()
