// Źródło: TutorialModal (ai-assistant), aiAssistantService (DATA CONTEXT, tryby), aiHelp* (tryb pomocy),
// entitlementsService (AI bez limitu, ukryty bezpiecznik AI_FAIR_USE), billingPurchaseIntentValidator (pakiety wycofane), aiExportIntentService, legal-documents/PRIVACY.md (OpenAI).
module.exports = {
	id: 'ai',
	order: 9,
	title: { pl: 'Asystent AI', en: 'AI assistant' },
	summary: {
		pl: 'Czat z danymi zespołu (raporty, eksporty), szkice wniosków i wpisów, tryb „jak działa Planopia”, bez limitu wiadomości.',
		en: 'Chat over team data (reports, exports), leave and timesheet drafts, a “how Planopia works” mode, no message limit.',
	},
	keywords: {
		pl: ['asystent', ' ai ', 'sztuczn', 'chatgpt', 'openai', ' gpt', 'wiadomości ai', 'limit ai', 'podsumow', 'szkic', 'prywatn'],
		en: ['assistant', ' ai ', 'artificial', 'chatgpt', 'openai', ' gpt', 'ai messages', 'ai limit', 'summary', 'draft', 'privacy'],
	},
	requires: { modules: ['ai_assistant'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Co potrafi asystent AI w Planopii?', 'Czy asystent AI ma limit wiadomości?', 'Czy moje dane trafiają do AI?'],
		en: ['What can the AI assistant do in Planopia?', 'Is there a limit on AI messages?', 'Does my data go to the AI?'],
	},
	body: {
		pl: `### Dwa tryby
- **Czat z danymi zespołu** (menu → Asystent AI): odpowiada na pytania o czas pracy, urlopy, zadania, grafiki i zespół za wybrany okres — w granicach uprawnień pytającego (Administrator/HR: cały zespół; przełożony: swój zakres; pracownik: własne dane, urlopy zespołu). Potrafi przygotować podsumowanie miesiąca po roli, a gdy poprosisz o raport lub eksport, pod odpowiedzią pojawiają się przyciski Excel/PDF generowane z bazy (nie z tekstu). Rozmowę można wyeksportować do TXT. Historia rozmów jest tylko w tej przeglądarce.
- **Jak działa Planopia** (przycisk w asystencie): tłumaczy działanie funkcji, z wyborem modułu (czas pracy, QR, urlopy, grafiki, zadania, czat, ustawienia i role, pakiety). Nie widzi danych zespołu i działa w każdym planie — także w darmowym i po okresie próbnym.
- Szkice: w asystencie tryb „Wniosek urlopowy (AI)” i „Wpis ewidencji (AI)” — opisujesz słowami, asystent przygotowuje szkic do potwierdzenia; nic nie wysyła bez Twojej zgody. W grafiku osobny panel AI szkicu miesiąca.

### Bez limitu wiadomości (czat z danymi, szkice, AI grafiku)
Kto ma AI w planie, korzysta bez limitu wiadomości i bez liczników: okres próbny, pakiety Pro i Business oraz Core z modułem Asystent AI lub Grafiki + AI. Obowiązuje tylko rozsądne użycie — ukryty miesięczny bezpiecznik chroni przed nadużyciem (np. automatycznym skryptem), nie przed normalną pracą; gdyby zespół go osiągnął, asystent wraca pierwszego dnia miesiąca, a przy większych potrzebach wystarczy napisać przez Centrum pomocy. Pakietów wiadomości AI nie trzeba już dokupować — nie są w sprzedaży. Core bez modułu AI i plan darmowy nie mają czatu z danymi zespołu (tryb „jak działa Planopia” działa zawsze).

### Prywatność
Do modelu (OpenAI, USA) trafia treść pytania i wyłącznie te dane zespołu, do których pytający ma dostęp w aplikacji, tylko na potrzeby odpowiedzi; nie są używane do trenowania modelu. Szczegóły w Polityce prywatności.

### Czego NIE robi
- Nie podejmuje decyzji (nie zatwierdza urlopów, nie zmienia danych) — może przygotować szkic, który Ty zatwierdzasz.
- Nie udziela porad prawnych.
- Nie ma dostępu do internetu ani do danych innych zespołów.

### Gdzie w aplikacji / kto może
Menu → Asystent AI (każdy w zakresie roli; czat z danymi wymaga modułu AI albo pakietu; „jak działa Planopia” — każdy, także w planie darmowym). AI grafiku: strona grafiku (kto może edytować grafik).`,
		en: null,
	},
}
