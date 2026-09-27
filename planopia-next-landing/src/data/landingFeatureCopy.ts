/**
 * Teksty kafelków „O aplikacji” i kalkulatora cennika (PL/EN). Przypisanie funkcji do planu przychodzi z planCatalog
 * (landingFeatures w generacie) — tu tylko nazwy, opisy i ikony. Te same nazwy są w aplikacji (Pakiety i rozliczenia).
 * Prosty język: bez „Kanban”, bez branżowych przykładów w opisach ogólnych (reguła z pamięci projektu).
 */
import type { FeatureId, ModuleId } from './landingPlanPricing'

export type Locale = 'pl' | 'en'
type Text = { title: string; desc: string }

export const FEATURE_COPY: Record<
	FeatureId,
	{
		icon: string | null
		href?: Record<Locale, string>
		moreLabel?: Record<Locale, string>
		/** Plakietka „Nowość” przed linkiem (świeża funkcja) */
		isNew?: boolean
		pl: Text
		en: Text
	}
> = {
	timesheet: {
		icon: '/img/schedule time works.png',
		pl: { title: 'Ewidencja czasu', desc: 'Kalendarz, nadgodziny, czynności i wydajność' },
		en: { title: 'Time tracking', desc: 'Calendar, overtime, activities and productivity' },
	},
	timesheet_print: {
		icon: '/img/pdf.png',
		pl: { title: 'Wydruk ewidencji', desc: 'Miesiąc każdej osoby w PDF i Excel' },
		en: { title: 'Timesheet printouts', desc: 'Each person’s month in PDF and Excel' },
	},
	leave: {
		icon: '/img/sunbed.png',
		href: { pl: '/program-do-urlopow', en: '/en/leave-management-software' },
		moreLabel: { pl: 'Program do urlopów →', en: 'Leave management software →' },
		pl: { title: 'Urlopy', desc: 'Wnioski, akceptacje, kalendarz nieobecności' },
		en: { title: 'Leave', desc: 'Requests, approvals, absence calendar' },
	},
	team_overview: {
		icon: '/img/groupses.png',
		pl: { title: 'Przegląd zespołu', desc: 'Kto dziś pracuje, kto ma urlop, co czeka na Twoją decyzję' },
		en: { title: 'Team overview', desc: 'Who is working today, who is on leave, what needs your decision' },
	},
	team_reports: {
		icon: '/img/contact-list.png',
		pl: { title: 'Raporty zespołu', desc: 'Czas pracy, nadgodziny, urlopy, czynności i wydajność całego zespołu (PDF, Excel)' },
		en: { title: 'Team reports', desc: 'Hours, overtime, leave, activities and productivity for the whole team (PDF, Excel)' },
	},
	ai_assistant: {
		icon: '/img/planio-ai.png',
		pl: { title: 'Asystent AI', desc: 'Pytasz o dane zespołu — dostajesz odpowiedź i raport. Bez limitu' },
		en: { title: 'AI assistant', desc: 'Ask about your team’s data — get an answer and a report. No limit' },
	},
	notifications: {
		icon: null,
		pl: { title: 'Powiadomienia', desc: 'Push i e-mail o urlopach, a z modułami także o grafiku, zadaniach i czacie' },
		en: { title: 'Notifications', desc: 'Push and email about leave — and with modules, about schedules, tasks and chat' },
	},
	timer_qr: {
		icon: '/img/timer.png',
		href: { pl: '/rejestracja-czasu-pracy-qr#ochrona-przed-zdjeciem', en: '/en/qr-time-clocking#photo-proof-clocking' },
		moreLabel: { pl: 'Kod QR na tablecie co 30 s i lokalizacja przy skanie', en: 'Tablet QR code every 30 s and location at scan' },
		isNew: true,
		pl: { title: 'Timer i QR', desc: 'Licznik czasu, kod QR w każdym miejscu pracy, kod na tablecie, lokalizacja przy skanie' },
		en: { title: 'Timer and QR', desc: 'Work timer, a QR code at every workplace, a code on a tablet, location at scan' },
	},
	schedules: {
		icon: '/img/project.png',
		href: { pl: '/program-do-grafikow-pracy', en: '/en/work-schedule-software' },
		moreLabel: { pl: 'Program do grafików pracy →', en: 'Work schedule software →' },
		pl: { title: 'Grafik pracy', desc: 'Zmiany i obsada, układanie grafiku przez AI' },
		en: { title: 'Work schedules', desc: 'Shifts and staffing, with AI building the schedule' },
	},
	tasks_chat: {
		icon: '/img/task-list.png',
		pl: { title: 'Zadania i czat', desc: 'Tablice zadań i czaty zespołu' },
		en: { title: 'Tasks and chat', desc: 'Task boards and team chats' },
	},
	mobile: {
		icon: '/img/booking.png',
		pl: { title: 'Aplikacja na telefon', desc: 'Ikona na ekranie telefonu, bez sklepu z aplikacjami' },
		en: { title: 'Phone app', desc: 'An icon on your home screen, no app store needed' },
	},
	security: {
		icon: '/img/verified.png',
		pl: { title: 'Bezpieczeństwo', desc: 'Szyfrowane połączenia, role i uprawnienia' },
		en: { title: 'Security', desc: 'Encrypted connections, roles and permissions' },
	},
	support: {
		icon: '/img/technical-support.png',
		pl: { title: 'Wsparcie', desc: 'Pomoc przez czat, w Business priorytetowo' },
		en: { title: 'Support', desc: 'Help via chat, priority support on Business' },
	},
}

export const MODULE_COPY: Record<ModuleId, Record<Locale, string>> = {
	timer_qr: { pl: 'Timer i QR', en: 'Timer and QR' },
	schedules_ai: { pl: 'Grafiki', en: 'Schedules' },
	tasks_chat: { pl: 'Zadania i czat', en: 'Tasks and chat' },
}

export const PLAN_NAME: Record<string, Record<Locale, string>> = {
	base_5: { pl: 'Core do 5 osób', en: 'Core up to 5 people' },
	base_s: { pl: 'Core do 15 osób', en: 'Core up to 15 people' },
	base_m: { pl: 'Core do 30 osób', en: 'Core up to 30 people' },
	base_50: { pl: 'Core do 50 osób', en: 'Core up to 50 people' },
	base_l: { pl: 'Core do 100 osób', en: 'Core up to 100 people' },
	pro_15: { pl: 'PRO do 15 osób', en: 'PRO up to 15 people' },
	pro: { pl: 'PRO do 30 osób', en: 'PRO up to 30 people' },
	pro_50: { pl: 'PRO do 50 osób', en: 'PRO up to 50 people' },
	business: { pl: 'Business do 100 osób', en: 'Business up to 100 people' },
}

export const BADGE_COPY: Record<'free' | 'core' | 'all', Record<Locale, string>> = {
	free: { pl: 'Darmowy', en: 'Free' },
	core: { pl: 'Core', en: 'Core' },
	all: { pl: 'Każdy plan', en: 'Every plan' },
}

export const TILES_COPY = {
	pl: {
		legend: 'Plakietka mówi, w którym planie jest funkcja:',
		moduleLegend: '+ moduł',
		badgeHint: 'Kliknij plakietkę ze strzałką — kalkulator w cenniku zaznaczy tę funkcję i policzy cenę.',
		badgeTitle: 'Zaznacz w kalkulatorze cennika',
		more: 'Więcej',
		newLabel: 'Nowość',
	},
	en: {
		legend: 'The badge shows which plan includes the feature:',
		moduleLegend: '+ module',
		badgeHint: 'Click a badge with an arrow — the pricing calculator will select that feature and work out the price.',
		badgeTitle: 'Select in the pricing calculator',
		more: 'More',
		newLabel: 'New',
	},
} as const

/** Zdarzenie z kafelka do kalkulatora: zaznacz funkcję i przewiń do cennika */
export const PRICING_FEATURE_EVENT = 'planopia:pricing-feature'
