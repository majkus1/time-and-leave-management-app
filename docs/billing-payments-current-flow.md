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
- zapisuje `BillingLedgerEntry`.

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
- addon tylko przy aktywnej platnej subskrypcji.

To jest kluczowe: niezaleznie od przyszlej bramki (Stripe), te walidacje powinny pozostac wspolne.

## 10) Fallback mailowy (gdy brak gotowosci P24 lub decyzja UX)

Plik: `server/services/billingRequestService.js`

`POST /api/billing/purchase-request`:
- przechodzi przez te same walidacje intencji zakupu,
- wysyla mail do `BILLING_SALES_EMAIL`/`EMAIL_USER` + stale CC na admina,
- dalsza aktywacja jest robiona recznie przez endpointy internal.

## 11) Internal API do aktywacji (manual ops / M2M)

Pliki:
- `server/routes/billingInternalRoutes.js`
- `server/middleware/billingAdminSecretMiddleware.js`

Endpointy:
- `POST /api/billing/internal/activate-subscription`
- `POST /api/billing/internal/apply-ai-addon`

Auth:
- header `X-Billing-Admin-Secret` == `BILLING_ADMIN_SECRET`.

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
