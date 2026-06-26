/**
 * Spójny opis modelu: okres próbny → darmowy plan (ewidencja) → pakiety płatne.
 * Używany w meta, JSON-LD i treściach landing / blog (SEO + zgodność z produktem).
 */
export const planOfferingCopy = {
	pl: {
		metaLong:
			'Planopia: ewidencja czasu pracy online, urlopy, grafiki, raporty PDF/Excel, czaty, tablice Kanban i Asystent AI bez Excela i papierowych wniosków. 30 dni za darmo z pełną aplikacją (do 5 użytkowników, limity Asystenta AI). Potem możesz zostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet z pełnymi modułami i AI — od 119 zł netto miesięcznie (Core).',
		metaShort:
			'Darmowa ewidencja czasu pracy, urlopy i grafiki bez Excela. 30 dni pełnej aplikacji za darmo, bez karty. Potem ewidencja do 5 osób lub pakiety z modułami i AI.',
		jsonLdOfferDescription:
			'30 dni pełnej aplikacji za darmo; potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub pakiety od 119 do 479 PLN netto miesięcznie (gotowe pakiety w aplikacji; większe zespoły — wycena indywidualna); dodatki AI po aktywnym pakiecie płatnym.',
		heroH1: 'Darmowa ewidencja czasu pracy, urlopy i grafiki bez Excela',
		heroSub:
			'30 dni za darmo, bez karty. Potem darmowa ewidencja do 5 osób albo pakiet z raportami i AI.',
		valueEyebrow: 'Dlaczego nie Excel?',
		valueTitle: 'Excel nie przypilnuje procesu. Planopia tak.',
		valueLead:
			'Excel jest darmowy tylko do momentu, w którym ktoś musi zbierać pliki, przepisywać urlopy i przygotowywać raporty.',
		valueCards: [
			{
				title: 'Koniec z rozproszonymi arkuszami',
				text: 'Czas pracy, urlopy, grafiki i zadania w jednym miejscu. Bez szukania po plikach, mailach i czatach.',
			},
			{
				title: 'Urlopy bez gonienia po akceptacje',
				text: 'Wniosek, akceptacja, historia zmian i powiadomienia zostają w aplikacji.',
			},
			{
				title: 'Raporty i statystyki w kilka kliknięć',
				text: 'PDF/Excel zamienia czas pracy, urlopy i nadgodziny w gotowe podsumowania dla księgowości i managera.',
			},
			{
				title: 'Cena ma kontekst zespołu',
				text: 'Core od 119 zł netto miesięcznie. Jedna odzyskana godzina administracji potrafi pokryć koszt.',
			},
		],
		blogJsonLdExtra:
			' Artykuły o ewidencji czasu pracy i HR; w aplikacji trial 30 dni, potem darmowy plan ewidencji lub pakiety płatne.',
	},
	en: {
		metaLong:
			'Planopia: online time tracking, leave, schedules, PDF/Excel reports, team chat, Kanban boards, and an AI Assistant without scattered spreadsheets or paper requests. 30-day free trial with the full product (up to 5 users, AI limits during trial). Then stay on a free time tracking plan for up to 5 active accounts, or upgrade for full modules and AI — from 119 PLN net per month (Core).',
		metaShort:
			'Free time tracking, leave, and schedules without spreadsheets. 30-day full trial, no card. Then free tier for 5 users or paid plans with full modules and AI.',
		jsonLdOfferDescription:
			'30-day full-product trial; then free time tracking tier for up to 5 active accounts, or paid plans from 119 to 479 PLN net per month (boxed tiers in-app; larger teams — custom quote); optional AI packs after an active paid plan.',
		heroH1: 'Free time tracking, leave, and schedules without spreadsheets',
		heroSub:
			'30 days free, no card. Then keep free time tracking for up to 5 people, or upgrade for reports and AI.',
		valueEyebrow: 'Why not spreadsheets?',
		valueTitle: 'Spreadsheets do not manage the process. Planopia does.',
		valueLead:
			'Spreadsheets are free until someone has to collect files, rewrite leave requests, and prepare reports.',
		valueCards: [
			{
				title: 'No more scattered sheets',
				text: 'Time, leave, schedules, and tasks in one place. No digging through files, emails, and chats.',
			},
			{
				title: 'Leave without approval chasing',
				text: 'Requests, approvals, change history, and notifications stay inside the app.',
			},
			{
				title: 'Reports and stats in a few clicks',
				text: 'PDF/Excel turns work time, leave, and overtime into summaries for accounting and managers.',
			},
			{
				title: 'Pricing has team context',
				text: 'Core starts at 119 PLN net/month. One recovered admin hour can cover the cost.',
			},
		],
		blogJsonLdExtra:
			' Articles on time tracking and HR workflows; in the app: 30-day trial, then a free time tracking tier or paid plans.',
	},
} as const

/** Skrót do meta artykułów blogowych (import w layout.tsx). */
export const blogArticleOfferLine = {
	pl: '30 dni pełnej aplikacji za darmo (do 5 osób); potem darmowy plan ewidencji czasu pracy do 5 aktywnych kont lub pakiety płatne z urlopami, grafikami, czatem i AI.',
	en: '30-day full trial (up to 5 users); then free time tracking for up to 5 active accounts, or paid plans with leave, schedules, chat, tasks, and AI.',
} as const
