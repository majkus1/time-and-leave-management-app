/** Pakiety i rozliczenia — zakupy / zgłoszenia tylko dla Administrator lub HR. */
module.exports = function requireBillingStaffRole(req, res, next) {
	const roles = req.user?.roles || []
	if (!roles.includes('Admin') && !roles.includes('HR')) {
		return res.status(403).json({
			success: false,
			message: 'Wymagana rola Administrator lub HR.',
			code: 'BILLING_ROLE_REQUIRED',
		})
	}
	next()
}
