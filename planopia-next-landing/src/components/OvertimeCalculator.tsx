'use client'

import { useMemo, useState } from 'react'

function zloteFormat(value: number) {
	return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 2 }).format(value)
}

/**
 * Dodatki za pracę w godzinach nadliczbowych wg art. 151¹ § 1 Kodeksu pracy:
 * 100% za nadgodziny w nocy, w niedziele i święta niebędące dniami pracy pracownika
 * oraz w dniu wolnym udzielonym w zamian; 50% za nadgodziny w każdym innym dniu.
 *
 * Za każdą nadgodzinę przysługuje też normalne wynagrodzenie — dodatek jest ponad nie.
 */
export default function OvertimeCalculator() {
	const [wynagrodzenie, setWynagrodzenie] = useState('5000')
	const [wymiarGodzin, setWymiarGodzin] = useState('168')
	const [godziny50, setGodziny50] = useState('8')
	const [godziny100, setGodziny100] = useState('0')

	const wynik = useMemo(() => {
		const pensja = Number(wynagrodzenie)
		const norma = Number(wymiarGodzin)
		const h50 = Number(godziny50)
		const h100 = Number(godziny100)

		if (!Number.isFinite(pensja) || pensja <= 0) return { error: 'Podaj wynagrodzenie większe od zera.' }
		if (!Number.isFinite(norma) || norma <= 0) return { error: 'Podaj wymiar czasu pracy większy od zera.' }
		if (!Number.isFinite(h50) || h50 < 0 || !Number.isFinite(h100) || h100 < 0) {
			return { error: 'Liczba nadgodzin nie może być ujemna.' }
		}

		const stawka = pensja / norma
		const normalne = (h50 + h100) * stawka
		const dodatek50 = h50 * stawka * 0.5
		const dodatek100 = h100 * stawka * 1
		return {
			stawka,
			normalne,
			dodatek50,
			dodatek100,
			razem: normalne + dodatek50 + dodatek100,
			godzinyRazem: h50 + h100,
		}
	}, [godziny100, godziny50, wymiarGodzin, wynagrodzenie])

	const pole = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900'

	return (
		<section
			id="kalkulator-nadgodzin"
			className="scroll-mt-24 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm md:p-7"
			aria-labelledby="overtime-calculator-heading"
		>
			<div className="max-w-2xl">
				<p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Kalkulator edukacyjny</p>
				<h2 id="overtime-calculator-heading" className="m-0 text-2xl font-semibold text-slate-900 md:text-3xl">
					Kalkulator dodatku za nadgodziny
				</h2>
				<p className="mt-3 leading-relaxed text-slate-700">
					Za każdą nadgodzinę przysługuje normalne wynagrodzenie <strong>oraz</strong> dodatek — 50% albo 100%
					stawki, zależnie od tego, kiedy praca wystąpiła.
				</p>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="ot-pensja" className="block text-sm font-semibold text-slate-800">
						Wynagrodzenie miesięczne brutto (zł)
					</label>
					<input
						id="ot-pensja"
						type="number"
						min="0"
						step="100"
						inputMode="decimal"
						value={wynagrodzenie}
						onChange={e => setWynagrodzenie(e.target.value)}
						className={pole}
					/>
				</div>
				<div>
					<label htmlFor="ot-norma" className="block text-sm font-semibold text-slate-800">
						Wymiar czasu pracy w miesiącu (godz.)
					</label>
					<input
						id="ot-norma"
						type="number"
						min="0"
						step="1"
						inputMode="decimal"
						value={wymiarGodzin}
						onChange={e => setWymiarGodzin(e.target.value)}
						className={pole}
					/>
				</div>
				<div>
					<label htmlFor="ot-h50" className="block text-sm font-semibold text-slate-800">
						Nadgodziny z dodatkiem 50%
					</label>
					<input
						id="ot-h50"
						type="number"
						min="0"
						step="0.5"
						inputMode="decimal"
						value={godziny50}
						onChange={e => setGodziny50(e.target.value)}
						className={pole}
					/>
					<p className="mt-1 text-xs text-slate-600">Praca ponad normę w zwykłym dniu roboczym.</p>
				</div>
				<div>
					<label htmlFor="ot-h100" className="block text-sm font-semibold text-slate-800">
						Nadgodziny z dodatkiem 100%
					</label>
					<input
						id="ot-h100"
						type="number"
						min="0"
						step="0.5"
						inputMode="decimal"
						value={godziny100}
						onChange={e => setGodziny100(e.target.value)}
						className={pole}
					/>
					<p className="mt-1 text-xs text-slate-600">Noc, niedziela lub święto niebędące dniem pracy, dzień wolny w zamian.</p>
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
							za {new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 }).format(wynik.godzinyRazem)} nadgodzin
							{' '}· stawka godzinowa {zloteFormat(wynik.stawka)}
						</p>
						<dl className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-700 sm:grid-cols-3">
							<div>
								<dt className="font-semibold text-slate-800">Normalne wynagrodzenie</dt>
								<dd>{zloteFormat(wynik.normalne)}</dd>
							</div>
							<div>
								<dt className="font-semibold text-slate-800">Dodatek 50%</dt>
								<dd>{zloteFormat(wynik.dodatek50)}</dd>
							</div>
							<div>
								<dt className="font-semibold text-slate-800">Dodatek 100%</dt>
								<dd>{zloteFormat(wynik.dodatek100)}</dd>
							</div>
						</dl>
					</>
				)}
			</div>

			<p className="mt-4 text-sm leading-relaxed text-slate-600">
				Kwoty brutto, dla stałego wynagrodzenia miesięcznego. Kalkulator nie uwzględnia zmiennych składników
				wynagrodzenia, dodatku za pracę w porze nocnej ani rekompensaty czasem wolnym zamiast dodatku. Nie
				rozstrzyga też, czy dane godziny w ogóle są nadgodzinami — to zależy od systemu czasu pracy i rozkładu.
			</p>
		</section>
	)
}
