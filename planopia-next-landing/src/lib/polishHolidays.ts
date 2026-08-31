/**
 * Dni ustawowo wolne od pracy w Polsce — na potrzeby kalkulatorów na blogu.
 *
 * Landing jest osobną aplikacją i nie może importować z `server/utils`, stąd druga
 * implementacja. Jeśli zmienia się jedna, sprawdź drugą.
 */

/** Algorytm Meeusa/Butchera dla kalendarza gregoriańskiego. */
function wielkanoc(rok: number): Date {
	const a = rok % 19
	const b = Math.floor(rok / 100)
	const c = rok % 100
	const d = Math.floor(b / 4)
	const e = b % 4
	const f = Math.floor((b + 8) / 25)
	const g = Math.floor((b - f + 1) / 3)
	const h = (19 * a + b - d - g + 15) % 30
	const i = Math.floor(c / 4)
	const k = c % 4
	const l = (32 + 2 * e + 2 * i - h - k) % 7
	const m = Math.floor((a + 11 * h + 22 * l) / 451)
	const miesiac = Math.floor((h + l - 7 * m + 114) / 31)
	const dzien = ((h + l - 7 * m + 114) % 31) + 1
	return new Date(rok, miesiac - 1, dzien)
}

function plusDni(data: Date, n: number): Date {
	return new Date(data.getFullYear(), data.getMonth(), data.getDate() + n)
}

export type Swieto = { data: Date; nazwa: string }

export function swietaWRoku(rok: number): Swieto[] {
	const e = wielkanoc(rok)
	return [
		{ data: new Date(rok, 0, 1), nazwa: 'Nowy Rok' },
		{ data: new Date(rok, 0, 6), nazwa: 'Święto Trzech Króli' },
		{ data: e, nazwa: 'Wielkanoc' },
		{ data: plusDni(e, 1), nazwa: 'Poniedziałek Wielkanocny' },
		{ data: new Date(rok, 4, 1), nazwa: 'Święto Pracy' },
		{ data: new Date(rok, 4, 3), nazwa: 'Święto Konstytucji 3 Maja' },
		{ data: plusDni(e, 49), nazwa: 'Zielone Świątki' },
		{ data: plusDni(e, 60), nazwa: 'Boże Ciało' },
		{ data: new Date(rok, 7, 15), nazwa: 'Wniebowzięcie NMP' },
		{ data: new Date(rok, 10, 1), nazwa: 'Wszystkich Świętych' },
		{ data: new Date(rok, 10, 11), nazwa: 'Narodowe Święto Niepodległości' },
		// Wigilia jest dniem ustawowo wolnym od 2025 r. — od tego roku swiat jest 14, nie 13.
		{ data: new Date(rok, 11, 24), nazwa: 'Wigilia Bożego Narodzenia' },
		{ data: new Date(rok, 11, 25), nazwa: 'Boże Narodzenie' },
		{ data: new Date(rok, 11, 26), nazwa: 'Drugi dzień Bożego Narodzenia' },
	]
}

/** Klucz `RRRR-MM-DD` w czasie lokalnym — bez konwersji na UTC, która cofa datę o dzień. */
export function kluczDaty(d: Date): string {
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const dz = String(d.getDate()).padStart(2, '0')
	return `${d.getFullYear()}-${m}-${dz}`
}

export function zbiorSwiat(rok: number): Set<string> {
	return new Set(swietaWRoku(rok).map(s => kluczDaty(s.data)))
}
