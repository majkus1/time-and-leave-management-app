/**
 * Odpowiedzi HTTP bez wycieku error.message / stack do klienta przy 500.
 * Znane komunikaty biznesowe (np. QR) mapuj jawnie — nie przekazuj surowego wyjątku.
 */

function mapQrServiceError(error, fallback500) {
	const msg = typeof error?.message === 'string' ? error.message : ''
	if (msg.includes('wymagana')) {
		return { status: 400, body: { message: 'Nazwa kodu QR jest wymagana' } }
	}
	if (msg.includes('unikalnego')) {
		return {
			status: 400,
			body: { message: 'Nie udało się wygenerować unikalnego kodu QR. Spróbuj ponownie.' },
		}
	}
	if (msg.includes('nie znaleziony')) {
		return { status: 404, body: { message: 'Kod QR nie znaleziony' } }
	}
	return { status: 500, body: { message: fallback500 } }
}

module.exports = { mapQrServiceError }
