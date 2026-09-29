// Źródło: planCatalog.js (jedyne źródło liczb — wstrzykiwane przez placeholdery), TutorialModal (packages-billing-legal),
// billingPurchaseIntentValidator (dane do faktury, limit miejsc), p24/stripe services, lifecycleEmailService (KSeF).
// Enterprise/949 świadomie nieobecne: nie jest w ofercie publicznej, > 100 osób = wycena indywidualna.
module.exports = {
	id: 'packages',
	order: 8,
	title: { pl: 'Pakiety, ceny i płatności', en: 'Plans, pricing and payments' },
	summary: {
		pl: 'Okres próbny, plan darmowy, Core w pięciu progach z modułami, pakiety PRO i Business, asystent AI bez limitu, rozliczenie roczne, płatności i faktury.',
		en: 'Trial, free plan, Core in five sizes with modules, PRO and Business bundles, unlimited AI assistant, annual billing, payments and invoices.',
	},
	keywords: {
		pl: ['cena', 'ceny', 'cenn', 'koszt', 'ile kosztuje', 'ile płac', 'ile za ', 'pakiet', 'abonament', 'subskrypc', 'core', ' pro ', 'business', 'moduł', 'płatnoś', 'zapłac', 'faktur', ' vat', 'netto', 'blik', 'przelew', 'karta', 'kartą', 'stripe', 'roczn', 'miesięczn', 'rezygn', 'anulow', 'zwrot', 'ksef', 'darmow', 'bezpłatn', 'freemium', 'trial', 'próbn', 'użytkowników', 'pracowników', 'osób', 'wygaś', 'przedłuż', 'enterprise', 'dokup'],
		en: ['price', 'pricing', 'cost', 'how much', 'plans', 'which plan', 'plan for', 'package', 'subscription', 'core', ' pro ', 'business', 'module', 'payment', 'pay', 'invoice', ' vat', 'net', 'card', 'transfer', 'annual', 'yearly', 'monthly', 'cancel', 'refund', 'users', 'people', 'employees', 'expire', 'renew', 'enterprise', 'top-up', 'top up'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Ile kosztuje Planopia dla 20 osób?', 'Czym różni się Core od PRO?', 'Jak zapłacić i czy dostanę fakturę?', 'Co się stanie, gdy nie przedłużę pakietu?'],
		en: ['How much does Planopia cost for 20 people?', 'What is the difference between Core and PRO?', 'How do I pay and will I get an invoice?', 'What happens if I do not renew?'],
	},
	body: {
		pl: `### Etapy
1. Okres próbny: {{trial.days}} dni pełnej aplikacji, do {{trial.maxUsers}} osób, z asystentem AI bez limitu wiadomości. Bez karty.
2. Plan darmowy (bezterminowo, po okresie próbnym): do {{trial.maxUsers}} aktywnych kont — ewidencja czasu pracy (kalendarz, nadgodziny, czynności i wydajność) oraz wydruk ewidencji każdej osoby (PDF, Excel). Bez urlopów, asystenta AI z danymi zespołu, licznika i QR, grafików, zadań i czatu.
3. Plan płatny — Core (z modułami do wyboru) albo pakiet PRO / Business, w którym wszystko jest w cenie.

### Core — ewidencja, urlopy, raporty, powiadomienia i asystent AI
| Core | cena netto/mies. |
|---|---|
| do {{maxUsers.plan.base_5}} osób | {{price.plan.base_5}} zł |
| do {{maxUsers.plan.base_s}} osób | {{price.plan.base_s}} zł |
| do {{maxUsers.plan.base_m}} osób | {{price.plan.base_m}} zł |
| do {{maxUsers.plan.base_50}} osób | {{price.plan.base_50}} zł |
| do {{maxUsers.plan.base_l}} osób | {{price.plan.base_l}} zł |

W każdym Core jest asystent AI bez limitu wiadomości (rozsądne użycie). Moduły do Core (netto/mies., cena ta sama przy każdej wielkości zespołu): Timer i QR {{price.module.timer_qr}} zł, Grafiki (z układaniem grafiku przez AI) {{price.module.schedules_ai}} zł, Zadania i czat {{price.module.tasks_chat}} zł.

### PRO i Business — wszystko w cenie
| pakiet | osób | cena netto/mies. |
|---|---|---|
| PRO | do {{maxUsers.plan.pro_15}} | {{price.plan.pro_15}} zł |
| PRO | do {{maxUsers.plan.pro}} | {{price.plan.pro}} zł |
| PRO | do {{maxUsers.plan.pro_50}} | {{price.plan.pro_50}} zł |
| Business | do {{maxUsers.plan.business}} | {{price.plan.business}} zł, priorytetowe wsparcie |

Zespoły powyżej {{maxUsers.plan.business}} osób: wycena indywidualna — kontakt przez Centrum pomocy lub biuro@planopia.pl. Nie ma gotowego większego pakietu w cenniku.

### Jak dobrać
- Liczba osób = aktywne konta (w tym pracownicy bez dostępu); wybierasz najmniejszy próg, który je mieści.
- Sama ewidencja z urlopami i asystentem: Core. Z jednym modułem Core zwykle wychodzi taniej; przy dwóch lub trzech modułach PRO często wychodzi taniej niż Core z modułami. Kalkulator na stronie cennika i w Pakietach i rozliczeniach sam wskazuje tańszą opcję.
- Od 51 do 100 osób ze wszystkimi funkcjami: Business.
- Rozliczenie roczne: płacisz za {{annual.monthsCharged}} miesięcy zamiast 12 (plan i moduły).
- Pakietów wiadomości AI nie ma — asystent w planach płatnych nie ma limitu wiadomości.
- Obecni klienci zachowują swoje plany i ceny (dawne Core S/M/L to te same progi do 15/30/100 osób, teraz z asystentem AI w cenie). Dawne osobne moduły Zadania, Czat i Asystent AI działają u zespołów, które je mają, ale nie są już w sprzedaży.

### Płatności i faktury
- Menu → Pakiety i rozliczenia (Administrator, HR): kalkulator z liczbą osób i potrzebnymi funkcjami pokazuje plan dla zaznaczonych funkcji (ta sama logika co na stronie cennika); pakiet PRO/Business poleca tylko wtedy, gdy wychodzi nie drożej niż Core z zaznaczonymi modułami — wtedy pokazuje obie ceny i oszczędność, a Core z modułami można wybrać drugim przyciskiem, obok są wszystkie plany; wybierasz cykl (miesięczny/roczny), plan i moduły.
- Obecni klienci zostają przy swoim planie i cenie. Zespół z aktywnym planem (także gdy karta jest ponownie obciążana po odrzuceniu) nie płaci w aplikacji za inny plan ani dodatkowy moduł — wysyła prośbę przyciskiem „Poproś o zmianę planu” (zgłoszenie do nas mailem, bez płatności); opłacony okres przenosimy i potwierdzamy mailem. Kalkulator pokazuje, co pasuje przy nowej liczbie osób albo z nowym modułem.
- Karta (Stripe): subskrypcja odnawiana automatycznie co miesiąc; kartą zarządzasz na tej samej stronie, subskrypcję można anulować (działa do końca opłaconego okresu).
- Gdy bank odrzuci odnowienie kartą: plan działa jeszcze 7 dni od końca opłaconego okresu (data widoczna w Pakietach i rozliczeniach), pojawia się tam czerwony komunikat z przyciskiem „Zmień kartę”, a obciążenie jest ponawiane automatycznie. Po 7 dniach bez płatności zespół przechodzi na plan darmowy (do {{trial.maxUsers}} osób); po opłaceniu pełny plan wraca od razu. Najczęstsza przyczyna to wyłączone płatności internetowe lub cykliczne na karcie — włącza się je w aplikacji banku. Jeśli płatność nie przejdzie do końca okresu, zespół przechodzi na plan darmowy (do {{trial.maxUsers}} osób).
- BLIK / przelew (Przelewy24): płatność jednorazowa za wybrany okres (miesiąc lub rok), bez automatycznego odnowienia — przed końcem okresu aplikacja przypomina e-mailem. Ten sam plan z tymi samymi modułami przedłużasz przyciskiem „Przedłuż plan” w Pakietach i rozliczeniach (Administrator, HR), także przed końcem okresu: nowy okres zaczyna się po obecnym, więc nic nie przepada. Po wygaśnięciu przedłużenie działa od chwili płatności. Zmiana planu albo modułów przy aktywnym planie nadal idzie prośbą.
- Przed zakupem trzeba uzupełnić dane do faktury: firma — nazwa, adres i NIP; osoba fizyczna — imię i nazwisko oraz adres (bez NIP). Faktura jest wystawiana w KSeF i wysyłana e-mailem w ciągu kilku dni po płatności. Ceny są netto, VAT doliczany na fakturze.
- Po zakupie dostęp włącza się od razu (webhook płatności), bez czekania.

### Koniec okresu
Gdy pakiet wygaśnie i nie zostanie przedłużony, zespół wraca na plan darmowy: ewidencja do {{trial.maxUsers}} kont, dane zostają, reszta modułów wraca po opłaceniu. Przy większej liczbie kont — blokada do czasu przedłużenia lub zmniejszenia zespołu (patrz „Planopia — ogólnie”).

### Czego NIE robi
- Nie ma pakietu „Enterprise” w publicznym cenniku ani cen za użytkownika — plany mają limity miejsc.
- Nie ma zwrotów za niewykorzystany okres przy rezygnacji w trakcie (subskrypcja kartą działa do końca okresu).

### Gdzie w aplikacji / kto może
Menu → Pakiety i rozliczenia (Administrator, HR). Pracownicy nie widzą tej sekcji.`,
		en: null,
	},
}
