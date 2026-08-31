'use client'

import { useMemo, useState } from 'react'
import { kluczDaty, swietaWRoku } from '@/lib/polishHolidays'

const MIESIACE = [
	'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
	'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
]

const LATA = [2026, 2027, 2028]

const ETATY = [
	{ value: '1', label: '1/1 — pełny etat' },
	{ value: '0.75', label: '3/4 etatu' },
	{ value: '0.5', label: '1/2 etatu' },
	{ value: '0.25', label: '1/4 etatu' },
]

function liczbaFormat(value: number) {
	return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
}

/**
 * Wymiar czasu pracy wg art. 130 § 1–2 Kodeksu pracy:
 * 40 h × pełne tygodnie + 8 h × dni od pon do pt pozostałe poza pełnymi tygodniami,
 * minus 8 h za każde święto przypadające w innym dniu niż niedziela.
 */
function policzWymiar(rok: number, miesiac: number, etat: number) {
	const swieta = new Set(
		swietaWRoku(rok)
			.filter(s => s.data.getDay() !== 0)
			.map(s => kluczDaty(s.data))
	)

	const pierwszy = new Date(rok, miesiac, 1)
	const dniWMiesiacu = new Date(rok, miesiac + 1, 0).getDate()

	let dniRobocze = 0
	let swietaWMiesiacu = 0
	for (let i = 0; i < dniWMiesiacu; i++) {
		const d = new Date(rok, miesiac, 1 + i)
		const dzienTygodnia = d.getDay()
		if (dzienTygodnia >= 1 && dzienTygodnia <= 5) dniRobocze++
		if (swieta.has(kluczDaty(d))) swietaWMiesiacu++
	}

	const peleTygodnie = Math.floor(dniWMiesiacu / 7)
	const dniPozaTygodniami = dniWMiesiacu - peleTygodnie * 7
	let dniPonPt = 0
	for (let i = 0; i < dniPozaTygodniami; i++) {
		const d = new Date(rok, miesiac, dniWMiesiacu - dniPozaTygodniami + 1 + i)
		const dzienTygodnia = d.getDay()
		if (dzienTygodnia >= 1 && dzienTygodnia <= 5) dniPonPt++
	}

	const godzinyPelnyEtat = 40 * peleTygodnie + 8 * dniPonPt - 8 * swietaWMiesiacu
	return {
		dniWMiesiacu,
		peleTygodnie,
		dniPonPt,
		swietaWMiesiacu,
		dniRobocze: dniRobocze - swietaWMiesiacu,
		pierwszyDzien: pierwszy,
		godzinyPelnyEtat,
		godziny: godzinyPelnyEtat * etat,
	}
}

export default function WorkingTimeNormCalculator() {
	const teraz = { rok: 2026, miesiac: 8 }
	const [rok, setRok] = useState(teraz.rok)
	const [miesiac, setMiesiac] = useState(teraz.miesiac)
	const [etat, setEtat] = useState('1')

	const wynik = useMemo(() => policzWymiar(rok, miesiac, Number(etat)), [rok, miesiac, etat])

	return (
		<section
			id="kalkulator-wymiaru"
			className="scroll-mt-24 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm md:p-7"
			aria-labelledby="norm-calculator-heading"
		>
			<div className="max-w-2xl">
				<p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Kalkulator edukacyjny</p>
				<h2 id="norm-calculator-heading" className="m-0 text-2xl font-semibold text-slate-900 md:text-3xl">
					Kalkulator wymiaru czasu pracy
				</h2>
				<p className="mt-3 leading-relaxed text-slate-700">
					Ile godzin można zaplanować w grafiku w danym miesiącu. Liczone według art. 130 Kodeksu pracy, z
					uwzględnieniem świąt obniżających wymiar.
				</p>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-3">
				<div>
					<label htmlFor="norm-rok" className="block text-sm font-semibold text-slate-800">
						Rok
					</label>
					<select
						id="norm-rok"
						value={rok}
						onChange={e => setRok(Number(e.target.value))}
						className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
					>
						{LATA.map(r => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="norm-miesiac" className="block text-sm font-semibold text-slate-800">
						Miesiąc
					</label>
					<select
						id="norm-miesiac"
						value={miesiac}
						onChange={e => setMiesiac(Number(e.target.value))}
						className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
					>
						{MIESIACE.map((m, i) => (
							<option key={m} value={i}>
								{m}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="norm-etat" className="block text-sm font-semibold text-slate-800">
						Wymiar etatu
					</label>
					<select
						id="norm-etat"
						value={etat}
						onChange={e => setEtat(e.target.value)}
						className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
					>
						{ETATY.map(e => (
							<option key={e.value} value={e.value}>
								{e.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-emerald-300 bg-white p-5" aria-live="polite">
				<p className="text-3xl font-bold text-emerald-800">
					{liczbaFormat(wynik.godziny)} <span className="text-xl font-semibold text-slate-700">godzin</span>
				</p>
				<p className="mt-2 text-slate-700">
					{MIESIACE[miesiac]} {rok} · {wynik.dniRobocze} dni roboczych
					{wynik.swietaWMiesiacu > 0
						? ` · ${wynik.swietaWMiesiacu} ${wynik.swietaWMiesiacu === 1 ? 'święto obniża' : 'święta obniżają'} wymiar o ${wynik.swietaWMiesiacu * 8} h`
						: ' · brak świąt obniżających wymiar'}
				</p>
				<p className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
					Działanie: 40 × {wynik.peleTygodnie} pełnych tygodni + 8 × {wynik.dniPonPt} dni od poniedziałku do piątku
					− 8 × {wynik.swietaWMiesiacu} święto/święta = {liczbaFormat(wynik.godzinyPelnyEtat)} h dla pełnego etatu
					{etat !== '1' ? `, po przeliczeniu na ${etat === '0.75' ? '3/4' : etat === '0.5' ? '1/2' : '1/4'} etatu: ${liczbaFormat(wynik.godziny)} h` : ''}
					.
				</p>
			</div>

			<p className="mt-4 text-sm leading-relaxed text-slate-600">
				Kalkulator obejmuje podstawowy system czasu pracy i miesięczny okres rozliczeniowy. Nie uwzględnia
				równoważnego systemu czasu pracy, okresów dłuższych niż miesiąc ani obniżenia wymiaru z tytułu nieobecności.
			</p>
		</section>
	)
}
