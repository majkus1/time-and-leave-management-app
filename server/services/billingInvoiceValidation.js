const MIN_INVOICE_ADDRESS_LEN = 6

/**
 * @param {import('mongoose').Document | Record<string, unknown>} team
 */
function isTeamInvoiceComplete(team) {
	const type = team.billingInvoiceBuyerType === 'individual' ? 'individual' : 'company'
	const name = (team.billingInvoiceCompanyName || '').trim()
	const addr = (team.billingInvoiceAddress || '').trim()
	const nipDigits = String(team.billingInvoiceNip || '').replace(/\D/g, '')
	const addrOk = addr.length >= MIN_INVOICE_ADDRESS_LEN

	if (type === 'individual') {
		return name.length >= 3 && addrOk
	}
	return name.length >= 2 && addrOk && nipDigits.length === 10
}

/**
 * @param {import('mongoose').Document | Record<string, unknown>} team
 */
function assertTeamInvoiceComplete(team) {
	if (isTeamInvoiceComplete(team)) return

	const err = new Error('Invoice details incomplete')
	err.code = 'INVOICE_INCOMPLETE'
	err.meta = { i18nKey: 'invoiceRequiredBeforePay' }
	throw err
}

module.exports = {
	MIN_INVOICE_ADDRESS_LEN,
	isTeamInvoiceComplete,
	assertTeamInvoiceComplete,
}
