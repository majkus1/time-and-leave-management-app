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

/**
 * Sufit per zespół: limit per użytkownik × 5 kont planu darmowego = 300/dobę bez opłaty,
 * a zespołów można założyć wiele — ten licznik trzyma koszt trybu pomocy w ryzach niezależnie od liczby kont.
 */
exports.aiHelpTeamDailyLimiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: envInt('AI_HELP_PER_DAY_TEAM', 150),
	message: 'Daily help limit for this team reached. Please try again tomorrow.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => `team:${req.user?.teamId?.toString?.() || req.ip}`,
	skipSuccessfulRequests: false,
	skipFailedRequests: true,
})

/** Rezerwacja / odwołanie rozmowy z założycielem — kilka prób na użytkownika, nie ma powodu na więcej. */
exports.founderCallBookLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: envInt('FOUNDER_CALL_PER_HOUR', 10),
	message: 'Too many booking requests. Please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.userId?.toString?.() || req.ip,
})

/** Publiczna lista terminów dla landingu — per IP; odpowiedź i tak jest cache'owana 60 s. */
exports.founderCallPublicLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: envInt('FOUNDER_CALL_PUBLIC_PER_15MIN', 60),
	standardHeaders: true,
	legacyHeaders: false,
})

/** Rejestracja skanu QR — limit per użytkownik; zwykły ruch to kilka skanów dziennie, próby „zgadywania” pozycji odpadają. */
exports.timeEntryRegisterLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: envInt('QR_REGISTER_PER_MIN', 20),
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user?.userId?.toString?.() || req.ip,
	message: { message: 'Zbyt wiele prób skanowania. Spróbuj ponownie za minutę.' },
})

/** Publiczny wyświetlacz rotującego kodu QR — tablet odpytuje raz przy starcie i co kilka minut. */
exports.qrDisplayPublicLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: envInt('QR_DISPLAY_PER_15MIN', 120),
	standardHeaders: true,
	legacyHeaders: false,
	// Per link wyświetlacza (i IP): tablety różnych firm nie dzielą jednej puli, nawet gdy za proxy widać wspólny adres
	keyGenerator: req => `qr-display:${String(req.params?.displayToken || '').slice(0, 64)}:${req.ip}`,
})

/**
 * Nieaktualne albo wymyślone linki wyświetlacza — per IP, liczy tylko nieudane odczyty (404), więc działające tablety
 * puli nie zużywają. Bez tego każdy losowy token miałby własną pulę w limiterze wyżej i zalewanie nie miałoby hamulca.
 */
exports.qrDisplayInvalidTokenLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: envInt('QR_DISPLAY_INVALID_PER_15MIN', 30),
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true,
	keyGenerator: req => `qr-display-invalid:${req.ip}`,
})
