'use client'

import { useMemo, useState } from 'react'
import { swietaWRoku } from '@/lib/polishHolidays'

const LATA = [2026, 2027, 2028]

function zloteFormat(value: number) {
	return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 2 }).format(value)
}

function liczbaFormat(value: number, miejsca = 2) {
	return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: miejsca }).format(value)
}

/**
 * Współczynnik ekwiwalentu za rok: (dni w roku − niedziele − święta poza niedzielą
 * − dni wolne z tytułu przeciętnie pięciodniowego tygodnia pracy) / 12.
 *
 * Liczony, a nie zaszyty — inaczej trzeba by go podmieniać co roku i pewnego stycznia
 * ktoś by o tym zapomniał.
 */
function wspolczynnik(rok: number) {
	const swietaPozaNiedziela = swietaWRoku(rok).filter(s => s.data.getDay() !== 0).length
	let dni = 0
	let niedziele = 0
	let soboty = 0
	for (let d = new Date(rok, 0, 1); d.getFullYear() === rok; d = new Date(rok, d.getMonth(), d.getDate() + 1)) {
		dni++
		if (d.getDay() === 0) niedziele++
		if (d.getDay() === 6) soboty++
	}
	return {
		dni,
		niedziele,
		soboty,
		swietaPozaNiedziela,
		wartosc: (dni - niedziele - swietaPozaNiedziela - soboty) / 12,
	}
}

export default function LeaveEquivalentCalculator() {
	const [rok, setRok] = useState(2026)
	const [podstawa, setPodstawa] = useState('5000')
	const [dni, setDni] = useState('5')

	const wsp = useMemo(() => wspolczynnik(rok), [rok])

	const wynik = useMemo(() => {
		const kwota = Number(podstawa)
		const liczbaDni = Number(dni)

		if (!Number.isFinite(kwota) || kwota <= 0) return { error: 'Podaj podstawę większą od zera.' }
		if (!Number.isFinite(liczbaDni) || liczbaDni <= 0) return { error: 'Podaj liczbę dni większą od zera.' }

		const zaDzien = kwota / wsp.wartosc
		return {
			zaDzien,
			zaGodzine: zaDzien / 8,
			razem: zaDzien * liczbaDni,
			liczbaDni,
		}
	}, [dni, podstawa, wsp.wartosc])

	const pole = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900'

	return (
		<section
			id="kalkulator-ekwiwalentu"
			className="scroll-mt-24 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm md:p-7"
			aria-labelledby="equivalent-calculator-heading"
		>
			<div className="max-w-2xl">
				<p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Kalkulator edukacyjny</p>
				<h2 id="equivalent-calculator-heading" className="m-0 text-2xl font-semibold text-slate-900 md:text-3xl">
					Kalkulator ekwiwalentu za urlop
				</h2>
				<p className="mt-3 leading-relaxed text-slate-700">
					Ekwiwalent wypłaca się, gdy pracownik nie wykorzystał urlopu, a stosunek pracy się kończy. Podstawę
					dzieli się przez współczynnik ustalany na dany rok kalendarzowy.
				</p>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="eq-rok" className="block text-sm font-semibold text-slate-800">
						Rok
					</label>
					<select id="eq-rok" value={rok} onChange={e => setRok(Number(e.target.value))} className={pole}>
						{LATA.map(r => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="eq-podstawa" className="block text-sm font-semibold text-slate-800">
						Miesięczna podstawa brutto (zł)
					</label>
					<input
						id="eq-podstawa"
						type="number"
						min="0"
						step="100"
						inputMode="decimal"
						value={podstawa}
						onChange={e => setPodstawa(e.target.value)}
						className={pole}
					/>
				</div>
				<div>
					<label htmlFor="eq-dni" className="block text-sm font-semibold text-slate-800">
						Niewykorzystane dni urlopu
					</label>
					<input
						id="eq-dni"
						type="number"
						min="0"
						step="1"
						inputMode="decimal"
						value={dni}
						onChange={e => setDni(e.target.value)}
						className={pole}
					/>
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-emerald-300 bg-white p-5" aria-live="polite">
				{'error' in wynik ? (
					<p className="text-slate-800">{wynik.error}</p>
				) : (
					<>
						<p className="text-3xl font-bold text-emerald-800">
							{zloteFormat(wynik.razem)} <span className="text-xl font-semibold text-slate-700">brutto</span>
						</p>
						<p className="mt-2 text-slate-700">
							za {wynik.liczbaDni} {wynik.liczbaDni === 1 ? 'dzień' : 'dni'} · {zloteFormat(wynik.zaDzien)} za dzień ·{' '}
							{zloteFormat(wynik.zaGodzine)} za godzinę
						</p>
						<p className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
							Współczynnik na {rok}: ({wsp.dni} dni − {wsp.niedziele} niedziel − {wsp.swietaPozaNiedziela} świąt poza
							niedzielą − {wsp.soboty} sobót) ÷ 12 = <strong>{liczbaFormat(wsp.wartosc)}</strong>
						</p>
					</>
				)}
			</div>

			<p className="mt-4 text-sm leading-relaxed text-slate-600">
				Kalkulator dotyczy <strong>pełnego etatu</strong> i stałego miesięcznego wynagrodzenia. Przy niepełnym wymiarze
				współczynnik obniża się proporcjonalnie do etatu, a podstawą jest faktyczne wynagrodzenie pracownika. Kalkulator
				nie uwzględnia zmiennych składników, które wlicza się do podstawy w średniej z trzech lub dwunastu miesięcy.
				Wynik jest orientacyjny.
			</p>
		</section>
	)
}
