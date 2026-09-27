import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pricingFromCatalog, recommendPlan } from '../../utils/pricingCalculator'
import { ANNUAL_MONTHS_CHARGED, formatPlanMoney } from '../../utils/planPriceFormat'
import './PackagesPlanPicker.css'

const USERS_MAX_SLIDER = 120

/** „netto / mies.” kończy się kropką — nie dokładamy drugiej */
function sentence(text) {
	return text.endsWith('.') ? text : `${text}.`
}

function sameModules(a, b) {
	if (a.length !== b.length) return false
	const set = new Set(a)
	return b.every(x => set.has(x))
}

/**
 * Kalkulator planu w Pakietach — ta sama logika co na landingu (utils/pricingCalculator).
 * Płatności zostają w PackagesPage: Core przechodzi przez konfigurator (onChooseCore), pakiety przez onChooseBundle.
 */
export default function PackagesPlanPicker({
	catalog,
	billing,
	onBillingChange,
	teamSeats,
	currentPlan,
	prefill,
	canBuy,
	canContact,
	changeByRequest,
	busy,
	busyPlanKey,
	planLabel,
	onChooseCore,
	onChooseBundle,
	onContact,
}) {
	const { t, i18n } = useTranslation()
	const lang = i18n.resolvedLanguage
	const pricing = useMemo(() => pricingFromCatalog(catalog), [catalog])
	const [users, setUsers] = useState(prefill?.users ?? 1)
	const [needs, setNeeds] = useState(prefill?.needs ?? { leave: true, modules: [] })
	const [touched, setTouched] = useState(false)

	// Podpowiedź (zespół, link z landingu, obecny plan) dochodzi, gdy przyjdą entitlements — do pierwszej zmiany przez użytkownika
	useEffect(() => {
		if (touched || !prefill) return
		setUsers(prefill.users)
		setNeeds(prefill.needs)
	}, [prefill, touched])

	const rec = useMemo(() => recommendPlan(users, needs, pricing), [users, needs, pricing])
	const yearly = billing === 'annual'
	const months = yearly ? ANNUAL_MONTHS_CHARGED : 1
	const money = pln => formatPlanMoney(pln, lang)
	const period = yearly ? t('billingPackages.picker.perYear') : t('billingPackages.picker.perMonth')
	const inline = monthlyNet => `${money(monthlyNet * months)} ${period}`
	const moduleName = id => {
		const m = pricing.modules.find(x => x.id === id)
		return m?.label?.[lang?.startsWith('en') ? 'en' : 'pl'] || id
	}
	const coreName = (planKey, mods) => [planLabel(planKey), ...mods.map(moduleName)].join(' + ')
	const tierMax = planKey =>
		[...pricing.coreTiers, ...pricing.bundles].find(x => x.id === planKey)?.maxUsers ?? null

	const update = patch => {
		setTouched(true)
		setNeeds(prev => ({ ...prev, ...patch }))
	}
	const toggleModule = id => {
		setTouched(true)
		setNeeds(prev => {
			const mods = prev.modules || []
			return { ...prev, modules: mods.includes(id) ? mods.filter(x => x !== id) : [...mods, id] }
		})
	}
	const noNeeds = !needs.leave && !needs.reports && !needs.ai && !(needs.modules || []).length
	// Brak tłumaczenia zwraca klucz (string) — lista musi zostać listą
	const alwaysRaw = t('billingPackages.picker.alwaysItems', { returnObjects: true })
	const alwaysItems = Array.isArray(alwaysRaw) ? alwaysRaw : []

	let card
	if (rec.kind === 'free') {
		const smallest = pricing.coreTiers[0]
		card = {
			name: t('billingPackages.picker.freeName'),
			price: money(0),
			period: '',
			why: t('billingPackages.picker.freeWhy', { max: pricing.freeMaxUsers }),
			includes: t('billingPackages.picker.freeIncludes'),
			alt: smallest
				? sentence(t('billingPackages.picker.altAll', { plan: planLabel(smallest.id), price: inline(smallest.monthlyNetPln) }))
				: null,
			action: { kind: 'none', note: t('billingPackages.picker.freeNothingToBuy') },
		}
	} else if (rec.kind === 'custom') {
		card = {
			name: t('billingPackages.picker.customName'),
			price: t('billingPackages.picker.customPrice'),
			period: '',
			why: t('billingPackages.picker.customWhy'),
			includes: t('billingPackages.picker.includesBundle'),
			alt: null,
			action: { kind: 'contact' },
		}
	} else if (rec.kind === 'bundle') {
		const { bundle, core } = rec
		const diff = bundle.monthlyNetPln - core.monthlyNetPln
		card = {
			name: planLabel(bundle.planKey),
			price: money(bundle.monthlyNetPln * months),
			period,
			equivalent: yearly ? money((bundle.monthlyNetPln * months) / 12) : null,
			why:
				diff < 0
					? t('billingPackages.picker.whyBundleCheaper', { price: inline(core.monthlyNetPln) })
					: diff === 0
						? t('billingPackages.picker.whyBundleSame')
						: t('billingPackages.picker.whyBundleNudge', { price: money(diff * months) }),
			includes:
				t('billingPackages.picker.includesBundle') +
				(bundle.planKey === 'business' ? t('billingPackages.picker.includesBusinessExtra') : ''),
			alt: sentence(t('billingPackages.picker.altOr', { plan: coreName(core.planKey, core.modules), price: inline(core.monthlyNetPln) })),
			action: { kind: 'bundle', planKey: bundle.planKey },
			altAction: { kind: 'core', planKey: core.planKey, modules: core.modules },
		}
	} else {
		const { core, bundle } = rec
		card = {
			name: coreName(core.planKey, core.modules),
			price: money(core.monthlyNetPln * months),
			period,
			equivalent: yearly ? money((core.monthlyNetPln * months) / 12) : null,
			why: noNeeds
				? t('billingPackages.picker.whyOverFree', { max: pricing.freeMaxUsers, count: users })
				: core.modules.length
					? t('billingPackages.picker.whyCoreModules')
					: t('billingPackages.picker.whyCore'),
			includes: `${[t('billingPackages.picker.includesCore'), ...core.modules.map(moduleName)].join(', ')}.`,
			alt: sentence(t('billingPackages.picker.altAll', { plan: planLabel(bundle.planKey), price: inline(bundle.monthlyNetPln) })),
			action: { kind: 'core', planKey: core.planKey, modules: core.modules },
			altAction: { kind: 'bundle', planKey: bundle.planKey },
		}
	}

	const isCurrent = action =>
		Boolean(
			currentPlan &&
				action &&
				action.planKey === currentPlan.planKey &&
				(action.kind === 'bundle' || sameModules(action.modules || [], currentPlan.modules || []))
		)
	const seatsBlocked = action => {
		const max = action?.planKey ? tierMax(action.planKey) : null
		return teamSeats != null && max != null && teamSeats > max
	}
	const run = action => {
		if (!action || !canBuy || busy) return
		if (action.kind === 'core') onChooseCore(action.planKey, action.modules || [])
		if (action.kind === 'bundle') onChooseBundle(action.planKey)
		if (action.kind === 'contact') onContact()
	}
	// Opłacony plan: zamiast zakupu prośba o zmianę (PackagesPage otwiera zgłoszenie mailem, bez płatności)
	const buyLabel = action =>
		busyPlanKey && action?.planKey === busyPlanKey
			? t('billingPackages.p24Redirecting')
			: changeByRequest
				? t('billingPackages.picker.requestChange')
				: t('billingPackages.picker.choose')
	const altLabel = changeByRequest ? t('billingPackages.picker.requestChangeAlt') : t('billingPackages.picker.chooseAlt')

	const mainAction = card.action
	const mainIsCurrent = isCurrent(mainAction)
	const mainSeatsBlocked = seatsBlocked(mainAction)
	const coreFrom = pricing.coreTiers[0]?.monthlyNetPln
	const proTiers = pricing.bundles.filter(b => b.id !== 'business')
	const business = pricing.bundles.find(b => b.id === 'business')
	const coreForSeats =
		pricing.coreTiers.find(x => teamSeats == null || x.maxUsers >= teamSeats) || pricing.coreTiers[0]
	const currentIsCore = Boolean(currentPlan && pricing.coreTiers.some(x => x.id === currentPlan.planKey))

	return (
		<section className="ppk" id="packages-plan-picker" aria-labelledby="ppk-title">
			<div className="ppk__head">
				<h3 id="ppk-title" className="ppk__title">
					{t('billingPackages.picker.title')}
				</h3>
				<div className="ppk__subtitle">{t('billingPackages.picker.subtitle')}</div>
				{currentPlan ? (
					<div className="ppk__current-note" role="note">
						{t('billingPackages.picker.currentPlanNote', { plan: currentPlan.label })}
					</div>
				) : null}
			</div>

			<div className="ppk__grid">
				<div className="ppk__card">
					<div className="ppk__step">
						<div className="ppk__step-head">
							<label className="ppk__label" htmlFor="ppk-users-range">
								{t('billingPackages.picker.people')}
							</label>
							<output className="ppk__users-value" htmlFor="ppk-users-range" aria-live="polite">
								{t('billingPackages.picker.peopleValue', { count: users })}
							</output>
						</div>
						<div className="ppk__users">
							<input
								id="ppk-users-range"
								type="range"
								min={1}
								max={USERS_MAX_SLIDER}
								step={1}
								value={Math.min(users, USERS_MAX_SLIDER)}
								onChange={e => {
									setTouched(true)
									setUsers(Number(e.target.value))
								}}
								style={{ '--ppk-fill': `${((Math.min(users, USERS_MAX_SLIDER) - 1) / (USERS_MAX_SLIDER - 1)) * 100}%` }}
								aria-valuetext={t('billingPackages.picker.peopleValue', { count: users })}
							/>
							<input
								type="number"
								inputMode="numeric"
								className="ppk__users-number"
								min={1}
								max={999}
								value={users}
								onChange={e => {
									setTouched(true)
									setUsers(Math.max(1, Math.min(999, Math.floor(Number(e.target.value)) || 1)))
								}}
								aria-label={t('billingPackages.picker.people')}
							/>
						</div>
						{teamSeats != null ? (
							<div className="ppk__hint">{t('billingPackages.picker.peopleNow', { count: teamSeats })}</div>
						) : null}
					</div>

					<div className="ppk__step">
						<div className="ppk__label">{t('billingPackages.picker.always')}</div>
						<ul className="ppk__always">
							{alwaysItems.map(item => (
								<li key={item} className="ppk__always-item">
									<span aria-hidden="true">✓</span> {item}
								</li>
							))}
						</ul>
					</div>

					<fieldset className="ppk__step ppk__fieldset">
						<legend className="ppk__label">{t('billingPackages.picker.needs')}</legend>
						<div className="ppk__needs">
							{[
								['leave', t('billingPackages.picker.needLeave')],
								['reports', t('billingPackages.picker.needReports')],
								['ai', t('billingPackages.picker.needAi')],
							].map(([key, label]) => (
								<label key={key} className={`ppk__need${needs[key] ? ' ppk__need--on' : ''}`}>
									<input type="checkbox" checked={Boolean(needs[key])} onChange={e => update({ [key]: e.target.checked })} />
									<span className="ppk__need-body">
										<span className="ppk__need-text">{label}</span>
										<span className="ppk__need-hint">{t('billingPackages.picker.needInCore')}</span>
									</span>
								</label>
							))}
							{pricing.modules.map(m => {
								const on = (needs.modules || []).includes(m.id)
								return (
									<label key={m.id} className={`ppk__need${on ? ' ppk__need--on' : ''}`}>
										<input type="checkbox" checked={on} onChange={() => toggleModule(m.id)} />
										<span className="ppk__need-body">
											<span className="ppk__need-text">{moduleName(m.id)}</span>
											<span className="ppk__need-hint">
												{t('billingPackages.picker.needModule', { price: money(m.monthlyNetPln) })}
											</span>
										</span>
									</label>
								)
							})}
						</div>
					</fieldset>

					<div className="ppk__step">
						<div className="ppk__billing" role="group" aria-label={t('billingPackages.billingToggle')}>
							<button
								type="button"
								className={`ppk__billing-btn${!yearly ? ' ppk__billing-btn--on' : ''}`}
								aria-pressed={!yearly}
								onClick={() => onBillingChange('monthly')}
							>
								{t('billingPackages.picker.monthly')}
							</button>
							<button
								type="button"
								className={`ppk__billing-btn${yearly ? ' ppk__billing-btn--on' : ''}`}
								aria-pressed={yearly}
								onClick={() => onBillingChange('annual')}
							>
								{t('billingPackages.picker.annual')}
								<small className="ppk__billing-save">{t('billingPackages.picker.annualSave')}</small>
							</button>
						</div>
					</div>
				</div>

				<div className="ppk__card ppk__result" aria-live="polite">
					<span className="ppk__badge">{t('billingPackages.picker.recommended')}</span>
					<div className="ppk__result-name">{card.name}</div>
					<div className="ppk__result-price">
						{card.price}
						{card.period ? <small className="ppk__result-period">{card.period}</small> : null}
					</div>
					{card.equivalent ? (
						<div className="ppk__result-equiv">{t('billingPackages.picker.annualEquivalent', { price: card.equivalent })}</div>
					) : null}
					<div className="ppk__result-why">{card.why}</div>
					<div className="ppk__result-includes">{card.includes}</div>

					{mainAction.kind === 'none' ? (
						<div className="ppk__result-note">{mainAction.note}</div>
					) : mainIsCurrent ? (
						<div className="ppk__result-current">{t('billingPackages.picker.currentPlan')}</div>
					) : !canBuy ? (
						<div className="ppk__result-note">{t('billingPackages.picker.adminOnly')}</div>
					) : mainAction.kind === 'contact' && !canContact ? (
						// Centrum pomocy jest tylko dla Administratora — HR dostaje wskazówkę zamiast martwego przycisku
						<div className="ppk__result-note">{t('billingPackages.picker.contactAskAdmin')}</div>
					) : (
						<>
							{mainSeatsBlocked ? (
								<div className="ppk__result-warn" role="status">
									{t('billingPackages.picker.seatsTooMany', { count: teamSeats, max: tierMax(mainAction.planKey) })}
								</div>
							) : null}
							<button
								type="button"
								className="ppk__cta"
								disabled={busy || mainSeatsBlocked}
								onClick={() => run(mainAction)}
							>
								{mainAction.kind === 'contact' ? t('billingPackages.picker.contact') : buyLabel(mainAction)}
							</button>
							{changeByRequest && mainAction.kind !== 'contact' ? (
								<div className="ppk__result-hint">{t('billingPackages.picker.changeByRequestNote')}</div>
							) : null}
						</>
					)}

					{card.alt ? (
						<div className="ppk__result-alt">
							{card.alt}{' '}
							{card.altAction && canBuy && !isCurrent(card.altAction) && !seatsBlocked(card.altAction) ? (
								<button type="button" className="ppk__link-btn" disabled={busy} onClick={() => run(card.altAction)}>
									{altLabel}
								</button>
							) : null}
						</div>
					) : null}
				</div>
			</div>

			<div className="ppk__plans">
				<h4 className="ppk__plans-title">{t('billingPackages.picker.allPlans')}</h4>
				<ul className="ppk__plans-grid">
					<li className={`ppk__plan${currentIsCore ? ' ppk__plan--current' : ''}`}>
						{currentIsCore ? <span className="ppk__plan-badge">{t('billingPackages.planCurrentBadge')}</span> : null}
						<div className="ppk__plan-name">Core</div>
						<div className="ppk__plan-price">
							{t('billingPackages.picker.from')} {money(coreFrom)}
						</div>
						<div className="ppk__plan-desc">{t('billingPackages.picker.coreDesc')}</div>
						<div className="ppk__plan-tiers">
							{pricing.coreTiers
								.map(x => `${t('billingPackages.picker.upTo', { n: x.maxUsers })} ${money(x.monthlyNetPln)}`)
								.join(' · ')}
						</div>
						{canBuy && coreForSeats ? (
							<button
								type="button"
								className="ppk__plan-btn"
								disabled={busy}
								onClick={() =>
									onChooseCore(currentIsCore ? currentPlan.planKey : coreForSeats.id, currentIsCore ? currentPlan.modules : [])
								}
							>
								{changeByRequest ? t('billingPackages.picker.requestChangeAlt') : t('billingPackages.picker.configureCore')}
							</button>
						) : null}
					</li>
					<li className={`ppk__plan${currentPlan && proTiers.some(x => x.id === currentPlan.planKey) ? ' ppk__plan--current' : ''}`}>
						{currentPlan && proTiers.some(x => x.id === currentPlan.planKey) ? (
							<span className="ppk__plan-badge">{t('billingPackages.planCurrentBadge')}</span>
						) : null}
						<div className="ppk__plan-name">PRO</div>
						<div className="ppk__plan-price">
							{t('billingPackages.picker.from')} {money(proTiers[0]?.monthlyNetPln)}
						</div>
						<div className="ppk__plan-desc">{t('billingPackages.picker.proDesc')}</div>
						<div className="ppk__plan-options">
							{proTiers.map(x => {
								const current = currentPlan?.planKey === x.id
								const blocked = teamSeats != null && teamSeats > x.maxUsers
								return (
									<button
										key={x.id}
										type="button"
										className="ppk__plan-option"
										disabled={!canBuy || busy || current || blocked}
										title={
											blocked ? t('billingPackages.planSeatsExceededHint', { used: teamSeats, maxUsers: x.maxUsers }) : undefined
										}
										onClick={() => onChooseBundle(x.id)}
									>
										{t('billingPackages.picker.upTo', { n: x.maxUsers })} · {money(x.monthlyNetPln)}
									</button>
								)
							})}
						</div>
					</li>
					{business ? (
						<li className={`ppk__plan${currentPlan?.planKey === business.id ? ' ppk__plan--current' : ''}`}>
							{currentPlan?.planKey === business.id ? (
								<span className="ppk__plan-badge">{t('billingPackages.planCurrentBadge')}</span>
							) : null}
							<div className="ppk__plan-name">Business</div>
							<div className="ppk__plan-price">{money(business.monthlyNetPln)}</div>
							<div className="ppk__plan-desc">{t('billingPackages.picker.businessDesc')}</div>
							<div className="ppk__plan-tiers">{t('billingPackages.picker.upToLong', { n: business.maxUsers })}</div>
							{canBuy ? (
								<button
									type="button"
									className="ppk__plan-btn"
									disabled={busy || currentPlan?.planKey === business.id || (teamSeats != null && teamSeats > business.maxUsers)}
									onClick={() => onChooseBundle(business.id)}
								>
									{altLabel}
								</button>
							) : null}
						</li>
					) : null}
				</ul>
				<div className="ppk__modules-line">
					<strong>{t('billingPackages.picker.modulesLine')}:</strong>{' '}
					{pricing.modules.map(m => `${moduleName(m.id)} + ${money(m.monthlyNetPln)}`).join(' · ')} (
					{t('billingPackages.picker.perMonth')})
				</div>
				<div className="ppk__notes">{t('billingPackages.picker.notes')}</div>
			</div>
		</section>
	)
}
