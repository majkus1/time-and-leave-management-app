const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { PAID_PLANS, isPaidPlanKey } = require('../constants/planCatalog')
const { countTeamSeats } = require('./teamSeatCountService')
const { sendBillingSeatOverLimitEmail } = require('./emailService')

/** Min. odstęp między mailami „nad limit” przy kolejnych odnowieniach */
const SEAT_OVER_LIMIT_EMAIL_THROTTLE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Przed zakupem lub aktywacją płatnego planu: liczba kont w zespole nie może przekraczać maxUsers planu.
 * Jedna reguła dla checkout P24, zgłoszeń mailowych i aktywacji wewnętrznej / webhooka.
 *
 * @param {string} teamId
 * @param {string} planKey
 */
async function assertPaidPlanSeatLimit(teamId, planKey) {
	if (!isPaidPlanKey(planKey)) return
	const maxUsers = PAID_PLANS[planKey].maxUsers
	const used = await countTeamSeats(teamId)
	if (used > maxUsers) {
		const err = new Error(
			`W zespole jest ${used} użytkowników, a wybrany plan pozwala na ${maxUsers}. ` +
				'Zmniejsz liczbę kont do limitu (usuń lub dezaktywuj użytkowników w zespole), a następnie spróbuj ponownie.'
		)
		err.code = 'PLAN_SEAT_LIMIT_EXCEEDED'
		err.meta = { used, maxUsers, planKey }
		throw err
	}
}

/**
 * Po udanej fakturze Stripe za plan: aktualizacja flagi nadwyżki miejsc + e-mail (throttle).
 * Przy odnowieniu nie blokujemy aktywacji — tu tylko informujemy i oznaczamy zespół.
 */
async function syncSeatLimitAfterStripePaidInvoice(teamId, planKey) {
	if (!isPaidPlanKey(planKey)) return
	const team = await Team.findById(teamId)
	if (!team) return

	const maxUsers = PAID_PLANS[planKey].maxUsers
	const used = await countTeamSeats(teamId)

	if (used <= maxUsers) {
		if (team.billingSeatLimitExceededActive) {
			team.billingSeatLimitExceededActive = false
			await team.save()
		}
		return
	}

	team.billingSeatLimitExceededActive = true

	const lastEmail = team.billingSeatLimitExceededEmailAt
	const shouldEmail =
		!lastEmail || Date.now() - new Date(lastEmail).getTime() >= SEAT_OVER_LIMIT_EMAIL_THROTTLE_MS

	if (shouldEmail) {
		try {
			await sendBillingSeatOverLimitEmail(team.adminEmail, team.name, {
				used,
				maxUsers,
				planKey,
			})
			team.billingSeatLimitExceededEmailAt = new Date()
		} catch (e) {
			console.error('[syncSeatLimitAfterStripePaidInvoice] email:', e.message || e)
		}
	}

	await team.save()
}

module.exports = {
	assertPaidPlanSeatLimit,
	syncSeatLimitAfterStripePaidInvoice,
}
