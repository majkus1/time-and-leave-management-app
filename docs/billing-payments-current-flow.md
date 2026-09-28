# Planopia - obecny flow platnosci (P24) i kontekst pod Stripe

Ten dokument opisuje aktualny stan implementacji platnosci w Planopia (na dzien dzisiejszy: Przelewy24 + fallback mailowy), z naciskiem na:
- realny przeplyw end-to-end,
- miejsca w kodzie, ktore trzeba zachowac przy dodawaniu Stripe recurring,
- ograniczenia biznesowe i techniczne.

## 1) Co dziala teraz

- Produkcyjna bramka online: `Przelewy24` (P24), uruchamiana z widoku `Packages`.
- Fallback, gdy P24 nie jest gotowe (np. brak webhook URL): zamowienie mailowe do obslugi.
- Typy zakupu:
  - `plan` (`starter|pro|business|enterprise`, `monthly|annual`),
  - `addon` (`ai50|ai200|ai500`).
- Po potwierdzeniu platnosci przez webhook P24:
  - aktywacja planu (ustawienie okresu subskrypcji),
  - albo doladowanie pakietu AI.

## 2) Wejscie po stronie frontend

- Glowny ekran: `client/src/components/billing/PackagesPage.jsx`.
- Warstwa API hookow: `client/src/hooks/useBilling.js`.

Najwazniejsze endpointy FE -> API:
- `GET /api/billing/catalog`
- `GET /api/billing/entitlements`
- `GET /api/billing/p24/status`
- `PATCH /api/billing/team-invoice`
- `POST /api/billing/p24/checkout` (online P24)
- `POST /api/billing/purchase-request` (fallback mailowy)

Zachowanie UI:
- Jesli `p24.status.ready === true`, CTA prowadzi do natychmiastowego checkoutu P24.
- Jesli `ready === false`, UI otwiera modal i wysyla request mailowy (manualna obsluga).
- Po powrocie z P24 (`/packages?p24=1&session=...`) frontend pokazuje hint i odswieza `entitlements`.
  - To tylko hint UX, finalnym source of truth jest webhook + aktywacja po stronie backend.

## 3) Routing backend i kolejnosc middleware

Plik: `server/index.js`
- webhook P24 jest podpinany przed globalnym CSRF:
  - `app.use('/api/billing/webhooks', require('./routes/billingWebhookRoutes'))`
- potem dopiero globalne CSRF:
  - `app.use(getCsrfSecret)`
  - `app.use(csrfProtection)`
- standardowe API billingu:
  - `app.use('/api/billing', require('./routes/billingRoutes'))`

To istotne, bo webhook od PSP musi byc bez CSRF i broniony podpisem PSP.

## 4) Status i konfiguracja P24

Plik: `server/services/przelewy24/p24Config.js`

Konfiguracja opiera sie o:
- `P24_MERCHANT_ID`
- `P24_POS_ID`
- `P24_CRC`
- `P24_API_KEY`
- `P24_SANDBOX`
- `P24_APP_PUBLIC_URL` (fallback do `appUrl`)
- `P24_WEBHOOK_URL` lub fallback z `API_PUBLIC_URL + /api/billing/webhooks/przelewy24`

Wewnetrzne flagi:
- `credsOk` - czy sa dane merchant/API,
- `webhookOk` - czy webhook URL jest HTTPS i poprawny,
- `ready = credsOk && webhookOk`.

`GET /api/billing/p24/status` zwraca:
- `configured`, `webhookConfigured`, `ready`, `sandbox`.

## 5) Tworzenie checkoutu P24 (register)

Plik: `server/services/przelewy24/p24CheckoutService.js`

Sciezka:
1. `POST /api/billing/p24/checkout` -> `billingController.postP24Checkout`.
2. `createCheckoutSessionAndRegister(...)`.
3. Walidacja intencji zakupu:
   - `validateBillingPurchaseIntent(...)`.
4. Wyliczenie kwoty (`grosze`) z katalogu:
   - `checkoutAmountGroszeForPlan(...)`
   - `checkoutAmountGroszeForAddon(...)`.
5. Zapis lokalnej sesji platnosci:
   - model `BillingPaymentSession`, status `pending`.
6. `POST /transaction/register` do P24.
7. Zwrot `redirectUrl = {trnHost}/trnRequest/{token}`.
8. Frontend robi `window.location.assign(redirectUrl)`.

Parametry register, ktore obecnie sa istotne:
- `waitForResult: false` (powrot klienta niezalezny od webhooka),
- `channel: 16` (wszystkie metody 24/7 po stronie P24, czyli m.in. BLIK, banki, karta),
- `urlReturn` -> `/packages?p24=1&session=...`,
- `urlStatus` -> backend webhook.

Jesli register sie wywali:
- status sesji -> `register_error`,
- zapis bledu w `registerError`.

Przedluzenie planu („Przedluz plan” w Pakietach): `POST /api/billing/p24/renew` (`{ billingCycle }`) ->
`createRenewalCheckoutSessionAndRegister` — plan i moduly bierzemy z zespolu, nie od klienta (przedluzenie nie moze
stac sie zmiana planu), dalej ta sama sciezka co checkout. Gdy walidator uzna platnosc za przedluzenie, sesja
zapisuje `renewFromPeriodEnd` (koniec oplaconego okresu z chwili zalozenia sesji). Finalizacja
(`p24FinalizePaidSession` -> `renewalFinalizeDecision`) liczy nowy okres od tej daty, nie od biezacego stanu zespolu:
- ponowiona albo rownolegla finalizacja tej samej platnosci (webhook + powrot ze strony platnosci, ponowienie po
  awarii, reczna aktywacja po nieudanym webhooku) zapisuje ten sam wynik — nie doklada drugiego okresu,
- druga, inna platnosc z tej samej daty (juz zaksiegowana) doklada okres po poprzedniej,
- plan albo moduly zmienione w miedzyczasie albo okres juz dluzszy (np. reczne przedluzenie) — zespolu nie zmieniamy,
  sesja `paid` z `settlementNote` (`plan_changed` / `already_covered`) i blad `[p24] przedluzenie zaksiegowane bez
  zmiany zespolu` w logach — do recznego rozliczenia.
Po wygasnieciu (sesja bez `renewFromPeriodEnd`) — okres od platnosci, jak dotad. Przypomnienia „Przedluz pakiet”
(7 dni i dzien przed koncem) mowia o przedluzeniu wprost.

## 6) Podpisy P24 (sign) i HTTP client

Pliki:
- `server/services/przelewy24/p24Sign.js`
- `server/services/przelewy24/p24HttpClient.js`

Podpisy SHA-384 sa liczone na `JSON.stringify(payload)`:
- `signRegister(...)`
- `signVerify(...)`
- `signNotification(...)`

HTTP do P24:
- Basic Auth `posId:apiKey`,
- `assertP24Ok(...)` wymaga `responseCode === 0`,
- bledy mapowane na `P24_API` / `P24_PARSE`.

## 7) Webhook P24 (asynchroniczne potwierdzenie)

Routing:
- `POST /api/billing/webhooks/przelewy24`
- `server/controllers/p24WebhookController.js`
- `server/services/przelewy24/p24WebhookService.js`

Sekwencja:
1. Walidacja payload (typy, pola wymagane).
2. Sprawdzenie `merchantId` i `posId`.
3. Weryfikacja podpisu notyfikacji (`signNotification` + timing safe compare).
4. Lookup `BillingPaymentSession` po `sessionId`.
5. Sprawdzenie stanu sesji:
   - `paid` => idempotent duplicate OK,
   - inny niz `pending` => konflikt stanu.
6. Twarde porownanie `amount` z lokalnym `amountGrosze`.
7. `PUT /transaction/verify` do P24.
8. Aktywacja biznesowa:
   - plan -> `activatePaidPlan(...)` z `periodEnd`,
   - addon -> `applyAiAddonPack(...)`.
9. Oznaczenie sesji:
   - `status = 'paid'`,
   - `p24OrderId = orderId`.

Idempotencja jest po stronie ledgera:
- `idempotencyKey = p24:order:{orderId}`,
- kolejne notyfikacje z tym samym `orderId` nie duplikuja efektu.

## 8) Aktywacja subskrypcji i addonow (warstwa biznesowa)

Plik: `server/services/billingActivationService.js`

`activatePaidPlan(...)`:
- waliduje `idempotencyKey`, `planKey`, `billingCycle`, `periodEnd`, `teamId`,
- pilnuje limitu miejsc zespolu (`assertPaidPlanSeatLimit`),
- ustawia na `Team`:
  - `billingPlanKey`,
  - `billingStatus = 'active'`,
  - `billingCycle`,
  - `billingPeriodEnd`,
  - `maxUsers`,
  - `billingHadPaidPlan = true`,
  - `subscriptionType` (`enterprise` lub `premium`).
- z `detachEndedStripeSubscription: true` (reczna aktywacja i platnosc BLIK / przelewem w `p24FinalizePaidSession`)
  odpina zakonczona subskrypcje Stripe — zywej w bazie nie rusza,
- zapisuje `BillingLedgerEntry`.

`activatePaidPlanManually(...)` — reczna aktywacja z endpointu internal: straznicy i tryb na sucho (sekcja 11).

`applyAiAddonPack(...)`:
- rowniez idempotentne przez `BillingLedgerEntry`,
- dziala tylko gdy jest aktywna platna subskrypcja,
- zwieksza `team.aiPackBalance`.

## 9) Zasady walidacji zakupu (wspolne dla P24 i fallbacku mailowego)

Plik: `server/services/billingPurchaseIntentValidator.js`

Wspolne reguly:
- wymagane poprawne dane do faktury (`INVOICE_INCOMPLETE`),
- poprawny `planKey` / `addonId`,
- poprawny `billingCycle` dla planu,
- limity miejsc dla planu,
- addon tylko przy aktywnej platnej subskrypcji,
- online (P24, Stripe) tylko plany w sprzedazy (`SALE_PLAN_KEYS`) — Enterprise wylacznie zgloszeniem mailem,
- zmiana planu przy oplaconym okresie albo zywej subskrypcji Stripe (`active`, `trialing`, `past_due`, `unpaid`):
  online odmowa `PLAN_CHANGE_REQUIRES_REQUEST`, przyjmujemy tylko zgloszenie mailem (`channel: 'mail'`),
  bo drugi plan naliczylby sie obok starego (`server/utils/billingPlanChange.js`); `meta.reason`
  (`planChangeBlockReason`): `paid_period` | `card_subscription` | `card_retry` — przy `card_retry` (`past_due` /
  `unpaid`) komunikat kieruje do zmiany karty, bo Stripe dalej ponawia platnosc za stary plan,
- wyjatek: przedluzenie TEGO SAMEGO planu z tymi samymi modulami BLIK / przelewem przed koncem okresu
  (`isEarlyRenewal`, tylko P24 — `allowEarlyRenewal: true`; karta zaczelaby okres od razu). Bez dzialajacej
  subskrypcji Stripe i tylko przy okresie z data konca (zespol rozliczany osobno faktura, np. Halo — nie).

To jest kluczowe: niezaleznie od przyszlej bramki (Stripe), te walidacje powinny pozostac wspolne.

## 10) Fallback mailowy (gdy brak gotowosci P24 lub decyzja UX)

Plik: `server/services/billingRequestService.js`

`POST /api/billing/purchase-request`:
- przechodzi przez te same walidacje intencji zakupu,
- wysyla mail do `BILLING_SALES_EMAIL`/`EMAIL_USER` + stale CC na admina,
- dalsza aktywacja jest robiona recznie przez endpointy internal,
- zgloszenie przy aktywnym planie przychodzi jako „Zmiana planu” z danymi do przeniesienia okresu
  (obecny plan i moduly, koniec oplaconego okresu, subskrypcja Stripe) oraz gotowa trescia aktywacji
  (`server/utils/planChangeMail.js`) — procedura w sekcji 11.

## 11) Internal API do aktywacji (manual ops / M2M)

Pliki:
- `server/routes/billingInternalRoutes.js`
- `server/middleware/billingAdminSecretMiddleware.js`

Endpointy:
- `POST /api/billing/internal/activate-subscription`
- `POST /api/billing/internal/apply-ai-addon`

Auth:
- header `X-Billing-Admin-Secret` == `BILLING_ADMIN_SECRET`.

`activate-subscription` (`billingActivationService.activatePaidPlanManually`) — tresc: `teamId`, `planKey`,
`billingCycle` (`monthly` / `annual`), `periodEnd` (ISO), `idempotencyKey`, `moduleKeys`, opcjonalnie `dryRun`,
`force`, `stripeSubscriptionEnded` (wszystkie trzy tylko jako boolean `true`):
- dla Core `moduleKeys` obowiazkowe (takze puste `[]`) — aktywacja zapisuje dokladnie te liste, wiec podaj
  pelna liste modulow zespolu po zmianie, nie tylko nowy modul; brak pola = blad walidacji,
- dla PRO / Business / Enterprise bez `moduleKeys` (maja wszystkie moduly),
- `dryRun: true` — sprawdza plan, moduly, limit miejsc, date, klucz i zaleglosc w Stripe bez zapisu;
  `stripeCancelRequired: true` mowi, ze trzeba jeszcze anulowac subskrypcje Stripe, `stripeSubscriptionStatus`
  pokazuje jej status z bazy,
- 409 `MANUAL_ACTIVATION_CONFLICT` (w `meta.conflicts`):
  - `PERIOD_END_IN_PAST`, `PERIOD_END_SHORTENS_PAID` (data krotsza niz obecny oplacony okres),
  - `STRIPE_PAYMENT_PAST_DUE` (`past_due` / `unpaid` — okres w bazie to karencja, otwarta faktura to dlug klienta;
    takze gdy zaleglosc powstala po zgloszeniu), zglaszany juz na sucho,
  - `STRIPE_SUBSCRIPTION_LIVE` (subskrypcja Stripe dziala — jej webhooki nadpisalyby aktywacje),
  - `OPEN_ENDED_BILLING` (oplacony plan bez daty konca, rozliczany osobno faktura — dzis tylko Halo; aktywacja
    nadalaby date, a po niej odciela dostep — takich zespolow nie ruszamy),
  - `force: true` swiadomie pomija tych straznikow (np. naprawa po nieudanym webhooku — dzialajaca subskrypcja
    zostaje wtedy podpieta, odpowiedz zwraca `stripeSubscriptionKept`); limitu miejsc nie pomija,
- `stripeSubscriptionEnded: true` — operator sprawdzil w Stripe, ze subskrypcja juz nie dziala, a status w bazie
  jest nieaktualny: nie blokuje, subskrypcja zostaje odpieta, status poprawiony na `canceled`,
- 409 `DUPLICATE_IDEMPOTENCY_KEY` — klucz juz uzyty, nic nie zmieniono (`meta`: kiedy i co zrobilo pierwsze
  wywolanie); przy poprawce uzyj nowego klucza,
- 409 `CONCURRENT_UPDATE` — rownolegly zapis zespolu (np. dwa identyczne wywolania naraz); to wywolanie niczego
  nie zmienilo,
- po aktywacji zakonczona (nie dzialajaca) subskrypcja Stripe jest odpinana (`stripeSubscriptionId = null`,
  klient Stripe zostaje, ID i pierwotny status trafiaja do ledgera jako `detachedStripeSubscriptionId` /
  `detachedStripeSubscriptionStatus`) — zespol przechodzi na rozliczenie reczne: dostaje przypomnienia o koncu
  okresu i nie widzi przycisku anulowania platnosci cyklicznej. To samo robi oplacona sesja BLIK / przelew (zespol
  po odrzuconej karcie przechodzi na P24). Webhooki Stripe (`activatePaidPlan` bez flagi) nic nie odpinaja,
- spoznione albo ponowione zdarzenia odpietej subskrypcji (`customer.subscription.updated` / `deleted`,
  `invoice.paid`) webhook Stripe pomija, zanim cokolwiek zapisze albo zapyta Stripe — przypielyby ja z powrotem
  i nadpisaly nowy plan, moduly albo okres (ledger: `stripe_detached_subscription_event_ignored`). Zaplacona stara
  faktura laduje w logach jako blad `[stripe] invoice.paid dla subskrypcji odpietej…` — do recznego rozliczenia
  (zwrot albo zaliczenie).

Zmiana planu przy aktywnym planie (mail „Zmiana planu” — procedura z danymi i gotowa trescia aktywacji):
1. Najpierw na sucho (`dryRun: true`) — zanim cokolwiek zostanie anulowane.
2. Subskrypcja Stripe dziala: sprawdz w Stripe koniec biezacego okresu (odnowienie po zgloszeniu przesuwa date
   z maila — pozniejsza date bierzemy tylko przy zaplaconej fakturze odnowienia), uniewaznij otwarte faktury
   (zaplacona po zmianie przywrocilaby stary plan; fakture z zaleglocia dopiero po ustaleniu z klientem), anuluj od
   razu bez zwrotu i bez rozliczenia proporcjonalnego (okres przenosimy), poczekaj na
   `customer.subscription.deleted`, aktywuj. Anulowanie wpisuje do bazy date anulowania, wiec `periodEnd` bierzemy
   z maila albo ze Stripe, nie z bazy. Jesli w Stripe subskrypcja jest juz anulowana (nieaktualny status w bazie),
   zamiast anulowania dodaj `stripeSubscriptionEnded: true`.
3. Zalegla platnosc (`past_due` / `unpaid`): data w bazie to koniec karencji, nie oplaconego okresu — mail wstawia
   w `periodEnd` napis zamiast daty (aktywacja sie na nim zatrzyma), a proba na sucho zglasza
   `STRIPE_PAYMENT_PAST_DUE`; przenosimy tylko oplacony okres, `force` dopiero po rozliczeniu zaleglosci.
4. Drozszy plan: doplata za roznice za przeniesiony okres (mail liczy roznice wg cennika — przy obecnym planie
   rocznym stawka roczna: 10 × miesiac na 12 miesiecy); tanszy — zwrot tylko po ustaleniu z klientem, osobno.
5. Zespol rozliczany osobno bez daty konca (faktura, np. Halo): w aplikacji nic nie zmieniamy — mail nie zawiera
   tresci aktywacji, endpoint odmawia (`OPEN_ENDED_BILLING`); zmiane ustalamy z klientem.
6. Nigdy nie zmieniaj planu ani ceny subskrypcji w panelu Stripe — metadane planu zostaja stare, odnowienia koncza
   sie bledem.
7. Po zmianie nie ma odnowienia karta: przed koncem okresu idzie przypomnienie, platnosc online w Pakietach
   odblokowuje sie po koncu okresu.

To jest dobre miejsce na przyszle automaty M2M, ale dla Stripe webhook lepiej trzymac dedykowany publiczny webhook route (tak jak P24), z weryfikacja podpisu Stripe.

## 12) Dane i modele zwiazane z platnosciami

`BillingPaymentSession` (`server/models/BillingPaymentSession.js`):
- lokalna sesja checkoutu (`pending/paid/failed/register_error`),
- laczy `sessionId` z teamem, rodzajem zakupu, kwota i orderId P24.

`BillingLedgerEntry` (`server/models/BillingLedgerEntry.js`):
- centralny mechanizm idempotencji akcji billingowych,
- unikalny `idempotencyKey`.

## 13) Co trzeba zachowac przy dodawaniu Stripe recurring

Przy wdrozeniu Stripe nie wolno rozbic obecnego modelu:
- P24 ma zostac nadal aktywne dla metod lokalnych (BLIK, banki, karta przez P24 channels).
- Walidacje zakupu musza zostac wspolne (`billingPurchaseIntentValidator`).
- Aktywacje koncowe powinny dalej przechodzic przez `billingActivationService` (jedno zrodlo prawdy).
- Idempotencja ma zostac oparta o `BillingLedgerEntry` (nowe klucze np. `stripe:invoice:{id}` / `stripe:event:{id}`).
- Frontend `Packages` powinien miec wyrazny wybor metody, ale nie duplikowac logiki walidacyjnej.

## 14) Ryzyka i niuanse

- Return URL z P24 nie oznacza platnosci sukcesem; sukces daje dopiero webhook + verify.
- `waitForResult=false` to swiadoma decyzja UX (szybki powrot klienta), ale wymaga solidnej obslugi webhook.
- `channel: 16` zostawia dobor metody po stronie P24 (to trzeba zachowac dla BLIK/banki).
- Brak dopasowania kwoty (`AMOUNT_MISMATCH`) blokuje aktywacje - to poprawny bezpiecznik.
- Webhook endpoint musi byc publiczny HTTPS i stabilny (retry P24 sa asynchroniczne).

## 15) Brak Stripe w obecnym kodzie

Aktualnie nie ma implementacji Stripe w repo.

Wnioski pod kolejny etap:
- trzeba dodac nowa sciezke checkout i webhook Stripe,
- ale finalna aktywacja planu/addonu powinna korzystac z juz istniejacych serwisow aktywacji.

## 16) Dodany provider Stripe (drugi obok P24)

Implementacja zostala dodana jako osobny provider, bez zmian w flow P24:

- Checkout endpoint:
  - `POST /api/billing/stripe/checkout`
  - route: `server/routes/billingStripeRoutes.js`
  - service: `server/services/stripe/billingStripeService.js`
  - wejscie: `priceId` (bez hardcodowania cen po stronie kodu)

- Webhook endpoint:
  - `POST /api/billing/webhooks/stripe`
  - controller: `server/controllers/stripeWebhookController.js`
  - route: `server/routes/billingWebhookRoutes.js`
  - weryfikacja sygnatury: `STRIPE_WEBHOOK_SECRET`

- Obslugiwane eventy:
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

- Integracja aktywacji (bez duplikacji logiki):
  - plan/subskrypcja -> `billingActivationService.activatePaidPlan(...)`
  - addon/jednorazowa -> `billingActivationService.applyAiAddonPack(...)`

- Idempotencja:
  - subskrypcje: `stripe:invoice:{id}`
  - checkout addon: `stripe:event:{id}`
  - eventy statusowe subskrypcji: `stripe:event:{id}`

- Kompatybilnosc wersji API Stripe:
  - subscription invoice: legacy `invoice.subscription` lub `invoice.parent.subscription_details.subscription`,
  - cena linii: legacy `line.price.id` lub `line.pricing.price_details.price`,
  - okres subskrypcji: legacy `subscription.current_period_end` lub `subscription.items.data[].current_period_end`,
  - metadata planu i zespolu: subskrypcja, snapshot `parent.subscription_details` oraz metadata linii,
  - sprzeczne identyfikatory lub niejednoznaczne okresy koncza webhook bledem do ponowienia zamiast cichego `skipped`.

- Jedno miejsce mapowania `priceId`:
  - `server/services/stripe/stripePriceMapService.js`
  - zasilane przez `STRIPE_PRICE_MAP_JSON`

### Uwaga implementacyjna

Do poprawnej walidacji sygnatury Stripe webhook konieczny jest surowy payload.
W `server/index.js` dla sciezki Stripe webhook zapisywany jest `req.rawBody` podczas `express.json(...)`.
