/**
 * Ustawia zespół "testokresprobny" tak jak synchronizacja startowa dla Halo Rental System:
 * maxUsers 11, Starter, active, billingPeriodEnd null, subscription premium.
 * Wymaga wpisu w specialTeams (testokresprobny na listach specjalnych).
 *
 * Uruchom: npm run simulate:halo-like
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)

const TEAM_NAME = 'testokresprobny'

async function run() {
	if (firmDb.readyState === 1) {
		await doUpdate()
		await firmDb.close()
		return
	}
	await new Promise((resolve, reject) => {
		firmDb.once('connected', resolve)
		firmDb.once('error', reject)
	})
	await doUpdate()
	await firmDb.close()
}

async function doUpdate() {
	const res = await Team.updateOne(
		{ name: TEAM_NAME },
		{
			$set: {
				maxUsers: 11,
				billingPlanKey: 'starter',
				billingStatus: 'active',
				billingHadPaidPlan: true,
				billingCycle: 'monthly',
				billingPeriodEnd: null,
				subscriptionType: 'premium',
				trialEndsAt: null,
			},
		}
	)
	console.log(
		`[simulateTeamHaloLike] team "${TEAM_NAME}": matched=${res.matchedCount}, modified=${res.modifiedCount} (jak Halo: 11 miejsc, Starter, brak daty końca okresu w UI)`
	)
	if (res.matchedCount === 0) {
		console.warn(`Brak zespołu "${TEAM_NAME}".`)
	}
}

run()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
