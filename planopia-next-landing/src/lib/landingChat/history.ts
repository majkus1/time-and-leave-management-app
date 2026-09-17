export type LandingChatRole = 'user' | 'assistant'
export type LandingChatMessage = { role: LandingChatRole; content: string }

export type TrimOptions = {
	/** Maksymalna liczba wiadomości (user + assistant) wysyłanych do modelu. */
	maxTurns?: number
	/** Maksymalna łączna liczba znaków historii. */
	maxChars?: number
}

const DEFAULTS: Required<TrimOptions> = { maxTurns: 12, maxChars: 12000 }

/**
 * Przycina historię rozmowy od początku (najstarsze wiadomości), zamiast odrzucać żądanie kodem 400
 * po ~20 wymianach. Ostatnia wiadomość użytkownika zostaje zawsze — nawet gdy sama przekracza limit znaków
 * (jej długość pilnuje osobno walidacja treści).
 */
export function trimLandingHistory(
	messages: LandingChatMessage[],
	options: TrimOptions = {},
): { messages: LandingChatMessage[]; trimmed: boolean } {
	const { maxTurns, maxChars } = { ...DEFAULTS, ...options }
	if (!Array.isArray(messages) || messages.length === 0) return { messages: [], trimmed: false }

	let kept = messages.slice(-maxTurns)
	let total = kept.reduce((n, m) => n + m.content.length, 0)
	while (kept.length > 1 && total > maxChars) {
		total -= kept[0].content.length
		kept = kept.slice(1)
	}
	return { messages: kept, trimmed: kept.length !== messages.length }
}
