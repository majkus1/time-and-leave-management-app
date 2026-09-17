// Źródło: TutorialModal (boards), docs/AI_DATA_CONTEXT_RULES.md (słownik danych), boardController.createBoardForDepartment,
// planCatalog.MODULE_API_PREFIXES.tasks.
module.exports = {
	id: 'tasks',
	order: 5,
	title: { pl: 'Zadania — tablice Kanban', en: 'Tasks — Kanban boards' },
	summary: {
		pl: 'Tablice zadań w kolumnach, przypisania, terminy, komentarze; godziny z ewidencji można przypiąć do zadań.',
		en: 'Task boards with columns, assignments, deadlines, comments; timesheet hours can be linked to tasks.',
	},
	keywords: {
		pl: ['zadan', 'tablic', 'kanban', 'projekt', 'kolumn', 'komentarz', 'przypisz', 'przypisa'],
		en: ['task', 'board', 'kanban', 'project', 'column', 'comment', 'assign'],
	},
	requires: { modules: ['tasks'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Jak działają tablice zadań?', 'Czy mogę przypisać godziny pracy do zadania?', 'Czy każdy dział ma własną tablicę?'],
		en: ['How do task boards work?', 'Can I link work hours to a task?', 'Does each department get its own board?'],
	},
	body: {
		pl: `### Jak działa
- Menu → „Tablice”: zadania w kolumnach (do zrobienia, w trakcie, zrobione — kolumny można dostosować). Zadanie ma tytuł, opis, osoby przypisane, termin, komentarze; powiadomienia e-mail/push o przypisaniu i komentarzach.
- Każdy dział dostaje własną tablicę automatycznie; można tworzyć tablice niestandardowe. Kalendarz zadań pokazuje terminy w czasie.
- Powiązanie z ewidencją: w „Czasie pracy” pracownik może przypisać godziny dnia do zadań z tablicy; raport zadań i czynności pokazuje wtedy, ile godzin poszło na które zadanie.

### Dostępność w planach
Okres próbny: tak. Plan Core: moduł Zadania ({{price.module.tasks}} zł netto/mies.). Pakiety Pro/Business: w cenie. Plan darmowy: nie.

### Czego NIE robi
- Nie ma wykresu Gantta, zależności między zadaniami ani śledzenia budżetu projektu.
- Nie integruje się z Jirą, Trello ani innymi narzędziami.

### Gdzie w aplikacji / kto może
Menu → Tablice (każdy, w zakresie swoich tablic). Tworzenie tablic: Administrator/HR.`,
		en: null,
	},
}
