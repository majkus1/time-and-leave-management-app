/**
 * Lista zespołów z sesjami P24 w statusie pending.
 *   node server/scripts/listPendingP24Teams.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingPaymentSession = require('../models/BillingPaymentSession')(firmDb)

async function main() {
	const pending = await BillingPaymentSession.find({ status: 'pending' })
		.sort({ updatedAt: -1 })
		.lean()

	const teamIds = [...new Set(pending.map(s => String(s.teamId)))]
	const teams = await Team.find({ _id: { $in: teamIds } }).select('name adminEmail').lean()
	const teamById = new Map(teams.map(t => [String(t._id), t]))

	const byTeam = new Map()
	for (const s of pending) {
		const tid = String(s.teamId)
		if (!byTeam.has(tid)) byTeam.set(tid, { team: teamById.get(tid), sessions: [] })
		byTeam.get(tid).sessions.push(s)
	}

	console.log(`Razem sesji pending: ${pending.length}`)
	console.log(`Zespołów z pending: ${byTeam.size}\n`)

	const rows = [...byTeam.entries()].sort((a, b) => {
		const ta = a[1].sessions[0]?.updatedAt || 0
		const tb = b[1].sessions[0]?.updatedAt || 0
		return new Date(tb) - new Date(ta)
	})

	for (const [tid, { team, sessions }] of rows) {
		console.log('---')
		console.log(`Zespół: ${team?.name ?? '(brak w teams)'}  |  teamId: ${tid}`)
		console.log(`Admin: ${team?.adminEmail ?? '—'}`)
		console.log(`Pending: ${sessions.length}`)
		for (const s of sessions.slice(0, 3)) {
			const when = s.updatedAt ? new Date(s.updatedAt).toISOString() : '—'
			const product =
				s.kind === 'plan'
					? `${s.planKey} (${s.billingCycle})`
					: `addon ${s.addonId}`
			console.log(`  ${when}  |  ${s.sessionId}  |  ${product}  |  ${s.amountGrosze} gr`)
		}
		if (sessions.length > 3) console.log(`  … +${sessions.length - 3} starszych`)
	}
}

async function closeDb() {
	await firmDb.close()
	if (centralTicketConnection?.readyState === 1) await centralTicketConnection.close()
}

main()
	.then(closeDb)
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		closeDb().finally(() => process.exit(1))
	})
