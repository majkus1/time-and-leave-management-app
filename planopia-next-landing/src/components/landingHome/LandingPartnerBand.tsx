import Link from 'next/link'
import './partnerBand.css'
import { PARTNER_PAGE_PATH, TERMS_LABEL } from '@/data/partnerProgramCopy'

/**
 * Pasek programu partnerskiego na stronie głównej (tylko PL) — druga karta w sekcji instrukcji, te same wymiary,
 * granatowa jak /program-partnerski. Stawki z partnerProgramCopy, żeby nie rozjechały się ze stroną partnerską.
 */
export default function LandingPartnerBand() {
	const facts = [
		{ value: TERMS_LABEL.initial, label: 'przez pierwszy rok' },
		{ value: TERMS_LABEL.later, label: 'potem bez limitu czasu' },
		{ value: '0 zł', label: 'za udział' },
	]

	return (
		<aside className="lpb" aria-labelledby="lpb-title">
			<div className="lpb__copy">
				<p className="landing-section-eyebrow lpb__eyebrow">Program partnerski</p>
				<h2 id="lpb-title" className="lpb__title">
					Polecaj Planopię i zarabiaj <span>{TERMS_LABEL.initial} od każdej płatności</span>
				</h2>
				<p className="lpb__text">
					Biura rachunkowe i kadrowe dostają też panel danych swoich klientów — godziny, urlopy i eksport miesiąca do płac w
					jednym miejscu.
				</p>
				<ul className="lpb__facts">
					{facts.map(f => (
						<li key={f.label}>
							<b>{f.value}</b>
							<span>{f.label}</span>
						</li>
					))}
				</ul>
			</div>
			<Link href={PARTNER_PAGE_PATH} className="lpb__cta">
				Zobacz program partnerski
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M5 12h14M13 6l6 6-6 6" />
				</svg>
			</Link>
		</aside>
	)
}
