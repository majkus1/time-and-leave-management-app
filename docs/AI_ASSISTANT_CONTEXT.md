# Planopia — kontekst dla asystenta AI

Planopia to aplikacja webowa (PWA) do ewidencji czasu pracy i timera, wniosków urlopowych, **grafików (harmonogramów)** — w tym **auto-uzupełniania miesiąca** oraz **osobnego panelu AI do szkicu grafiku** na stronie harmonogramu — tablic zadań (Kanban), czatu zespołowego, komunikatów, **globalnego AI Asystenta** (`/ai-assistant`), **pakietów i rozliczeń** (`/packages`: plany, limity, wykorzystanie AI zespołu, dokumenty prawne) oraz typowych modułów HR (ustawienia zespołu, listy urlopów, ewidencje, dokumenty, pomoc). Dane są izolowane per zespół (multi-tenant).

W kontekście technicznym zawsze jest też **zrzut danych zespołu** w sekcji „DATA CONTEXT”: m.in. konfiguracja (`workOnWeekends`, święta niestandardowe, sloty `workHours`, typy urlopów, timer, tablice, grafiki). **Pytania „ile godzin / kto / jaki status”** — odpowiadaj wyłącznie na podstawie DATA CONTEXT.

**Pytania „czy Planopia ma funkcję X / gdzie to jest / jak to zrobić”** — odpowiadaj na podstawie **tego dokumentu (DOMAIN DOCUMENT)** i ewentualnie DATA CONTEXT, jeśli chodzi o to, co widać w danych użytkownika. **Nie twierdz**, że nie masz informacji o funkcjach aplikacji, jeśli są opisane poniżej.

---

## Mapa aplikacji (menu boczne — typowe ścieżki)

| Obszar | Ścieżka URL (wzór) | Kto |
|--------|-------------------|-----|
| Profil / hasło | `/edit-profile` | wszyscy |
| Czas pracy (dashboard, timer) | `/dashboard` | wszyscy |
| Grafiki (harmonogramy) | `/schedule`, `/schedule/:scheduleId` | wg uprawnień do grafiku |
| **AI — szkic grafiku** (osobny panel na stronie grafiku, nie ten sam co `/ai-assistant`) | `/schedule/:scheduleId` | wg uprawnień do grafiku |
| Zgłoszenie urlopu | `/leave-request` | wszyscy |
| Plan urlopów (kalendarz) | `/leave-planner` | wszyscy |
| Plany urlopowe (zespołowe) | `/all-leave-plans` | Admin / HR / przełożony (wg roli) |
| Tablice zadań | `/boards`, `/boards/:boardId` | wszyscy |
| Czat | `/chat` | wszyscy |
| Komunikaty | `/announcements` | wszyscy |
| **AI Asystent** | `/ai-assistant` | wszyscy (wymaga klucza OpenAI po stronie serwera) |
| **Tryb „Wniosek urlopowy (AI)”** (w AI Asystencie) | ten sam `/ai-assistant` | pomaga sparować treść z typem urlopu i datami; **wysłanie** dopiero po potwierdzeniu — ten sam endpoint co formularz `/leave-request` |
| Ustawienia zespołu | `/settings` | zwykle Admin |
| Ewidencje czasu (lista użytkowników) | `/calendars-list` | Admin / HR / przełożony (wg uprawnień) |
| Urlopy (zatwierdzanie list) | `/leave-list` | Admin / HR / przełożony (wg uprawnień) |
| Dokumenty prawne | `/documents` | często tylko Admin |
| **Pakiety i rozliczenia** | `/packages` | zwykle **Admin** (zakup / podgląd planu; **wykorzystanie AI zespołu** widoczne wg uprawnień na tej stronie) |
| Pomoc / zgłoszenia | `/helpcenter` | wg roli |
| Zarządzanie zespołem / logi | `/team-management` | ograniczone |

---

## Pakiety i rozliczenia (`/packages`)

W menu bocznym: **„Pakiety i rozliczenia”** (PL) / **„Packages & billing”** (EN), ikona portfela.

**Co tam jest (funkcjonalnie):**

- **Bieżący plan zespołu**: okres próbny (trial), aktywna subskrypcja płatna (plan + okres rozliczeniowy), ewentualnie konta „legacy” (pełny dostęp do aplikacji w okresie przejściowym — szczegół w UI).
- **Wykorzystanie Asystenta AI (zespołu)**: wspólny limit na **AI Asystenta** (`/ai-assistant`), **AI szkicu grafiku** na stronie harmonogramu oraz **drafty AI** (np. wniosek urlopowy / wpis czasu z opisu). W UI widać m.in. szacowane pozostałe wiadomości, pulę próbną trialu i saldo **dokupionych pakietów** wiadomości.
- **Wybór planu**: **Core** (rozmiary S / M / L + opcjonalne moduły) oraz pakiety **Pro, Business, Enterprise** (wszystkie moduły w cenie) — limity użytkowników i AI jak w tabeli poniżej. Rozliczenie **miesięczne lub roczne** (rocznie typowo **10× cena miesięczna netto za 12 miesięcy**, plan + moduły Core w tym samym cyklu).
- **Zakup**: administrator zespołu może wysłać **zapytanie o zakup** (plan lub pakiet dodatkowy AI) — proces w aplikacji prowadzi przez formularz / e-mail (nie podawaj fikcyjnych linków do płatności kartą, jeśli użytkownik pyta „jak zapłacić” — odsyłaj do tej sekcji w UI).
- **Pakiety dodatkowe AI**: dodatkowe wiadomości poza limitem planu — **dostępność w UI jest uzależniona od reguł produktu** (np. po wcześniejszej aktywnej płatnej subskrypcji); kwoty i rozmiary pakietów są na stronie Pakiety.
- **Dokumenty prawne** na dole tej samej strony: regulamin, polityka prywatności, ewentualnie DPA — akceptacje w jednym miejscu, gdy wymagane.

**Tabela planów (orientacyjnie — źródło: `server/constants/planCatalog.js`; użytkownik zawsze widzi aktualne wartości na `/packages`):**

| Plan | Cena miesięczna netto (PLN) | Max użytkowników | Wiadomości AI / miesiąc (plan) |
|------|------------------------------|------------------|--------------------------------|
| **Core S** (`base_s`) | 119 | 15 | 0 w bazie; po wykupieniu modułu Asystenta AI i/lub grafik z AI — **wspólna pula 50** (te dwa moduły łącznie) |
| **Core M** (`base_m`) | 199 | 30 | jak wyżej |
| **Core L** (`base_l`) | 349 | 100 | jak wyżej |
| **Pro** | 239 | 30 | 50 (wszystkie moduły w pakiecie) |
| **Business** | 479 | 100 | 300 |
| **Enterprise** | 949 | 300 | 1000 |

**Moduły dokupywane do Core (mies. netto PLN, orientacyjnie):** timer + QR 39; grafiki + AI w grafiku 59; tablice 39; czat 29; Asystent AI 29.

**Alias:** stary klucz „starter” w danych = **Core S** (`base_s`).

**Okres próbny (trial):** ok. **30 dni**, do **5 użytkowników**, **10 jednorazowych** wiadomości AI (wspólna pula próbna, nie miesięczny limit planu).

**Przykładowe pakiety dodatkowe AI (PLN netto, wiadomości)** — potwierdź w UI: **50 / 19**, **200 / 49**, **500 / 99**.

**Uwagi dla asystenta:**

- Nie podawaj jako „twardej prawdy” kwot ani limitów, jeśli użytkownik widzi inne wartości w aplikacji — napisz, że **aktualny cennik i limity są na stronie Pakiety i rozliczenia**.
- Pytania „ile kosztuje”, „jaki limit AI”, „jak kupić plan” — odpowiadaj na podstawie **tej sekcji** i zachęć do **otwarcia `/packages`** (Admin).

---

## Role i zakres danych (DATA CONTEXT)

- **Admin / HR**: mogą widzieć szczegółowe dane wszystkich aktywnych użytkowników zespołu (czas pracy, zadania na tablicach zespołu) w zakresie roli.
- **Przełożony (Supervisor)**: pracownicy zgodnie z konfiguracją przełożonego (jak w ewidencji / zadaniach).
- **Pracownik**: w ewidencji i zadaniach — zwykle własny zakres widoczności jak w aplikacji.
- **Wnioski urlopowe w AI Asystencie**: lista w DATA CONTEXT obejmuje **wszystkich aktywnych członków zespołu** (jak szeroki podgląd w planerze urlopów), z imionami i statusami — niezależnie od roli przy pytaniach o urlopy.

Nie ujawniaj danych spoza DATA CONTEXT. Jeśli użytkownik pyta o osoby poza zakresem **dla ewidencji lub zadań** — wyjaśnij brak dostępu; dla urlopów w Asystencie korzystaj z sekcji wniosków zespołowych w kontekście.

---

## Dashboard — czas pracy i timer

- **Timer** (jeśli włączony w ustawieniach zespołu): rejestracja pracy z opisem sesji; wpływa na ewidencję dnia.
- **Workdays**: dni ewidencji; godziny, notatki dnia, nieobecności, sesje timera z opisami.
- Ustawienia typu **weekendy jako dni pracy** zależą od konfiguracji zespołu — opisuj je słowami, nie nazwami pól technicznych.

---

## Grafiki (Schedule) — ważne dla pytań o „automatyczne uzupełnianie”

Planopia ma **automatyczne planowanie / auto-uzupełnianie miesiąca** w module grafiku:

1. Wejdź w **Grafik** z menu (`/schedule`) i wybierz konkretny grafik (`/schedule/:scheduleId`).
2. Na widoku kalendarza grafiku jest akcja w stylu **„Auto-uzupełnij miesiąc”** (przycisk otwierający modal).
3. W modalu ustawiasz m.in. **miesiąc i rok**, **zmiany (przedziały czasowe)**, opcjonalnie nadpisania dni, wykluczenia ręczne, czy preferowana jest **dostępność** pracowników, czy wiele zmian dziennie itd.
4. System generuje **wpisy** zgodnie z regułami (m.in. nieobecności, istniejące wpisy, minimalna obsada — szczegóły w interfejsie). Wpisy mogą być oznaczone jako **robocze (draft)**.
5. Po wygenerowaniu możesz **opublikować miesiąc** (osobny przycisk) albo **wyczyścić miesiąc** — zgodnie z uprawnieniami i tekstami w UI.

**Odpowiedź na pytanie „czy jest automatyczne uzupełnianie grafików?”**: **Tak** — w grafiku jest funkcja **auto-uzupełnienia miesiąca** z modalem ustawień i możliwością publikacji roboczego grafiku.

### AI — szkic grafiku (osobny panel w module grafiku)

Oprócz powyższego **auto-uzupełnienia wg reguł** (algorytm), Planopia oferuje w widoku konkretnego grafiku (`/schedule/:scheduleId`) **osobny panel AI do szkicu miesiąca**: użytkownik opisuje wymagania (np. zmiany, wykluczenia, preferencje), a model **proponuje szkic** wpisów do podglądu i ewentualnego **zastosowania** w grafiku. To **nie jest to samo** co globalny **AI Asystent** (`/ai-assistant`) — inny endpoint i interfejs, ale to nadal funkcja Planopii.

**Pytanie „czy jest AI do grafiku / szkic miesiąca?”**: **Tak** — w module grafiku jest **AI do szkicowania** (obok klasycznego auto-uzupełnienia przez system).

Ręczne dodawanie / edycja wpisów w siatce dni nadal jest dostępna (formularz wpisu, godziny, pracownik, notatki).

---

## Urlopy

- **Zgłoś urlop** (`/leave-request`): formularz, typ urlopu z ustawień zespołu, zakres dat. **Nie** jest wymagana wcześniejsza ewidencja czasu pracy ani wpisy z timera — to osobny moduł.
- **Plan urlopów** / kalendarze: planowanie i podgląd — zależnie od roli.
- **Zatwierdzanie**: Admin / HR / przełożony wg uprawnień (`/leave-list`, szczegóły wniosków).
- **PDF**: podgląd wniosku URLopowego — ścieżka typu `/leave-request-pdf-preview`.
- Typy urlopów i mapowanie `leaveform.option…` → nazwa ludzka są w DATA CONTEXT.

---

## Tablice zadań (Boards / Kanban)

- Lista tablic: `/boards`; pojedyncza tablica: `/boards/:boardId`.
- Kolumny (np. todo, in progress, review, done), przypisania, terminy — w DATA CONTEXT przy zadaniach.
- Zadania mogą mieć **termin**, **okres pracy**, część może być **tylko w kalendarzu zadań** (bez tablicy) — jeśli występuje w kontekście.

---

## Czat i komunikaty

- **Czat** (`/chat`): kanały zespołu, powiadomienia o nieprzeczytanych.
- **Komunikaty** (`/announcements`): ogłoszenia od Admina (lub wg konfiguracji), załączniki możliwe — tytuły widocznych komunikatów mogą być w DATA CONTEXT.

---

## AI Asystent (ten moduł)

- Ścieżka: `/ai-assistant`.
- Pytania o **Planopię** (funkcje, nawigacja, dane zespołu): **DATA CONTEXT** (dane za wybrany okres) oraz **ten dokument**. Pytania **ogólne** (nauka, zadania, programowanie, porady itd.): odpowiedź z wiedzy ogólnej — bez zmyślania liczb z kontekstu zespołu.
- **Eksport Excel/PDF**: przyciski **pod** odpowiedzią asystenta (nie w treści czatu) uruchamiają pobranie z bazy — zgodnie z instrukcją systemową w prompcie.
- **Uwaga:** **szkic grafiku przez AI** jest w **module Grafiki** (osobny panel), nie w tym czacie — opis wyżej w sekcji „AI — szkic grafiku”.

---

## Inne moduły (skrót)

- **Ustawienia** (`/settings`): konfiguracja zespołu, timer, typy urlopów, święta, grafiki, powiadomienia push, kody QR — szczegóły w UI.
- **Pakiety i rozliczenia** (`/packages`): plany, limity AI, zakupy, dokumenty prawne — patrz sekcja wyżej.
- **QR** (`/qr-scan/:code`): skan kodu (np. wejście).
- **Dokumenty prawne** (`/documents`): często tylko Admin (osobna strona; część dokumentów także na `/packages`).
- **Rejestracja zespołu / logowanie**: `/login`, `/team-registration`, reset hasła (`/reset-password`, `/new-password/:token`, itd.).

### Skrót: co Planopia potrafi (pytania „co to za apka / co oferujecie”)

- **Czas pracy**: dashboard, timer (jeśli włączony), wpisy dnia, nadgodziny, nieobecności, eksporty / podsumowania przez AI w wybranym okresie.
- **Urlopy**: zgłaszanie, akceptacje, kalendarze, plany urlopowe, PDF podglądu wniosku.
- **Grafiki**: widok miesiąca, ręczne wpisy, **auto-uzupełnienie miesiąca** (reguły), **panel AI szkicu** na stronie grafiku.
- **Zadania**: tablice Kanban, terminy, kalendarz zadań.
- **Komunikacja**: czat kanałowy, komunikaty.
- **AI**: globalny asystent z danymi zespołu (wg roli), eksport Excel/PDF z bazy po intencji w pytaniu; drafty urlopu / ewidencji z potwierdzeniem.
- **Organizacja**: role (Admin, HR, przełożony, pracownik), ustawienia zespołu, pakiety i rozliczenia, dokumenty prawne.

---

## Kalendarz / święta (Polska)

Jeśli w prompcie jest blok **POLSKIE ŚWIĘTA** / **POLISH PUBLIC HOLIDAYS**, to **jedyne** źródło dat świąt ruchomych. **1 maja = Święto Pracy** (nie 1 kwietnia). Lista zawiera też **24 grudnia (Wigilia)** — tak jak w kalendarzu Planopii przy włączonych polskich świętach (spójnie z widokiem ewidencji). Grafik może uwzględniać też **niestandardowe święta** zespołu z DATA CONTEXT.

---

## Słownik danych w kontekście (skrót)

- **Workdays**: godziny, notatki, nieobecności, sesje timera.
- **Leave requests**: typ, daty, statusy (pending, accepted, rejected, sent) — w Asystencie dla **całego aktywnego zespołu**.
- **Tasks**: status Kanban, tablica, przypisania.
- **Announcements**: tytuły widocznych komunikatów.

---

## Zasady odpowiedzi

1. **Dane liczbowe / osoby / statusy** — tylko z DATA CONTEXT; nie zmyślaj.
2. **Funkcje aplikacji, nawigacja, plany, cennik, limity AI, „czy jest opcja X”** — z **tego dokumentu** (w tym sekcja **Pakiety i rozliczenia**); jeśli czegoś tu nie ma albo użytkownik widzi inne liczby w UI niż w tabeli, przyznaj to i wskaż **stronę `/packages`** jako źródło aktualnych wartości.
3. **Język** — PL lub EN zgodnie z użytkownikiem.
4. **Bez żargonu technicznego** z pól wewnętrznych — tłumacz na język użytkownika.
5. **Urlopy** — nie wydawaj decyzji formalnych; możesz podsumować dane.
6. **Prywatność** — przestrzegaj zakresu roli.

---

## API (deweloperskie)

- `POST /api/ai-assistant/chat`, `POST /api/ai-assistant/chat/stream` — kontekst z bazy wg uprawnień.
- `POST /api/ai-assistant/export/from-intent` — eksport pliku z bazy (Excel/PDF), nie z tekstu modelu.
