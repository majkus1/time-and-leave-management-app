/**
 * Adds a missing Stripe invoice ledger after Team access was restored manually.
 * Dry-run is the default. The script never updates Team.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const mongoose = require('mongoose')
const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingLedgerEntry = require('../models/BillingLedgerEntry')(firmDb)
const { isPaidPlanKey } = require('../constants/planCatalog')

function readArgument(name) {
	const index = process.argv.indexOf(name)
	if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1]
	const assigned = process.argv.find(value => value.startsWith(`${name}=`))
	return assigned ? assigned.slice(name.length + 1) : null
}

function assertEqual(actual, expected, label) {
	if (String(actual ?? '') !== String(expected ?? '')) {
		throw new Error(`${label} mismatch: expected=${expected}, actual=${actual}`)
	}
}

function assertLedger(entry, expected) {
	assertEqual(entry.teamId, expected.teamId, 'ledger teamId')
	assertEqual(entry.action, 'subscription_activated', 'ledger action')
	assertEqual(entry.payload?.planKey, expected.planKey, 'ledger planKey')
	assertEqual(entry.payload?.billingCycle, expected.billingCycle, 'ledger billingCycle')
	assertEqual(entry.payload?.periodEnd, expected.periodEnd, 'ledger periodEnd')
}

async function closeConnections() {
	await firmDb.close()
	if (centralTicketConnection?.readyState === 1) await centralTicketConnection.close()
}

async function main() {
	const expected = {
		teamId: readArgument('--team-id'),
		invoiceId: readArgument('--invoice-id'),
		customerId: readArgument('--customer-id'),
		subscriptionId: readArgument('--subscription-id'),
		planKey: readArgument('--plan-key'),
		billingCycle: readArgument('--billing-cycle'),
		periodEnd: readArgument('--period-end'),
	}
	const apply = process.argv.includes('--apply')
	for (const [key, value] of Object.entries(expected)) {
		if (!value) throw new Error(`Missing required value: ${key}`)
	}
	if (!mongoose.Types.ObjectId.isValid(expected.teamId)) throw new Error('Invalid teamId')
	if (!isPaidPlanKey(expected.planKey)) throw new Error('Invalid planKey')
	if (!['monthly', 'annual'].includes(expected.billingCycle)) throw new Error('Invalid billingCycle')
	const targetPeriod = new Date(expected.periodEnd)
	if (Number.isNaN(targetPeriod.getTime()) || targetPeriod.toISOString() !== expected.periodEnd) {
		throw new Error('periodEnd must be an exact ISO timestamp')
	}

	const team = await Team.findById(expected.teamId).lean()
	if (!team || team.isActive === false) throw new Error('Active team not found')
	assertEqual(team.stripeCustomerId, expected.customerId, 'team stripeCustomerId')
	assertEqual(team.stripeSubscriptionId, expected.subscriptionId, 'team stripeSubscriptionId')
	assertEqual(team.billingPlanKey, expected.planKey, 'team billingPlanKey')
	assertEqual(team.billingCycle, expected.billingCycle, 'team billingCycle')
	assertEqual(team.billingStatus, 'active', 'team billingStatus')
	assertEqual(team.stripeSubscriptionStatus, 'active', 'team stripeSubscriptionStatus')
	assertEqual(team.billingPeriodEnd?.toISOString(), expected.periodEnd, 'team billingPeriodEnd')

	const idempotencyKey = `stripe:invoice:${expected.invoiceId}`
	const existing = await BillingLedgerEntry.findOne({ idempotencyKey }).lean()
	if (existing) assertLedger(existing, expected)

	console.log(
		JSON.stringify(
			{
				mode: apply ? 'apply' : 'dry-run',
				teamId: expected.teamId,
				teamName: team.name,
				billingPeriodEnd: team.billingPeriodEnd.toISOString(),
				idempotencyKey,
				ledgerExists: Boolean(existing),
				action: existing ? 'no-op duplicate' : 'create ledger only',
			},
			null,
			2
		)
	)
	if (!apply || existing) return

	try {
		await BillingLedgerEntry.create({
			idempotencyKey,
			teamId: team._id,
			action: 'subscription_activated',
			payload: {
				planKey: expected.planKey,
				billingCycle: expected.billingCycle,
				moduleKeys: team.billingModuleKeys || [],
				periodEnd: expected.periodEnd,
				actorLabel: 'stripe-recovery',
			},
		})
	} catch (error) {
		if (error?.code !== 11000) throw error
	}

	const ledger = await BillingLedgerEntry.findOne({ idempotencyKey }).lean()
	if (!ledger) throw new Error('Ledger was not created')
	assertLedger(ledger, expected)
	const unchangedTeam = await Team.findById(expected.teamId).lean()
	assertEqual(unchangedTeam.billingPeriodEnd?.toISOString(), expected.periodEnd, 'result billingPeriodEnd')

	console.log(JSON.stringify({ ok: true, idempotencyKey, teamUnchanged: true }, null, 2))
}

main()
	.then(closeConnections)
	.catch(error => {
		console.error(error.message)
		closeConnections().finally(() => process.exit(1))
	})
