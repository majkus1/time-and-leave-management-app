export type LandingChatCta = 'register' | 'contact'

/** Znaczniki, które model dopisuje na końcu odpowiedzi (reguła w prompcie); UI zamienia je na przycisk. */
const CTA_RE = /\[\[\s*CTA\s*:\s*(register|contact)\s*\]\]/gi

/**
 * Usuwa znaczniki CTA z tekstu odpowiedzi i zwraca rodzaj przycisku (ostatni wygrywa).
 * Działa też na częściowym tekście w trakcie streamingu — znacznik może dojść w kilku fragmentach,
 * więc wywołuj na całości zebranego tekstu.
 */
export function extractCtaMarkers(text: string): { text: string; cta: LandingChatCta | null } {
	let cta: LandingChatCta | null = null
	const cleaned = String(text || '')
		.replace(CTA_RE, (_, kind: string) => {
			cta = kind.toLowerCase() as LandingChatCta
			return ''
		})
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trimEnd()
	return { text: cleaned, cta }
}

/**
 * W streamingu chowamy niedokończony znacznik (np. "[[CTA:reg"), żeby nie mignął użytkownikowi.
 * Zwraca tekst bezpieczny do wyświetlenia.
 */
export function hidePartialCtaMarker(text: string): string {
	const idx = text.lastIndexOf('[[')
	if (idx === -1) return text
	const tail = text.slice(idx)
	if (tail.includes(']]')) return text
	return text.slice(0, idx).trimEnd()
}
