/**
 * Ustawia zespół "testokresprobny" na aktywny plan Business (jak po aktywacji billing).
 * Uruchom: npm run simulate:business-plan
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { PAID_PLANS } = require('../constants/planCatalog')

const TEAM_NAME = 'testokresprobny'
const PLAN_KEY = 'business'

/** Koniec bieżącego okresu rozliczeniowego — +1 miesiąc kalendarzowy, koniec dnia UTC (symulacja „miesięcznie”). */
function billingPeriodEndMonthlyFrom(now = new Date()) {
	const end = new Date(now.getTime())
	end.setUTCMonth(end.getUTCMonth() + 1)
	end.setUTCHours(23, 59, 59, 999)
	return end
}

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
	const limits = PAID_PLANS[PLAN_KEY]
	const periodEnd = billingPeriodEndMonthlyFrom()
	const res = await Team.updateOne(
		{ name: TEAM_NAME },
		{
			$set: {
				billingPlanKey: PLAN_KEY,
				billingStatus: 'active',
				billingCycle: 'monthly',
				billingHadPaidPlan: true,
				billingPeriodEnd: periodEnd,
				maxUsers: limits.maxUsers,
				subscriptionType: 'premium',
				trialEndsAt: null,
			},
		}
	)
	console.log(
		`[simulateTeamBusinessPlan] team "${TEAM_NAME}": matched=${res.matchedCount}, modified=${res.modifiedCount}, plan=${PLAN_KEY}, maxUsers=${limits.maxUsers}, billingPeriodEnd=${periodEnd.toISOString()} (monthly +1)`
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
