# 📱 Dokumentacja funkcji QR - Wejście/Wyjście

## 🎯 Przegląd funkcjonalności

Funkcja QR pozwala na automatyczną rejestrację czasu pracy poprzez skanowanie kodów QR. Każdy zespół może wygenerować wiele kodów QR (np. dla różnych wejść), a pracownicy skanując kod automatycznie uruchamiają/zatrzymują timer pracy.

---

## 📋 KROK PO KROKU - Jak działa funkcja QR

### **ETAP 1: Generowanie kodu QR (Admin/HR)**

**Lokalizacja:** `/settings` → Sekcja "📱 Kody QR - Wejście/Wyjście"

**Proces:**
1. **Admin lub HR** wchodzi w ustawienia
2. W sekcji kodów QR wpisuje nazwę miejsca (np. "Biuro główne", "Wejście A")
3. Klika "Generuj kod QR"
4. **Backend (`qrController.generateQRCode`):**
   - Sprawdza uprawnienia (tylko Admin/HR)
   - Generuje unikalny kod: `${teamId.slice(-6)}-${randomHex(16)}`
   - Tworzy rekord w bazie (`QRCode` model):
     ```javascript
     {
       teamId: ObjectId,
       code: "abc123-def456...",
       name: "Biuro główne",
       isActive: true,
       createdBy: userId
     }
     ```
5. **Frontend** wyświetla:
   - Kod QR (SVG) z URL: `${window.location.origin}/qr-scan/${code}`
   - Możliwość pobrania kodu jako PNG
   - Możliwość usunięcia kodu

**Endpoint:** `POST /api/qr/generate`
**Model:** `QRCode` (MongoDB)

---

### **ETAP 2: Skanowanie kodu QR (Pracownik)**

**Scenariusz A: Pracownik NIE jest zalogowany**

1. Pracownik skanuje kod QR (aplikacja kamery lub skaner QR)
2. Otwiera się URL: `https://planopia.pl/qr-scan/abc123-def456...`
3. **Frontend (`QRScan.jsx`):**
   - Automatycznie wywołuje `GET /api/qr/verify/${code}` (publiczny endpoint, bez autoryzacji)
   - Jeśli kod jest nieprawidłowy → wyświetla błąd
   - Jeśli kod jest prawidłowy → przekierowuje do `/login?redirect=/qr-scan/${code}`
4. Po zalogowaniu → automatycznie wraca do `/qr-scan/${code}` i kontynuuje proces

**Scenariusz B: Pracownik JEST zalogowany**

1. Pracownik skanuje kod QR
2. Otwiera się URL: `https://planopia.pl/qr-scan/abc123-def456...`
3. **Frontend (`QRScan.jsx`):**
   - Automatycznie wywołuje `GET /api/qr/verify/${code}`
   - Jeśli kod jest prawidłowy → automatycznie wywołuje `handleRegister()`
   - Jeśli kod jest nieprawidłowy → wyświetla błąd

**Endpoint weryfikacji:** `GET /api/qr/verify/:code` (PUBLICZNY - bez autoryzacji)

---

### **ETAP 3: Rejestracja wejścia/wyjścia**

**Proces automatyczny (po weryfikacji kodu):**

1. **Frontend** wywołuje: `POST /api/time-entry/register` z `{ code: "abc123-def456..." }`
2. **Backend (`timeEntryController.registerTimeEntry`):**

   **KROK 3.1: Walidacja**
   - Sprawdza czy kod QR istnieje i jest aktywny
   - Sprawdza czy użytkownik należy do tego samego zespołu co kod QR
   - Jeśli nie → zwraca 403 "Kod QR nie należy do Twojego zespołu"

   **KROK 3.2: Określenie typu akcji (wejście/wyjście)**
   
   Sprawdza:
   - Czy istnieje aktywny timer dla tego użytkownika dzisiaj z tym samym `qrCodeId`
   - Czy istnieje ostatni `TimeEntry` dla tego użytkownika dzisiaj z tym samym `qrCodeId` bez `exitTime`

   **Scenariusz A: WYJŚCIE (Exit)**
   - Jeśli istnieje aktywny timer z tym samym `qrCodeId`:
     - Zatrzymuje timer (`workday.activeTimer`)
     - Tworzy sesję w `workday.timeEntries` z:
       - `startTime`, `endTime`
       - `isBreak`, `isOvertime`
       - `workDescription`, `taskId`
       - `qrCodeId` (oznaczenie że to z QR)
     - Aktualizuje `workday.hoursWorked` (lub `additionalWorked` jeśli overtime)
     - Aktualizuje `workday.realTimeDayWorked` (dodaje zakres czasu)
     - Czyści `workday.activeTimer`
   - Jeśli istnieje `TimeEntry` bez `exitTime`:
     - Ustawia `exitTime` na aktualny czas
     - Aktualizuje `Workday` (stary sposób - dla kompatybilności)
   - Zwraca: `{ type: 'exit', message: 'Wyjście zarejestrowane' }`

   **Scenariusz B: WEJŚCIE (Entry)**
   - **Walidacja przed startem:**
     - Sprawdza czy można uruchomić timer (`canStartTimerOnDate`):
       - ❌ Weekend (jeśli zespół nie pracuje w weekendy)
       - ❌ Święto (polskie lub niestandardowe)
       - ❌ Zaakceptowany wniosek urlopowy/nieobecność
       - ❌ Istnieje już workday z `hoursWorked > 0` dla tego dnia
     - Jeśli walidacja nie przejdzie → zwraca błąd 400 z powodem
   - Tworzy nowy `TimeEntry`:
     ```javascript
     {
       userId: ObjectId,
       qrCodeId: ObjectId,
       entryTime: Date (now),
       date: Date (today, 00:00:00),
       exitTime: null
     }
     ```
   - Tworzy lub aktualizuje `Workday` dla dzisiaj
   - Uruchamia timer (`workday.activeTimer`):
     ```javascript
     {
       startTime: Date (now),
       isBreak: false,
       isOvertime: false,
       workDescription: '', // Pusty - można edytować później
       taskId: null,
       qrCodeId: ObjectId // Oznaczenie że start z QR
     }
     ```
   - Zwraca: `{ type: 'entry', message: 'Wejście zarejestrowane' }`

3. **Frontend:**
   - Wyświetla komunikat sukcesu (✅ Wejście zarejestrowane / 👋 Wyjście zarejestrowane)
   - Po 2 sekundach przekierowuje do `/dashboard`
   - Odświeża stronę (`window.location.reload()`) aby zaktualizować timer

**Endpoint:** `POST /api/time-entry/register` (wymaga autoryzacji)

---

### **ETAP 4: Integracja z timerem**

**Gdy timer jest aktywny (uruchomiony przez QR):**

1. **W `TimerPanel.jsx`:**
   - Wyświetla aktywny timer z czasem pracy
   - Pokazuje "Z kodu QR" jeśli `activeTimer.qrCodeId` jest ustawione
   - Pozwala na:
     - Edycję opisu pracy (`workDescription`)
     - Wybór zadania (`taskId`)
     - Przełączenie trybu nadgodzin (`isOvertime`)
     - Pauzę/Wznowienie (`isBreak`)
     - Zatrzymanie timera (Stop)

2. **Aktualizacje timera:**
   - `PUT /api/workdays/timer/update` - aktualizuje `workDescription`, `taskId`, `isOvertime`
   - `POST /api/workdays/timer/pause` - przełącza `isBreak`
   - `POST /api/workdays/timer/stop` - zatrzymuje timer i tworzy sesję

3. **Gdy pracownik skanuje ten sam kod QR ponownie:**
   - Automatycznie zatrzymuje timer (wyjście)
   - Zapisuje sesję z wszystkimi danymi

---

## 🔒 Walidacje i zabezpieczenia

### **Obecne walidacje:**

✅ **Przed generowaniem kodu QR:**
- Tylko Admin/HR może generować kody
- Nazwa kodu jest wymagana
- Kod musi być unikalny

✅ **Przed rejestracją:**
- Kod QR musi istnieć i być aktywny
- Użytkownik musi należeć do tego samego zespołu co kod QR
- Nie można uruchomić nowego timera jeśli inny timer jest już aktywny

### **✅ Wszystkie walidacje są zaimplementowane:**

✅ **Przed startem timera przez QR:**
- ✅ Sprawdza czy to weekend (jeśli zespół nie pracuje w weekendy)
- ✅ Sprawdza czy to święto
- ✅ Sprawdza czy użytkownik ma zaakceptowany wniosek urlopowy/nieobecność
- ✅ Sprawdza czy już istnieje workday z `hoursWorked > 0` dla tego dnia

**Implementacja:** Wywołanie `canStartTimerOnDate()` przed startem timera w `timeEntryController.registerTimeEntry` (linia ~192).

---

## 📊 Struktura danych

### **Model QRCode:**
```javascript
{
  _id: ObjectId,
  teamId: ObjectId (ref: Team),
  code: String (unique), // Format: "abc123-def456..."
  name: String, // "Biuro główne"
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### **Model TimeEntry (stary sposób - dla kompatybilności):**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  qrCodeId: ObjectId (ref: QRCode),
  entryTime: Date,
  exitTime: Date | null,
  date: Date, // Data bez czasu (00:00:00)
  isOvertime: Boolean,
  workDescription: String,
  taskId: ObjectId (ref: Task)
}
```

### **Model Workday (nowy sposób - główny):**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date, // Data bez czasu
  hoursWorked: Number, // Suma godzin pracy
  additionalWorked: Number, // Nadgodziny
  realTimeDayWorked: String, // "09:00-17:00, 18:00-20:00"
  timeEntries: [{
    _id: ObjectId,
    startTime: Date,
    endTime: Date,
    isBreak: Boolean,
    isOvertime: Boolean,
    workDescription: String,
    taskId: ObjectId (ref: Task),
    qrCodeId: ObjectId (ref: QRCode) // Oznaczenie że z QR
  }],
  activeTimer: {
    startTime: Date,
    isBreak: Boolean,
    isOvertime: Boolean,
    workDescription: String,
    taskId: ObjectId (ref: Task),
    qrCodeId: ObjectId (ref: QRCode) // Oznaczenie że z QR
  } | null
}
```

---

## 🔄 Flow diagram

```
[Admin/HR] Generuje kod QR
    ↓
[QRCode Model] Zapis w bazie
    ↓
[Pracownik] Skanuje kod QR
    ↓
[QRScan.jsx] Weryfikacja kodu (GET /api/qr/verify/:code)
    ↓
    ├─ Nieprawidłowy → Błąd
    └─ Prawidłowy → Sprawdź czy zalogowany
        ↓
        ├─ Nie zalogowany → Przekieruj do /login
        └─ Zalogowany → POST /api/time-entry/register
            ↓
            [timeEntryController] Sprawdź typ akcji
                ↓
                ├─ WEJŚCIE (brak aktywnego timera z tym QR)
                │   ↓
                │   [Workday] Uruchom activeTimer z qrCodeId
                │   ↓
                │   [TimeEntry] Utwórz entry bez exitTime
                │   ↓
                │   ✅ Zwróć { type: 'entry' }
                │
                └─ WYJŚCIE (istnieje aktywny timer z tym QR)
                    ↓
                    [Workday] Zatrzymaj activeTimer
                    ↓
                    [Workday.timeEntries] Dodaj sesję z qrCodeId
                    ↓
                    [TimeEntry] Ustaw exitTime
                    ↓
                    ✅ Zwróć { type: 'exit' }
```

---

## ✅ Naprawione problemy

### **1. ✅ Dodana walidacja przed startem timera przez QR**
**Status:** Naprawione ✅

**Rozwiązanie:** Dodano wywołanie `canStartTimerOnDate()` przed startem timera w `timeEntryController.registerTimeEntry` (linia ~192):
```javascript
// Validate if timer can be started on this date
const workdayController = require('./workdayController')
const { canStart, reason } = await workdayController.canStartTimerOnDate(userId, today)
if (!canStart) {
  return res.status(400).json({ message: reason })
}
```

### **2. Podwójne zapisywanie (TimeEntry + Workday)**
**Problem:** System zapisuje zarówno `TimeEntry` (stary sposób) jak i `Workday.activeTimer` (nowy sposób). To może prowadzić do duplikacji danych.

**Rozwiązanie:** Rozważyć usunięcie `TimeEntry` i używanie tylko `Workday` z `timeEntries`.

### **3. Brak walidacji czy użytkownik ma już workday z hoursWorked**
**Problem:** W `canStartTimerOnDate` w `workdayController.js` jest sprawdzenie, ale nie jest wywoływane w `timeEntryController`.

**Rozwiązanie:** Dodać wywołanie `canStartTimerOnDate` przed startem timera.

---

## 📝 Endpointy API

### **Publiczne (bez autoryzacji):**
- `GET /api/qr/verify/:code` - Weryfikacja kodu QR

### **Chronione (wymagają autoryzacji):**
- `POST /api/qr/generate` - Generowanie kodu QR (Admin/HR)
- `GET /api/qr/team-codes` - Lista kodów QR zespołu (Admin/HR)
- `DELETE /api/qr/:id` - Usunięcie kodu QR (Admin/HR)
- `POST /api/time-entry/register` - Rejestracja wejścia/wyjścia
- `GET /api/time-entry/today` - Dzisiejsze wpisy czasu

---

## 🧪 Testowanie przed produkcją

### **Scenariusze testowe:**

1. ✅ Generowanie kodu QR (Admin/HR)
2. ✅ Skanowanie kodu QR przez zalogowanego użytkownika
3. ✅ Skanowanie kodu QR przez niezalogowanego użytkownika
4. ✅ Rejestracja wejścia (pierwsze skanowanie)
5. ✅ Rejestracja wyjścia (drugie skanowanie tego samego kodu)
6. ✅ Edycja opisu pracy w aktywnym timerze (z QR)
7. ✅ Przełączenie trybu nadgodzin w aktywnym timerze (z QR)
8. ✅ **Test: Skanowanie QR w weekend (jeśli zespół nie pracuje w weekendy) - POWINNO BLOKOWAĆ**
9. ✅ **Test: Skanowanie QR w święto - POWINNO BLOKOWAĆ**
10. ✅ **Test: Skanowanie QR gdy użytkownik ma zaakceptowany urlop - POWINNO BLOKOWAĆ**
11. ✅ **Test: Skanowanie QR gdy już istnieje workday z hoursWorked - POWINNO BLOKOWAĆ**

---

## 🚀 Wdrożenie na produkcję

### **Kroki przed wdrożeniem:**

1. ✅ Dodać walidację `canStartTimerOnDate` przed startem timera w `timeEntryController.registerTimeEntry` - **WYKONANE**
2. ✅ Przetestować wszystkie scenariusze testowe
3. ✅ Sprawdzić czy wszystkie tłumaczenia są dodane
4. ✅ Sprawdzić czy informacja o pracach modernizacyjnych jest widoczna
5. ✅ Sprawdzić czy routing `/qr-scan/:code` działa poprawnie
6. ✅ Sprawdzić czy endpoint weryfikacji QR jest publiczny (bez autoryzacji)

---

## 📞 Kontakt / Wsparcie

W razie problemów sprawdź:
- Logi serwera (`console.error` w `timeEntryController.js`, `qrController.js`)
- Network tab w DevTools (sprawdź odpowiedzi API)
- MongoDB (sprawdź czy rekordy są zapisywane w `QRCode`, `TimeEntry`, `Workday`)

---

**Ostatnia aktualizacja:** 2025-01-28
**Status:** ✅ Gotowe do wdrożenia na produkcję (wszystkie walidacje zaimplementowane)
