/**
 * Raport użycia AI (tylko odczyt): koszt i tokeny per zespół / miesiąc / ścieżka z kolekcji aiusagelogs.
 *
 * Uruchomienie (z katalogu głównego, czyta server/.env):
 *   node server/scripts/aiUsageReport.js                 # bieżący miesiąc
 *   node server/scripts/aiUsageReport.js 2026-09         # wskazany miesiąc
 *   node server/scripts/aiUsageReport.js 2026-09 --team=<teamId>
 *
 * Po tygodniu na gpt-5-mini odpowiada na pytanie z planu: czy czat z danymi (data_chat) zostaje
 * na gpt-5-mini, czy wraca na 4o-mini przy zachowaniu gpt-5-mini dla help i landingu.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const mongoose = require('mongoose')

const args = process.argv.slice(2)
const monthArg = args.find(a => /^\d{4}-\d{2}$/.test(a))
const teamArg = (args.find(a => a.startsWith('--team=')) || '').slice('--team='.length) || null

function monthRange(ym) {
	const [y, m] = (ym || new Date().toISOString().slice(0, 7)).split('-').map(Number)
	return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)), label: `${y}-${String(m).padStart(2, '0')}` }
}

const usd = n => `$${(n || 0).toFixed(4)}`
const num = n => String(Math.round(n || 0)).padStart(9)

async function main() {
	const uri = process.env.DB_URI
	if (!uri) throw new Error('Brak DB_URI w server/.env')
	const conn = await mongoose.createConnection(uri).asPromise()
	const col = conn.db.collection('aiusagelogs')
	const { start, end, label } = monthRange(monthArg)
	const match = { createdAt: { $gte: start, $lt: end } }
	if (teamArg) match.teamId = new mongoose.Types.ObjectId(teamArg)

	const byPathModel = await col
		.aggregate([
			{ $match: match },
			{
				$group: {
					_id: { path: '$path', model: '$model' },
					calls: { $sum: 1 },
					promptTokens: { $sum: '$promptTokens' },
					cachedTokens: { $sum: '$cachedTokens' },
					completionTokens: { $sum: '$completionTokens' },
					reasoningTokens: { $sum: '$reasoningTokens' },
					costUsd: { $sum: { $ifNull: ['$estimatedCostUsd', 0] } },
					avgMs: { $avg: '$durationMs' },
				},
			},
			{ $sort: { costUsd: -1 } },
		])
		.toArray()

	console.log(`\nUżycie AI — ${label}${teamArg ? ` — zespół ${teamArg}` : ''}\n`)
	console.log('ścieżka         model                      wywołań   prompt    cached   compl.  reason.   śr. ms   koszt')
	let total = 0
	for (const r of byPathModel) {
		total += r.costUsd
		const cachedPct = r.promptTokens ? Math.round((100 * r.cachedTokens) / r.promptTokens) : 0
		console.log(
			`${String(r._id.path).padEnd(15)} ${String(r._id.model).padEnd(26)} ${String(r.calls).padStart(7)} ${num(r.promptTokens)} ${num(r.cachedTokens)} (${String(cachedPct).padStart(3)}%) ${num(r.completionTokens)} ${num(r.reasoningTokens)} ${num(r.avgMs)}   ${usd(r.costUsd)}`,
		)
	}
	console.log(`\nRazem: ${usd(total)}\n`)

	if (!teamArg) {
		const byTeam = await col
			.aggregate([
				{ $match: match },
				{ $group: { _id: '$teamId', calls: { $sum: 1 }, costUsd: { $sum: { $ifNull: ['$estimatedCostUsd', 0] } }, help: { $sum: { $cond: [{ $eq: ['$path', 'help'] }, 1, 0] } }, data: { $sum: { $cond: [{ $eq: ['$path', 'data_chat'] }, 1, 0] } } } },
				{ $sort: { costUsd: -1 } },
				{ $limit: 15 },
			])
			.toArray()
		const teams = conn.db.collection('teams')
		console.log('Top zespoły (koszt):')
		for (const t of byTeam) {
			const team = await teams.findOne({ _id: t._id }, { projection: { name: 1, billingPlanKey: 1 } })
			console.log(
				`  ${String(t._id)}  ${String(team?.name || '?').slice(0, 30).padEnd(30)} ${String(team?.billingPlanKey || '-').padEnd(9)} wywołań ${String(t.calls).padStart(5)} (dane ${t.data}, pomoc ${t.help})  ${usd(t.costUsd)}`,
			)
		}
		console.log('')
	}
	await conn.close()
}

main().catch(err => {
	console.error(err.message)
	process.exit(1)
})
