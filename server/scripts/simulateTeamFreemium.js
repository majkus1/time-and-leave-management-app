/**
 * Ustawia zespół w tierze freemium (wygasły trial, bez aktywnego planu).
 *
 * Użycie (z repo root):
 *   node server/scripts/simulateTeamFreemium.js eeee
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { TRIAL } = require('../constants/planCatalog')

const teamName = process.argv[2] || 'eeee'
const trialEndsAt = new Date()
trialEndsAt.setDate(trialEndsAt.getDate() - 1)

async function run() {
	if (firmDb.readyState !== 1) {
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve)
			firmDb.once('error', reject)
		})
	}

	const res = await Team.updateOne(
		{ name: teamName, isActive: { $ne: false } },
		{
			$set: {
				billingPlanKey: 'trial',
				billingStatus: 'trial',
				trialEndsAt,
				billingHadPaidPlan: false,
				billingPeriodEnd: null,
				billingCycle: null,
				maxUsers: TRIAL.maxUsers,
				subscriptionType: null,
			},
			$unset: {
				stripeCustomerId: '',
				stripeSubscriptionId: '',
				stripeSubscriptionStatus: '',
				stripeCancelAtPeriodEnd: '',
				stripePendingPlanKey: '',
				stripePendingBillingCycle: '',
				stripePendingModuleKeys: '',
				billingModuleKeys: '',
				billingSeatLimitExceededActive: '',
				billingSeatLimitExceededEmailAt: '',
			},
		}
	)

	console.log('[simulateTeamFreemium]', {
		teamName,
		matched: res.matchedCount,
		modified: res.modifiedCount,
		trialEndsAt: trialEndsAt.toISOString(),
		maxUsers: TRIAL.maxUsers,
	})

	if (res.matchedCount === 0) {
		console.warn(`Brak aktywnego zespołu o nazwie "${teamName}".`)
		process.exitCode = 1
	}
}

async function closeDb() {
	await firmDb.close()
	if (centralTicketConnection?.readyState === 1) {
		await centralTicketConnection.close()
	}
}

run()
	.then(closeDb)
	.then(() => process.exit(process.exitCode || 0))
	.catch(err => {
		console.error(err)
		closeDb().finally(() => process.exit(1))
	})
