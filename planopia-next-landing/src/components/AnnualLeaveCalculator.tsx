'use client'

import { useMemo, useState } from 'react'

type Tenure = 'under10' | 'atLeast10'
type FractionPreset = '1' | '0.75' | '0.5' | '0.25' | '0.125' | 'custom'

const FRACTIONS: { value: FractionPreset; label: string }[] = [
	{ value: '1', label: '1/1 - pełny etat' },
	{ value: '0.75', label: '3/4 etatu' },
	{ value: '0.5', label: '1/2 etatu' },
	{ value: '0.25', label: '1/4 etatu' },
	{ value: '0.125', label: '1/8 etatu' },
	{ value: 'custom', label: 'Własny ułamek etatu' },
]

function formatNumber(value: number) {
	return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
}

export default function AnnualLeaveCalculator() {
	const [tenure, setTenure] = useState<Tenure>('under10')
	const [fraction, setFraction] = useState<FractionPreset>('1')
	const [numerator, setNumerator] = useState('1')
	const [denominator, setDenominator] = useState('1')

	const result = useMemo(() => {
		const baseDays = tenure === 'under10' ? 20 : 26
		const parsedNumerator = Number(numerator)
		const parsedDenominator = Number(denominator)
		const fractionValue = fraction === 'custom' ? parsedNumerator / parsedDenominator : Number(fraction)

		if (fraction === 'custom') {
			if (!Number.isFinite(parsedNumerator) || parsedNumerator <= 0) {
				return { error: 'Licznik musi być większy od zera.' }
			}
			if (!Number.isFinite(parsedDenominator) || parsedDenominator <= 0) {
				return { error: 'Mianownik musi być większy od zera.' }
			}
			if (fractionValue > 1) {
				return { error: 'Wymiar etatu nie może przekraczać 1/1.' }
			}
		}

		const rawDays = baseDays * fractionValue
		const days = Math.ceil(rawDays)
		return { baseDays, fractionValue, rawDays, days, hours: days * 8 }
	}, [denominator, fraction, numerator, tenure])

	return (
		<section
			id="kalkulator-urlopu"
			className="scroll-mt-24 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm md:p-7"
			aria-labelledby="leave-calculator-heading"
		>
			<div className="max-w-2xl">
				<p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Kalkulator edukacyjny</p>
				<h2 id="leave-calculator-heading" className="m-0 text-2xl font-semibold text-slate-900 md:text-3xl">
					Kalkulator wymiaru urlopu
				</h2>
				<p className="mt-3 leading-relaxed text-slate-700">
					Wybierz ustalony staż urlopowy i wymiar etatu. Kalkulator przeliczy podstawę 20 lub 26 dni i zaokrągli niepełny dzień w górę.
				</p>
			</div>

			<div className="mt-6 grid gap-5 md:grid-cols-2">
				<fieldset>
					<legend className="mb-2 font-semibold text-slate-900">Ustalony staż urlopowy</legend>
					<div className="space-y-2">
						<label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
							<input type="radio" name="leave-tenure" checked={tenure === 'under10'} onChange={() => setTenure('under10')} />
							Poniżej 10 lat
						</label>
						<label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
							<input type="radio" name="leave-tenure" checked={tenure === 'atLeast10'} onChange={() => setTenure('atLeast10')} />
							Co najmniej 10 lat
						</label>
					</div>
				</fieldset>

				<div>
					<label htmlFor="leave-fraction" className="mb-2 block font-semibold text-slate-900">Wymiar etatu</label>
					<select
						id="leave-fraction"
						value={fraction}
						onChange={event => setFraction(event.target.value as FractionPreset)}
						className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
					>
						{FRACTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
					</select>

					{fraction === 'custom' && (
						<div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
							<label className="text-sm font-medium text-slate-700">
								Licznik
								<input type="number" min="1" step="1" value={numerator} onChange={event => setNumerator(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800" />
							</label>
							<span className="pb-3 text-slate-500" aria-hidden>/</span>
							<label className="text-sm font-medium text-slate-700">
								Mianownik
								<input type="number" min="1" step="1" value={denominator} onChange={event => setDenominator(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800" />
							</label>
						</div>
					)}
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-emerald-300 bg-white p-5" aria-live="polite">
				{'error' in result ? (
					<p className="m-0 font-medium text-red-700">{result.error}</p>
				) : (
					<>
						<p className="m-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Roczny wymiar</p>
						<div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
							<strong className="text-3xl font-semibold text-slate-900">{result.days} dni</strong>
							<span className="text-lg text-slate-700">{result.hours} godzin</span>
						</div>
						<p className="mb-0 mt-3 text-sm leading-relaxed text-slate-600">
							Działanie: {result.baseDays} × {formatNumber(result.fractionValue)} = {formatNumber(result.rawDays)}; wynik zaokrąglony w górę: {result.days} dni.
						</p>
					</>
				)}
			</div>

			<p className="mb-0 mt-4 text-sm leading-relaxed text-slate-600">
				Kalkulator nie ustala stażu na podstawie dokumentów i nie uwzględnia pierwszej pracy, zmiany etatu w trakcie roku ani szczególnych uprawnień urlopowych.
			</p>
		</section>
	)
}
