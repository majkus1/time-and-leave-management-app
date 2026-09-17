// Źródło: models/Settings.js (pełna lista pól), models/SupervisorConfig.js, roleService.js, client Logs.jsx (opisy ról),
// TutorialModal (settings, create-user, team-management), userController.register (link do ustawienia hasła),
// docs/AI_DATA_CONTEXT_RULES.md (pracownicy bez dostępu w danych).
module.exports = {
	id: 'settingsRoles',
	order: 7,
	title: { pl: 'Ustawienia zespołu, role i uprawnienia', en: 'Team settings, roles and permissions' },
	summary: {
		pl: 'Wszystkie opcje zespołu (weekendy, święta, godziny, czynności, typy urlopów, licznik), role, uprawnienia przełożonych, działy, pracownicy bez dostępu.',
		en: 'All team options (weekends, holidays, hours, activities, leave types, timer), roles, supervisor permissions, departments, no-access employees.',
	},
	keywords: {
		pl: ['ustawi', ' rol', 'uprawnien', 'admin', ' hr ', 'przełożon', 'kierownik', 'manager', 'dodać pracownik', 'dodaj pracownik', 'nowy pracownik', 'nowego pracownik', 'pracownik bez', 'pracownicy bez', 'bez dostępu', 'bez konta', 'nie loguj', ' dział ', ' działu', ' działy', ' działów', ' działem', ' działach', 'weekend', 'sobot', 'niedziel', 'święt', 'godziny pracy', 'dodać użytkownik', 'dodaj użytkownik', 'nowy użytkownik', 'nowego użytkownik', 'zarządzanie zespołem', 'usuń', 'usuną', 'dezaktyw', 'zaprosi', 'zaproś', 'kto może', 'kto widzi'],
		en: ['settings', ' role', 'permission', 'admin', ' hr ', 'supervisor', 'manager', 'add employee', 'new employee', 'add user', 'new user', 'invite', 'no access', 'no account', 'department', 'weekend', 'saturday', 'sunday', 'holiday', 'work hours', 'team management', 'remove', 'deactivate', 'who can', 'who sees'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Jakie są role i co może przełożony?', 'Jak dodać pracownika i co on dostaje?', 'Czy da się prowadzić ewidencję za osoby, które nie logują się do aplikacji?', 'Co można ustawić dla całego zespołu?'],
		en: ['What are the roles and what can a supervisor do?', 'How do I add an employee and what do they receive?', 'Can I keep records for people who never log in?', 'What can be configured for the whole team?'],
	},
	body: {
		pl: `### Role
- **Administrator** — pełny dostęp: użytkownicy, role, działy, ustawienia, pakiety, dokumenty prawne, centrum pomocy. Zawsze może wszystko, niezależnie od konfiguracji.
- **HR** — wnioski urlopowe i ewidencja całego zespołu, grafiki, pakiety i rozliczenia, dodawanie użytkowników.
- **Przełożony** — zakres ustawia Administrator w trzech uprawnieniach: zatwierdzanie urlopów, podgląd i edycja ewidencji, zarządzanie grafikiem — każde dla swojego działu i/lub wybranych pracowników. Bez konfiguracji przełożony ma wszystkie trzy.
- **Pracownik** — własna ewidencja, własne wnioski, tablice i czat, do których należy.
- Jedna osoba może mieć kilka ról; hierarchia Administrator > HR > Przełożony > Pracownik.

### Dodawanie i usuwanie użytkowników
- Menu → „Utwórz użytkownika” (Administrator, HR; przełożony — tylko pracowników bez dostępu, jeśli włączone): imię, nazwisko, e-mail, role, działy, stanowisko, opcjonalnie pula urlopowa. Nowa osoba dostaje e-mail z linkiem do ustawienia własnego hasła.
- Menu → „Zarządzanie zespołem” (Administrator): zmiana ról i działów, uprawnienia przełożonych, dezaktywacja i przywracanie kont, ponowne wysłanie linku do hasła, logi aktywności, działy (dodanie działu tworzy automatycznie jego kanał czatu, tablicę i grafik), usunięcie zespołu.
- Liczba aktywnych kont liczy się do limitu planu (okres próbny i plan darmowy: {{trial.maxUsers}}; Core S/M/L: {{maxUsers.plan.base_s}}/{{maxUsers.plan.base_m}}/{{maxUsers.plan.base_l}}; Pro: {{maxUsers.plan.pro}}; Business: {{maxUsers.plan.business}}). Dezaktywowane konto nie zajmuje miejsca.

### Pracownicy bez dostępu do aplikacji
Opcja w Ustawieniach (domyślnie wyłączona): osoby, które nie logują się i nie mają hasła, ale są w zespole (liczą się do limitu kont). Uprawnieni użytkownicy prowadzą za nie ewidencję (jeśli włączono „wpisy ewidencji za pracownika”) i składają wnioski urlopowe (jeśli włączono, w planie płatnym), potwierdzają ich miesiąc i zatwierdzają dni. Przydatne dla pracowników fizycznych bez telefonu służbowego.

### Ustawienia zespołu (Administrator, HR)
- Praca w weekendy (tak/nie) — wpływa na ewidencję, licznik i urlopy.
- Polskie święta ustawowe (w tym 24 grudnia od 2025) oraz własne dni wolne (np. dzień firmowy).
- Standardowe godziny pracy (sloty od–do) jako szybkie wybory w ewidencji.
- Czynności w ewidencji: lista, grupowanie, „Mierz wykonanie” z jednostką.
- Typy urlopów: nazwa (PL/EN), wymaga akceptacji, pula dni, minimalne wyprzedzenie, jednostka (dni/godziny); rozliczanie urlopu w dniach lub godzinach; automatyczne rozliczanie puli.
- Licznik i kody QR (włącz/wyłącz; kody z nazwą miejsca).
- Strona Start (pulpit KPI) — włącz/wyłącz.
- Pracownicy bez dostępu (+ wpisy ewidencji i wnioski za nich).
- Wpisy w ewidencji tylko na dziś.
- W planie darmowym dostępne: weekendy, święta, godziny pracy, czynności, pracownicy bez dostępu (bez wniosków za nich).

### Ustawienia osobiste (każdy)
Powiadomienia push i e-mail, zmiana hasła i danych w „Edytuj profil”, język aplikacji.

### Czego NIE robi
- Nie ma logowania kontem Google/Microsoft ani importu pracowników z pliku — konta zakłada się pojedynczo.
- Nie ma struktury organizacyjnej wielopoziomowej (dział → poddział) — jest jeden poziom działów i przypisania przełożonych.

### Gdzie w aplikacji / kto może
Ustawienia zespołu: menu → Ustawienia (Administrator, HR). Użytkownicy i role: menu → Utwórz użytkownika / Zarządzanie zespołem (Administrator; HR — dodawanie). Uprawnienia przełożonego: Zarządzanie zespołem → ikona przy osobie z rolą Przełożony.`,
		en: null,
	},
}
