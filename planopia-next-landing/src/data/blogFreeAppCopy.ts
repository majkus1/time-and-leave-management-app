import { LANDING_TRIAL_DAYS, landingBundles, landingCoreTiers, landingModules, landingTrial } from './landingPlanPricing'

export type BlogFreeAppLocale = 'pl' | 'en'

// Ceny i limity wyłącznie z katalogu — artykuł o „darmowej” aplikacji nie może obiecywać więcej, niż daje plan darmowy
const FREE_USERS = landingTrial.maxUsers
const TRIAL_USERS = landingTrial.maxUsers
const CORE_FROM = landingCoreTiers[0].monthlyNetPln
const PRO_FROM = landingBundles[0].monthlyNetPln
const PRO_FROM_USERS = landingBundles[0].maxUsers
const moduleNet = (id: (typeof landingModules)[number]['id']) => landingModules.find(m => m.id === id)?.monthlyNetPln ?? 0

export type PlanCard = { title: string; note: string; items: string[] }

export const blogFreeAppCopy = {
	pl: {
		slug: 'darmowa-aplikacja-do-ewidencji-czasu-pracy',
		url: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
		headline: `Darmowa aplikacja do ewidencji czasu pracy — do ${FREE_USERS} osób, bez limitu czasu`,
		heroH1: `Darmowa aplikacja do ewidencji czasu pracy — do ${FREE_USERS} osób, bez limitu czasu`,
		heroLead: `Godziny, nadgodziny i nieobecności z wydrukiem do PDF i Excel — za darmo dla ${FREE_USERS} kont. Na start ${LANDING_TRIAL_DAYS} dni pełnej aplikacji z urlopami, grafikami i Asystentem AI, bez karty.`,
		pricingHref: '/#cennik',
		pricingLabel: 'Szczegóły w cenniku',
		cta: 'Załóż darmowy zespół',
		datePublished: '2024-10-18',
		dateModified: '2026-10-17',
		metaDescription: `Darmowa ewidencja czasu pracy do ${FREE_USERS} kont bez limitu czasu, z wydrukiem PDF i Excel. Na start ${LANDING_TRIAL_DAYS} dni pełnej Planopii z urlopami — bez karty.`,
		plansTitle: 'Co dokładnie jest za darmo, a co w okresie próbnym?',
		plansLead:
			'Planopia ma dwa „darmowe” etapy i warto je odróżnić: darmowy plan zostaje z Tobą na stałe, a okres próbny pokazuje całą aplikację przez pierwszy miesiąc.',
		planCards: [
			{
				title: 'Darmowy plan — bez limitu czasu',
				note: `do ${FREE_USERS} aktywnych kont`,
				items: [
					'Dzienne wpisy: godziny, nadgodziny, nieobecności i notatki',
					'Kalendarz miesięczny każdej osoby',
					'Podgląd ewidencji pracowników zgodnie z rolą (Admin, HR, przełożony)',
					'Wydruk ewidencji każdej osoby do PDF i Excel',
				],
			},
			{
				title: `Okres próbny — ${LANDING_TRIAL_DAYS} dni`,
				note: `pełna aplikacja, do ${TRIAL_USERS} osób, bez karty`,
				items: [
					'Urlopy: wnioski, akceptacje i kalendarz nieobecności',
					'Raporty zespołu, przegląd zespołu i powiadomienia',
					'Asystent AI bez limitu wiadomości',
					'Timer i rejestracja QR, grafiki pracy, zadania i czat',
				],
			},
			{
				title: 'Plany płatne — gdy potrzebujesz więcej',
				note: `Core od ${CORE_FROM} zł netto / mies.`,
				items: [
					'Core: urlopy, przegląd i raporty zespołu, powiadomienia, Asystent AI',
					`Moduły do Core: Timer i QR ${moduleNet('timer_qr')} zł, Grafiki ${moduleNet('schedules_ai')} zł, Zadania i czat ${moduleNet('tasks_chat')} zł`,
					`PRO od ${PRO_FROM} zł netto / mies. (do ${PRO_FROM_USERS} osób) — wszystko w cenie`,
					'Rozliczenie roczne: płacisz za 10 miesięcy zamiast 12',
				],
			},
			{
				title: 'W każdym planie',
				note: 'także w darmowym',
				items: [
					'Działa w przeglądarce i jako aplikacja na telefonie (PWA)',
					'Szyfrowane połączenia, role i uprawnienia',
					'Zgodność z RODO i umowa powierzenia danych (DPA)',
					'Pomoc przez czat',
				],
			},
		] satisfies PlanCard[],
		tableTitle: 'Darmowy plan, okres próbny i Core — porównanie funkcji',
		tableHead: { feature: 'Funkcja', free: 'Darmowy plan', trial: `${LANDING_TRIAL_DAYS} dni próby`, core: 'Core i moduły' },
		tableModule: 'moduł +{price} zł',
		tableNote: 'Ceny netto miesięcznie. Pełny cennik z kalkulatorem dla Twojego zespołu jest na stronie głównej.',
		faqs: [
			{
				q: 'Czy jest okres próbny?',
				a: `Tak. Przez ${LANDING_TRIAL_DAYS} dni masz pełne funkcje za darmo w zespole do ${TRIAL_USERS} użytkowników, z Asystentem AI bez limitu wiadomości. Bez karty płatniczej i bez zobowiązania.`,
			},
			{
				q: 'Co zostaje za darmo po okresie próbnym?',
				a: `Ewidencja czasu pracy dla maks. ${FREE_USERS} aktywnych kont — wpisy godzin, nadgodzin i nieobecności, kalendarz miesięczny i wydruk ewidencji każdej osoby do PDF i Excel. Bez limitu czasu. Urlopy, raporty zespołu i Asystent AI są w planach płatnych.`,
			},
			{
				q: 'Czy urlopy są w darmowym planie?',
				a: `Nie. Wnioski urlopowe, akceptacje i kalendarz nieobecności działają w okresie próbnym i w planach płatnych — od ${CORE_FROM} zł netto miesięcznie w planie Core.`,
			},
			{
				q: 'Czy moje dane są bezpieczne?',
				a: 'Tak. Połączenia są szyfrowane, dostęp wyznaczają role i uprawnienia, a dane są regularnie archiwizowane. Aplikacja jest zgodna z RODO, a każda firma dostaje umowę powierzenia przetwarzania danych (DPA).',
			},
			{
				q: 'Czy mogę eksportować dane?',
				a: 'Tak. W każdym planie, także darmowym, wydrukujesz ewidencję każdej osoby do PDF i Excel. Raporty zbiorcze całego zespołu są w planach płatnych.',
			},
		],
	},
	en: {
		slug: 'free-time-tracking-app',
		url: 'https://planopia.pl/en/blog/free-time-tracking-app',
		headline: `Free time tracking app — up to ${FREE_USERS} people, no time limit`,
		heroH1: `Free time tracking app — up to ${FREE_USERS} people, no time limit`,
		heroLead: `Hours, overtime and absences with PDF and Excel printouts — free for ${FREE_USERS} accounts. Start with ${LANDING_TRIAL_DAYS} days of the full app with leave, schedules and the AI Assistant, no card.`,
		pricingHref: '/en#prices',
		pricingLabel: 'See pricing',
		cta: 'Create your free team today',
		datePublished: '2024-10-18',
		dateModified: '2026-10-17',
		metaDescription: `Free time tracking for up to ${FREE_USERS} accounts with no time limit, plus PDF and Excel printouts. Start with ${LANDING_TRIAL_DAYS} days of the full Planopia app, no card needed.`,
		plansTitle: 'What exactly is free, and what is in the trial?',
		plansLead:
			'Planopia has two “free” stages: the free plan stays with you for good, while the trial shows the whole app during your first month.',
		planCards: [
			{
				title: 'Free plan — no time limit',
				note: `up to ${FREE_USERS} active accounts`,
				items: [
					'Daily entries: hours, overtime, absences and notes',
					'Monthly calendar for every person',
					'Employee timesheets visible according to role (Admin, HR, supervisor)',
					'Each person’s timesheet printout in PDF and Excel',
				],
			},
			{
				title: `Trial — ${LANDING_TRIAL_DAYS} days`,
				note: `full app, up to ${TRIAL_USERS} people, no card`,
				items: [
					'Leave: requests, approvals and absence calendar',
					'Team reports, team overview and notifications',
					'AI Assistant with no message limit',
					'Timer and QR clocking, work schedules, tasks and chat',
				],
			},
			{
				title: 'Paid plans — when you need more',
				note: `Core from PLN ${CORE_FROM} net / month`,
				items: [
					'Core: leave, team overview and reports, notifications, AI Assistant',
					`Core add-ons: Timer and QR PLN ${moduleNet('timer_qr')}, Schedules PLN ${moduleNet('schedules_ai')}, Tasks and chat PLN ${moduleNet('tasks_chat')}`,
					`PRO from PLN ${PRO_FROM} net / month (up to ${PRO_FROM_USERS} people) — everything included`,
					'Annual billing: pay for 10 months instead of 12',
				],
			},
			{
				title: 'In every plan',
				note: 'including the free one',
				items: [
					'Works in the browser and as a phone app (PWA)',
					'Encrypted connections, roles and permissions',
					'GDPR compliance and a data processing agreement (DPA)',
					'Help via chat',
				],
			},
		] satisfies PlanCard[],
		tableTitle: 'Free plan, trial and Core — feature comparison',
		tableHead: { feature: 'Feature', free: 'Free plan', trial: `${LANDING_TRIAL_DAYS}-day trial`, core: 'Core and add-ons' },
		tableModule: 'add-on +PLN {price}',
		tableNote: 'Prices are net per month. The full pricing with a calculator for your team is on the home page.',
		faqs: [
			{
				q: 'Is there a free trial?',
				a: `Yes. For ${LANDING_TRIAL_DAYS} days you get full features for free in a team of up to ${TRIAL_USERS} users, including the AI Assistant with no message limit. No credit card and no commitment required.`,
			},
			{
				q: 'What stays free after the trial?',
				a: `Time tracking for up to ${FREE_USERS} active accounts — hours, overtime and absence entries, a monthly calendar and each person’s timesheet printout in PDF and Excel. No time limit. Leave, team reports and the AI Assistant are in paid plans.`,
			},
			{
				q: 'Is leave management included in the free plan?',
				a: `No. Leave requests, approvals and the absence calendar work during the trial and in paid plans — from PLN ${CORE_FROM} net per month on the Core plan.`,
			},
			{
				q: 'Is my data secure?',
				a: 'Yes. Connections are encrypted, access is governed by roles and permissions, and data is backed up regularly. The app is GDPR-compliant and every company gets a data processing agreement (DPA).',
			},
			{
				q: 'Can I export data?',
				a: 'Yes. In every plan, including the free one, you can print each person’s timesheet to PDF and Excel. Team-wide reports are in paid plans.',
			},
		],
	},
} as const
