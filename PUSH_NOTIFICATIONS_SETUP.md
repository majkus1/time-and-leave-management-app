# Konfiguracja Powiadomień Push w PWA

## Wymagania

1. **VAPID Keys** - Klucze do autoryzacji powiadomień push
2. **HTTPS** - Powiadomienia push wymagają bezpiecznego połączenia (HTTPS) lub localhost

## Konfiguracja VAPID Keys

### 1. Generowanie VAPID Keys

Użyj narzędzia `web-push` do wygenerowania kluczy:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

To wygeneruje:
- **Public Key** (VAPID_PUBLIC_KEY)
- **Private Key** (VAPID_PRIVATE_KEY)
- **Subject** (VAPID_SUBJECT) - zwykle mailto: URL, np. `mailto:admin@planopia.pl`

**Co to jest VAPID_SUBJECT?**
- To identyfikator kontaktowy administratora aplikacji
- Używany przez serwisy push (np. Chrome, Firefox) do identyfikacji, kto wysyła powiadomienia
- Format: `mailto:twoj@email.com`
- **Możesz wpisać dowolny adres email** - najlepiej email administratora/wsparcia technicznego
- Przykłady:
  - `mailto:admin@planopia.pl` - email administratora
  - `mailto:support@planopia.pl` - email wsparcia
  - `mailto:kontakt@planopia.pl` - email kontaktowy
- **Ważne**: Ten email nie jest używany do faktycznego kontaktu, tylko do identyfikacji w systemie push

### 2. Dodanie do zmiennych środowiskowych

Dodaj do pliku `.env` w katalogu `server/`:

```env
VAPID_PUBLIC_KEY=twoj_public_key
VAPID_PRIVATE_KEY=twoj_private_key
VAPID_SUBJECT=mailto:admin@planopia.pl
```

### 3. Restart serwera

Po dodaniu zmiennych środowiskowych, zrestartuj serwer:

```bash
npm start
```

## Funkcjonalności

### Powiadomienia Push dla:

1. **Czat** - Nowe wiadomości w kanałach
2. **Zadania** - Nowe zadania na tablicach
3. **Zmiany statusu** - Zmiany statusu zadań

### Zarządzanie powiadomieniami

Użytkownicy mogą zarządzać powiadomieniami w sekcji **Ustawienia** (`/settings`):

- Włączanie/wyłączanie powiadomień push
- Konfiguracja preferencji:
  - Powiadomienia o nowych wiadomościach w czacie
  - Powiadomienia o nowych zadaniach
  - Powiadomienia o zmianach statusu zadań

## Architektura

### Backend

- **Model**: `server/models/PushSubscription.js` - Przechowuje subskrypcje push
- **Service**: `server/services/pushNotificationService.js` - Wysyłanie powiadomień
- **Routes**: `server/routes/pushRoutes.js` - Endpointy API
- **Integracja**: Automatyczna integracja z systemem emaili w:
  - `server/controllers/chatController.js` - Nowe wiadomości
  - `server/controllers/taskController.js` - Nowe zadania i zmiany statusu

### Frontend

- **Hook**: `client/src/hooks/usePushNotifications.js` - Zarządzanie subskrypcjami
- **UI**: `client/src/components/profile/Settings.jsx` - Interfejs użytkownika
- **Service Worker**: Automatycznie generowany przez `vite-plugin-pwa` z obsługą push

## Testowanie

1. Upewnij się, że VAPID keys są skonfigurowane
2. Zaloguj się do aplikacji
3. Przejdź do **Ustawienia** (`/settings`)
4. Włącz powiadomienia push
5. Zezwól na powiadomienia w przeglądarce
6. Wyślij testową wiadomość w czacie lub utwórz zadanie

## Rozwiązywanie problemów

### Powiadomienia nie działają

1. Sprawdź czy VAPID keys są ustawione w `.env`
2. Sprawdź czy aplikacja działa na HTTPS (lub localhost)
3. Sprawdź czy użytkownik zezwolił na powiadomienia w przeglądarce
4. Sprawdź konsolę przeglądarki i logi serwera

### Service Worker nie działa

1. Sprawdź czy `vite-plugin-pwa` jest zainstalowany
2. Sprawdź czy aplikacja jest zbudowana (`npm run build`)
3. Sprawdź konsolę przeglądarki pod kątem błędów service workera

## Bezpieczeństwo

- VAPID keys powinny być przechowywane bezpiecznie
- Private key nigdy nie powinien być udostępniany publicznie
- Public key może być udostępniony w frontendzie (jest bezpieczny)
