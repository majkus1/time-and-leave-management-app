/**
 * Koniec okresu subskrypcji od momentu zaksięgowania płatności.
 * Roczny pakiet w cenniku = 10 mies. opłaty, ale dostęp 12 mies. (jak w UI).
 * @param {Date} paymentDate
 * @param {'monthly'|'annual'} billingCycle
 */
function subscriptionPeriodEnd(paymentDate, billingCycle) {
	const d = new Date(paymentDate.getTime())
	if (billingCycle === 'annual') {
		d.setFullYear(d.getFullYear() + 1)
		return d
	}
	d.setMonth(d.getMonth() + 1)
	return d
}

module.exports = { subscriptionPeriodEnd }
