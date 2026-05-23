# Planopia — kontekst aplikacji (dla narzędzi / review)

Zwięzły opis **zgodny z kodem** w tym repozytorium. Szczegóły płatności / AI: `docs/billing-payments-current-flow.md`, `docs/AI_ASSISTANT_CONTEXT.md`.

---

## Produkt

**Planopia** — aplikacja webowa (PWA) dla firm: **ewidencja czasu pracy**, **urlopy / nieobecności**, **grafiki**, **tablice zadań (Kanban)**, **czat zespołu**, **ogłoszenia**, **asystent AI**, **centrum pomocy (tickety)**. Multi-tenant: każdy **Team** ma własnych użytkowników i dane w MongoDB.

---

## Struktura repozytorium

| Katalog | Rola |
|--------|------|
| `client/` | SPA (React + Vite), `axios`, React Router, TanStack Query, i18n, Socket.io client. Produkcja: typowo `app.planopia.pl`. |
| `server/` | API Express (`server/index.js`), Mongoose, Socket.io, billing (Stripe + P24), maile, uploady. |
| `planopia-next-landing/` | Marketing / blog (Next.js) — osobna aplikacja, nie serwuje głównej apki. |

---

## Bazy danych

- **Główna aplikacja:** `DB_URI` (lub `DB_URI_TEST` gdy `USE_TEST_DB=true`) — połączenie `firmDb` w `server/db/db.js`.
- **Tickety (centrum pomocy):** opcjonalnie osobny URI (`MONGO_URI_TICKETS` itd.) — `centralTicketConnection`; brak URI → endpointy ticketów 503.

Kolekcje to modele Mongoose w `server/models/` (m.in. `teams`, `users`, `workdays`, plany urlopów, grafiki, `boards`/`tasks`, `channels`/`messages`, `notifications`, billing, `appsessions`).

---

## Autentykacja i żądania API

- Logowanie ustawia **httpOnly cookie** `token` (JWT). Payload zawiera m.in. `userId`, `teamId`, `roles`, `username`, `isTeamAdmin`.
- Chronione trasy używają `authenticateToken` (`server/middleware/authMiddleware.js`) — weryfikacja użytkownika **aktywnego** i zespołu **aktywnego** (`isActive !== false`).
- **CSRF:** po trasach publicznych / webhookach — `GET /api/csrf-token`, nagłówek `x-csrf-token` na mutacjach (`server/index.js`).
- `axios.defaults.withCredentials = true` w kliencie.

---

## Kolejność ochrony API (ważne)

W `server/index.js` **przed** CSRF:

1. **`freemiumApiGuard`** — dla zespołów w tierze freemium ogranicza ścieżki API (lista w `server/services/freemiumApiPolicyService.js`). Przy **> 5 aktywnych kontach** (`TRIAL.maxUsers`) — tryb „seat blocked”: węższy zestaw (billing, użytkownicy, ewidencja/kalendarz do ograniczenia zespołu itd.).
2. **`planModuleApiGuard`** — dla **płatnego planu CORE** (`base_s` / `m` / `l`) bez aktywnej subskrypcji trial/legacy/freemium sprawdza, czy ścieżka należy do wykupionego modułu (`MODULE_API_PREFIXES` w `server/constants/planCatalog.js`). **Freemium / trial / legacy — ten guard przepuszcza** (`return next()`).

Potem CSRF, potem montowane routery `/api/...`.

---

## Billing i entitlement (logika biznesowa)

**Źródło prawdy cennika:** `server/constants/planCatalog.js` — plany `base_*` (CORE, moduły z `billingModuleKeys`), pakiety `pro` / `business` / `enterprise` (bundle — wszystkie moduły), trial (`TRIAL.maxUsers === 5`, limit AI trial), alias `starter` → `base_s`.

**Serwis:** `server/services/entitlementsService.js`

- **`isTrialActive`:** `billingPlanKey === 'trial'` i `trialEndsAt > now`.
- **`isTrialExpiredUnpaid`:** `billingPlanKey === 'trial'`, `trialEndsAt <= now`, `billingStatus !== 'active'` — typowy przejście w **freemium** (nadal w Mongo może być `billingPlanKey: 'trial'`).
- **`isPaidSubscriptionActive`:** `billingStatus === 'active'`, plan z `PAID_PLANS`, `billingPeriodEnd` nie w przeszłości.
- **`isFreemiumTierTeam`:** m.in. wygasły trial bez aktywnej płatności, wygaśnięty okres płatnego planu, koniec okresu legacy po grace; **wyklucza** aktywny legacy grace (`isLegacyPreBillingTeam`) i zespoły specjalne z `server/constants/specialTeams.js`.
- **`isLegacyPreBillingTeam`:** zespoły „sprzed billingu” (brak pól billing w dokumencie lub wymuszenia nazw) **do** `LEGACY_PRE_BILLING_GRACE_UNTIL` z `planCatalog.js`.
- **Klient:** `GET /api/billing/entitlements` — `buildClientEntitlements()` m.in. `freemiumTier`, `freemiumSeatBlocked`, `planKey`, moduły, limity AI.

**Płatności:** Stripe + Przelewy24 — opis przepływów: `docs/billing-payments-current-flow.md`.

---

## Freemium — zachowanie

- API: prefix **`/api/workdays`** (CRUD) dozwolony; **`/api/workdays/timer/*`** zablokowane (polityka + `freemiumWorkdayTimerGuard` w `server/routes/workdayRoutes.js`).
- Dozwolone m.in.: kalendarz, ustawienia, powiadomienia, push, QR (ścieżki z listy w `freemiumApiPolicyService.js`) — **bez** pełnego czatu / tablic / grafiku jako „premium moduł” przez guard freemium (mutacje na `/api/chat`, `/api/boards`, `/api/schedules` poza wyjątkami są 403).
- **Klient:** `FreemiumRouteSync.jsx` synchronizuje URL z polityką (wąski zestaw ścieżek + `/work-calendars/:id` wg roli; przy `freemiumSeatBlocked` redirect na management / packages / notice).

---

## Moduły vs routing API (skrót)

Montaż w `server/index.js` (fragment): `users`, `userlogs`, `workdays`, `calendar`, leave (`planlea`, `requlea`, `leaveworks`, `vacations`), `tickets`, `departments`, `chat`, `boards`, `schedules`, `supervisors`, `settings`, `push`, `notifications`, `qr`, `time-entry`, `announcements`, `ai-assistant`, `billing`, upload `/uploads`.

**Mapowanie moduł płatny → prefixy:** `MODULE_API_PREFIXES` w `planCatalog.js` (timer+QR, grafiki, tablice, czat, AI).

---

## Flow modułów (jak to działa w praktyce)

Skrót **ścieżek użytkownika + backendu** — szczegóły implementacji w wymienionych plikach.

### Ewidencja czasu pracy (`workdays`)

- **Model:** jeden dokument **na użytkownika i dzień kalendarzowy** (`date`) — pola m.in. `hoursWorked`, `additionalWorked`, `absenceType`, `notes`, tablica `timeEntries`, opcjonalnie `activeTimer` (`server/models/Workday.js`).
- **Ręczny wpis:** użytkownik wybiera dzień w kalendarzu (miesięcznym) → zapis przez **`POST /api/workdays`** / aktualizacja **`PUT /api/workdays/:id`** (`workdayRoutes.js` → `workdayController.js`). Dashboard pracownika: `/dashboard` + komponenty w `client/src/components/workcalendars/`.
- **Licznik / sesje:** osobne endpointy **`/api/workdays/timer/*`** (start / pause / stop / sesje) — wymagają modułu płatnego `timer_qr` poza trial/legacy/freemium; w **freemium** zablokowane guardem.
- **QR / wejście-wyjście:** osobna ścieżka **`/api/time-entry`** (powiązanie z kodami QR zespołu) — moduł `timer_qr` w `planCatalog` / `planModuleApiGuard`.
- **Widok przełożonego / HR / Admin:** lista użytkowników → **`/work-calendars/:userId`** (`UserCalendar.jsx`) pobiera pracownika **`GET /api/workdays/user/:userId`**; zbiorczy podgląd zespołu także **`GET /api/workdays/team`** (wg uprawnień w kontrolerze).
- **Integracja z urlopami:** zaakceptowane wnioski i niektóre nieobecności „bez akceptacji” są **uwzględniane w kalendarzu ewidencji** (logika po stronie UI + API kalendarza/wniosków — patrz `TutorialModal` / `leaveController` / `leaveRequestController`).

### Urlopy i nieobecności

- **Konfiguracja typów:** `Settings` zespołu — włączone typy wniosków, czy typ wymaga akceptacji (`requiresApproval`), limity dni (`server/controllers/leaveController.js`, `settings`).
- **Złożenie wniosku:** pracownik **`/leave-request`** → API leave (`/api/leaveworks` itd. w `server/index.js`). Walidacja zakresu dat (m.in. przycięcie weekendów wg ustawień), kolizje z już zaakceptowanymi wnioskami (`findConflictingApprovedLeaveRequest`).
- **Statusy:** `pending` → akceptacja/odrzucenie przez Admin/HR lub przełożonego z uprawnieniem; typy **bez akceptacji** od razu `sent` i zapis do **`LeavePlan`** (wpisy po datach dla kalendarza urlopów).
- **Akceptacja:** `leaveRequestController.updateLeaveRequestStatus` — sprawdzenie ról + `roleService.canSupervisorApproveLeaves` (przełożony: ten sam dział / lista wybranych wg `SupervisorConfig`).
- **Kalendarze urlopów:** osobne widoki (`LeavePlanner`, `EmployeeLeaveCalendar`, `AdminAllLeaveCalendar` itd.) + API `planlea` / `vacations` / `requlea` — dokładne mapowanie tras w `App.jsx` i `server/routes/*leave*`.

### Grafiki (`schedules`)

- Moduł billing **`schedules_ai`** chroni prefix **`/api/schedules`** (`planModuleApiGuard`).
- UI: `/schedule`, `/schedule/:scheduleId` — listy grafików, edycja zmian (komponenty w `client/src/components/schedule/`). Grafiki mogą być powiązane z **działem** (tworzenie działu może seedować grafik — `departmentController`).

### Tablice zadań (`boards` / `tasks`)

- **Typy tablic:** `team`, `department`, `custom` (`server/models/Board.js`). Przy utworzeniu działu system może utworzyć tablicę „{dział} - Tablica zadań” (`boardController.createBoardForDepartment`).
- **Flow:** lista tablic → **`/boards`** → Kanban **`/boards/:boardId`** (`Board.jsx`) — zadania ze statusami (`todo`, `in-progress`, `review`, `done`), drag & drop (`@dnd-kit`), komentarze i załączniki (API w `boardRoutes` / hooki `useBoards`).
- **Dostęp:** `server/utils/boardAccess.js` — kto widzi którą tablicę (członkowie, typ zespołowy).

### Czat (`chat`)

- Kanały (m.in. ogólny + per dział), wiadomości, Socket.io do live. Prefix **`/api/chat`** — moduł billing **`chat`**. Freemium: mutacje czatu poza polityką escape → zwykle **403**.

### Ogłoszenia i powiadomienia

- **Ogłoszenia:** `/api/announcements` + widok `/announcements`.
- **Powiadomienia / push:** `/api/notifications`, `/api/push` — rejestracja subskrypcji Web Push; powiadomienia w aplikacji z osobnej kolekcji.

### Asystent AI

- **`/api/ai-assistant`** + widok `/ai-assistant`. Limity zależne od planu / modułu `ai_assistant` / trial / legacy — szczegóły: `docs/AI_ASSISTANT_CONTEXT.md`, `entitlementsService` (zużycie, pakiety).

### Tickety (centrum pomocy)

- Osobna baza opcjonalna; API `/api/tickets` (rola Admin). Widok `/helpcenter` (tylko Admin w `App.jsx`, także freemium).

---

## Role i uprawnienia (klient + serwer)

- **Enum w Mongo:** `Admin`, `Pracownik (Worker)`, `Przełożony (Supervisor)`, `HR` — tablica `roles` na użytkowniku (`server/models/user.js`). Użytkownik może mieć **wiele ról** naraz.
- **UI (`App.jsx`):** Admin i HR mają szerszy dostęp do tras (urlopy, ewidencja zespołu, Pakiety); **Centrum pomocy** (`/helpcenter`) — tylko Admin. Pracownik bez roli kierowniczej: głównie dashboard własnej ewidencji, własny wniosek urlopowy, ograniczone moduły w sidebarze (`Sidebar.jsx` + `moduleNavAccess.js` + entitlementy).
- **Przełożony:** uprawnienia **nie tylko z roli** — model **`SupervisorConfig`** (`supervisorId`, `permissions`, wybrane pracownicy / dział) odczytywany w **`server/services/roleService.js`** (`canSupervisorApproveLeaves`, analogicznie podgląd ewidencji po stronie klienta w `App.jsx` / `useSupervisor`).
- **Super-admin platformy:** helper `isPlatformSuperAdmin` + `requireSuperAdmin` — m.in. `/api/super/activity`, dostęp do `/team-management` jako `Logs` (nadzór billingowy).

---

## Socket.io

`Server` w `server/index.js`; auth jak HTTP (JWT z cookie / `handshake.auth`). Przy połączeniu: `requiresFullAppSubscriptionWall` w kodzie **zawsze false** (kompatybilność); praktyczne cięcia idą przez REST guards + freemium. Opcjonalnie `touchSessionById` z cookie `appSessionId`.

---

## Inne istotne elementy

- **Soft delete:** użytkownicy (`isActive` / `deletedAt`) i zespoły — unikalność username / nazwy zespołu przez partial indexes w modelach.
- **Logi audytu:** kolekcja przez `server/models/log.js`, akcje typu `LOGIN`, mutacje HR — z `userlogs` API.
- **Rejestracja zespołu:** `POST /api/teams/register` + pierwszy admin; seed kanałów / tablic m.in. przy starcie (`server/index.js` fragmenty sync).
- **i18n serwer:** `i18next` + `server/locales/`.
- **Landing:** branże, SEO, blog — `planopia-next-landing/`, nie ten sam build co `client/`.

---

## Gdzie szukać przy zmianach

| Temat | Pliki |
|-------|--------|
| Czy feature jest w planie / module | `planCatalog.js`, `planModuleApiGuard.js`, `entitlementsService.js` |
| Czy działa na freemium | `freemiumApiPolicyService.js`, `freemiumApiGuard.js`, `FreemiumRouteSync.jsx` |
| Ewidencja + timer | `workdayRoutes.js`, `workdayController.js`, `freemiumWorkdayTimerGuard.js` |
| UI routing / role | `client/src/App.jsx`, `ProtectedRoute`, `Sidebar.jsx` |
| Billing HTTP | `server/routes/billingRoutes.js`, `billingStripeRoutes.js`, kontrolery billing |

*Dokument opisuje stan na podstawie struktury repo; przy refaktorze nazw tras lub guardów należy go zaktualizować.*
