/**
 * Ustawia zespół "testokresprobny" jak stare konta sprzed billing: brak pól planu/trialu w Mongo —
 * pełna aplikacja bez muru do LEGACY_PRE_BILLING_GRACE_UNTIL (planCatalog),
 * pula AI: LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL jednorazowo na ten okres (planCatalog).
 *
 * Uruchom z katalogu głównego: node server/scripts/simulateTeamLegacyGrace.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { LEGACY_PRE_BILLING_GRACE_UNTIL } = require('../constants/planCatalog')

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
			$unset: {
				billingPlanKey: '',
				billingStatus: '',
				trialEndsAt: '',
				billingCycle: '',
				billingPeriodEnd: '',
				billingHadPaidPlan: '',
			},
			$set: {
				subscriptionType: 'free',
			},
		}
	)
	console.log(
		`[simulateTeamLegacyGrace] team "${TEAM_NAME}": matched=${res.matchedCount}, modified=${res.modifiedCount}`
	)
	console.log(
		`  Pełny dostęp bez subskrypcji do (wyłącznie): ${LEGACY_PRE_BILLING_GRACE_UNTIL.toISOString()} (Europe/Warsaw → koniec 1.08.2026 włącznie)`
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
