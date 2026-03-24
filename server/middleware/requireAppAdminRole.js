/** Application role Admin (not team admin flag). */
module.exports = function requireAppAdminRole(req, res, next) {
	if (!req.user?.roles?.includes('Admin')) {
		return res.status(403).json({ success: false, message: 'Admin role required' })
	}
	next()
}
