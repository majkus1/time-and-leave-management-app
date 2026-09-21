const onboardingService = require('../services/onboardingService')

exports.getStatus = async (req, res) => {
	try {
		const status = await onboardingService.getOnboardingStatus({
			teamId: req.user.teamId,
			roles: req.user.roles,
		})
		return res.json(status)
	} catch (error) {
		console.error('[onboarding] getStatus:', error)
		return res.status(500).json({ success: false, message: 'Server error' })
	}
}

function sendDemoError(res, error, label) {
	if (error.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' })
	if (error.code === 'DEMO_EXISTS' || error.code === 'DEMO_NO_SEATS' || error.code === 'DEMO_NOT_TRIAL') {
		return res.status(409).json({ success: false, message: error.message, code: error.code })
	}
	console.error(`[onboarding] ${label}:`, error)
	return res.status(500).json({ success: false, message: 'Server error' })
}

/** Dane demonstracyjne — POST tworzy (Admin / HR), DELETE usuwa to, co powstało. */
exports.createDemoData = async (req, res) => {
	try {
		const result = await onboardingService.createDemoData({
			teamId: req.user.teamId,
			userId: req.user.userId,
			roles: req.user.roles,
		})
		return res.json(result)
	} catch (error) {
		return sendDemoError(res, error, 'createDemoData')
	}
}

exports.removeDemoData = async (req, res) => {
	try {
		const result = await onboardingService.removeDemoData({
			teamId: req.user.teamId,
			roles: req.user.roles,
		})
		return res.json(result)
	} catch (error) {
		return sendDemoError(res, error, 'removeDemoData')
	}
}

exports.dismiss = async (req, res) => {
	try {
		const result = await onboardingService.dismissOnboarding({
			teamId: req.user.teamId,
			roles: req.user.roles,
		})
		return res.json(result)
	} catch (error) {
		if (error.code === 'FORBIDDEN') {
			return res.status(403).json({ success: false, message: 'Forbidden' })
		}
		console.error('[onboarding] dismiss:', error)
		return res.status(500).json({ success: false, message: 'Server error' })
	}
}
