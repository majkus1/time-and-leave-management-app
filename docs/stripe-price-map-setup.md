# Stripe — mapowanie cen (`STRIPE_PRICE_MAP_JSON`)

Backend szuka **Stripe Price ID** (`price_…`) po intencji zakupu (plan / moduł, cykl). Bez kompletnej mapy checkout zwróci błąd konfiguracji.

## 1. Utwórz ceny w Stripe (Products → Prices)

W Dashboard nazwy produktów mogą być po ludzku (**„Core – 15 użytkowników”**, **„PRO”**, **„Business”** …). W mapie JSON (`planKey`) backend nadal używa **krótkich kluczy technicznych** — tak jest stabilnie w bazie i kodzie.

Dla **każdej** kombinacji sprzedawanej **kartą** (subskrypcja Stripe), osobny **recurring** Price:

- **Core** — trzy rozmiary (to są trzy `planKey`): `base_s` (do 15 osób), `base_m` (do 30), `base_l` (do 100) × `monthly` i `annual` (rocznie w katalogu 10× netto — ustaw kwotę roczną zgodnie z cennikiem).
- **Moduły dodatkowe** (tylko przy Core): `timer_qr`, `schedules_ai`, `tasks`, `chat`, `ai_assistant` × `monthly` i `annual` (jeśli sprzedajesz roczne moduły Stripe; roczny Core w UI często idzie P24).
- **Pakiety:** `pro`, `business`, `enterprise` × `monthly` i `annual`.

- **Wielopozycyjny checkout (Core + moduły) — karta:** w sesji Stripe muszą być **wszystkie** zmapowane `priceId` dla wybranego planu, modułów i tego samego `billingCycle` (miesięczny albo roczny).
- **Core + moduły — BLIK/przelew (P24):** jedna transakcja z kwotą z katalogu (`planCatalog`); **nie** wymaga wpisów modułów w `STRIPE_PRICE_MAP_JSON`. Mapowanie Stripe jest potrzebne wyłącznie przy płatności kartą (subskrypcja Stripe).

## 2. Wklej mapę do `STRIPE_PRICE_MAP_JSON` (np. w `server/.env`)

Jedna linia JSON: klucz = **Price ID** z Dashboard, wartość = obiekt:

| `kind`   | Wymagane pola |
|----------|----------------|
| `plan`   | `planKey`, `billingCycle` (`monthly` \| `annual`) |
| `module` | `moduleKey`, `billingCycle` |
| `addon`  | `addonId` (dodatki AI itd., jeśli używane) |

**Przykład (zamień `price_…` na swoje ID test/live):**

```json
{
  "price_abc1": { "kind": "plan", "planKey": "base_s", "billingCycle": "monthly" },
  "price_abc2": { "kind": "plan", "planKey": "base_s", "billingCycle": "annual" },
  "price_mod1": { "kind": "module", "moduleKey": "chat", "billingCycle": "monthly" },
  "price_mod2": { "kind": "module", "moduleKey": "chat", "billingCycle": "annual" },
  "price_pro_m": { "kind": "plan", "planKey": "pro", "billingCycle": "monthly" }
}
```

Po zmianie env **zrestartuj serwer**.

## 3. Webhook Stripe

- W Stripe Dashboard: endpoint URL jak u Ciebie w deploy (np. `/api/billing/webhooks/stripe` — sprawdź `server/routes/billingWebhookRoutes.js`).
- Skopiuj **Signing secret** → zmienna env używana przez webhook (np. `STRIPE_WEBHOOK_SECRET` — patrz `stripeWebhookController.js` / `stripeConfig.js`).

## 4. Tryb test vs produkcja

- **Test:** `sk_test_…`, Price ID z trybu testowego, webhook z trybu testowego.
- **Live:** osobne klucze i **nowa** mapa `price_…` z live — nie mieszaj ID z test i live.

## 5. Zgodność z aktualnym modelem produktu

- **Core** to nie osobne „plany Base S/M/L” w sensie biznesowym — to jedna oferta z trzema limitami miejsc i opcjonalnymi modułami; w systemie rozróżnia je nadal **`base_s` / `base_m` / `base_l`**.
- **PRO / Business / Enterprise** — klucze **`pro`**, **`business`**, **`enterprise`** (legacy **`starter`** w starych kontach mapuje się na `base_s`).
- Stare produkty w Stripe możesz zostawić archiwalnie; dla aktywnej sprzedaży utwórz ceny i wpisy w `STRIPE_PRICE_MAP_JSON` zgodnie z powyższym schematem.
