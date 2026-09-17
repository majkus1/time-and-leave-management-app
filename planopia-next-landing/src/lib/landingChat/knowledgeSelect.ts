import type { ProductKnowledgeModule } from '@/data/productKnowledge.generated'

/**
 * Bliźniak server/utils/productKnowledgeRender.js (selectKnowledgeModules) — świadomie powielony,
 * bo landing buduje się bez dostępu do server/. Wspólne przypadki testowe: scripts/knowledge-select-cases.json.
 * Zmiana tutaj = ta sama zmiana po stronie serwera.
 */
export function foldDiacritics(s: string): string {
	return String(s || '')
		.toLowerCase()
		.replace(/ą/g, 'a')
		.replace(/ć/g, 'c')
		.replace(/ę/g, 'e')
		.replace(/ł/g, 'l')
		.replace(/ń/g, 'n')
		.replace(/ó/g, 'o')
		.replace(/ś/g, 's')
		.replace(/ż/g, 'z')
		.replace(/ź/g, 'z')
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/ {2,}/g, ' ')
}

function normalizeTextForMatch(text: string): string {
	return ` ${foldDiacritics(text).trim()} `
}

function scoreModule(mod: ProductKnowledgeModule, normalizedText: string): number {
	const keywords = [...mod.keywords.pl, ...mod.keywords.en]
	let score = 0
	for (const kw of keywords) {
		const k = foldDiacritics(kw)
		if (k.trim() && normalizedText.includes(k)) score += 1
	}
	return score
}

export type SelectKnowledgeOptions = {
	modules: ProductKnowledgeModule[]
	moduleId?: string | null
	lastUserText?: string
	max?: number
	fallback?: string[]
}

export function selectKnowledgeModules({
	modules,
	moduleId = null,
	lastUserText = '',
	max = 3,
	fallback = [],
}: SelectKnowledgeOptions): ProductKnowledgeModule[] {
	const byId = new Map(modules.map(m => [m.id as string, m]))
	const picked: ProductKnowledgeModule[] = []
	const explicit = moduleId ? byId.get(moduleId) : undefined
	if (explicit) picked.push(explicit)

	const normalized = normalizeTextForMatch(lastUserText)
	if (normalized.trim()) {
		const scored = modules
			.filter(m => !explicit || m.id !== explicit.id)
			.map(m => ({ m, score: scoreModule(m, normalized) }))
			.filter(x => x.score > 0)
			.sort((a, b) => b.score - a.score || a.m.order - b.m.order)
		for (const { m } of scored) {
			if (picked.length >= max) break
			picked.push(m)
		}
	}
	if (picked.length === 0) {
		for (const id of fallback) {
			const m = byId.get(id)
			if (m && picked.length < max) picked.push(m)
		}
	}
	return picked
}

/** Słowa, po których dokładamy pełne regulaminy (kilkanaście tysięcy tokenów) — inaczej ich nie wysyłamy. */
const LEGAL_KEYWORDS = [
	'regulamin', 'prywatn', 'rodo', 'gdpr', 'dpa', 'powierzen', 'reklamac', 'umow', 'wlasciciel', 'kto stoi', 'firma',
	'terms', 'privacy', 'complaint', 'contract', 'owner', 'legal', 'prawn', 'dane osobowe', 'personal data',
	'przetwarza', 'processing', 'nip', 'regon', 'siedzib', 'address', 'odstap', 'wypowiedz', 'cancel the contract',
]

export function isLegalQuestion(text: string): boolean {
	const t = normalizeTextForMatch(text)
	return LEGAL_KEYWORDS.some(k => t.includes(foldDiacritics(k)))
}
