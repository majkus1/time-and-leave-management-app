# Debugowanie Powiadomień Push na iOS

## Problem: Powiadomienia push nie działają na iPhone w PWA

### Wymagania iOS dla Push Notifications w PWA

1. **iOS 16.4+** - Push notifications w PWA są dostępne tylko od iOS 16.4
2. **HTTPS** - Wymagane bezpieczne połączenie (nie działa na localhost w produkcji)
3. **Service Worker** - Musi być poprawnie zarejestrowany
4. **Manifest PWA** - Musi zawierać odpowiednie pola

## Kroki debugowania

### 1. Sprawdź wersję iOS
- Upewnij się, że używasz iOS 16.4 lub nowszego
- Sprawdź: Ustawienia > Ogólne > Informacje > Wersja oprogramowania

### 2. Sprawdź Service Worker
Otwórz konsolę w Safari (na iPhone):
- Ustawienia Safari > Zaawansowane > Web Inspector (włącz)
- Połącz iPhone z Mac i otwórz Safari > Develop > [Twoje urządzenie] > [Strona]

W konsoli sprawdź:
```javascript
navigator.serviceWorker.ready.then(reg => console.log('SW ready:', reg))
navigator.serviceWorker.getRegistration().then(reg => console.log('SW registration:', reg))
```

### 3. Sprawdź subskrypcję push
W konsoli Safari:
```javascript
navigator.serviceWorker.ready.then(async (reg) => {
  const sub = await reg.pushManager.getSubscription()
  console.log('Push subscription:', sub)
  if (sub) {
    console.log('Endpoint:', sub.endpoint)
    console.log('Keys:', {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))
    })
  }
})
```

### 4. Sprawdź logi serwera
Po wysłaniu wiadomości w czacie, sprawdź logi serwera:
- Powinny pojawić się logi `[Push] Sending chat notification...`
- Powinny pojawić się logi `[Push] Found X active subscriptions...`
- Powinny pojawić się logi `[Push] Successfully sent...` lub błędy

### 5. Sprawdź bazę danych
Sprawdź czy subskrypcja jest zapisana:
```javascript
// W MongoDB
db.pushSubscriptions.find({ userId: ObjectId("...") })
```

### 6. Sprawdź VAPID keys
Upewnij się, że VAPID keys są ustawione w `.env`:
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@planopia.pl
```

### 7. Sprawdź uprawnienia
Na iPhone:
- Ustawienia > Planopia > Powiadomienia (powinno być włączone)
- Ustawienia > Safari > Powiadomienia (jeśli używasz Safari)

## Częste problemy

### Problem: Service Worker nie jest zarejestrowany
**Rozwiązanie:**
- Sprawdź czy aplikacja działa na HTTPS
- Sprawdź czy `vite-plugin-pwa` jest poprawnie skonfigurowany
- Sprawdź konsolę przeglądarki pod kątem błędów

### Problem: Subskrypcja nie jest zapisywana
**Rozwiązanie:**
- Sprawdź logi w konsoli przeglądarki
- Sprawdź czy endpoint `/api/push/register` zwraca sukces
- Sprawdź czy użytkownik jest zalogowany

### Problem: Powiadomienia nie są wysyłane
**Rozwiązanie:**
- Sprawdź logi serwera - powinny pokazać ile subskrypcji znaleziono
- Sprawdź czy preferencje użytkownika mają włączone powiadomienia dla czatu/zadań
- Sprawdź czy VAPID keys są poprawne

### Problem: iOS nie pokazuje powiadomień
**Rozwiązanie:**
- Upewnij się, że używasz iOS 16.4+
- Sprawdź uprawnienia w ustawieniach iPhone
- Sprawdź czy aplikacja jest zainstalowana jako PWA (dodana do ekranu głównego)
- **Ważne**: Push notifications w iOS PWA działają tylko gdy aplikacja jest zainstalowana jako PWA

## Testowanie

1. **Zainstaluj PWA na iPhone:**
   - Otwórz aplikację w Safari
   - Kliknij przycisk "Udostępnij"
   - Wybierz "Dodaj do ekranu głównego"

2. **Włącz powiadomienia:**
   - Otwórz zainstalowaną PWA
   - Przejdź do Ustawienia
   - Włącz powiadomienia push

3. **Przetestuj:**
   - Wyślij wiadomość w czacie (z innego urządzenia/konta)
   - Sprawdź logi serwera
   - Sprawdź czy powiadomienie przyszło

## Dodatkowe informacje

- iOS wymaga, aby PWA była zainstalowana (dodana do ekranu głównego) aby push notifications działały
- Push notifications nie działają w Safari bez instalacji PWA
- Wymagane jest HTTPS w produkcji (localhost działa tylko w development)
