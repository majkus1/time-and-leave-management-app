/**
 * Funkcje pomocnicze do obsługi dni świątecznych po stronie frontendu
 */

// Funkcja pomocnicza do formatowania daty jako YYYY-MM-DD w lokalnej strefie czasowej
function formatDateLocal(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// Funkcja do obliczania Wielkanocy (algorytm Meeusa/Jonesa/Butchera)
function calculateEaster(year) {
	const a = year % 19
	const b = Math.floor(year / 100)
	const c = year % 100
	const d = Math.floor(b / 4)
	const e = b % 4
	const f = Math.floor((b + 8) / 25)
	const g = Math.floor((b - f + 1) / 3)
	const h = (19 * a + b - d - g + 15) % 30
	const i = Math.floor(c / 4)
	const k = c % 4
	const l = (32 + 2 * e + 2 * i - h - k) % 7
	const m = Math.floor((a + 11 * h + 22 * l) / 451)
	const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
	const day = ((h + l - 7 * m + 114) % 31) + 1
	return new Date(year, month, day)
}

// Funkcja do obliczania Bożego Ciała (60 dni po Wielkanocy)
function calculateCorpusChristi(year) {
	const easter = calculateEaster(year)
	const corpusChristi = new Date(easter)
	corpusChristi.setDate(easter.getDate() + 60)
	return corpusChristi
}

// Funkcja do obliczania Zesłania Ducha Świętego (49 dni po Wielkanocy)
function calculatePentecost(year) {
	const easter = calculateEaster(year)
	const pentecost = new Date(easter)
	pentecost.setDate(easter.getDate() + 49)
	return pentecost
}

/**
 * Pobiera wszystkie święta polskie dla danego roku
 * @param {number} year - Rok
 * @returns {Array} Tablica obiektów {date: string (YYYY-MM-DD), name: string}
 */
export function getPolishHolidaysForYear(year) {
	const holidays = []
	
	// Święta stałe
	const fixedHolidays = [
		{ month: 0, day: 1, name: 'Nowy Rok, Świętej Bożej Rodzicielki Maryi' },
		{ month: 0, day: 6, name: 'Trzech Króli (Objawienie Pańskie)' },
		{ month: 4, day: 1, name: 'Święto Pracy' },
		{ month: 4, day: 3, name: 'Święto Konstytucji 3 Maja' },
		{ month: 7, day: 15, name: 'Święto Wojska Polskiego, Wniebowzięcie Najświętszej Maryi Panny' },
		{ month: 10, day: 1, name: 'Wszystkich Świętych' },
		{ month: 10, day: 11, name: 'Święto Niepodległości' },
		{ month: 11, day: 24, name: 'Wigilia Bożego Narodzenia' },
		{ month: 11, day: 25, name: 'Boże Narodzenie (pierwszy dzień)' },
		{ month: 11, day: 26, name: 'Boże Narodzenie (drugi dzień)' },
	]
	
	fixedHolidays.forEach(holiday => {
		const date = new Date(year, holiday.month, holiday.day)
		holidays.push({
			date: formatDateLocal(date),
			name: holiday.name
		})
	})
	
	// Święta ruchome
	const easter = calculateEaster(year)
	const easterMonday = new Date(easter)
	easterMonday.setDate(easter.getDate() + 1)
	const pentecost = calculatePentecost(year)
	const corpusChristi = calculateCorpusChristi(year)
	
	holidays.push({
		date: formatDateLocal(easter),
		name: 'Wielkanoc'
	})
	holidays.push({
		date: formatDateLocal(easterMonday),
		name: 'Poniedziałek Wielkanocny'
	})
	holidays.push({
		date: formatDateLocal(pentecost),
		name: 'Zesłanie Ducha Świętego (Zielone Świątki)'
	})
	holidays.push({
		date: formatDateLocal(corpusChristi),
		name: 'Boże Ciało'
	})
	
	// Sortuj po dacie
	holidays.sort((a, b) => a.date.localeCompare(b.date))
	
	return holidays
}

/**
 * Sprawdza czy dana data jest świętem
 * @param {Date|string} date - Data do sprawdzenia
 * @param {Object} settings - Obiekt ustawień z includePolishHolidays, includeCustomHolidays i customHolidays
 * @returns {Object|null} Obiekt {date: string, name: string} jeśli to święto, null w przeciwnym razie
 */
export function isHolidayDate(date, settings) {
	if (!settings) {
		return null
	}
	
	const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
	const year = new Date(dateStr).getFullYear()
	
	// Sprawdź niestandardowe święta (tylko gdy includeCustomHolidays jest włączone)
	if (settings.includeCustomHolidays && settings.customHolidays && Array.isArray(settings.customHolidays)) {
		const customHoliday = settings.customHolidays.find(h => h.date === dateStr)
		if (customHoliday) {
			return customHoliday
		}
	}
	
	// Sprawdź święta polskie (tylko gdy includePolishHolidays jest włączone)
	if (settings.includePolishHolidays) {
		const polishHolidays = getPolishHolidaysForYear(year)
		const polishHoliday = polishHolidays.find(h => h.date === dateStr)
		if (polishHoliday) {
			return polishHoliday
		}
	}
	
	return null
}

/**
 * Pobiera wszystkie święta dla danego zakresu dat
 * @param {string} startDate - Data początkowa (YYYY-MM-DD)
 * @param {string} endDate - Data końcowa (YYYY-MM-DD)
 * @param {Object} settings - Obiekt ustawień
 * @returns {Array} Tablica obiektów {date: string, name: string}
 */
export function getHolidaysInRange(startDate, endDate, settings) {
	if (!settings) {
		return []
	}
	
	const holidays = []
	const start = new Date(startDate)
	const end = new Date(endDate)
	
	// Zbierz wszystkie lata w zakresie
	const years = new Set()
	const current = new Date(start)
	while (current <= end) {
		years.add(current.getFullYear())
		current.setDate(current.getDate() + 1)
	}
	
	// Zbierz wszystkie święta polskie dla wszystkich lat w zakresie (tylko gdy includePolishHolidays jest włączone)
	const allPolishHolidays = []
	if (settings.includePolishHolidays) {
		years.forEach(year => {
			allPolishHolidays.push(...getPolishHolidaysForYear(year))
		})
	}
	
	// Połącz z niestandardowymi świętami (tylko gdy includeCustomHolidays jest włączone)
	const allHolidays = [...allPolishHolidays]
	
	// Debug: sprawdź czy includeCustomHolidays jest włączone i czy customHolidays istnieją
	if (settings.includeCustomHolidays) {
		if (settings.customHolidays && Array.isArray(settings.customHolidays)) {
			// Dodaj niestandardowe święta - upewnij się, że mają właściwy format
			const validCustomHolidays = settings.customHolidays
				.filter(h => h && h.date && h.name) // Filtruj tylko poprawne święta
				.map(h => ({
					date: h.date, // Format YYYY-MM-DD
					name: h.name
				}))
			allHolidays.push(...validCustomHolidays)
		}
	}
	
	// Filtruj tylko te w zakresie i usuń duplikaty (na wypadek gdyby to samo święto było w polskich i niestandardowych)
	const startStr = startDate
	const endStr = endDate
	const filtered = allHolidays.filter(h => h && h.date && h.date >= startStr && h.date <= endStr)
	
	// Usuń duplikaty na podstawie daty (zachowaj pierwsze wystąpienie)
	const uniqueHolidays = []
	const seenDates = new Set()
	for (const holiday of filtered) {
		if (!seenDates.has(holiday.date)) {
			seenDates.add(holiday.date)
			uniqueHolidays.push(holiday)
		}
	}
	
	return uniqueHolidays
}

