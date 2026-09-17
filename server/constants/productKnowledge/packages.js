// Źródło: planCatalog.js (jedyne źródło liczb — wstrzykiwane przez placeholdery), TutorialModal (packages-billing-legal),
// billingPurchaseIntentValidator (dane do faktury, limit miejsc), p24/stripe services, lifecycleEmailService (KSeF).
// Enterprise/949 świadomie nieobecne: nie jest w ofercie publicznej, > 100 osób = wycena indywidualna.
module.exports = {
	id: 'packages',
	order: 8,
	title: { pl: 'Pakiety, ceny i płatności', en: 'Plans, pricing and payments' },
	summary: {
		pl: 'Okres próbny, plan darmowy, Core S/M/L z modułami, pakiety Pro i Business, dokupy AI, rozliczenie roczne, płatności i faktury.',
		en: 'Trial, free plan, Core S/M/L with modules, Pro and Business bundles, AI top-ups, annual billing, payments and invoices.',
	},
	keywords: {
		pl: ['cena', 'ceny', 'cenn', 'koszt', 'ile kosztuje', 'ile płac', 'ile za ', 'pakiet', 'abonament', 'subskrypc', 'core', ' pro ', 'business', 'moduł', 'płatnoś', 'zapłac', 'faktur', ' vat', 'netto', 'blik', 'przelew', 'karta', 'kartą', 'stripe', 'roczn', 'miesięczn', 'rezygn', 'anulow', 'zwrot', 'ksef', 'darmow', 'bezpłatn', 'freemium', 'trial', 'próbn', 'użytkowników', 'pracowników', 'osób', 'wygaś', 'przedłuż', 'enterprise', 'dokup'],
		en: ['price', 'pricing', 'cost', 'how much', 'plans', 'which plan', 'plan for', 'package', 'subscription', 'core', ' pro ', 'business', 'module', 'payment', 'pay', 'invoice', ' vat', 'net', 'card', 'transfer', 'annual', 'yearly', 'monthly', 'cancel', 'refund', 'users', 'people', 'employees', 'expire', 'renew', 'enterprise', 'top-up', 'top up'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Ile kosztuje Planopia dla 20 osób?', 'Czym różni się Core od Pro?', 'Jak zapłacić i czy dostanę fakturę?', 'Co się stanie, gdy nie przedłużę pakietu?'],
		en: ['How much does Planopia cost for 20 people?', 'What is the difference between Core and Pro?', 'How do I pay and will I get an invoice?', 'What happens if I do not renew?'],
	},
	body: {
		pl: `### Etapy
1. Okres próbny: {{trial.days}} dni pełnej aplikacji, do {{trial.maxUsers}} osób, {{trial.aiMessages}} wiadomości AI. Bez karty.
2. Plan darmowy (bezterminowo, po trialu): ewidencja czasu pracy do {{trial.maxUsers}} aktywnych kont, bez urlopów, licznika/QR, grafików, zadań, czatu i AI.
3. Pakiet płatny — dwie drogi:

### Core — ewidencja i urlopy w cenie, moduły do wyboru
| plan | osób | cena netto/mies. |
|---|---|---|
| Core S | do {{maxUsers.plan.base_s}} | {{price.plan.base_s}} zł |
| Core M | do {{maxUsers.plan.base_m}} | {{price.plan.base_m}} zł |
| Core L | do {{maxUsers.plan.base_l}} | {{price.plan.base_l}} zł |

Moduły dokupywane do Core (netto/mies.): Licznik + QR {{price.module.timer_qr}} zł, Grafiki + AI w grafiku {{price.module.schedules_ai}} zł, Zadania (tablice) {{price.module.tasks}} zł, Czat {{price.module.chat}} zł, Asystent AI {{price.module.ai_assistant}} zł. Z modułem Asystent AI lub Grafiki + AI zespół ma wspólną pulę {{ai.coreModulePool}} wiadomości AI miesięcznie.

### Pakiety — wszystkie moduły w cenie
| pakiet | osób | AI/mies. | cena netto/mies. |
|---|---|---|---|
| Pro | do {{maxUsers.plan.pro}} | {{ai.plan.pro}} | {{price.plan.pro}} zł |
| Business | do {{maxUsers.plan.business}} | {{ai.plan.business}} | {{price.plan.business}} zł |

Zespoły powyżej {{maxUsers.plan.business}} osób: wycena indywidualna — kontakt przez Centrum pomocy lub biuro@planopia.pl. Nie ma gotowego większego pakietu w cenniku.

### Jak dobrać
- Liczba osób = aktywne konta (w tym pracownicy bez dostępu). Do 15 osób z samą ewidencją i urlopami: Core S. Potrzebne 2–3 moduły przy 16–30 osobach: porównaj Core M + moduły z Pro ({{price.plan.pro}} zł) — Pro często wychodzi taniej. Powyżej 30 osób z modułami: Business.
- Rozliczenie roczne: płacisz za {{annual.monthsCharged}} miesięcy zamiast 12 (plan i moduły).
- Dokupy wiadomości AI (jednorazowe, po aktywnym pakiecie płatnym): {{addon.ai50.messages}} za {{addon.ai50.price}} zł, {{addon.ai200.messages}} za {{addon.ai200.price}} zł, {{addon.ai500.messages}} za {{addon.ai500.price}} zł netto.

### Płatności i faktury
- Menu → Pakiety i rozliczenia (Administrator, HR): wybierasz cykl (miesięczny/roczny), plan i moduły.
- Karta (Stripe): subskrypcja odnawiana automatycznie co miesiąc; kartą zarządzasz na tej samej stronie, subskrypcję można anulować (działa do końca opłaconego okresu).
- BLIK / przelew (Przelewy24): płatność jednorazowa za wybrany okres (miesiąc lub rok), bez automatycznego odnowienia — przed końcem okresu aplikacja przypomina e-mailem.
- Przed zakupem trzeba uzupełnić dane do faktury (firma, adres, NIP). Faktura jest wystawiana w KSeF i wysyłana e-mailem po płatności. Ceny są netto, VAT doliczany na fakturze.
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
