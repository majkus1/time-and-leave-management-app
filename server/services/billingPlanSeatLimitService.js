const { PAID_PLANS, isPaidPlanKey } = require('../constants/planCatalog')
const { countTeamSeats } = require('./teamSeatCountService')

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

module.exports = { assertPaidPlanSeatLimit }
