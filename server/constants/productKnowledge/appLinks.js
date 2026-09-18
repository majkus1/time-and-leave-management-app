/**
 * Miejsca w aplikacji, do których asystent w trybie pomocy może dać przycisk (znacznik [[LINK:id]] na końcu
 * odpowiedzi → klient renderuje przycisk i nawiguje; kotwice #settings-* przewijają do sekcji w Ustawieniach —
 * id kotwic muszą zgadzać się z client/src/components/profile/Settings.jsx).
 * `roles: null` = każdy zalogowany; inaczej lista ról (literalnie jak w bazie), dla których link ma sens.
 * `mention` = regex, który musi trafić w treść odpowiedzi — model potrafi dopiąć przycisk „na siłę”
 * (np. „Powiadomienia push” do pytania o święta), a bez wzmianki w tekście przycisk tylko myli.
 */
const ADMIN_HR = ['Admin', 'HR']
const STAFF = ['Admin', 'HR', 'Przełożony (Supervisor)']

module.exports = [
	{ id: 'work-time', path: '/work-time', label: { pl: 'Czas pracy (moja ewidencja)', en: 'Work time (my timesheet)' }, roles: null, mention: /czas pracy|ewidencj|kalendarz|wpis|licznik|timesheet|work time|calendar|entry|timer/i },
	{ id: 'leave-request', path: '/leave-request', label: { pl: 'Zgłoś urlop', en: 'Request leave' }, roles: null, mention: /urlop|wniosek|wniosk|nieobecn|leave|request|absence/i },
	{ id: 'leave-planner', path: '/leave-planner', label: { pl: 'Zaplanuj swój urlop', en: 'Plan your leave' }, roles: null },
	{ id: 'all-leave-plans', path: '/all-leave-plans', label: { pl: 'Plany urlopowe zespołu', en: 'Team leave plans' }, roles: null },
	{ id: 'calendars-list', path: '/calendars-list', label: { pl: 'Ewidencja czasu pracy zespołu', en: 'Team timesheets' }, roles: STAFF },
	{ id: 'leave-list', path: '/leave-list', label: { pl: 'Wnioski urlopowe do zatwierdzenia', en: 'Leave requests to approve' }, roles: STAFF },
	{ id: 'schedule', path: '/schedule', label: { pl: 'Grafik', en: 'Schedule' }, roles: null },
	{ id: 'boards', path: '/boards', label: { pl: 'Tablice zadań', en: 'Task boards' }, roles: null },
	{ id: 'chat', path: '/chat', label: { pl: 'Czat', en: 'Chat' }, roles: null, mention: /czat|chat|wiadomo|message/i },
	{ id: 'announcements', path: '/announcements', label: { pl: 'Komunikaty', en: 'Announcements' }, roles: null, mention: /komunikat|ogłoszen|announcement/i },
	{ id: 'edit-profile', path: '/edit-profile', label: { pl: 'Edytuj profil', en: 'Edit profile' }, roles: null, mention: /profil|hasł|profile|password/i },
	{ id: 'create-user', path: '/create-user', label: { pl: 'Utwórz użytkownika', en: 'Create user' }, roles: ADMIN_HR },
	{ id: 'team-management', path: '/team-management', label: { pl: 'Zarządzanie zespołem', en: 'Team management' }, roles: ['Admin'] },
	{ id: 'packages', path: '/packages', label: { pl: 'Pakiety i rozliczenia', en: 'Packages & billing' }, roles: ADMIN_HR },
	{ id: 'documents', path: '/documents', label: { pl: 'Dokumenty prawne', en: 'Legal documents' }, roles: ['Admin'] },
	{ id: 'helpcenter', path: '/helpcenter', label: { pl: 'Centrum pomocy', en: 'Help center' }, roles: ['Admin'] },
	// Ustawienia zespołu — konkretne sekcje (Admin, HR)
	{ id: 'settings-weekends', path: '/settings#settings-weekends-section', label: { pl: 'Ustawienia → Praca w weekendy', en: 'Settings → Weekend work' }, roles: ADMIN_HR },
	{ id: 'settings-holidays', path: '/settings#settings-holidays-section', label: { pl: 'Ustawienia → Święta i dni wolne', en: 'Settings → Holidays & days off' }, roles: ADMIN_HR },
	{ id: 'settings-work-hours', path: '/settings#settings-work-hours-section', label: { pl: 'Ustawienia → Godziny pracy', en: 'Settings → Work hours' }, roles: ADMIN_HR },
	{ id: 'settings-work-activities', path: '/settings#settings-work-activities-section', label: { pl: 'Ustawienia → Czynności w ewidencji', en: 'Settings → Work activities' }, roles: ADMIN_HR },
	{ id: 'settings-workday-entries', path: '/settings#settings-workday-entries-section', label: { pl: 'Ustawienia → Wpisy w ewidencji (tylko dziś)', en: 'Settings → Timesheet entries (today only)' }, roles: ADMIN_HR },
	{ id: 'settings-leave-types', path: '/settings#settings-leave-types-section', label: { pl: 'Ustawienia → Typy urlopów', en: 'Settings → Leave types' }, roles: ADMIN_HR },
	{ id: 'settings-leave-calculation', path: '/settings#settings-leave-calculation-section', label: { pl: 'Ustawienia → Rozliczanie urlopów i pula dni', en: 'Settings → Leave settlement & balance' }, roles: ADMIN_HR },
	{ id: 'settings-timer-qr', path: '/settings#settings-timer-qr-section', label: { pl: 'Ustawienia → Licznik i kody QR', en: 'Settings → Timer & QR codes' }, roles: ADMIN_HR, mention: /qr|licznik|timer/i },
	{ id: 'settings-dashboard', path: '/settings#settings-dashboard-section', label: { pl: 'Ustawienia → Strona Start', en: 'Settings → Start page' }, roles: ADMIN_HR, mention: /start|pulpit|dashboard/i },
	{ id: 'settings-no-access-users', path: '/settings#settings-no-access-users-section', label: { pl: 'Ustawienia → Pracownicy bez dostępu', en: 'Settings → Employees without app access' }, roles: ADMIN_HR },
	// Ustawienia osobiste (każdy)
	{ id: 'settings-push', path: '/settings#settings-push-notifications-section', label: { pl: 'Ustawienia → Powiadomienia push', en: 'Settings → Push notifications' }, roles: null, mention: /push|powiadomien|notification/i },
	{ id: 'settings-email', path: '/settings#settings-email-notifications-section', label: { pl: 'Ustawienia → Powiadomienia e-mail', en: 'Settings → E-mail notifications' }, roles: null, mention: /e-?mail|powiadomien|notification/i },
]
