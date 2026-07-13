/** Zachowaj pojedyncze entery w starych wiadomościach bez składni Markdown. */
export function normalizeTicketMarkdownForRender(content) {
	const text = String(content || '')
	if (!text) return ''
	if (/[*_`#\[\]>-]/.test(text)) return text
	return text.replace(/\n/g, '  \n')
}

export function applyTextareaEdit(textarea, nextValue, selectionStart, selectionEnd) {
	if (!textarea) return
	textarea.value = nextValue
	textarea.focus()
	textarea.setSelectionRange(selectionStart, selectionEnd)
}

export function wrapTextareaSelection(textarea, before, after, placeholder = '') {
	if (!textarea) return ''
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	const value = textarea.value
	const selected = value.slice(start, end) || placeholder
	const next = value.slice(0, start) + before + selected + after + value.slice(end)
	const cursorStart = start + before.length
	const cursorEnd = cursorStart + selected.length
	return { next, cursorStart, cursorEnd }
}

export function prefixTextareaLines(textarea, prefix) {
	if (!textarea) return { next: '', cursorStart: 0, cursorEnd: 0 }
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	const value = textarea.value
	const lineStart = value.lastIndexOf('\n', start - 1) + 1
	const lineEnd = value.indexOf('\n', end)
	const blockEnd = lineEnd === -1 ? value.length : lineEnd
	const block = value.slice(lineStart, blockEnd)
	const lines = block.split('\n')
	const prefixed = lines.map(line => (line.startsWith(prefix) ? line : `${prefix}${line}`)).join('\n')
	const next = value.slice(0, lineStart) + prefixed + value.slice(blockEnd)
	return { next, cursorStart: lineStart, cursorEnd: lineStart + prefixed.length }
}

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/** Dozwolone tylko http(s) i mailto — blokuje javascript:, data: itd. */
export function sanitizeTicketLinkUrl(rawUrl) {
	const trimmed = String(rawUrl || '').trim()
	if (!trimmed) return null
	try {
		const parsed = new URL(trimmed.includes('://') || trimmed.startsWith('mailto:') ? trimmed : `https://${trimmed}`)
		if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) return null
		return parsed.href
	} catch {
		return null
	}
}

export function escapeMarkdownLinkLabel(label) {
	return String(label || '').replace(/[[\]]/g, '\\$&')
}
