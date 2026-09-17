import { productKnowledgeModules } from '@/data/productKnowledge.generated'

export type LandingChatUiModule = {
	id: string
	title: string
	summary: string
	suggestedQuestions: string[]
}

/**
 * Lekka lista modułów do chipów w UI (bez treści wiedzy — ta zostaje po stronie serwera).
 * Wywoływać w komponentach serwerowych i przekazywać jako props, żeby generat nie trafiał do bundla klienta.
 */
export function landingChatModulesForUi(locale: 'pl' | 'en'): LandingChatUiModule[] {
	return productKnowledgeModules.map(m => ({
		id: m.id,
		title: m.title[locale],
		summary: m.summary[locale],
		suggestedQuestions: [...m.suggestedQuestions[locale]],
	}))
}
