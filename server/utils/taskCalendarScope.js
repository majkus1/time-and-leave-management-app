/**
 * Zakres kalendarza zadań (czysta logika, bez bazy):
 *  - assigned: zadania przypisane do oglądającego lub „wszyscy członkowie” (domyślnie — jak dotąd),
 *  - mine: jak wyżej + zadania, które oglądający utworzył (kierownik rozdzielający pracę),
 *  - board: wszystkie zadania dostępnych tablic — tylko Admin / HR / Przełożony; dla innych spada do „mine”.
 * Nieznany zakres = assigned, żeby stare klienty (bez parametru) zachowały dotychczasowy widok.
 */
const CALENDAR_SCOPES = ['assigned', 'mine', 'board']
const BOARD_SCOPE_ROLES = ['Admin', 'HR', 'Przełożony (Supervisor)']

function canUseBoardScope(roles) {
	return Array.isArray(roles) && roles.some(r => BOARD_SCOPE_ROLES.includes(r))
}

function resolveCalendarScope(requested, roles) {
	const scope = CALENDAR_SCOPES.includes(requested) ? requested : 'assigned'
	if (scope === 'board' && !canUseBoardScope(roles)) return 'mine'
	return scope
}

/** Fragment zapytania Mongo ograniczający zadania do osoby; null = bez ograniczenia (zakres board). */
function calendarAssigneeMatch(scope, userId) {
	if (scope === 'board') return null
	const or = [{ assignedScope: 'all-members' }, { assignedTo: userId }]
	if (scope === 'mine') or.push({ createdBy: userId })
	return { $or: or }
}

module.exports = { CALENDAR_SCOPES, BOARD_SCOPE_ROLES, canUseBoardScope, resolveCalendarScope, calendarAssigneeMatch }
