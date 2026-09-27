// Źródło: models/QRCode.js (name, isActive), qrService.generateQRCode/checkQRCodePermission,
// client QRCodeGenerator.jsx (placeholder „Nazwa miejsca”), QRScan.jsx (login redirect, auto-register),
// timeEntryController.registerTimeEntry (ostatni wpis per qrCodeId → wyjście tym samym kodem; canStartTimerOnDate),
// freemiumApiPolicyService (/api/qr zablokowane w planie darmowym), planCatalog.MODULE_API_PREFIXES.timer_qr.
// Lokalizacja: utils/qrGeoCheck.js (polityki, tolerancja, zapis bez współrzędnych), QRCodeGeoSettings.jsx, QRScan.jsx.
// Stop licznika z kodu chronionego: workdayController.stopTimer (QR_EXIT_REQUIRED).
// Wyjście tylko przy działającym liczniku z tego kodu: utils/qrTimeEntry.isQrExit (bez podwójnego liczenia godzin).
// Filtr miejsca QR: client utils/workQrPlaceFilter (restrictWorkdaysToQrPlaces), QrPlaceFilterBar, UserCalendar/MonthlyCalendar.
// Widok weryfikacji: Workday.timeEntries[].qrVerify, WorkSessionList.jsx (plakietki, filtry), UserCalendar.jsx (raport PDF/Excel).
module.exports = {
	id: 'qr',
	order: 2,
	title: { pl: 'Kody QR — wejście i wyjście', en: 'QR codes — clock in / clock out' },
	summary: {
		pl: 'Skan kodu aparatem telefonu rejestruje wejście i wyjście; wiele kodów z nazwą miejsca (np. budowa, biuro).',
		en: 'Scanning a code with the phone camera registers clock-in and clock-out; many codes, each named after a place.',
	},
	keywords: {
		pl: [' qr', ' kod ', ' kodu', ' kody', ' kodów', ' kodem', 'skan', 'budow', 'lokalizac', 'obiekt', 'oddział', 'wejści', 'wyjści', 'aparat', 'telefon', 'wydruk', 'gps', 'kiosk', 'tablet', 'rfid', 'nfc', 'odbij', 'odbić'],
		en: [' qr', 'scan', 'site', 'location', 'branch', 'clock in', 'clock out', 'clock-in', 'camera', 'phone', 'print', 'gps', 'kiosk', 'tablet', 'rfid', 'nfc', 'badge'],
	},
	requires: { modules: ['timer_qr'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Czy kod QR skanuje się zwykłym telefonem?', 'Czy mogę mieć osobne kody na każdą budowę lub oddział?', 'Czy QR sprawdza lokalizację GPS?', 'Co się dzieje po zeskanowaniu kodu?'],
		en: ['Can the QR code be scanned with a regular phone?', 'Can I have separate codes for each site or branch?', 'Does QR check GPS location?', 'What happens after scanning a code?'],
	},
	body: {
		pl: `### Jak działa
- Administrator lub HR tworzy kody w Ustawieniach → Licznik i QR. Kodów może być **dowolnie wiele**, każdy z własną **nazwą miejsca** (np. „Budowa Kraków, ul. Długa”, „Biuro główne”, „Wejście A”). Kod to obrazek do wydruku lub pobrania; nieużywany kod można dezaktywować.
- Pracownik skanuje kod **aparatem swojego telefonu** (zwykła aplikacja aparatu lub czytnik QR — Planopia nie ma własnego skanera). Otwiera się strona Planopii; jeśli pracownik nie jest zalogowany, loguje się i skan jest dokończony automatycznie. Wygodniej z zainstalowaną Planopią (PWA), ale nie jest to wymagane.
- Pierwszy skan danego dnia = **wejście**: startuje licznik czasu pracy. Kolejny skan **tego samego kodu** = **wyjście**: licznik się zatrzymuje, a sesja (od–do, miejsce) trafia do ewidencji tego dnia. Przy sesji widać „Miejsce QR: nazwa kodu”.
- Godziny z sesji liczą się do wpisu dnia jak przy ręcznym liczniku (nadgodziny i przerwy w szczegółach sesji).
- Wymaga włączonego licznika w Ustawieniach zespołu (Administrator/HR).

### Kod na ekranie (tablet przy wejściu) — ochrona przed zdjęciem kodu
Każdy kod ma w Ustawieniach → Licznik i QR wybór „Sposób użycia kodu”:
- **Wydruk** — domyślnie, jak dotąd. Prosto, ale zdjęcie wydruku działa z każdego miejsca.
- **Tylko ekran (tablet)** — kod wyświetla tablet (lub dowolne urządzenie z przeglądarką) przy wejściu i **zmienia się co 30 sekund**. Zdjęcie zrobione wcześniej nie zadziała, wydruk nie jest przyjmowany. Administrator klika „Otwórz wyświetlacz” (albo kopiuje link) i otwiera go na tablecie — **tablet nie loguje się** kontem pracownika; link można w każdej chwili unieważnić przyciskiem „Nowy link”. Wyświetlacz ma pełny ekran i nie pozwala ekranowi zgasnąć (jeśli przeglądarka to wspiera); przy chwilowym braku internetu kod nadal się zmienia.
- **Ekran + wydruk** — preferowany kod z ekranu, ale wydruk nadal działa (np. gdy tablet jest wyłączony); taka sesja ma plakietkę „Skan z wydruku”.
- Pracownik skanuje kod z ekranu tak samo, aparatem telefonu. Jeśli musi się zalogować, ma na to 10 minut od skanu — nie trzeba skanować ponownie. Ten jeden skan wystarcza na jedno zdarzenie (wejście albo wyjście), nie na oba.
- To utrudnia oszukiwanie „ze zdjęcia z domu”, ale nie zapobiega zmowie (ktoś na miejscu przesyła zdjęcie ekranu od razu).

### Lokalizacja przy skanie (opcjonalnie, per kod)
Każdy kod ma w Ustawieniach → Licznik i QR wybór „Lokalizacja przy skanie”. Działa z wydrukiem i z ekranem:
- **Wyłączona** — domyślnie, jak dotąd.
- **Tylko zapisuj** — telefon pracownika podaje lokalizację **raz, w chwili skanu**; zapisujemy wynik (w miejscu / ile metrów od miejsca / brak zgody / brak sygnału). Nic nie jest blokowane.
- **Oznaczaj nietypowe** — skan przechodzi, ale skan poza miejscem, bez zgody na lokalizację albo bez sygnału jest oznaczony.
- **Blokuj poza miejscem** — przyjmowany jest tylko skan w obrębie miejsca; bez zgody na lokalizację skan jest odrzucany z informacją, co zrobić.
- Pozycję miejsca Administrator/HR ustawia przyciskiem „Użyj mojej pozycji”, stojąc na miejscu (z potwierdzeniem), albo wkleja współrzędne z mapy (np. z Google Maps). Promień do wyboru: od 50 m do 2 km (domyślnie 150 m). Słaby sygnał jest uwzględniany z tolerancją.
- Przed pytaniem przeglądarki o zgodę pracownik widzi krótką informację, że lokalizacja jest zapisywana jednorazowo, bez śledzenia. **Nie zapisujemy współrzędnych pracownika** — tylko wynik i odległość.
- Gdy licznik został włączony kodem z ekranem albo z lokalizacją, zakończyć go można tylko skanem przy wyjściu (nie przyciskiem Stop). „Zapisz sesję i kontynuuj” (np. zmiana czynności) działa, ale sesji z takiego kodu pracownik nie usunie sam — korektę robi przełożony lub administrator.
- Czynność z pomiarem wykonania przy liczniku z QR: czynność i ilość (np. 8 szt.) ustawia się w panelu licznika w trakcie pracy — ilość zapisuje się od razu i trafia do sesji przy wyjściu skanem.
- Lokalizację podaje telefon lub przeglądarka pracownika, więc da się ją sfałszować (aplikacją na telefonie albo narzędziami przeglądarki na komputerze). Przy kodzie z wydruku to utrudnienie, nie dowód; najmocniejsze jest połączenie z **kodem na ekranie**, bo wtedy trzeba też mieć świeży kod z tabletu.

### Gdzie widać wynik weryfikacji
- **Lista sesji** (Czas pracy pod kalendarzem; u Administratora/HR/przełożonego w kalendarzu pracownika): obok „QR: miejsce” plakietki „W miejscu”, „Poza miejscem · 1,2 km”, „Bez zgody na lokalizację”, „Brak lokalizacji”, „Kod z ekranu” / „Skan z wydruku” (z dopiskiem, czy dotyczy wejścia czy wyjścia); po najechaniu lub rozwinięciu — szczegóły wejścia i wyjścia. Pracownik widzi to samo przy swoich sesjach.
- **Filtr miejsca QR** (panel podsumowania obok filtrów czynności i zadań — w kalendarzu pracownika u Administratora/HR/przełożonego i w „Czas pracy” pracownika): po wybraniu np. „Budowa A” kalendarz, podsumowanie miesiąca (godziny, dni, nadgodziny), lista sesji i raport PDF/Excel liczą się tylko z sesji ze skanów tego miejsca. Wpisy ręczne i urlopy nie są wtedy liczone. Raport z jednej budowy: wybierz miejsce i wyeksportuj; dla drugiej — zmień filtr i wyeksportuj ponownie. Nagłówek raportu pokazuje wybrane miejsce.
- **W kalendarzu** przy „Czas pracy: 08:00–16:00” widać miejsce (np. „· Budowa A”), a ⚠ przy nietypowym skanie. Miejsce nie jest dopisywane do uwag dnia.
- **Filtr listy sesji** „Tylko nietypowe skany” (poza miejscem, bez lokalizacji, z wydruku zamiast ekranu).
- **Raport pracownika PDF i Excel** (kalendarz pracownika → eksport): sekcja / arkusz „Skany QR — weryfikacja” z datą, godzinami, miejscem, wejściem, wyjściem i kolumną „Nietypowe”.
- Weryfikacja trafia do sesji w chwili wyjścia skanem; sesje sprzed włączenia funkcji nie mają plakietek.

### Ograniczenia, o których warto wiedzieć
- Wyjście trzeba zeskanować tym samym kodem, którym było wejście; skan innego kodu przy otwartej sesji nie zamyka jej.
- Gdy działa licznik uruchomiony ręcznie (przyciskiem Start), skan wejścia jest odrzucany z komunikatem „Licznik już działa” — najpierw trzeba zakończyć licznik.
- Godziny liczy sesja licznika. Jeśli licznik z kodu QR zatrzymano przyciskiem Stop (dotyczy zwykłego wydruku bez lokalizacji), kolejny skan tego kodu jest nowym wejściem — czas nie liczy się podwójnie.
- Skan nie zadziała, gdy zespół nie pracuje w weekendy (a to weekend), w święto albo w dniu zaakceptowanego urlopu pracownika.
- Rejestracja jest zawsze na koncie zalogowanej osoby — każdy pracownik skanuje własnym telefonem (ma własne konto).

### Czego NIE robi
- **Nie śledzi pracowników** — lokalizacja (jeśli włączona przy kodzie) jest odczytywana tylko w chwili skanu, nie w trakcie pracy. Bez włączonej lokalizacji kod z **wydruku** można zeskanować z dowolnego miejsca, jeśli ktoś ma jego zdjęcie; chronią przed tym **kod na ekranie** i **lokalizacja przy skanie**.
- Nie ma geofencingu w tle, map przejazdów ani lokalizacji przy ręcznym liczniku start/stop (tylko przy skanie QR).
- Tablet w trybie ekranu tylko wyświetla kod — pracownicy nadal skanują własnymi telefonami. Nie ma trybu kiosku, w którym tablet sam skanuje pracowników, ani kart RFID/NFC.
- Nie działa w planie darmowym.

### Dostępność w planach
W okresie próbnym: tak. Plan Core: wymaga modułu Timer + QR ({{price.module.timer_qr}} zł netto/mies.). Pakiety Pro i Business: w cenie. Plan darmowy: nie.

### Gdzie w aplikacji / kto może
Tworzenie i wydruk kodów: menu → Ustawienia → Licznik i QR (Administrator, HR). Skanowanie: aparat telefonu → strona /qr-scan (każdy zalogowany pracownik). Sesje: menu → Czas pracy, lista pod kalendarzem.`,
		en: null,
	},
}
