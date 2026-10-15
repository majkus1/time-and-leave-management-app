import './valueComparison.css'
import { planOfferingCopy } from '@/data/planOfferingCopy'

type Locale = 'pl' | 'en'

/** „Dlaczego nie Excel?” — porównanie wiersz w wiersz zamiast dwóch luźnych kart */
export default function ValueComparison({ locale }: { locale: Locale }) {
	const copy = planOfferingCopy[locale]
	const { excelLabel, appLabel, rows } = copy.valueCompare
	const headingId = locale === 'pl' ? 'planopia-value-proof-heading' : 'planopia-value-proof-heading-en'

	return (
		<section className="landing-value-proof-section px-4" aria-labelledby={headingId}>
			<div className="landing-value-proof max-w-7xl mx-auto">
				<div className="landing-value-proof__header">
					<p className="landing-value-proof__eyebrow landing-section-eyebrow">{copy.valueEyebrow}</p>
					<h2 id={headingId} className="landing-value-proof__title">
						{copy.valueTitle}
					</h2>
					<p className="landing-value-proof__lead">{copy.valueLead}</p>
				</div>

				<div className="lvc">
					<div className="lvc__head" aria-hidden="true">
						<span className="lvc__label lvc__label--excel">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
								<rect x="3.5" y="4.5" width="17" height="15" rx="2" />
								<path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" />
							</svg>
							{excelLabel}
						</span>
						<span className="lvc__label lvc__label--app">
							<span className="lvc__logo">
								<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M5 12.5l4.2 4.2L19 7" />
								</svg>
							</span>
							{appLabel}
						</span>
					</div>
					<ul className="lvc__rows">
						{rows.map(row => (
							<li key={row.app} className="lvc__row">
								<p className="lvc__cell lvc__cell--excel">
									<span className="lvc__tag">{excelLabel}</span>
									<span className="lvc__icon lvc__icon--no" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
											<path d="M7 7l10 10M17 7L7 17" />
										</svg>
									</span>
									<span className="lvc__text">{row.excel}</span>
								</p>
								<p className="lvc__cell lvc__cell--app">
									<span className="lvc__tag">{appLabel}</span>
									<span className="lvc__icon lvc__icon--yes" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M5 12.5l4.2 4.2L19 7" />
										</svg>
									</span>
									<span className="lvc__text">{row.app}</span>
								</p>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	)
}
