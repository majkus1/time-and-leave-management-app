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
