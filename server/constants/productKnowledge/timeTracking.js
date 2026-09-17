// Źródło: TutorialModal (timesheet, timer, timesheets-admin, reports-exports), models/Settings.js
// (workHours, workActivities, workdayEntriesOnlyToday, allowManagedWorkdayEntries), workdayController.
module.exports = {
	id: 'timeTracking',
	order: 1,
	title: { pl: 'Czas pracy — ewidencja i licznik', en: 'Work time — timesheet and timer' },
	summary: {
		pl: 'Kalendarz miesięczny, wpisy ręczne, licznik start/stop, czynności i wydajność, potwierdzanie miesiąca, eksporty.',
		en: 'Monthly calendar, manual entries, start/stop timer, activities and output, month confirmation, exports.',
	},
	keywords: {
		pl: ['ewidencj', 'czas pracy', 'czasu pracy', 'czasie pracy', 'godziny pracy', 'godzin pracy', 'ile godzin', 'wpis', 'licznik', 'timer', 'stoper', 'start i stop', 'nadgodzin', 'nieobecnoś', 'czynnoś', 'wydajnoś', 'wykonan', 'potwierdz', 'zatwierdz dzień', 'eksport', 'excel', 'pdf', 'raport', 'przerw', 'tylko dziś', 'kalendarz'],
		en: ['timesheet', 'time tracking', 'work time', 'working hours', 'hours worked', 'entry', 'entries', 'timer', 'overtime', 'absence', 'activit', 'output', 'productivity', 'confirm', 'export', 'excel', 'pdf', 'report', 'break', 'calendar'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Jak pracownik wpisuje swój czas pracy?', 'Czy da się rozbić dzień na czynności i mierzyć wydajność?', 'Jak wyeksportować ewidencję do Excela lub PDF?', 'Jak działa licznik czasu pracy?'],
		en: ['How does an employee log their work time?', 'Can a day be split into activities with measured output?', 'How do I export the timesheet to Excel or PDF?', 'How does the work timer work?'],
	},
	body: {
		pl: `### Jak działa ewidencja
- Strona „Czas pracy” to kalendarz miesięczny. Klikasz dzień i dodajesz wpis: godziny od–do albo sama liczba godzin, plus ewentualne nadgodziny i notatka. Administrator/HR mogą ustawić standardowe godziny pracy (np. 8:00–16:00) jako szybkie wybory w formularzu.
- Nieobecności i zaakceptowane urlopy wpisują się do kalendarza same.
- Czynności: gdy Administrator/HR dodali w Ustawieniach listę czynności (np. montaż, biuro, transport), wpis dnia można rozbić na czynności z godzinami. Dla czynności z włączonym „Mierz wykonanie” podajesz też ilość w jednostce (szt., m², kg…) — raporty pokazują wtedy wydajność (ilość na godzinę).
- Godziny do zadań: jeśli zespół ma moduł zadań, godziny dnia można przypisać do konkretnych zadań z tablicy.
- Podsumowanie miesiąca pod kalendarzem; filtry czynności i zadań zawężają widok i liczone godziny.
- Opcja „wpisy tylko dziś” (Ustawienia): pracownicy mogą dodawać i edytować wpisy wyłącznie na bieżący dzień.

### Licznik czasu pracy
- Panel licznika jest na stronie „Czas pracy”, gdy Administrator włączył go w Ustawieniach (Licznik i QR).
- Start ręcznie albo skanem kodu QR (patrz moduł QR). Przy starcie można wybrać czynność, zadanie z tablicy lub opis pracy.
- Stop kończy sesję; czas trafia do wpisu dnia, sesje są widoczne pod kalendarzem, nadgodziny i przerwy liczone osobno w szczegółach sesji.
- Licznik i QR wymagają modułu Timer + QR ({{price.module.timer_qr}} zł netto/mies. do planu Core) albo pakietu Pro/Business; w okresie próbnym są dostępne, w planie darmowym nie.

### Podgląd i potwierdzanie (Administrator, HR, przełożony)
- „Ewidencja czasu pracy” w menu: kalendarze pracowników — Administrator i HR widzą cały zespół, przełożony swój dział lub wybrane osoby (wg uprawnień). Filtr miesiąca, działu, osoby.
- Uprawniona osoba może edytować wpisy pracownika w jego kalendarzu, zatwierdzać lub odrzucać dni (zielone/czerwone) i potwierdzać cały miesiąc.
- Pracownicy bez dostępu do aplikacji: po włączeniu w Ustawieniach uprawnieni użytkownicy prowadzą ewidencję za osoby, które same nie logują się (patrz „Ustawienia i role”).

### Raporty i eksporty
- Ewidencja zespołu: na dole listy kalendarzy — Excel/PDF raport zespołu (godziny, nadgodziny, urlopy w okresie), Excel/PDF wg osób, raport zadań i czynności (godziny, ilości, wydajność), gdy są dane.
- Kalendarz jednej osoby: u góry PDF z podsumowaniem miesiąca.
- Własna ewidencja: pracownik pobiera PDF/Excel swojego miesiąca ze strony „Czas pracy”.
- Eksporty ewidencji działają także w planie darmowym.

### Czego NIE robi
- Nie śledzi lokalizacji GPS ani aktywności na komputerze (nie ma zrzutów ekranu, monitoringu aplikacji).
- Nie ma osobnego modułu przerw poza tymi liczonymi w sesji licznika.
- Nie liczy wynagrodzeń z godzin — daje dane do rozliczenia (godziny, nadgodziny), nie kwoty.
- Nie importuje danych z innych systemów ani z plików.

### Gdzie w aplikacji / kto może
Własna ewidencja: menu → Czas pracy (każdy). Ewidencja zespołu: menu → Ewidencja czasu pracy (Administrator, HR, przełożony z uprawnieniem „podgląd ewidencji”). Czynności, godziny pracy, licznik: menu → Ustawienia (Administrator, HR).`,
		en: null,
	},
}
