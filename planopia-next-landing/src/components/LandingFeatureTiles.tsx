'use client'

import Link from 'next/link'
import { landingFeatures, type FeatureId } from '@/data/landingPlanPricing'
import {
	BADGE_COPY,
	FEATURE_COPY,
	MODULE_COPY,
	PRICING_FEATURE_EVENT,
	TILES_COPY,
	type Locale,
} from '@/data/landingFeatureCopy'
import '@/styles/landingFeaturesPricing.css'

/** Dzwonek w stylu zielonych ikon PNG (w projekcie nie ma ikony powiadomień) */
function BellIcon() {
	return (
		<svg viewBox="0 0 24 24" width="35" height="35" aria-hidden="true" className="lf-tile__svg">
			<path
				d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5v3.2c0 .9-.3 1.8-.9 2.5L4.5 16h15l-1.1-1.3a3.9 3.9 0 0 1-.9-2.5V9A5.5 5.5 0 0 0 12 3.5Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			<path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	)
}

/** Kliknięcie plakietki: kalkulator zaznacza funkcję i przewija do cennika */
function selectInCalculator(featureId: FeatureId, locale: Locale) {
	window.dispatchEvent(new CustomEvent(PRICING_FEATURE_EVENT, { detail: { featureId } }))
	document.getElementById(locale === 'pl' ? 'cennik' : 'prices')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingFeatureTiles({ locale }: { locale: Locale }) {
	const t = TILES_COPY[locale]
	return (
		<div className="lf-tiles">
			<p className="lf-tiles__legend">
				<span className="lf-tiles__legend-text">{t.legend}</span>
				<span className="lf-badge lf-badge--free">{BADGE_COPY.free[locale]}</span>
				<span className="lf-badge lf-badge--core">{BADGE_COPY.core[locale]}</span>
				<span className="lf-badge lf-badge--module">{t.moduleLegend}</span>
				<span className="lf-badge lf-badge--all">{BADGE_COPY.all[locale]}</span>
			</p>
			<p className="lf-tiles__hint">{t.badgeHint}</p>
			<ul className="lf-tiles__grid">
				{landingFeatures.map(feature => {
					const copy = FEATURE_COPY[feature.id]
					const text = copy[locale]
					const selectable = feature.plan === 'core' || feature.plan === 'module'
					const badgeLabel =
						feature.plan === 'module' && 'module' in feature
							? `+ ${MODULE_COPY[feature.module][locale]}`
							: BADGE_COPY[feature.plan as 'free' | 'core' | 'all'][locale]
					return (
						<li key={feature.id} className="lf-tile">
							<div className="lf-tile__icon" aria-hidden="true">
								{copy.icon ? (
									<img src={copy.icon} alt="" width={35} height={35} loading="lazy" decoding="async" />
								) : (
									<BellIcon />
								)}
							</div>
							<div className="lf-tile__body">
								<h3 className="lf-tile__title">{text.title}</h3>
								<div className="lf-tile__desc">{text.desc}</div>
								<div className="lf-tile__foot">
									{selectable ? (
										<button
											type="button"
											className={`lf-badge lf-badge--${feature.plan}`}
											onClick={() => selectInCalculator(feature.id, locale)}
											title={t.badgeTitle}
											aria-label={`${badgeLabel} — ${t.badgeTitle}`}
										>
											{badgeLabel}
										</button>
									) : (
										<span className={`lf-badge lf-badge--${feature.plan}`}>{badgeLabel}</span>
									)}
									{copy.href ? (
										<Link href={copy.href[locale]} className="lf-tile__more">
											{copy.isNew ? <><b>{t.newLabel}</b>{' '}</> : null}
											{copy.moreLabel ? copy.moreLabel[locale] : `${t.more} →`}
										</Link>
									) : null}
								</div>
							</div>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
