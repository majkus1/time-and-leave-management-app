/**
 * Dev / staging: ustawia wybrany płatny plan dla zespołu po nazwie (jak po aktywacji billing).
 *
 * Użycie (z katalogu server/ lub repo root):
 *   node scripts/simulateTeamStarterPlan.js
 *   node scripts/simulateTeamStarterPlan.js testnewversion starter
 *   node scripts/simulateTeamStarterPlan.js testnewversion pro monthly
 *
 * drugi arg: planKey (starter|pro|business|enterprise), domyślnie starter
 * trzeci arg: billingCycle monthly|annual, domyślnie monthly
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
	require('dotenv').config({ path: envPath })
} else {
	console.error(`Nie znaleziono ${envPath}`)
	process.exit(1)
}

const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { activatePaidPlan } = require('../services/billingActivationService')
const { isPaidPlanKey } = require('../constants/planCatalog')

async function main() {
	const teamName = process.argv[2] || 'testnewversion'
	const planKey = process.argv[3] || 'starter'
	const billingCycle = process.argv[4] === 'annual' ? 'annual' : 'monthly'

	if (!isPaidPlanKey(planKey)) {
		console.error(`Nieznany plan: ${planKey}. Dozwolone: starter, pro, business, enterprise`)
		process.exit(1)
	}

	const team = await Team.findOne({ name: teamName, isActive: { $ne: false } })
	if (!team) {
		console.error(`Brak aktywnego zespołu o nazwie: "${teamName}"`)
		process.exit(1)
	}

	const periodEnd = new Date()
	if (billingCycle === 'annual') {
		periodEnd.setFullYear(periodEnd.getFullYear() + 1)
	} else {
		periodEnd.setMonth(periodEnd.getMonth() + 1)
	}

	const idempotencyKey = `dev-simulate:${team._id}:${planKey}:${Date.now()}`

	const result = await activatePaidPlan({
		teamId: team._id.toString(),
		planKey,
		billingCycle,
		periodEnd: periodEnd.toISOString(),
		idempotencyKey,
		actorLabel: 'dev-simulateTeamStarterPlan',
	})

	console.log('OK:', {
		teamName: team.name,
		teamId: team._id.toString(),
		planKey,
		billingCycle,
		billingPeriodEnd: periodEnd.toISOString(),
		duplicate: result.duplicate,
	})
}

async function closeDbConnections() {
	await firmDb.close()
	if (centralTicketConnection && centralTicketConnection.readyState === 1) {
		await centralTicketConnection.close()
	}
}

if (require.main === module) {
	main()
		.then(() => closeDbConnections())
		.catch((err) => {
			console.error(err)
			closeDbConnections().finally(() => process.exit(1))
		})
}

module.exports = { main }
