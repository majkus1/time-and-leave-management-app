// Źródło: TutorialModal (schedule), scheduleController (auto-uzupełnianie, panel AI szkicu),
// roleService.canSupervisorManageSchedule, scheduleAutoPlannerService, planCatalog.MODULE_API_PREFIXES.schedules_ai.
module.exports = {
	id: 'schedules',
	order: 4,
	title: { pl: 'Grafiki pracy', en: 'Work schedules' },
	summary: {
		pl: 'Planowanie zmian w kalendarzu miesięcznym; grafik może układać się automatycznie (auto-uzupełnianie miesiąca lub szkic AI); dyspozycyjność pracowników.',
		en: 'Shift planning in a monthly calendar; the schedule can be filled automatically (auto-fill or an AI draft); employee availability.',
	},
	keywords: {
		pl: ['grafik', 'harmonogram', 'na zmian', ' zmiany ', 'zmianow', 'zmianach', 'nocn', 'rann', 'popołudn', 'dyspozycyjn', 'automatycz', 'uzupełn', 'szkic', 'publik', 'obsad'],
		en: ['schedule', 'rota', 'roster', 'shift', 'availability', 'auto-fill', 'autofill', 'draft', 'publish', 'staffing'],
	},
	requires: { modules: ['schedules_ai'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Czy grafik może układać się automatycznie?', 'Czy pracownicy mogą zgłaszać dyspozycyjność?', 'Kto widzi grafik i kto może go edytować?', 'Czy urlopy są widoczne w grafiku?'],
		en: ['Can the schedule be filled automatically?', 'Can employees submit their availability?', 'Who can see and edit a schedule?', 'Are leaves visible in the schedule?'],
	},
	body: {
		pl: `### Jak działa
- **Tak, grafik może układać się automatycznie** — na dwa sposoby: „Auto-uzupełnianie miesiąca” (reguły: zmiany, obsada, dyspozycyjność) albo panel AI szkicu (opis słowami). Oba tworzą szkic, który planujący sprawdza i publikuje.
- Menu → „Grafik”: lista grafików. Każdy dział dostaje własny grafik automatycznie po utworzeniu działu; Administrator/HR mogą też tworzyć grafiki niestandardowe z dowolnymi osobami.
- W grafiku (kalendarz miesiąca) przypisujesz pracowników do dni i godzin (zmiany), z notatkami. Wpisy mogą być robocze (szkic) i publikowane — pracownicy widzą przypisane zmiany po publikacji, w swoim kalendarzu.
- W grafiku widać zaakceptowane urlopy, nieobecności i zgłoszenia bez akceptacji (np. L4) — nie zaplanujesz zmiany osobie na urlopie bez ostrzeżenia.
- Dyspozycyjność: pracownik może zgłosić, kiedy może pracować; planowanie może brać to pod uwagę.
- Auto-uzupełnianie miesiąca: przycisk w grafiku otwiera okno, w którym ustawiasz miesiąc, zmiany (przedziały godzin), nadpisania dni, wykluczenia, czy preferować dyspozycyjność i minimalną obsadę; system generuje wpisy z uwzględnieniem urlopów, świąt i istniejących wpisów. Wynik można opublikować albo wyczyścić i ułożyć ponownie.
- Panel AI szkicu grafiku (osobny panel na stronie grafiku): opisujesz potrzeby własnymi słowami („dwie zmiany, Kowalski tylko rano, w soboty trzy osoby”), a asystent proponuje szkic miesiąca do podglądu i zastosowania. Zużywa wiadomości AI zespołu.
- Powiadomienia: po publikacji grafiku pracownicy dostają e-mail/push.

### Kto może
Administrator i HR — wszystkie grafiki. Przełożony — grafik swojego działu lub wybranych osób, jeśli Administrator dał mu uprawnienie „zarządzanie grafikiem”. Twórca grafiku niestandardowego może go edytować. Pracownik widzi grafiki, do których jest przypisany.

### Dostępność w planach
Okres próbny: tak. Plan Core: moduł Grafiki + AI ({{price.module.schedules_ai}} zł netto/mies.). Pakiety Pro/Business: w cenie. Plan darmowy: nie.

### Czego NIE robi
- Nie pilnuje automatycznie norm Kodeksu pracy (odpoczynek dobowy 11 h, tygodniowy 35 h, doba pracownicza) — to odpowiedzialność planującego; system pokazuje kolizje z urlopami i świętami.
- Nie wymienia się zmianami między pracownikami automatycznie (brak „giełdy zmian”).
- Nie eksportuje grafiku do PDF/Excela (eksporty dotyczą ewidencji i urlopów).

### Gdzie w aplikacji / kto może
Menu → Grafik (widoczność wg przypisania). Tworzenie grafików i uprawnienia przełożonych: Administrator/HR w menu → Zarządzanie zespołem.`,
		en: null,
	},
}
