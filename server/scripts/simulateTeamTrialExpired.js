/**
 * Ustawia zespół "testokresprobny" w stanie: trial zakończony 22.03.2026, bez aktywnego pakietu.
 * Uruchom z katalogu głównego repo: node server/scripts/simulateTeamTrialExpired.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)

const TEAM_NAME = 'testokresprobny'
/** Koniec okresu próbnego — data włącznie (UTC). */
const TRIAL_ENDS_AT = new Date('2026-03-22T23:59:59.999Z')

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
				billingPlanKey: 'trial',
				billingStatus: 'trial',
				trialEndsAt: TRIAL_ENDS_AT,
				billingHadPaidPlan: false,
				billingPeriodEnd: null,
				billingCycle: null,
			},
		}
	)
	console.log(
		`[simulateTeamTrialExpired] team "${TEAM_NAME}": matched=${res.matchedCount}, modified=${res.modifiedCount}, trialEndsAt=${TRIAL_ENDS_AT.toISOString()}`
	)
	if (res.matchedCount === 0) {
		console.warn(
			`Brak zespołu o nazwie "${TEAM_NAME}". Zarejestruj taki zespół lub zmień TEAM_NAME w skrypcie.`
		)
	}
}

run()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
