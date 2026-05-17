const { getActivityOverview } = require('../services/appSessionService')

exports.getOverview = async (req, res) => {
	try {
		const onlineMinutes = req.query.onlineMinutes
		const historyDays = req.query.historyDays
		const data = await getActivityOverview({ onlineMinutes, historyDays })
		res.json({ success: true, ...data })
	} catch (e) {
		console.error('superAdminActivityController.getOverview:', e)
		res.status(500).json({ success: false, message: 'Server error' })
	}
}
