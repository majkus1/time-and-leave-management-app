/**
 * Zrzuty ekranu aplikacji na stronach produktowych (public/img/product/{pl|en}-{nazwa}.webp).
 * Dane na zrzutach są przykładowe (zespół demonstracyjny). Kod QR w ustawieniach jest celowo rozmyty —
 * na stronie nie publikujemy działającego kodu.
 */
import type { Locale, Variant } from './commercialLandingCopy'

export type Shot = { src: string; alt: string; caption: string; width: number; height: number }

type Name =
	| 'time-calendar'
	| 'dashboard'
	| 'dashboard-stats'
	| 'worktime'
	| 'managed-calendar'
	| 'leave-approve'
	| 'leave-plans'
	| 'leave-form'
	| 'leave-conflict'
	| 'schedule'
	| 'schedule-auto'
	| 'qr-sessions'
	| 'qr-settings'
	| 'qr-codes'
	| 'create-noaccess'
	| 'board'
	| 'm-worktime'
	| 'm-leave-form'

/** Wymiary plików po konwersji (szerokość × wysokość) */
const SIZE: Record<Name, [number, number]> = {
	'time-calendar': [1600, 1017],
	dashboard: [1600, 952],
	'dashboard-stats': [1600, 879],
	worktime: [1600, 952],
	'managed-calendar': [1600, 1017],
	'leave-approve': [1600, 1377],
	'leave-plans': [1600, 778],
	'leave-form': [1600, 952],
	'leave-conflict': [1600, 1302],
	schedule: [1600, 1017],
	'schedule-auto': [1600, 952],
	'qr-sessions': [1600, 1105],
	'qr-settings': [1600, 1200],
	'qr-codes': [1100, 1065],
	'create-noaccess': [1520, 1840],
	board: [1600, 853],
	'm-worktime': [600, 1298],
	'm-leave-form': [600, 1298],
}
const SIZE_EN: Partial<Record<Name, [number, number]>> = { 'leave-plans': [1600, 763] }

const TEXT: Record<Name, Record<Locale, { alt: string; caption: string }>> = {
	'time-calendar': {
		pl: { alt: 'Kalendarz ewidencji czasu pracy pracownika z godzinami, nadgodzinami i podsumowaniem miesiąca w Planopii', caption: 'Miesiąc pracownika: godziny przy każdym dniu, nadgodziny, urlop i podsumowanie z eksportem do PDF i Excela.' },
		en: { alt: 'An employee’s timesheet calendar with hours, overtime and a monthly summary in Planopia', caption: 'An employee’s month: hours on each day, overtime, leave and a summary exported to PDF and Excel.' },
	},
	dashboard: {
		pl: { alt: 'Przegląd zespołu w Planopii: licznik czasu, wnioski do decyzji, godziny i zadania', caption: 'Przegląd zespołu: co dziś wymaga decyzji, godziny w miesiącu, wnioski i zadania w jednym widoku.' },
		en: { alt: 'Team overview in Planopia: timer, requests to review, hours and tasks', caption: 'Team overview: what needs a decision today, hours this month, requests and tasks in one view.' },
	},
	'dashboard-stats': {
		pl: { alt: 'Statystyki zespołu w Planopii: suma godzin, nadgodziny i osoby z największą liczbą godzin', caption: 'Statystyki zespołu: suma godzin i nadgodzin w okresie oraz kto przepracował najwięcej.' },
		en: { alt: 'Team statistics in Planopia: total hours, overtime and the people with the most hours', caption: 'Team statistics: total hours and overtime for the period, and who worked the most.' },
	},
	worktime: {
		pl: { alt: 'Widok pracownika w Planopii: licznik czasu pracy i kalendarz miesiąca', caption: 'Widok pracownika: licznik czasu z wyborem zadania i trybem nadgodzin, kalendarz i potwierdzenie miesiąca.' },
		en: { alt: 'Employee view in Planopia: work timer and monthly calendar', caption: 'Employee view: a timer with task choice and overtime mode, the calendar and month confirmation.' },
	},
	'managed-calendar': {
		pl: { alt: 'Ewidencja pracownika bez dostępu do aplikacji prowadzona przez brygadzistę w Planopii', caption: 'Pracownik bez konta: godziny, czynność i wykonaną ilość wpisuje za niego brygadzista.' },
		en: { alt: 'Timesheet of an employee without app access, kept by the foreman in Planopia', caption: 'An employee without an account: the foreman logs hours, activity and quantity for them.' },
	},
	'leave-approve': {
		pl: { alt: 'Wniosek urlopowy oczekujący na akceptację w Planopii', caption: '' },
		en: { alt: 'A leave request awaiting approval in Planopia', caption: '' },
	},
	'leave-plans': {
		pl: { alt: 'Kalendarz urlopów całego zespołu w Planopii', caption: 'Kalendarz urlopów zespołu: zatwierdzone urlopy, wnioski czekające na decyzję, plany i święta.' },
		en: { alt: 'The whole team’s leave calendar in Planopia', caption: 'The team leave calendar: approved leave, requests awaiting a decision, plans and public holidays.' },
	},
	'leave-form': {
		pl: { alt: 'Formularz wniosku urlopowego z saldem dni w Planopii', caption: 'Wniosek pracownika: rodzaj nieobecności, daty, zastępstwo i dostępne dni urlopu.' },
		en: { alt: 'Leave request form with the day balance in Planopia', caption: 'An employee’s request: absence type, dates, a substitute and the available leave days.' },
	},
	'leave-conflict': {
		pl: { alt: 'Wniosek urlopowy z ostrzeżeniem o kolizji z grafikiem w Planopii', caption: 'Kolizja z grafikiem widoczna przy wniosku — zanim go zaakceptujesz.' },
		en: { alt: 'A leave request with a schedule overlap warning in Planopia', caption: 'A schedule overlap shows on the request — before you approve it.' },
	},
	schedule: {
		pl: { alt: 'Miesięczny grafik zmianowy zespołu w Planopii', caption: '' },
		en: { alt: 'A team’s monthly shift schedule in Planopia', caption: '' },
	},
	'schedule-auto': {
		pl: { alt: 'Automatyczne układanie grafiku w Planopii: zmiany, minimalna obsada i dni tygodnia', caption: 'Automatyczne układanie: zmiany, minimalna obsada i dni tygodnia — albo opis słowami dla Asystenta AI.' },
		en: { alt: 'Auto-fill for the schedule in Planopia: shifts, minimum staffing and weekdays', caption: 'Auto-fill: shifts, minimum staffing and weekdays — or a plain-words brief for the AI Assistant.' },
	},
	'qr-sessions': {
		pl: { alt: 'Sesje pracy z kodów QR w Planopii z oznaczeniem miejsca, sposobu skanu i wykonanej ilości', caption: '' },
		en: { alt: 'Work sessions from QR codes in Planopia with site, scan method and quantity done', caption: '' },
	},
	'qr-settings': {
		pl: { alt: 'Ustawienia kodów QR w Planopii: wydruk albo tablet i sprawdzanie lokalizacji', caption: 'Kody QR: wydruk albo tablet z kodem zmienianym co 30 s i sprawdzanie lokalizacji przy skanie (kod na zrzucie celowo rozmyty).' },
		en: { alt: 'QR code settings in Planopia: printout or tablet and a location check', caption: 'QR codes: a printout or a tablet code that changes every 30 s, with a location check at scan (the code in the screenshot is blurred on purpose).' },
	},
	'qr-codes': {
		pl: { alt: 'Kody QR budowy i magazynu w Planopii: kod z tabletu zmieniany co 30 s i sprawdzanie lokalizacji', caption: '' },
		en: { alt: 'Site and warehouse QR codes in Planopia: a tablet code that changes every 30 s and a location check', caption: '' },
	},
	'create-noaccess': {
		pl: { alt: 'Dodawanie pracownika bez dostępu do aplikacji w Planopii', caption: 'Pracownik bez dostępu do aplikacji: bez maila i hasła, przypisany do ekipy.' },
		en: { alt: 'Adding an employee without app access in Planopia', caption: 'An employee without app access: no email or password, assigned to a crew.' },
	},
	board: {
		pl: { alt: 'Tablica zadań zespołu w Planopii', caption: 'Tablica zadań: zlecenia z terminami, priorytetami i osobami odpowiedzialnymi.' },
		en: { alt: 'A team task board in Planopia', caption: 'Task board: jobs with deadlines, priorities and owners.' },
	},
	'm-worktime': {
		pl: { alt: 'Licznik czasu pracy w Planopii na telefonie', caption: '' },
		en: { alt: 'The Planopia work timer on a phone', caption: '' },
	},
	'm-leave-form': {
		pl: { alt: 'Wniosek urlopowy w Planopii na telefonie', caption: '' },
		en: { alt: 'A leave request in Planopia on a phone', caption: '' },
	},
}

export function shot(locale: Locale, name: Name): Shot {
	const [width, height] = (locale === 'en' && SIZE_EN[name]) || SIZE[name]
	return { src: `/img/product/${locale}-${name}.webp`, width, height, ...TEXT[name][locale] }
}

/** Pierwszy zrzut idzie do hero, reszta do galerii; telefon — opcjonalnie obok zrzutu w hero */
const PLAN: Record<Variant, { shots: Name[]; phone?: Name }> = {
	time: { shots: ['time-calendar', 'dashboard', 'worktime', 'managed-calendar'], phone: 'm-worktime' },
	leave: { shots: ['leave-approve', 'leave-plans', 'leave-form', 'leave-conflict'], phone: 'm-leave-form' },
	schedule: { shots: ['schedule', 'schedule-auto', 'leave-conflict'] },
	attendance: { shots: ['qr-sessions', 'qr-settings', 'worktime', 'managed-calendar'], phone: 'm-worktime' },
	overtime: { shots: ['dashboard-stats', 'time-calendar', 'worktime'] },
}

export function productShots(variant: Variant, locale: Locale) {
	const p = PLAN[variant]
	return { shots: p.shots.map(n => shot(locale, n)), phone: p.phone ? shot(locale, p.phone) : null }
}
