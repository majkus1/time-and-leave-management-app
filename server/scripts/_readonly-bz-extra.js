require('dotenv').config()
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('69cd6fbf07e4d06e5d3c7b13')

	const team = await db.collection('teams').findOne({ _id: teamId })
	const teamFields = Object.fromEntries(
		Object.entries(team).filter(([k, v]) =>
			typeof v === 'string' && v.trim() &&
			/nip|invoice|address|company|firma|tax|vat|billing|admin|email|name/i.test(k + String(v))
		)
	)

	const tickets = await db.collection('tickets').find({
		$or: [
			{ company: /BZ|Ubezpieczenia|Glaba|bzubezpieczenia/i },
			{ email: /bzubezpieczenia/i },
		],
	}).toArray()

	const allTicketsEmail = await db.collection('tickets').find({ email: /bzubezpieczenia/i }).toArray()

	const logs = await db.collection('logs').find({
		details: /bzubezpieczenia|BZ Ubezpieczenia|faktur|NIP|nip|invoice|billingInvoice/i,
	}).sort({ timestamp: -1 }).limit(20).toArray()

	const userIds = (await db.collection('users').find({ teamId }).toArray()).map(u => u._id)
	const userLogs = await db.collection('logs').find({
		$or: [{ user: { $in: userIds } }, { createdBy: { $in: userIds } }],
		details: /faktur|invoice|NIP|nip|billing|pakiet|company|firma|adres|address/i,
	}).sort({ timestamp: -1 }).toArray()

	const legal = await db.collection('legalacceptances').find({ userId: { $in: userIds } }).toArray()

	console.log(JSON.stringify({
		teamRelevantFields: teamFields,
		tickets: allTicketsEmail.length ? allTicketsEmail : tickets,
		billingLogs: logs,
		userBillingLogs: userLogs,
		legalAcceptancesCount: legal.length,
		purchaseNotes: (await db.collection('billingpaymentsessions').find({ teamId }).toArray()).map(s => ({
			note: s.note,
			customerEmail: s.customerEmail,
			createdAt: s.createdAt,
		})),
	}, null, 2))

	await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
