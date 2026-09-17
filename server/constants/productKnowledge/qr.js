// Źródło: models/QRCode.js (name, isActive), qrService.generateQRCode/checkQRCodePermission,
// client QRCodeGenerator.jsx (placeholder „Nazwa miejsca”), QRScan.jsx (login redirect, auto-register),
// timeEntryController.registerTimeEntry (ostatni wpis per qrCodeId → wyjście tym samym kodem; canStartTimerOnDate),
// freemiumApiPolicyService (/api/qr zablokowane w planie darmowym), planCatalog.MODULE_API_PREFIXES.timer_qr.
// Grep po „geolocation|latitude|GPS” w client i server: 0 wyników.
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

### Ograniczenia, o których warto wiedzieć
- Wyjście trzeba zeskanować tym samym kodem, którym było wejście; skan innego kodu przy otwartej sesji nie zamyka jej.
- Skan nie zadziała, gdy zespół nie pracuje w weekendy (a to weekend), w święto albo w dniu zaakceptowanego urlopu pracownika.
- Rejestracja jest zawsze na koncie zalogowanej osoby — każdy pracownik skanuje własnym telefonem (ma własne konto).

### Czego NIE robi
- **Nie sprawdza lokalizacji GPS** ani tego, gdzie fizycznie znajduje się telefon — kod można zeskanować z dowolnego miejsca, jeśli ktoś ma jego obrazek. Kontrolą jest fizyczne umieszczenie wydruku na obiekcie.
- Nie ma trybu kiosku (wspólny tablet przy wejściu, na którym pracownicy kolejno się „odbijają”) ani kart RFID/NFC.
- Nie działa w planie darmowym.

### Dostępność w planach
W okresie próbnym: tak. Plan Core: wymaga modułu Timer + QR ({{price.module.timer_qr}} zł netto/mies.). Pakiety Pro i Business: w cenie. Plan darmowy: nie.

### Gdzie w aplikacji / kto może
Tworzenie i wydruk kodów: menu → Ustawienia → Licznik i QR (Administrator, HR). Skanowanie: aparat telefonu → strona /qr-scan (każdy zalogowany pracownik). Sesje: menu → Czas pracy, lista pod kalendarzem.`,
		en: null,
	},
}
