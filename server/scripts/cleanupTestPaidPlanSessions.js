/**
 * Zostawia tylko opłacone sesje P24 planów dla wskazanych zespołów (reszta = test).
 * Użycie: node server/scripts/cleanupTestPaidPlanSessions.js
 *         node server/scripts/cleanupTestPaidPlanSessions.js --dry-run
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingPaymentSession = require('../models/BillingPaymentSession')(firmDb)

const KEEP_TEAM_NAMES = ['BZ Ubezpieczenia', 'Euro-Agro Consulting']
const dryRun = process.argv.includes('--dry-run')

async function run() {
	if (firmDb.readyState !== 1) {
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve)
			firmDb.once('error', reject)
		})
	}

	const keepTeams = await Team.find({ name: { $in: KEEP_TEAM_NAMES } }).select('_id name').lean()
	const keepTeamIds = new Set(keepTeams.map(t => String(t._id)))

	console.log('Zostawiamy zespoły:', keepTeams.map(t => `${t.name} (${t._id})`).join(', ') || '(brak!)')

	const paid = await BillingPaymentSession.find({ status: 'paid', kind: 'plan' }).lean()
	const allTeams = await Team.find({ _id: { $in: paid.map(s => s.teamId) } })
		.select('name')
		.lean()
	const nameById = new Map(allTeams.map(t => [String(t._id), t.name]))

	const toKeep = []
	const toDelete = []

	for (const s of paid) {
		const tid = String(s.teamId)
		const teamName = nameById.get(tid) || '—'
		if (keepTeamIds.has(tid)) {
			toKeep.push({ ...s, teamName })
		} else {
			toDelete.push({ _id: s._id, sessionId: s.sessionId, teamName, payer: s.customerEmail, planKey: s.planKey, paidAt: s.updatedAt })
		}
	}

	console.log('\nZOSTAJE (' + toKeep.length + ' sesji paid):')
	for (const s of toKeep) {
		console.log(' ', s.teamName, s.customerEmail, s.planKey, s.billingCycle, s.updatedAt?.toISOString?.())
	}

	console.log('\nDO USUNIĘCIA (' + toDelete.length + '):')
	for (const s of toDelete) {
		console.log(' ', s.teamName, s.payer, s.planKey, s.paidAt?.toISOString?.())
	}

	if (dryRun) {
		console.log('\n[dry-run] Nic nie usunięto.')
		return
	}

	if (toDelete.length === 0) {
		console.log('\nBrak sesji do usunięcia.')
		return
	}

	const ids = toDelete.map(s => s._id)
	const result = await BillingPaymentSession.deleteMany({ _id: { $in: ids } })
	console.log('\nUsunięto sesji paid:', result.deletedCount)
	console.log('Pozostało paid plan:', await BillingPaymentSession.countDocuments({ status: 'paid', kind: 'plan' }))
}

async function closeDb() {
	await firmDb.close()
	if (centralTicketConnection?.readyState === 1) await centralTicketConnection.close()
}

run()
	.then(closeDb)
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		closeDb().finally(() => process.exit(1))
	})
