/**
 * Kanoniczna baza wiedzy o działaniu Planopii — jedno źródło dla asystenta w aplikacji i czatu na landingu.
 *
 * Zasady:
 * - każdy moduł opisuje RZECZYWISTE działanie (przy sekcjach komentarz „Źródło: plik/funkcja”),
 *   ma obowiązkowe sekcje „Czego NIE robi” i „Gdzie w aplikacji” (pilnuje test),
 * - liczby z cennika NIE są wpisywane ręcznie — tylko placeholdery {{…}} renderowane z planCatalog.js
 *   (utils/productKnowledgeRender.js); test wykrywa nieznane placeholdery i rozjazd z katalogiem,
 * - treść PL jest kanoniczna; `body.en: null` = model dostaje PL z instrukcją odpowiadania po angielsku,
 * - landing dostaje wygenerowany plik (scripts/build-product-knowledge.mjs) — po edycji uruchom
 *   `npm run knowledge:build`; CI sprawdza `knowledge:check`.
 *
 * Zmiana zachowania modułu w kodzie = aktualizacja odpowiedniego pliku tutaj, w tym samym commicie.
 */
const modules = [
	require('./general'),
	require('./timeTracking'),
	require('./qr'),
	require('./leave'),
	require('./schedules'),
	require('./tasks'),
	require('./chat'),
	require('./settingsRoles'),
	require('./packages'),
	require('./ai'),
].sort((a, b) => a.order - b.order)

/** Wspólny dla obu czatów blok „czego Planopia nie ma” — żeby model nie zmyślał funkcji. */
const NOT_AVAILABLE_PL = `### Czego Planopia nie ma (wspólne dla wszystkich modułów)
- lokalizacji GPS, geofencingu ani śledzenia telefonu — także przy kodach QR,
- kadr i płac (wynagrodzenia, ZUS, PIT) ani integracji z programami kadrowo-płacowymi,
- natywnej aplikacji w App Store / Google Play (jest PWA instalowana z przeglądarki),
- logowania kontem Google/Microsoft, importu pracowników z pliku, kart RFID/NFC, trybu kiosku,
- delegacji, floty, magazynu, CRM, fakturowania klientów,
- SMS-ów, rozmów głosowych/wideo, integracji ze Slackiem, Teams, Jirą, Trello,
- automatycznego liczenia wymiaru urlopu z Kodeksu pracy ani pilnowania norm odpoczynku w grafiku,
- eksportu grafiku do PDF/Excela (eksporty są dla ewidencji i urlopów),
- pakietu „Enterprise” w publicznym cenniku (powyżej Business: wycena indywidualna).
Jeśli użytkownik pyta o coś z tej listy — powiedz wprost, że tego nie ma, i zaproponuj najbliższe działające rozwiązanie albo kontakt (biuro@planopia.pl).`

module.exports = { modules, NOT_AVAILABLE_PL }
