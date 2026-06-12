require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('69cd6fbf07e4d06e5d3c7b13')
	const team = await db.collection('teams').findOne({ _id: teamId })
	console.log(
		JSON.stringify(
			{
				stripeCustomerId: team.stripeCustomerId || null,
				stripeSubscriptionId: team.stripeSubscriptionId || null,
				stripeSubscriptionStatus: team.stripeSubscriptionStatus || null,
				stripeCancelAtPeriodEnd: team.stripeCancelAtPeriodEnd,
				billingModuleKeys: team.billingModuleKeys,
				aiPackBalance: team.aiPackBalance,
				aiMessagesUsedInMonth: team.aiMessagesUsedInMonth,
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
