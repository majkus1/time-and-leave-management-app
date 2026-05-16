/**
 * Diagnostyka płatności: sesje P24, ledger, reachability webhooków (lokalnie / ngrok).
 *
 *   node server/scripts/diagnoseBillingWebhooks.js
 *   node server/scripts/diagnoseBillingWebhooks.js eeee
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { firmDb, centralTicketConnection } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const BillingPaymentSession = require('../models/BillingPaymentSession')(firmDb)
const BillingLedgerEntry = require('../models/BillingLedgerEntry')(firmDb)
const { getP24Config } = require('../services/przelewy24/p24Config')
const { getStripeConfig } = require('../services/stripe/stripeConfig')

const teamName = process.argv[2] || null
const port = process.env.PORT || 3000

async function probeUrl(url, label) {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}',
		})
		const text = (await res.text()).slice(0, 120)
		const looksNgrokOffline = text.includes('ERR_NGROK') || text.includes('ngrok') && text.includes('<!DOCTYPE')
		console.log(`  ${label}: HTTP ${res.status}`, looksNgrokOffline ? '← ngrok OFFLINE / HTML (P24 tu nie trafi)' : `← ${text}`)
	} catch (e) {
		console.log(`  ${label}: BŁĄD`, e.message)
	}
}

async function main() {
	const p24 = getP24Config()
	const stripe = getStripeConfig()

	console.log('\n=== Konfiguracja ===')
	console.log('PORT:', port)
	console.log('P24 ready:', p24.ready, '| sandbox:', p24.sandbox)
	console.log('P24 webhook URL:', p24.webhookUrl || '(brak)')
	console.log('Stripe ready:', stripe.ready, '| app URL:', stripe.appPublicUrl)
	console.log('Stripe webhook secret ustawiony:', stripe.webhookOk)

	console.log('\n=== Reachability (pusty POST — oczekiwane 400, nie 404 HTML) ===')
	await probeUrl(`http://127.0.0.1:${port}/api/billing/webhooks/przelewy24`, 'localhost P24')
	if (p24.webhookUrl) {
		await probeUrl(p24.webhookUrl, 'P24_WEBHOOK_URL z .env')
	}
	await probeUrl(`http://127.0.0.1:${port}/api/billing/webhooks/stripe`, 'localhost Stripe')

	console.log('\n=== Mongo ===')
	const pendingCount = await BillingPaymentSession.countDocuments({ status: 'pending' })
	const paidCount = await BillingPaymentSession.countDocuments({ status: 'paid' })
	console.log(`Sesje P24: pending=${pendingCount}, paid=${paidCount}`)
	if (pendingCount > 0) {
		console.log('  → pending = płatność w P24 bez webhooka (najczęściej ngrok wyłączony / zły URL / Stripe bez stripe listen)')
	}

	if (teamName) {
		const team = await Team.findOne({ name: teamName }).lean()
		if (!team) {
			console.log(`\nZespół "${teamName}" nie znaleziony.`)
		} else {
			console.log(`\nZespół "${teamName}" (${team._id}):`)
			console.log('  billingPlanKey:', team.billingPlanKey)
			console.log('  billingStatus:', team.billingStatus)
			console.log('  trialEndsAt:', team.trialEndsAt)
			console.log('  billingPeriodEnd:', team.billingPeriodEnd)
			console.log('  stripeSubscriptionId:', team.stripeSubscriptionId || '—')

			const sessions = await BillingPaymentSession.find({ teamId: team._id })
				.sort({ updatedAt: -1 })
				.limit(5)
				.lean()
			console.log('\n  Ostatnie sesje P24:')
			for (const s of sessions) {
				console.log(
					`    ${s.sessionId} | ${s.status} | ${s.kind} ${s.planKey || s.addonId} | ${s.amountGrosze} gr | orderId=${s.p24OrderId || '—'}`
				)
			}
			const ledger = await BillingLedgerEntry.find({ teamId: team._id })
				.sort({ createdAt: -1 })
				.limit(5)
				.lean()
			console.log('\n  Ledger (aktywacje):', ledger.length ? '' : '(pusto — webhook nigdy nie aktywował)')
			for (const l of ledger) {
				console.log(`    ${l.idempotencyKey} | ${l.action}`)
			}
		}
	}

	console.log('\n=== Lokalny dev — co musi działać równolegle z node index.js ===')
	console.log('1. P24:  ngrok http', port, '  → skopiuj HTTPS URL do P24_WEBHOOK_URL w .env i zrestartuj serwer')
	console.log('2. Stripe: stripe listen --forward-to localhost:' + port + '/api/billing/webhooks/stripe')
	console.log('         → whsec z outputu stripe listen wklej do STRIPE_WEBHOOK_SECRET (nie dashboard, jeśli używasz CLI)')
	console.log('3. Po naprawie: opłacone sesje pending — ponów notyfikację w panelu P24 sandbox lub zapłać test ponownie\n')
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
