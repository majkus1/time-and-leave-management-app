require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const { isTeamInvoiceComplete } = require('../services/billingInvoiceValidation')
const {
	isFreemiumTierTeam,
	isPaidSubscriptionActive,
	isPaidPlanPeriodLapsed,
} = require('../services/entitlementsService')

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db
	const teamId = new mongoose.Types.ObjectId('69cd6fbf07e4d06e5d3c7b13')
	const team = await db.collection('teams').findOne({ _id: teamId })
	if (!team) {
		console.log(JSON.stringify({ error: 'Team not found' }, null, 2))
		await mongoose.disconnect()
		return
	}

	const activeUsers = await db.collection('users').countDocuments({
		teamId,
		isActive: { $ne: false },
	})
	const admins = await db
		.collection('users')
		.find({ teamId, roles: { $in: ['Admin'] }, isActive: { $ne: false } })
		.project({ email: 1, firstName: 1, lastName: 1, roles: 1 })
		.toArray()

	const invoice = {
		buyerType: team.billingInvoiceBuyerType || 'company',
		companyName: (team.billingInvoiceCompanyName || '').trim(),
		address: (team.billingInvoiceAddress || '').trim(),
		nip: String(team.billingInvoiceNip || '').replace(/\D/g, ''),
	}
	const now = new Date()
	const freemiumTier = isFreemiumTierTeam(team, now)
	const freemiumSeatBlocked = freemiumTier && activeUsers > 5

	console.log(
		JSON.stringify(
			{
				name: team.name,
				teamId: teamId.toString(),
				billingPlanKey: team.billingPlanKey,
				billingStatus: team.billingStatus,
				billingCycle: team.billingCycle,
				billingPeriodEnd: team.billingPeriodEnd,
				billingHadPaidPlan: team.billingHadPaidPlan,
				paidSubscriptionActive: isPaidSubscriptionActive(team, now),
				paidPlanPeriodLapsed: isPaidPlanPeriodLapsed(team, now),
				maxUsers: team.maxUsers,
				billingModuleKeys: team.billingModuleKeys,
				activeUsers,
				admins: admins.map(a => ({
					email: a.email,
					name: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
				})),
				invoice,
				invoiceComplete: isTeamInvoiceComplete(team),
				freemiumTier,
				freemiumSeatBlocked,
				freemiumMaxSeats: 5,
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
