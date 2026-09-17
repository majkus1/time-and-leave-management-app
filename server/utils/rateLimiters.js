const rateLimit = require('express-rate-limit')

exports.loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		return req.ip + ':' + (req.body.username || 'unknown')
	},
	skipSuccessfulRequests: true,
	skipFailedRequests: false,
})

exports.resetPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: {
		message: 'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za 15 minut.',
	},
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		return req.ip + ':' + (req.body.username || 'unknown')
	},
	skipSuccessfulRequests: true,
	skipFailedRequests: false,
})

exports.teamRegistrationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 3,
	message: 'Zbyt wiele prób tworzenia zespołów. Spróbuj ponownie za godzinę.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		return req.ip + ':' + (req.body.adminEmail || 'unknown')
	},
	skipSuccessfulRequests: true,
	skipFailedRequests: false,
})

/** OpenAI-backed assistant — per user to control cost */
exports.aiAssistantChatLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 8,
	message: 'Too many AI requests. Please wait a moment.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		return req.user?.userId?.toString?.() || req.ip
	},
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

/** Billing: purchase inquiry emails per team */
exports.billingPurchaseRequestLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 10,
	message: { success: false, message: 'Too many purchase requests. Try again later.' },
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.teamId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

/** Przelewy24: rozpoczęcie płatności (register) per team */
exports.billingP24CheckoutLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 20,
	message: { success: false, message: 'Too many checkout attempts. Try again later.' },
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.teamId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

/** Stripe: rozpoczęcie checkoutu per team */
exports.billingStripeCheckoutLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 20,
	message: { success: false, message: 'Too many checkout attempts. Try again later.' },
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.teamId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

/** AI intent export downloads (Excel/PDF from DB) */
exports.aiAssistantExportLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 15,
	message: 'Too many export requests. Please wait a moment.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.userId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

function envInt(name, fallback) {
	const n = parseInt(String(process.env[name] || ''), 10)
	return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Tryb „Jak działa Planopia” — bez limitu wiadomości AI, więc koszt trzyma rate limit per użytkownik. */
exports.aiHelpChatLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: envInt('AI_HELP_PER_MINUTE', 6),
	message: 'Too many help requests. Please wait a moment.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.userId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
})

exports.aiHelpDailyLimiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: envInt('AI_HELP_PER_DAY', 60),
	message: 'Daily help limit reached. Please try again tomorrow.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.userId?.toString?.() || req.ip,
	skipSuccessfulRequests: false,
	skipFailedRequests: true,
})
