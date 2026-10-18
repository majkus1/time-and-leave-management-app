/**
 * Wersja tekstowa maila z jego HTML-a. Maile z samym HTML-em filtry antyspamowe oceniają gorzej, a część czytników
 * (zegarki, podglądy powiadomień) pokazuje tylko tekst. Bez zależności — szablony są proste (tabele, akapity, linki).
 */

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#039;': "'", '&apos;': "'" }

function decodeEntities(text) {
	return text
		.replace(/&(nbsp|amp|lt|gt|quot|apos|#0?39);/g, m => ENTITIES[m] ?? m)
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function htmlToText(html) {
	if (!html) return ''
	let s = String(html)
	s = s.replace(/<(head|style|script|title)[^>]*>[\s\S]*?<\/\1>/gi, '')
	// Link: tekst i adres, bo w wersji tekstowej nie da się kliknąć przycisku
	s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
		const text = label.replace(/<[^>]+>/g, '').trim()
		if (!text || text === href) return href
		return /^mailto:/i.test(href) ? text : `${text}: ${href}`
	})
	s = s.replace(/<br\s*\/?>/gi, '\n')
	s = s.replace(/<(ul|ol)[^>]*>/gi, '\n').replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '')
	s = s.replace(/<\/(p|div|h[1-6]|tr|ul|ol|table|blockquote|pre)>/gi, '\n\n')
	s = s.replace(/<[^>]+>/g, '')
	s = decodeEntities(s)
	return s
		.split('\n')
		.map(line => line.replace(/[ \t]+/g, ' ').trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

module.exports = { htmlToText }
