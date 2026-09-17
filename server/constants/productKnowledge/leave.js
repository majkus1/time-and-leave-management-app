// Źródło: TutorialModal (leave-request, leave-planner, leave-plans, leave-approval), models/Settings.js
// (leaveRequestTypes: requireApproval, allowDaysLimit, minDaysBefore, settlementUnit; autoDeductLeaveLimits;
// allowManagedLeaveRequests), leaveController.submitLeaveRequest (duplikat, kolizje, godzinowe),
// leaveBalanceService (auto-rozliczanie + ślad na wniosku), leaveRecipientsService, freemiumApiPolicyService.
module.exports = {
	id: 'leave',
	order: 3,
	title: { pl: 'Urlopy i nieobecności', en: 'Leave and absences' },
	summary: {
		pl: 'Wnioski (dzienne i godzinowe), typy urlopów, akceptacja, pula dni i jej automatyczne rozliczanie, planer, raporty.',
		en: 'Requests (daily and hourly), leave types, approval, day balance with automatic settlement, planner, reports.',
	},
	keywords: {
		pl: ['urlop', 'wniosk', 'wniosek', 'nieobecn', ' l4', 'zwolnien', 'chorob', 'okolicznoś', 'bezpłatny urlop', 'akcept', 'zatwierdz', 'odrzuc', ' pula', ' puli', ' pulę', 'limit dni', 'saldo', 'godzinow', 'planer', 'plan urlop', 'plany urlop', 'zastępst', 'wyprzedzen', 'opieka', 'macierzyń', 'ojcowsk'],
		en: ['leave', 'vacation', 'holiday', 'request', 'absence', 'sick', 'approve', 'reject', 'balance', 'allowance', 'hourly', 'planner', 'substitute', 'notice period', 'days off', 'time off', 'pto'],
	},
	requires: { modules: [], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Jak pracownik składa wniosek urlopowy i kto go zatwierdza?', 'Czy da się wziąć urlop na kilka godzin?', 'Czy pula dni urlopu odejmuje się sama po akceptacji?', 'Jak zobaczyć, kto jest na urlopie w danym tygodniu?'],
		en: ['How does an employee submit a leave request and who approves it?', 'Can leave be taken for a few hours?', 'Is the leave balance deducted automatically after approval?', 'How do I see who is on leave in a given week?'],
	},
	body: {
		pl: `### Składanie wniosku
- Menu → „Zgłoś urlop”: pracownik wybiera typ, daty (albo jeden dzień i liczbę godzin przy typie godzinowym), opcjonalnie zastępstwo i uwagi. Formularz pokazuje dostępną pulę dni dla typów z limitem.
- Wniosek na dni wolne jest przycinany do dni roboczych (weekendy i święta wg ustawień zespołu); wniosek wyłącznie na dni wolne jest odrzucany.
- Aplikacja nie pozwala złożyć drugiego identycznego wniosku (ten sam typ i daty, jeśli pierwszy czeka na decyzję) ani wniosku nakładającego się na już zaakceptowany urlop. Jeśli termin koliduje z opublikowanym grafikiem, pracownik dostaje ostrzeżenie i potwierdza świadomie.
- Statusy: oczekujący → zaakceptowany / odrzucony; anulowanie własnego oczekującego wniosku jest możliwe. Typy bez wymogu akceptacji (domyślnie zwolnienie lekarskie L4) trafiają od razu jako „wysłane” i zajmują kalendarz.
- Powiadomienia: e-mail i push do osób, które mogą zatwierdzić (Administrator, HR, przełożony wg zakresu), a po decyzji do pracownika. Każdy może wyłączyć e-maile w Ustawieniach → Powiadomienia e-mail.

### Typy urlopów i reguły (Ustawienia, Administrator/HR)
- Domyślnie: wypoczynkowy (z pulą dni), okolicznościowy, na żądanie, bezpłatny, inna nieobecność, zwolnienie lekarskie L4 (bez akceptacji). Można dodawać własne typy i wyłączać niepotrzebne.
- Dla każdego typu: czy wymaga akceptacji, czy ma pulę dni (limit per pracownik), minimalne wyprzedzenie w dniach (np. wniosek co najmniej 3 dni przed), jednostka rozliczenia: dni albo **godziny** (np. opieka nad dzieckiem z art. 188 KP — wniosek na jeden dzień i liczbę godzin; kilka wniosków godzinowych tego samego dnia sumuje się do limitu godzin pracy).
- Rozliczanie urlopu w dniach albo w godzinach (z liczbą godzin na dzień) — ustawienie zespołu.

### Pula dni i automatyczne rozliczanie
- Pulę (np. 20 lub 26 dni) ustawia Administrator/HR per pracownik i per typ z limitem. Pracownik widzi ją w formularzu i w „Statystykach”.
- Opcja „Automatycznie rozliczaj pulę urlopową” (Ustawienia): akceptacja wniosku odejmuje dni (lub godziny) z puli, odrzucenie albo anulowanie oddaje je. Przełożony po decyzji widzi komunikat z ruchem na puli i nowym saldem, a na karcie wniosku zostaje ślad „Rozliczono z puli: −N dni”. Nic nie jest przeliczane wstecz; saldo zawsze można poprawić ręcznie.

### Zatwierdzanie (Administrator, HR, przełożony)
- Menu → „Wnioski urlopowe”: lista wniosków zespołu z filtrami okresu, działu, pracownika i statusu; przy każdym wniosku Zatwierdź / Odrzuć. Przełożony widzi tylko swój dział lub wybrane osoby (wg uprawnień).
- „Statystyki” obok filtra: podsumowanie wniosków, limity, typy — stamtąd Excel/PDF. Na dole strony: Excel/PDF raport urlopów zespołu za okres. PDF pojedynczego wniosku: podgląd z listy.

### Planowanie
- „Zaplanuj swój urlop”: kalendarz własnych wniosków i nieobecności ze „Statystykami”.
- „Plany urlopowe”: kalendarz całego zespołu (zaakceptowane wnioski i nieobecności) z filtrem pracownika i działu oraz Asystent terminu urlopu, który sprawdza wybrany termin pod kątem nieobecności i świąt.
- Zaakceptowane urlopy są widoczne w grafikach i w ewidencji.

### Pracownicy bez dostępu
Po włączeniu w Ustawieniach uprawnieni użytkownicy mogą składać wnioski w imieniu osób bez konta w aplikacji (w planie płatnym).

### Dostępność w planach
Okres próbny: pełne urlopy. Plan Core (każdy rozmiar): urlopy w cenie. Pakiety Pro/Business: w cenie. Plan darmowy: **bez** składania i zatwierdzania wniosków (widać tylko dawne wnioski w kalendarzach).

### Czego NIE robi
- Nie generuje dokumentów kadrowych (np. karty urlopowej w formacie wymaganym przez program kadrowy) — jest PDF wniosku i raporty.
- Nie liczy automatycznie wymiaru urlopu z Kodeksu pracy (20/26 dni, proporcje przy zatrudnieniu w trakcie roku) — pulę wpisuje Administrator/HR.
- Nie przenosi automatycznie niewykorzystanych dni na kolejny rok.

### Gdzie w aplikacji / kto może
Wniosek: menu → Zgłoś urlop (każdy). Zatwierdzanie: menu → Wnioski urlopowe (Administrator, HR, przełożony z uprawnieniem). Typy, reguły, pule, auto-rozliczanie: menu → Ustawienia (Administrator, HR). Plany zespołu: menu → Plany urlopowe.`,
		en: null,
	},
}
