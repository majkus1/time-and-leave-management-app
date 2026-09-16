/**
 * Wykrywanie zmian w ustawieniach zespołu (ekran /settings).
 *
 * Strona działa w modelu SZKICU: użytkownik zmienia dowolnie wiele opcji, a zapis
 * następuje jednym przyciskiem. Do serwera trafiają WYŁĄCZNIE pola, które faktycznie
 * się zmieniły — każde pole w PUT /api/settings jest strzeżone przez `!== undefined`,
 * więc pominięte zachowują wartość z bazy. Dzięki temu zapis jednej opcji nie może
 * nadpisać ustawień zmienionych w międzyczasie przez innego administratora.
 *
 * Logika siedzi w osobnym module, bo jest czysta i testowalna — inaczej niż wtedy,
 * gdy była wpleciona w komponent.
 */

/**
 * Sprowadza ustawienia do postaci porównywalnej.
 *
 * Listy normalizujemy do samych pól znaczących: bez tego porównanie łapałoby techniczne
 * pola z bazy (np. `_id` poddokumentów, które Mongoose nadaje przy każdym zapisie)
 * i strona zostawałaby „brudna" zaraz po udanym zapisie.
 *
 * Zależności między przełącznikami rozstrzygamy tutaj, żeby stan zapisany i bieżący
 * były porównywane w tej samej, efektywnej postaci.
 */
export function buildTeamSettingsShape(source = {}, { freemiumTier = false } = {}) {
	const allowManaged = source.allowManagedNoAccessUsers === true
	return {
		workOnWeekends: source.workOnWeekends,
		includePolishHolidays: source.includePolishHolidays,
		includeCustomHolidays: source.includeCustomHolidays,
		customHolidays: (source.customHolidays || []).map(holiday => ({
			date: holiday.date,
			name: holiday.name,
		})),
		workHours: (source.workHours || []).map(entry => ({
			timeFrom: entry.timeFrom,
			timeTo: entry.timeTo,
			hours: entry.hours ?? null,
		})),
		leaveCalculationMode: source.leaveCalculationMode,
		leaveHoursPerDay: source.leaveHoursPerDay,
		timerEnabled: source.timerEnabled,
		dashboardEnabled: source.dashboardEnabled,
		allowManagedNoAccessUsers: allowManaged,
		allowManagedWorkdayEntries: allowManaged && source.allowManagedWorkdayEntries === true,
		allowManagedLeaveRequests:
			!freemiumTier && allowManaged && source.allowManagedLeaveRequests === true,
		workdayEntriesOnlyToday: source.workdayEntriesOnlyToday,
		autoDeductLeaveLimits: source.autoDeductLeaveLimits === true,
		leaveRequestTypes: (source.leaveRequestTypes || []).map(type => ({
			id: type.id,
			name: type.name,
			nameEn: type.nameEn || null,
			isSystem: type.isSystem === true,
			isEnabled: type.isEnabled !== false,
			requireApproval: type.requireApproval !== false,
			allowDaysLimit: type.allowDaysLimit === true,
			minDaysBefore: type.minDaysBefore ?? null,
			settlementUnit: type.settlementUnit || 'inherit',
		})),
	}
}

/**
 * Nazwy pól różniących się między stanem bieżącym a zapisanym.
 *
 * @param {Object|null} currentShape
 * @param {Object|null} savedShape
 * @param {Boolean} ready - czy formularz zdążył wczytać dane z serwera. Dopóki nie,
 *   zwracamy pustą listę: stan początkowy komponentu to wartości domyślne, a nie dane
 *   zespołu, więc porównywanie ich dałoby fałszywe „niezapisane zmiany" — i, co gorsza,
 *   zablokowałoby wczytanie danych, gdyby wczytywanie było uzależnione od tej flagi.
 */
export function diffTeamSettings(currentShape, savedShape, ready = true) {
	if (!ready || !currentShape || !savedShape) return []
	return Object.keys(currentShape).filter(
		key => JSON.stringify(currentShape[key]) !== JSON.stringify(savedShape[key])
	)
}

/**
 * Ładunek do PUT /api/settings zbudowany z samych zmienionych pól.
 *
 * @param {Array<String>} allowedKeys - pola, które dany użytkownik mógł w ogóle zmienić
 *   (np. freemium nie widzi większości sekcji, więc ich nie wysyłamy).
 */
export function buildTeamSettingsPayload(currentShape, changedKeys, allowedKeys) {
	const payload = {}
	for (const key of changedKeys) {
		if (!allowedKeys.includes(key)) continue
		if (key === 'workHours') {
			// Pusta lista znaczy „brak konfiguracji" i serwer oczekuje tu null.
			payload.workHours = currentShape.workHours.length > 0 ? currentShape.workHours : null
			continue
		}
		payload[key] = currentShape[key]
	}

	// Wyłączenie kont bez dostępu kasuje na serwerze oba zależne przełączniki —
	// wysyłamy je razem, żeby stan po zapisie był jednoznaczny.
	if (payload.allowManagedNoAccessUsers === false) {
		payload.allowManagedWorkdayEntries = false
		payload.allowManagedLeaveRequests = false
	}

	return payload
}
