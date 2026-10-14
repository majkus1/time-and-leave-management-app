'use client'

import { useId, useState } from 'react'
import {
	CALCULATOR,
	CALCULATOR_DEFAULT_COMPANIES,
	CALCULATOR_DEFAULT_PLAN,
	CALCULATOR_PLANS,
	PARTNER_TERMS,
	TERMS_LABEL,
} from '@/data/partnerProgramCopy'
import { firmsLabel, formatPln, formatPlnSmart, partnerEarnings } from '@/lib/partnerEarnings'

const MIN = 1
const MAX = 50
const TICKS = [1, 10, 25, 50]
// Najwyższy słupek wykresu lat (px) — reszta toru to etykieta kwoty nad słupkiem
const BAR_MAX = 112

export default function PartnerEarningsCalculator() {
	const [companies, setCompanies] = useState(CALCULATOR_DEFAULT_COMPANIES)
	const [planId, setPlanId] = useState(CALCULATOR_DEFAULT_PLAN)
	const rangeId = useId()
	const plan = CALCULATOR_PLANS.find(p => p.id === planId) ?? CALCULATOR_PLANS[0]

	const result = partnerEarnings({
		companies,
		monthlyNetPln: plan.monthlyNetPln,
		initialRate: PARTNER_TERMS.initialRate,
		initialMonths: PARTNER_TERMS.initialMonths,
		laterRate: PARTNER_TERMS.laterRate,
	})
	const peak = Math.max(...result.years, 1)
	const fill = ((companies - MIN) / (MAX - MIN)) * 100

	return (
		<div className="plp-calc">
			<div className="plp-calc__controls">
				<div className="plp-calc__row">
					<div className="plp-calc__label-row">
						<label className="plp-calc__label" htmlFor={rangeId}>
							{CALCULATOR.companiesLabel}
						</label>
						<span className="plp-calc__count" aria-hidden="true">
							{companies}
							<small>{firmsLabel(companies)}</small>
						</span>
					</div>
					<input
						id={rangeId}
						className="plp-range"
						type="range"
						min={MIN}
						max={MAX}
						step={1}
						value={companies}
						aria-valuetext={`${companies} ${firmsLabel(companies)}`}
						onChange={e => setCompanies(Number(e.target.value))}
						style={{ '--fill': `${fill}%` } as React.CSSProperties}
					/>
					<div className="plp-ticks" aria-hidden="true">
						{TICKS.map(t => (
							<span key={t} style={{ '--at': (t - MIN) / (MAX - MIN) } as React.CSSProperties}>
								{t}
							</span>
						))}
					</div>
				</div>

				<fieldset className="plp-calc__row plp-field">
					<legend className="plp-calc__label">{CALCULATOR.planLabel}</legend>
					<div className="plp-plans">
						{CALCULATOR_PLANS.map(p => (
							<label key={p.id} className="plp-plan">
								<input
									type="radio"
									name="plp-plan"
									value={p.id}
									checked={p.id === planId}
									onChange={() => setPlanId(p.id)}
								/>
								<span className="plp-plan__box">
									<span className="plp-plan__name">{p.label}</span>
									<span className="plp-plan__price">
										<b>{formatPln(p.monthlyNetPln)}</b> {CALCULATOR.perMonthNet}
									</span>
								</span>
							</label>
						))}
					</div>
				</fieldset>

				<div className="plp-calc__per">
					<span className="plp-calc__per-label">{CALCULATOR.perFirm}</span>
					<span className="plp-calc__per-row">
						<b>{formatPlnSmart(plan.monthlyNetPln * PARTNER_TERMS.initialRate)}</b> {CALCULATOR.perFirmFirst}
					</span>
					<span className="plp-calc__per-row">
						<b>{formatPlnSmart(plan.monthlyNetPln * PARTNER_TERMS.laterRate)}</b> {CALCULATOR.perFirmLater}
					</span>
				</div>
			</div>

			<div className="plp-calc__result" aria-live="polite">
				<p className="plp-calc__kicker">{CALCULATOR.firstYear}</p>
				<span className="plp-calc__big">{formatPln(result.years[0])}</span>
				<p className="plp-calc__monthly">
					<b>{formatPlnSmart(result.monthlyInitial)}</b> {CALCULATOR.monthly}
				</p>

				<div className="plp-calc__stats">
					<div>
						<span className="plp-calc__stat-label">
							{CALCULATOR.nextYears} ({TERMS_LABEL.later})
						</span>
						<span className="plp-calc__stat-value">{formatPln(result.years[1])}</span>
					</div>
					<div>
						<span className="plp-calc__stat-label">{CALCULATOR.threeYears}</span>
						<span className="plp-calc__stat-value">{formatPln(result.total)}</span>
					</div>
				</div>

				<div className="plp-years" aria-hidden="true">
					{result.years.map((value, i) => (
						<div key={i} className="plp-year">
							<div className="plp-year__track">
								<span className="plp-year__value">{formatPln(value)}</span>
								<div className="plp-year__bar" style={{ height: `${Math.round(Math.max(30, (value / peak) * BAR_MAX))}px` }}>
									<span className="plp-year__rate">{i === 0 ? TERMS_LABEL.initial : TERMS_LABEL.later}</span>
								</div>
							</div>
							<span className="plp-year__label">
								{CALCULATOR.chartYear} {i + 1}
							</span>
						</div>
					))}
				</div>

				<p className="plp-calc__note">{CALCULATOR.note}</p>
			</div>
		</div>
	)
}
