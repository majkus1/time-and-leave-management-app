/**
 * Komunikaty błędów bezpieczne dla klienta (bez nazw env, stacków, odpowiedzi dostawców).
 * Szczegóły zostaw w console.error po stronie serwera.
 */

const CLIENT_SAFE_MESSAGE_BY_CODE = {
	OPENAI_NOT_CONFIGURED: 'Asystent AI jest tymczasowo niedostępny. Spróbuj ponownie później.',
	STRIPE_NOT_CONFIGURED: 'Płatności online są tymczasowo niedostępne. Spróbuj ponownie później.',
	STRIPE_CONFIG: 'Płatności online są tymczasowo niedostępne. Spróbuj ponownie później.',
	CONFIG: 'Usługa jest tymczasowo niedostępna. Spróbuj ponownie później lub skontaktuj się z nami.',
	P24_NOT_CONFIGURED: 'Płatności online są tymczasowo niedostępne. Spróbuj ponownie później.',
	P24_API: 'Nie udało się rozpocząć płatności online. Spróbuj ponownie za chwilę.',
	P24_PARSE: 'Nie udało się rozpocząć płatności online. Spróbuj ponownie za chwilę.',
	STRIPE_PORTAL: 'Nie udało się otworzyć ustawień płatności. Spróbuj ponownie później.',
	OPENAI_HTTP_ERROR: 'Asystent AI jest chwilowo niedostępny. Spróbuj ponownie za chwilę.',
	OPENAI_STREAM_ERROR: 'Asystent AI jest chwilowo niedostępny. Spróbuj ponownie za chwilę.',
}

function getClientSafeMessage(err, fallback = 'Wystąpił błąd. Spróbuj ponownie później.') {
	if (err?.code && CLIENT_SAFE_MESSAGE_BY_CODE[err.code]) {
		return CLIENT_SAFE_MESSAGE_BY_CODE[err.code]
	}
	if (typeof err?.message === 'string' && err.message.trim()) {
		return err.message
	}
	return fallback
}

function billingClientErrorPayload(err) {
	const payload = {
		success: false,
		message: getClientSafeMessage(err, 'Nie można zrealizować żądania.'),
		code: err.code,
	}
	if (err.meta && typeof err.meta === 'object') {
		payload.meta = err.meta
	}
	return payload
}

function billingServiceUnavailablePayload(err) {
	return {
		success: false,
		message: getClientSafeMessage(err, 'Usługa jest tymczasowo niedostępna.'),
		code: err.code,
	}
}

/** Błąd bramki płatności (502) — bez surowej odpowiedzi P24/Stripe w treści. */
function billingGatewayErrorPayload(err) {
	return {
		success: false,
		message: getClientSafeMessage(err, 'Nie udało się rozpocząć płatności online. Spróbuj ponownie później.'),
		code: err.code,
	}
}

/**
 * Zwraca odpowiedź Express dla typowych błędów AI lub null, jeśli obsługa nieznana.
 */
function respondAiAssistantError(err, res) {
	if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
		return res.status(403).json({ error: err.message, code: err.code })
	}
	if (err.code === 'OPENAI_NOT_CONFIGURED') {
		return res.status(503).json({ error: getClientSafeMessage(err), code: err.code })
	}
	if (err.code === 'VALIDATION' || err.code === 'USER_INVALID') {
		return res.status(400).json({ error: err.message, code: err.code })
	}
	if (err.code === 'OPENAI_HTTP_ERROR' || err.code === 'OPENAI_STREAM_ERROR') {
		const body = { error: getClientSafeMessage(err), code: err.code }
		if (err.status != null) body.status = err.status
		return res.status(502).json(body)
	}
	return null
}

function aiAssistantSseErrorPayload(err) {
	return {
		type: 'error',
		code: err.code || 'UNKNOWN',
		message: getClientSafeMessage(err, 'Asystent AI jest chwilowo niedostępny.'),
	}
}

module.exports = {
	getClientSafeMessage,
	billingClientErrorPayload,
	billingServiceUnavailablePayload,
	billingGatewayErrorPayload,
	respondAiAssistantError,
	aiAssistantSseErrorPayload,
}
