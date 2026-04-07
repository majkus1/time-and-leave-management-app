/**
 * Przygotowanie treści asystenta pod ReactMarkdown + rehype-raw:
 * - modele bywają z ** w Unicode / ze znakami ucieczki — wtedy w UI widać gołe gwiazdki;
 * - **krótki fragment** w jednej linii zamieniamy na bezpieczny HTML <strong>, reszta zostaje MD (GFM).
 */
export function preprocessAssistantMarkdownForChat(text) {
	if (text == null || typeof text !== 'string') return ''
	let s = text
	s = s.replace(/\uFF0A/g, '*')
	s = s.replace(/\u2217/g, '*')
	s = s.replace(/\uFE61/g, '*')
	s = s.replace(/\u2731/g, '*')
	s = s.replace(/\\([*_])/g, '$1')
	s = s.replace(/\*\*([^*\n]{1,200})\*\*/g, (_, inner) => {
		const cleaned = inner.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
		const safe = cleaned
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
		return `<strong>${safe}</strong>`
	})
	return s
}
