require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('69cd6fbf07e4d06e5d3c7b13')

	const team = await db.collection('teams').findOne({ _id: teamId })
	const sessions = await db
		.collection('billingpaymentsessions')
		.find({ teamId })
		.sort({ createdAt: -1 })
		.limit(10)
		.toArray()
	const ledger = await db
		.collection('billingledgerentries')
		.find({ teamId })
		.sort({ createdAt: -1 })
		.limit(10)
		.toArray()

	console.log(
		JSON.stringify(
			{
				team: {
					name: team.name,
					billingPlanKey: team.billingPlanKey,
					billingStatus: team.billingStatus,
					billingCycle: team.billingCycle,
					billingPeriodEnd: team.billingPeriodEnd,
					billingHadPaidPlan: team.billingHadPaidPlan,
					maxUsers: team.maxUsers,
					billingModuleKeys: team.billingModuleKeys,
					subscriptionType: team.subscriptionType,
					createdAt: team.createdAt,
					updatedAt: team.updatedAt,
				},
				paymentSessions: sessions.map(s => ({
					_id: s._id,
					status: s.status,
					planKey: s.planKey,
					billingCycle: s.billingCycle,
					provider: s.provider,
					amountPln: s.amountPln,
					createdAt: s.createdAt,
					paidAt: s.paidAt,
					customerEmail: s.customerEmail,
				})),
				ledgerEntries: ledger.map(l => ({
					_id: l._id,
					action: l.action,
					idempotencyKey: l.idempotencyKey,
					payload: l.payload,
					createdAt: l.createdAt,
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
