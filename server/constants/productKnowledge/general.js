// Źródło: TutorialModal (start-dashboard, login-session, pwa-install, edit-profile, freemium-overview),
// teamController.registerTeam, planCatalog.TRIAL, freemiumApiPolicyService, legal-documents/PRIVACY.md.
module.exports = {
	id: 'general',
	order: 0,
	title: { pl: 'Planopia — ogólnie', en: 'Planopia — overview' },
	summary: {
		pl: 'Co to jest, dla kogo, jak zacząć: rejestracja, okres próbny, plan darmowy, telefon, role.',
		en: 'What it is, who it is for, how to start: sign-up, trial, free plan, mobile, roles.',
	},
	keywords: {
		pl: ['co to jest', 'czym jest', 'dla kogo', 'jak zacząć', 'od czego zacząć', 'pierwsze kroki', 'rejestr', 'załóż', 'założy', 'konto', 'trial', 'próbn', 'darmow', 'bezpłatn', 'freemium', 'telefon', 'komórk', 'pwa', 'zainstal', 'instalac', 'app store', 'google play', 'sklep', 'logow', 'hasło', 'hasła', 'sesj', 'profil', 'język', 'angiel', 'rodo', 'gdpr', 'dane osobowe', 'serwer', 'bezpiecz', 'pulpit', ' start ', 'dashboard', 'przeglądar'],
		en: ['what is', 'who is it for', 'get started', 'first steps', 'sign up', 'register', 'account', 'trial', 'free', 'freemium', 'phone', 'mobile', 'pwa', 'install', 'app store', 'google play', 'login', 'log in', 'password', 'profile', 'language', 'gdpr', 'personal data', 'server', 'security', 'dashboard', 'browser'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Od czego zacząć po założeniu zespołu?', 'Co zostaje za darmo po okresie próbnym?', 'Czy działa na telefonie?', 'Gdzie są przechowywane dane?'],
		en: ['Where do I start after creating a team?', 'What stays free after the trial?', 'Does it work on a phone?', 'Where is the data stored?'],
	},
	body: {
		pl: `### Co to jest
Planopia to aplikacja webowa dla firm do ewidencji czasu pracy, wniosków urlopowych, grafików (harmonogramów zmian), zadań (tablice Kanban), czatu i komunikatów, z asystentem AI. Działa w przeglądarce na komputerze i telefonie; można ją zainstalować jak zwykłą aplikację (PWA). Dane każdej firmy są odizolowane od innych. Interfejs jest po polsku i po angielsku.

### Jak zacząć
- Rejestracja zespołu: {{app.url}}/team-registration — podajesz nazwę firmy (zespołu), imię, nazwisko i e-mail. Osoba zakładająca zostaje Administratorem. Bez karty płatniczej.
- Okres próbny: {{trial.days}} dni pełnej aplikacji (wszystkie moduły) dla zespołu do {{trial.maxUsers}} osób, z pulą {{trial.aiMessages}} wiadomości asystenta AI.
- Pierwsze kroki po założeniu zespołu (lista widoczna nad ewidencją): dodaj pracowników, ustaw godziny pracy i święta, wpisz pierwszy dzień pracy.
- Nowy zespół startuje od strony „Czas pracy” (ewidencja). Strona „Start” (pulpit) jest w nowych zespołach domyślnie wyłączona — włącza ją Administrator w Ustawieniach (patrz niżej).

### Plan darmowy (po okresie próbnym)
Po {{trial.days}} dniach, jeśli zespół nie wybierze pakietu, zostaje na bezpłatnym planie bezterminowo:
- działa: ewidencja czasu pracy (kalendarz miesięczny, wpisy ręczne, czynności, eksport PDF/Excel), edycja profilu; dla Administratora/HR: listy ewidencji zespołu, zarządzanie zespołem, ustawienia (weekendy, święta, godziny pracy, czynności, pracownicy bez dostępu), pakiety i rozliczenia;
- limit: {{trial.maxUsers}} aktywnych kont;
- nie działa: licznik czasu i kody QR, składanie wniosków urlopowych, grafiki, zadania, czat, komunikaty, asystent AI z danymi zespołu, strona Start.
- Jeśli zespół ma więcej niż {{trial.maxUsers}} kont, aplikacja jest zablokowana dla wszystkich poza Administratorem i HR, którzy widzą tylko zarządzanie zespołem i pakiety — trzeba zmniejszyć zespół do {{trial.maxUsers}} kont albo wykupić pakiet. Dane nie znikają.

### Strona Start (pulpit)
Źródło: dashboardSummaryService. Domyślnie wyłączona w nowych zespołach; Administrator włącza ją w Ustawieniach → „Strona Start”. Dostępna w okresie próbnym i planach płatnych, nie w planie darmowym. Po włączeniu jest pierwszą stroną po zalogowaniu i pokazuje (zawsze w granicach roli i uprawnień):
- **Dziś**: własny wpis dnia (godziny, nadgodziny, nieobecność, notatka, stan zatwierdzenia) i uruchomiony licznik (od kiedy, czy przerwa/nadgodziny, opis pracy).
- **Mój miesiąc**: suma godzin i nadgodzin, liczba dni z wpisami, dni zatwierdzone i odrzucone.
- **Zespół w tym miesiącu** (Administrator, HR, przełożony w swoim zakresie): sumy godzin i nadgodzin, ile osób ma wpis, aktywne liczniki oraz **kto dziś nie ma jeszcze wpisu** (bez osób na urlopie i w dni wolne).
- **Urlopy**: wnioski czekające na decyzję (u osób, które zatwierdzają) z podglądem, nadchodzące urlopy w zespole, własne pule dni.
- **Zadania** (gdy moduł włączony): otwarte zadania, wysoki priorytet, z terminem w najbliższych dniach.
- **Grafik** (gdy moduł włączony): dzisiejsze zmiany w zasięgu użytkownika, własne najbliższe zmiany, liczba wpisów roboczych (szkic).
- **Komunikacja**: nieprzeczytane powiadomienia, komunikaty i wiadomości na czacie.
- **Szybkie akcje**: „Uzupełnij czas pracy”, „Zgłoś urlop” / „Sprawdź wnioski”, zadania, grafiki, asystent AI, a dla Administratora/HR „Pakiety i rozliczenia”.
Pulpit tylko pokazuje dane — wpisy, wnioski i zadania dodaje się na właściwych stronach (skróty prowadzą prosto tam).

### Telefon i instalacja
Na telefonie: otwórz stronę aplikacji w przeglądarce i wybierz „Dodaj do ekranu głównego”; na komputerze „Zainstaluj aplikację”. Zainstalowana wersja otwiera się szybciej i lepiej obsługuje powiadomienia push. Nie ma osobnej aplikacji w App Store / Google Play — PWA zastępuje ją.

### Logowanie i sesja
Logowanie e-mailem i hasłem; przy regularnym korzystaniu użytkownik zostaje zalogowany, po ok. tygodniu przerwy aplikacja poprosi o ponowne logowanie. Nowy pracownik dostaje e-mail z linkiem do ustawienia własnego hasła. Reset hasła: „Nie pamiętam hasła” na stronie logowania.

### Role (w skrócie)
Administrator (pełny dostęp), HR (urlopy i ewidencja całego zespołu, grafiki, pakiety), Przełożony (zatwierdzanie urlopów, podgląd ewidencji i grafik dla swojego działu lub wybranych osób — zakres ustawia Administrator), Pracownik (własna ewidencja, wnioski, zadania, czat). Jedna osoba może mieć kilka ról. Szczegóły w module „Ustawienia i role”.

### Dane i bezpieczeństwo
Dane są przechowywane na serwerach w USA (Oregon) na podstawie Standardowych Klauzul Umownych (SCC) zgodnie z RODO; między firmą a Planopią zawierana jest umowa powierzenia (DPA) — dokumenty prawne są w aplikacji w Pakietach i rozliczeniach. Logowanie tokenami, hasła szyfrowane, połączenie HTTPS. Do asystenta AI (OpenAI) trafiają tylko pytanie i dane w granicach uprawnień pytającego.

### Czego NIE robi
- Nie ma natywnej aplikacji w sklepach (jest PWA).
- Nie prowadzi kadr i płac (nie liczy wynagrodzeń, nie wysyła deklaracji ZUS/PIT) i nie integruje się z programami kadrowo-płacowymi.
- Nie rozlicza delegacji ani floty.
- Nie ma logowania kontem Google/Microsoft (SSO).
- Strona Start nie ma własnych wykresów do eksportu ani konfigurowalnych widżetów — zestaw bloków jest stały, zależny od roli i włączonych modułów.

### Gdzie w aplikacji / kto może
Rejestracja: {{app.url}}/team-registration (każdy). Ustawienia zespołu: menu → Ustawienia (Administrator, HR). Pakiety: menu → Pakiety i rozliczenia (Administrator, HR). Pomoc: menu → Centrum pomocy (Administrator) albo e-mail biuro@planopia.pl.`,
		en: null,
	},
}
