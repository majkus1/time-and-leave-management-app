/**
 * Treść instrukcji „Jak korzystać?" — wygenerowana z client/src/components/tutorial/TutorialModal.jsx.
 *
 * NIE EDYTUJ RĘCZNIE. Źródłem prawdy jest instrukcja w aplikacji; ten plik powstaje
 * skryptem, żeby strona publiczna nie zaczęła opisywać czegoś innego niż produkt.
 *
 * Sekcje z `dlaRoli: true` są w aplikacji widoczne tylko dla Administratora, HR
 * i przełożonego. Pominięta została sekcja o planie darmowym — zależy od aktualnego
 * planu zespołu i jest napisana do zalogowanego użytkownika.
 */
export type HowToLocale = 'pl' | 'en'
export type HowToText = { pl: string; en: string }

export type HowToSection = {
	id: string
	/** Widoczna w aplikacji tylko dla Admina, HR i przełożonego. */
	dlaRoli: boolean
	title: HowToText
	description?: HowToText
	content: HowToText
	externalLink?: string
	externalLinkLabel?: HowToText
}

export const HOW_TO_SECTIONS: HowToSection[] = [
	{
		id: 'start-dashboard',
		dlaRoli: false,
		title: { pl: 'Start', en: 'Home dashboard' },
		description: { pl: 'Najważniejsze sprawy zespołu i Twojej pracy w jednym miejscu', en: 'Your work and the team’s priorities in one place' },
		content: { pl: 'Strona „Start” daje szybki obraz dnia: czas pracy, zadania, wnioski urlopowe, grafiki, komunikację i sprawy wymagające uwagi. Zakres informacji jest dopasowany do roli użytkownika oraz modułów planu, dzięki czemu każdy widzi przede wszystkim to, co pomaga mu działać.\n\nJeśli „Start” nie jest widoczny w menu, Administrator lub HR może włączyć go dla całego zespołu w Ustawieniach → Strona Start (pulpit główny).', en: 'The Home dashboard gives you a quick view of the day: work time, tasks, leave requests, schedules, communication, and items that need attention. Information is matched to the user’s role and the plan modules, so everyone sees what helps them act.\n\nIf Home is not visible in the sidebar, an Admin or HR user can enable it for the whole team under Settings → Home dashboard.' },
	},
	{
		id: 'login-session',
		dlaRoli: false,
		title: { pl: 'Logowanie i sesja', en: 'Login and Session' },
		description: { pl: 'Jak działa utrzymanie zalogowania', en: 'How login session persistence works' },
		content: { pl: 'Po zalogowaniu, przy regularnym korzystaniu z aplikacji, użytkownik pozostaje zalogowany. Jeśli jednak po zalogowaniu nastąpi dłuższa przerwa i wejście dopiero np. około 8. dnia, system może poprosić o ponowne zalogowanie. Wyjątkiem są też sytuacje ze słabym lub niestabilnym połączeniem internetowym - wtedy chwilowo może wystąpić problem z rozpoznaniem sesji i wykonaniem części działań w aplikacji.', en: 'After logging in, regular use of the application keeps the user logged in. If there is a longer break after login and the user returns only around day 8, the system may ask for login again. An exception is weak or unstable internet connection - in such cases there may be temporary issues with session recognition and performing some actions in the application.' },
	},
	{
		id: 'pwa-install',
		dlaRoli: false,
		title: { pl: 'Używaj jak aplikacji (telefon/komputer)', en: 'Use it like an app (mobile/computer)' },
		description: { pl: 'Szybciej, wygodniej i z powiadomieniami push', en: 'Short: faster, easier, and with push notifications' },
		content: { pl: 'Planopię możesz dodać do ekranu głównego telefonu lub zainstalować na komputerze jak zwykłą aplikację.\n\nZalety: szybkie otwieranie, wygodna praca bez szukania karty w przeglądarce i lepsze działanie powiadomień push.\n\nJak to zrobić: na telefonie wybierz „Dodaj do ekranu głównego”, a na komputerze „Zainstaluj aplikację”.\n\nInstrukcja krok po kroku jest w naszym krótkim wpisie blogowym:', en: 'You can add Planopia to your phone home screen or install it on your computer like a regular app.\n\nBenefits: faster opening, better daily workflow without browser tab switching, and improved push notification experience.\n\nHow to do it: on mobile choose "Add to Home Screen", and on computer choose "Install app".\n\nStep-by-step guide is in our short blog post:' },
		externalLink: 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
		externalLinkLabel: { pl: 'Jak zainstalować Planopię jako aplikację', en: 'How to install Planopia as an app' },
	},
	{
		id: 'edit-profile',
		dlaRoli: false,
		title: { pl: 'Edytuj profil', en: 'My Profile' },
		description: { pl: 'Zarządzanie własnymi danymi i bezpieczeństwem konta', en: 'Managing your personal data and account security' },
		content: { pl: 'W sekcji "Edytuj profil" możesz zaktualizować swoje dane, takie jak imię i nazwisko oraz stanowisko. Możesz też sprawdzić, jakie role masz przypisane w systemie. W razie potrzeby zmienisz tutaj również swoje hasło.', en: 'In the "My Profile" section, you can update your personal data such as first and last name and your position. You can also check which roles are assigned to your account. If needed, you can change your password here as well.' },
	},
	{
		id: 'leave-request',
		dlaRoli: false,
		title: { pl: 'Zgłoś urlop', en: 'Request Leave' },
		description: { pl: 'Zgłaszanie urlopów i nieobecności', en: 'Requesting leave and absences' },
		content: { pl: 'W „Zgłoś urlop” wypełniasz formularz: rodzaj urlopu, daty i liczbę dni lub godzin. Po wysłaniu przełożony, HR lub Admin dostaje maila i może zatwierdzić lub odrzucić wniosek.\n\n– Status wniosku śledzisz na tej samej stronie.\n– Obok filtra roku i miesiąca jest przycisk „Statystyki” — zobaczysz podsumowanie swoich wniosków i limity urlopów; stamtąd możesz też pobrać Excel lub PDF.', en: 'In “Request Leave”, fill in the type, dates, and number of days or hours. After submitting, your supervisor, HR, or Admin gets an email and can approve or reject.\n\n– Track status on the same page.\n– Next to the year/month filter, click “Statistics” for a summary of your requests and leave limits; you can also download Excel or PDF from there.' },
	},
	{
		id: 'timesheet',
		dlaRoli: false,
		title: { pl: 'Czas pracy', en: 'Timesheet' },
		description: { pl: 'Wypełnianie codziennej ewidencji czasu pracy', en: 'Filling in daily work time records' },
		content: { pl: 'Na stronie „Czas pracy” masz kalendarz miesięczny. Kliknij dzień, aby dodać lub zmienić wpis.\n\n– Prosty wpis: godziny od–do albo sama liczba godzin, plus ewentualne nadgodziny.\n– Rozbij dzień na czynności: gdy Admin lub HR dodały czynności w Ustawieniach — w formularzu zaznacz opcję i przypisz godziny do każdej czynności. Przy włączonym „Mierz wykonanie” możesz wpisać też wykonaną ilość (np. sztuki, m²).\n– Godziny do zadań z tablic: jeśli zespół ma moduł zadań — możesz przypisać godziny do wybranych zadań.\n– Filtry czynności i zadań (przy podsumowaniu miesiąca) zawężają widok kalendarza i liczone godziny.\n– Zaakceptowane urlopy i część nieobecności wpisują się do kalendarza same.', en: 'On “Timesheet” you have a monthly calendar. Click a day to add or edit an entry.\n\n– Simple entry: start/end times or hours only, plus overtime if needed.\n– Split by activities: when Admin or HR added activities in Settings — tick the option in the form and assign hours to each activity. With “Track quantity” enabled you can also enter amount done (e.g. pieces, m²).\n– Hours to board tasks: if your team has the tasks module — assign hours to selected tasks.\n– Activity and task filters (in the monthly summary) narrow the calendar view and counted hours.\n– Approved leave and some absences appear in the calendar automatically.' },
	},
	{
		id: 'timer',
		dlaRoli: false,
		title: { pl: 'Licznik czasu pracy', en: 'Work Time Counter' },
		description: { pl: 'Używanie licznika czasu pracy do śledzenia czasu pracy', en: 'Using work time counter to track work time' },
		content: { pl: 'Panel licznika jest na stronie „Czas pracy” (gdy Admin włączył go w Ustawieniach).\n\n– Start ręcznie albo skan QR — wejście startuje licznik, kolejny skan kończy pracę.\n– Przy starcie możesz wybrać czynność, zadanie z tablicy albo opis pracy z bieżącego miesiąca.\n– Po zatrzymaniu sesji — przy czynności z „Mierz wykonanie” możesz uzupełnić wykonaną ilość.\n– Czas trafia do ewidencji danego dnia. Sesje widać na liście pod kalendarzem.\n– Nadgodziny i przerwy są liczone osobno w szczegółach sesji.', en: 'The counter panel is on “Timesheet” (when Admin enabled it in Settings).\n\n– Start manually or scan QR — entry starts the counter, another scan ends work.\n– When starting you can pick an activity, a board task, or a work description from the current month.\n– After stopping — for activities with “Track quantity” you can fill in amount done.\n– Time goes to that day’s timesheet. Sessions appear in the list under the calendar.\n– Overtime and breaks are counted separately in session details.' },
	},
	{
		id: 'boards',
		dlaRoli: false,
		title: { pl: 'Tablice zadań', en: 'Task Boards' },
		description: { pl: 'Zarządzanie zadaniami', en: 'Managing tasks' },
		content: { pl: 'Tablice służą do prowadzenia zadań w kolumnach (do zrobienia, w trakcie, zrobione). Możesz dodawać zadania, przypisywać osoby i komentarze.\n\n– Jeśli zespół ma moduł zadań, w ewidencji czasu możesz też przypisywać godziny pracy do wybranych zadań z tablicy (obok czynności).', en: 'Boards help you manage tasks in columns (to do, in progress, done). You can add tasks, assign people, and comment.\n\n– If your team has the tasks module, in the timesheet you can also assign work hours to selected board tasks (alongside activities).' },
	},
	{
		id: 'schedule',
		dlaRoli: false,
		title: { pl: 'Grafiki', en: 'Schedules' },
		description: { pl: 'Planowanie grafików pracy', en: 'Planning work schedules' },
		content: { pl: 'Grafiki pozwalają na planowanie zmian i harmonogramów pracy. Gdy dodasz nowy dział w zespole, automatycznie tworzy się grafik dla tego działu. Możesz również tworzyć niestandardowe grafiki. W każdym grafiku możesz przypisywać pracowników do konkretnych dni i godzin pracy. Grafiki są widoczne tylko dla członków przypisanych do danego grafiku i pomagają w koordynacji pracy. Admin, HR i przełożony (z uprawnieniami) mogą zarządzać grafikami. Pracownicy widzą przypisane im zmiany w kalendarzu. W kalendarzach grafików widoczne są również zaakceptowane wnioski urlopowe, nieobecności oraz zgłoszenia nieobecności, które nie wymagają zatwierdzenia. Dodatkowo możesz zgłaszać dyspozycyjność i skorzystać z automatycznego generowania miesięcznego grafiku przez system. Na stronie grafiku dostępny jest też osobny panel AI grafiku: możesz opisać potrzeby i otrzymać propozycję szkicu miesiąca do wglądu lub zastosowania obok klasycznego auto-uzupełnienia.', en: 'Schedules allow you to plan shifts and work schedules. When you add a new department to the team, a schedule for that department is automatically created. You can also create custom schedules. In each schedule, you can assign employees to specific days and work hours. Schedules are visible only to members assigned to the schedule and help coordinate work. Admin, HR, and supervisors (with permissions) can manage schedules. Employees see their assigned shifts in the calendar. Schedule calendars also show approved leave requests, absences, and reported absences that do not require approval. You can also submit availability and use automatic monthly schedule generation by the system. On the schedule page there is also a dedicated AI schedule panel: describe what you need and get a proposed month draft to review or apply, alongside the rule-based auto-fill.' },
	},
	{
		id: 'chat',
		dlaRoli: false,
		title: { pl: 'Czat', en: 'Chat' },
		description: { pl: 'Komunikacja z zespołem', en: 'Team communication' },
		content: { pl: 'Czat umożliwia komunikację z zespołem w czasie rzeczywistym. Kanał ogólny dla całego zespołu jest automatycznie utworzony na starcie. Gdy dodasz nowy dział w zespole, automatycznie tworzy się kanał czatu dla tego działu. Możesz również tworzyć niestandardowe czaty z dowolnymi pracownikami oraz prowadzić czaty prywatne. Możesz wysyłać wiadomości, otrzymywać powiadomienia o nowych wiadomościach (w przeglądarce i email). Wszystkie wiadomości są zapisywane i dostępne w historii.', en: 'Chat enables real-time communication with your team. A general channel for the entire team is automatically created at the start. When you add a new department to the team, a chat channel for that department is automatically created. You can also create custom chats with any employees and have private chats. You can send messages, receive notifications about new messages (in browser and email). All messages are saved and available in history.' },
	},
	{
		id: 'ai-assistant',
		dlaRoli: false,
		title: { pl: 'AI Asystent', en: 'AI Assistant' },
		description: { pl: 'Pytania o czas pracy, urlopy, zadania, grafiki i zespół', en: 'Work time, leave, tasks, schedules and team data' },
		content: { pl: '– Odpowiedzi z danych Planopii na Twoim koncie (czas, urlopy, zadania, grafiki, zespół).\n– Okres u góry; Excel/PDF — przyciski z bazy pod odpowiedzią.\n– Eksport rozmowy: TXT z paska nad czatem.\n– Historia tylko w tej przeglądarce — na telefonie lub innym komputerze jej nie ma.\n– Bez zbędnych danych wrażliwych.\n– To nie porada prawna.', en: '– Answers from Planopia data on your account (time, leave, tasks, schedules, team).\n– Pick the period above; Excel/PDF — download buttons under the reply.\n– Export chat as TXT from the toolbar.\n– History stays in this browser only — it won’t appear on your phone or another computer.\n– Avoid unnecessary sensitive data.\n– Not legal advice.' },
	},
	{
		id: 'announcements',
		dlaRoli: false,
		title: { pl: 'Komunikaty', en: 'Announcements' },
		description: { pl: 'Szybkie ogłoszenia dla wybranych osób lub działów', en: 'Quick announcements for selected users or departments' },
		content: { pl: 'W sekcji "Komunikaty" możesz dodawać ważne informacje dla zespołu. Komunikat może być skierowany do wszystkich, konkretnego działu lub wybranych użytkowników. Możesz dodać tytuł, opis oraz załączniki. Odbiorcy dostaną powiadomienie email i push (jeśli mają je włączone).', en: 'In the "Announcements" section, you can add important information for your team. An announcement can target everyone, a specific department, or selected users. You can add a title, description, and attachments. Recipients get email and push notifications (if enabled).' },
	},
	{
		id: 'leave-planner',
		dlaRoli: false,
		title: { pl: 'Zaplanuj swój urlop', en: 'Plan your leave' },
		description: { pl: 'Planowanie urlopów w kalendarzu', en: 'Planning leave in calendar' },
		content: { pl: 'Kalendarz do planowania urlopów. Widać Twoje wnioski i nieobecności.\n\n– Przycisk „Statystyki” obok filtra okresu pokazuje podsumowanie wniosków i wykorzystane limity urlopów.', en: 'Calendar for planning leave. You see your requests and absences.\n\n– The “Statistics” button next to the period filter shows a summary of requests and used leave limits.' },
	},
	{
		id: 'leave-plans',
		dlaRoli: false,
		title: { pl: 'Plany urlopowe', en: 'Vacation plans' },
		description: { pl: 'Przeglądanie planów urlopowych wszystkich pracowników', en: 'Viewing vacation plans of all employees' },
		content: { pl: 'W sekcji "Plany urlopowe" widoczne są plany i zaakceptowane wnioski urlopowe wszystkich pracowników w zespole. Możesz filtrować kalendarz według konkretnego pracownika lub działu, co ułatwia planowanie i koordynację urlopów w zespole. Widzisz wszystkie zatwierdzone wnioski urlopowe i nieobecności, co pomaga w zarządzaniu dostępnością pracowników i unikaniu konfliktów terminów. W tej sekcji również dostępny jest Asystent terminu urlopu, który automatycznie sprawdza wybrany termin pod kątem nieobecności i świąt.', en: 'In the "Vacation plans" section, you can see plans and accepted leave requests of all employees in the team. You can filter the calendar by a specific employee or department, which facilitates planning and coordinating leaves in the team. You see all approved leave requests and absences, which helps manage employee availability and avoid date conflicts. This section also includes the Leave date assistant, which automatically checks the selected period for absences and holidays.' },
	},
	{
		id: 'settings',
		dlaRoli: true,
		title: { pl: 'Ustawienia zespołu', en: 'Team Settings' },
		description: { pl: 'Konfiguracja ustawień zespołu', en: 'Team settings configuration' },
		content: { pl: 'W Ustawieniach konfigurujesz zespół. Najważniejsze obszary:\n\n– Godziny pracy, weekendy i święta — wpływają na ewidencję i urlopy.\n– Ewidencja czasu → Czynności: dodajesz listę czynności (np. montaż, biuro). Możesz włączyć „Mierz wykonanie” i podać jednostkę (szt., m²) — wtedy w raportach widać też wydajność.\n– Typy urlopów i limity — gdy masz moduł urlopów w planie.\n– Licznik i QR — gdy plan obejmuje timer.\n– Pracownicy bez dostępu: konto bez logowania (wlicza się w limit miejsc). Możesz włączyć wpisy ewidencji za taką osobę; wnioski urlopowe za nią — w planie płatnym.', en: 'In Settings you configure the team. Main areas:\n\n– Work hours, weekends, holidays — affect timesheets and leave.\n– Work time records → Activities: add activities (e.g. assembly, office). Enable “Track quantity” and a unit (pcs, m²) to see efficiency in reports.\n– Leave types and limits — when your plan includes leave.\n– Timer and QR — when your plan includes the counter.\n– No-access employees: account without login (counts toward seat limit). You can enable timesheet entries on their behalf; leave requests for them — on paid plans.' },
	},
	{
		id: 'create-user',
		dlaRoli: true,
		title: { pl: 'Dodawanie użytkowników', en: 'Adding Users' },
		description: { pl: 'Tworzenie nowych użytkowników w zespole', en: 'Creating new users in the team' },
		content: { pl: 'Jako Admin możesz dodawać nowych użytkowników do zespołu w sekcji "Utwórz użytkownika". Podczas tworzenia użytkownika możesz przypisać mu jedną lub więcej ról: Admin (pełny dostęp), HR (dostęp do urlopów i ewidencji wszystkich), Przełożony (z konfigurowalnymi uprawnieniami), Pracownik (podstawowa rola). Możesz również przypisać użytkownika do działów i ustawić przełożonych. Hierarchia ról: Admin > HR > Przełożony > Pracownik.', en: 'As Admin, you can add new users to the team in the "Create User" section. When creating a user, you can assign one or more roles: Admin (full access), HR (access to leaves and timesheets of all), Supervisor (with configurable permissions), Worker (basic role). You can also assign users to departments and set supervisors. Role hierarchy: Admin > HR > Supervisor > Worker.' },
	},
	{
		id: 'team-management',
		dlaRoli: true,
		title: { pl: 'Zarządzanie zespołem i rolami', en: 'Team and Role Management' },
		description: { pl: 'Zarządzanie rolami, działami i logami użytkowników', en: 'Managing roles, departments and user logs' },
		content: { pl: 'W sekcji "Zarządzanie zespołem" możesz zarządzać rolami i działami. Możesz edytować role i działy użytkowników, konfigurować uprawnienia przełożonych, przeglądać opisy ról (Admin, HR, Przełożony, Pracownik) oraz przeglądać logi aktywności użytkowników. Admin ma zawsze pełny dostęp, niezależnie od konfiguracji. W tej sekcji znajdziesz również szczegółowe informacje o hierarchii ról i uprawnieniach.', en: 'In the "Team Management" section, you can manage roles and departments. You can edit user roles and departments, configure supervisor permissions, review role descriptions (Admin, HR, Supervisor, Worker), and view user activity logs. Admin always has full access, regardless of configuration. This section also contains detailed information about role hierarchy and permissions.' },
	},
	{
		id: 'timesheets-admin',
		dlaRoli: true,
		title: { pl: 'Ewidencja czasu pracy (Admin/HR/Przełożony)', en: 'Timesheets (Admin/HR/Supervisor)' },
		description: { pl: 'Przeglądanie ewidencji czasu pracy pracowników', en: 'Reviewing employee timesheets' },
		content: { pl: 'W „Ewidencji czasu pracy” widzisz kalendarze pracowników (Admin i HR — cały zespół; przełożony — według uprawnień).\n\n– Wybierz miesiąc, dział lub osobę. Kliknij pracownika, aby zobaczyć szczegóły miesiąca.\n– Filtry czynności i zadań zawężają dane i podsumowania (godziny wg czynności lub zadań).\n– Możesz edytować wpisy pracownika w jego kalendarzu.\n– Eksporty Excel i PDF — opis w sekcji „Raporty i eksporty”.', en: 'In “Work time records” you see employee calendars (Admin and HR — whole team; supervisor — per permissions).\n\n– Pick month, department, or person. Click an employee for month details.\n– Activity and task filters narrow data and summaries (hours by activity or task).\n– You can edit entries in the employee calendar.\n– Excel and PDF exports — see the “Reports and exports” section.' },
	},
	{
		id: 'leave-approval',
		dlaRoli: true,
		title: { pl: 'Zatwierdzanie urlopów (Admin/HR/Przełożony)', en: 'Leave Approval (Admin/HR/Supervisor)' },
		description: { pl: 'Zarządzanie wnioskami urlopowymi', en: 'Managing leave requests' },
		content: { pl: 'W „Wnioskach urlopowych” (menu boczne) przeglądasz wnioski zespołu, zatwierdzasz lub odrzucasz.\n\n– Filtruj okres, dział, pracownika i status.\n– Przycisk „Statystyki” obok filtra — podsumowanie wniosków, limity, typy urlopów; stamtąd Excel/PDF dla wybranych danych.\n– Na dole strony: przyciski Excel i PDF — raport urlopów całego zespołu za wybrany okres.\n– Przy jednym pracowniku (lista wniosków) też jest „Statystyki”.', en: 'In “Leave requests” (sidebar) you review team requests and approve or reject.\n\n– Filter period, department, employee, and status.\n– “Statistics” next to the filter — summary, limits, leave types; Excel/PDF from there.\n– At the bottom: Excel and PDF — team leave report for the selected period.\n– For one employee’s list there is also “Statistics”.' },
	},
	{
		id: 'packages-billing-legal',
		dlaRoli: true,
		title: { pl: 'Pakiety, rozliczenia i dokumenty prawne', en: 'Packages, billing & legal documents' },
		description: { pl: 'Core, Pro, Business, limity AI i dokumenty prawne', en: 'Core, Pro, Business, AI limits and legal documents' },
		content: { pl: '– Menu boczne → „Pakiety i rozliczenia” (ikona portfela).\n– U góry: aktualny plan zespołu i wykorzystanie limitu Asystenta AI (czat, grafik, drafty).\n– Plany: Core (konfiguracja — wielkość zespołu i moduły), gotowe pakiety Pro i Business.\n– Przełącz rozliczenie miesięczne/roczne, potem wybierz plan lub dokup wiadomości AI.\n– Płatność online: cykliczna subskrypcja kartą (Stripe) lub BLIK/przelew (Przelewy24) — w zależności od planu i dostępności; przy Stripe możesz też zarządzać kartą na tej stronie.\n– Gdy płatność online nie jest dostępna — formularz zgłoszenia mailem.\n– Dokupy wiadomości AI — przy aktywnej płatnej subskrypcji.\n– Na dole: dokumenty prawne (regulamin, polityka prywatności, DPA); przy nowej wersji — ostrzeżenie i akceptacja jednym przyciskiem.', en: '– Sidebar → “Packages & billing” (wallet icon).\n– At the top: current team plan and shared AI Assistant usage (chat, schedule, drafts).\n– Plans: Core (configure team size and modules), ready-made Pro and Business bundles.\n– Switch monthly/yearly billing, then pick a plan or buy extra AI messages.\n– Online payment: recurring card subscription (Stripe) or BLIK/bank transfer (Przelewy24) — depending on the plan and what is enabled; with Stripe you can manage your card on this page.\n– If online payment is unavailable — email request form.\n– Extra AI message packs — with an active paid subscription.\n– At the bottom: legal documents (terms, privacy, DPA); when a new version is required — warning and accept all in one step.' },
	},
	{
		id: 'reports-exports',
		dlaRoli: true,
		title: { pl: 'Raporty i eksporty', en: 'Reports and exports' },
		description: { pl: 'Excel i PDF — gdzie je znaleźć', en: 'Excel and PDF — where to find them' },
		content: { pl: 'Raporty nie mają osobnej strony — pobierasz je przyciskami w aplikacji.\n\nEwidencja czasu pracy (menu boczne):\n– Przewiń na dół listy kalendarzy.\n– Excel / PDF — raport zespołu (godziny, nadgodziny, urlopy w okresie).\n– Excel / PDF wg osób — zestawienie per pracownik.\n– Raport zadań i czynności — gdy są dane i filtry czynności lub zadań (godziny, ilości, wydajność).\n– Kalendarz jednej osoby → u góry PDF z podsumowaniem miesiąca.\n\nWnioski urlopowe (Admin, HR, przełożony z uprawnieniem):\n– Przewiń na dół strony.\n– Excel / PDF — raport urlopów zespołu (statusy, typy, podsumowania).\n– Przycisk „Statystyki” obok filtra roku — szybki podgląd; stamtąd też Excel/PDF.\n\nW planie darmowym: eksporty ewidencji działają; pełne wnioski urlopowe i ich raporty — po rozszerzeniu planu.', en: 'Reports have no separate page — download them with buttons in the app.\n\nWork time records (sidebar):\n– Scroll to the bottom of the calendar list.\n– Excel / PDF — team report (hours, overtime, leave in the period).\n– Excel / PDF by person — per employee.\n– Tasks and activities report — when data and activity/task filters exist (hours, quantities, efficiency).\n– One person’s calendar → PDF at the top with monthly summary.\n\nLeave requests (Admin, HR, approving supervisor):\n– Scroll to the bottom.\n– Excel / PDF — team leave report (statuses, types, summaries).\n– “Statistics” next to the year filter — quick view; Excel/PDF from there too.\n\nOn the free plan: timesheet exports work; full leave requests and their reports — after upgrading.' },
	},
	{
		id: 'help-center',
		dlaRoli: true,
		title: { pl: 'Centrum pomocy', en: 'Help Center' },
		description: { pl: 'Zgłaszanie problemów i kontakt z obsługą', en: 'Reporting issues and contacting support' },
		content: { pl: 'W sekcji "Centrum pomocy" możesz zgłaszać problemy z działaniem aplikacji, proponować usprawnienia lub poprosić o kontakt w sprawie zakupu lub przedłużenia pakietu. Tworzysz zgłoszenie, opisujesz problem lub potrzebę, możesz dołączyć załączniki (np. zrzuty ekranu). Wszystkie Twoje zgłoszenia są widoczne w liście "Twoje zgłoszenia" – możesz śledzić ich status (otwarte/zamknięte) i historię odpowiedzi zespołu wsparcia.', en: 'In the "Help Center" section, you can report issues with the application, suggest improvements, or request contact regarding purchasing or extending a subscription. You create a ticket, describe the issue or need, and can attach files (e.g., screenshots). All your tickets are visible in the "Your tickets" list – you can track their status (open/closed) and the response history from the support team.' },
	},
	{
		id: 'settings-personal',
		dlaRoli: true,
		title: { pl: 'Ustawienia', en: 'Settings' },
		description: { pl: 'Personalizacja ustawień użytkownika', en: 'Personalizing user settings' },
		content: { pl: 'W sekcji "Ustawienia" możesz personalizować własne preferencje. Na ten moment szczególnie ważne są ustawienia powiadomień push - możesz zdecydować, które typy powiadomień chcesz otrzymywać w przeglądarce, a które wyłączyć.', en: 'In the "Settings" section, you can personalize your own preferences. At the moment, push notification settings are especially important - you can decide which notification types you want to receive in your browser and which ones to disable.' },
	},
]

export function howToSectionsFor(dlaRoli: boolean): HowToSection[] {
	return HOW_TO_SECTIONS.filter(s => s.dlaRoli === dlaRoli)
}
