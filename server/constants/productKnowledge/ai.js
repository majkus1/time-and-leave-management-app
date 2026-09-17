// Źródło: TutorialModal (ai-assistant), aiAssistantService (DATA CONTEXT, tryby), aiHelp* (tryb pomocy),
// entitlementsService (limity AI), aiExportIntentService, legal-documents/PRIVACY.md (OpenAI).
module.exports = {
	id: 'ai',
	order: 9,
	title: { pl: 'Asystent AI', en: 'AI assistant' },
	summary: {
		pl: 'Czat z danymi zespołu (raporty, eksporty), szkice wniosków i wpisów, tryb „jak działa Planopia”, limity wiadomości.',
		en: 'Chat over team data (reports, exports), leave and timesheet drafts, a “how Planopia works” mode, message limits.',
	},
	keywords: {
		pl: ['asystent', ' ai ', 'sztuczn', 'chatgpt', 'openai', ' gpt', 'wiadomości ai', 'limit ai', 'podsumow', 'szkic', 'prywatn'],
		en: ['assistant', ' ai ', 'artificial', 'chatgpt', 'openai', ' gpt', 'ai messages', 'ai limit', 'summary', 'draft', 'privacy'],
	},
	requires: { modules: ['ai_assistant'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Co potrafi asystent AI w Planopii?', 'Ile wiadomości AI mam w pakiecie?', 'Czy moje dane trafiają do AI?'],
		en: ['What can the AI assistant do in Planopia?', 'How many AI messages are included?', 'Does my data go to the AI?'],
	},
	body: {
		pl: `### Dwa tryby
- **Czat z danymi zespołu** (menu → Asystent AI): odpowiada na pytania o czas pracy, urlopy, zadania, grafiki i zespół za wybrany okres — w granicach uprawnień pytającego (Administrator/HR: cały zespół; przełożony: swój zakres; pracownik: własne dane, urlopy zespołu). Potrafi przygotować podsumowanie miesiąca po roli, a gdy poprosisz o raport lub eksport, pod odpowiedzią pojawiają się przyciski Excel/PDF generowane z bazy (nie z tekstu). Rozmowę można wyeksportować do TXT. Historia rozmów jest tylko w tej przeglądarce.
- **Jak działa Planopia** (przycisk w asystencie): tłumaczy działanie funkcji, z wyborem modułu (czas pracy, QR, urlopy, grafiki, zadania, czat, ustawienia i role, pakiety). Nie widzi danych zespołu i **nie zużywa limitu wiadomości** — dostępny także po okresie próbnym.
- Szkice: w asystencie tryb „Wniosek urlopowy (AI)” i „Wpis ewidencji (AI)” — opisujesz słowami, asystent przygotowuje szkic do potwierdzenia; nic nie wysyła bez Twojej zgody. W grafiku osobny panel AI szkicu miesiąca.

### Limity wiadomości (czat z danymi, szkice, AI grafiku)
Okres próbny: {{trial.aiMessages}} wiadomości łącznie. Core z modułem Asystent AI lub Grafiki + AI: {{ai.coreModulePool}} miesięcznie (wspólna pula). Pro: {{ai.plan.pro}}/mies. Business: {{ai.plan.business}}/mies. Dokupy: {{addon.ai50.messages}}/{{addon.ai200.messages}}/{{addon.ai500.messages}} wiadomości. Wykorzystanie widać w Pakietach i rozliczeniach. Tryb „jak działa” nie liczy się do limitu.

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
