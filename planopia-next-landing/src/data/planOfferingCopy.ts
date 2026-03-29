/**
 * Spójny opis modelu: okres próbny → darmowy plan (ewidencja) → pakiety płatne.
 * Używany w meta, JSON-LD i treściach landing / blog (SEO + zgodność z produktem).
 */
export const planOfferingCopy = {
	pl: {
		metaLong:
			'Planopia: ewidencja czasu pracy online, urlopy, grafiki, czaty, tablice Kanban i Asystent AI. 30 dni za darmo z pełną aplikacją (do 5 użytkowników, limity Asystenta AI). Potem możesz zostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet z pełnymi modułami i AI — od 99 zł netto miesięcznie.',
		metaShort:
			'30 dni pełnej aplikacji za darmo (do 5 osób). Potem darmowa ewidencja czasu pracy do 5 kont lub pakiety płatne z urlopami, grafikami, czatem i Asystentem AI.',
		jsonLdOfferDescription:
			'30 dni pełnej aplikacji za darmo; potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub pakiety od 99 do 799 PLN netto miesięcznie; dodatki AI po aktywnym pakiecie płatnym.',
		heroH1: 'Ewidencja czasu pracy, urlopy i zadania w jednym systemie z AI',
		heroSub:
			'30 dni pełnych funkcji za darmo — potem darmowa ewidencja do 5 osób lub pełna wersja z raportami i AI.',
		blogJsonLdExtra:
			' Artykuły o ewidencji czasu pracy i HR; w aplikacji trial 30 dni, potem darmowy plan ewidencji lub pakiety płatne.',
	},
	en: {
		metaLong:
			'Planopia: online time tracking, leave, schedules, team chat, Kanban boards, and an AI Assistant grounded in team data. 30-day free trial with the full product (up to 5 users, AI limits during trial). Then stay on a free time tracking plan for up to 5 active accounts, or upgrade for full modules and AI — from 99 PLN net per month.',
		metaShort:
			'30-day full-product trial (up to 5 users). Then free time tracking for up to 5 active accounts, or paid plans with leave, schedules, chat, tasks, and the AI Assistant.',
		jsonLdOfferDescription:
			'30-day full-product trial; then free time tracking tier for up to 5 active accounts, or paid plans from 99 to 799 PLN net per month; optional AI packs after an active paid plan.',
		heroH1: 'Time tracking, leave, and tasks in one system with AI',
		heroSub:
			'30 days of full features for free — then free time tracking for up to 5 people, or the full version with reports and AI.',
		blogJsonLdExtra:
			' Articles on time tracking and HR workflows; in the app: 30-day trial, then a free time tracking tier or paid plans.',
	},
} as const

/** Skrót do meta artykułów blogowych (import w layout.tsx). */
export const blogArticleOfferLine = {
	pl: '30 dni pełnej aplikacji za darmo (do 5 osób); potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub pakiety płatne z urlopami, grafikami, czatem i AI.',
	en: '30-day full trial (up to 5 users); then free time tracking for up to 5 active accounts, or paid plans with leave, schedules, chat, tasks, and AI.',
} as const
