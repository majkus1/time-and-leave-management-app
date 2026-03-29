import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import {
	useBillingCatalog,
	useBillingEntitlements,
	useBillingPurchaseRequest,
	useBillingP24Status,
	useBillingP24Checkout,
	useBillingPatchTeamInvoice,
	BILLING_ENTITLEMENTS_QUERY_KEY,
} from '../../hooks/useBilling'
import LegalDocumentsSection from '../legal/LegalDocumentsSection'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './PackagesPage.css'

const TIER_LABELS = {
	starter: 'Starter',
	pro: 'Pro',
	business: 'Business',
	enterprise: 'Enterprise',
}

const PAID_PLAN_IDS = ['starter', 'pro', 'business', 'enterprise']

function billingAxiosErrorMessage(error, t) {
	const d = error?.response?.data
	if (
		d?.code === 'PLAN_SEAT_LIMIT_EXCEEDED' &&
		d?.meta &&
		Number.isFinite(Number(d.meta.used)) &&
		Number.isFinite(Number(d.meta.maxUsers))
	) {
		return t('billingPackages.planSeatLimitExceeded', {
			used: d.meta.used,
			maxUsers: d.meta.maxUsers,
		})
	}
	return d?.message || error?.message || null
}

function paidSubscriptionActive(ent) {
	if (!ent?.planKey || ent.billingStatus !== 'active') return false
	if (!PAID_PLAN_IDS.includes(ent.planKey)) return false
	if (ent.billingPeriodEnd && new Date(ent.billingPeriodEnd) < new Date()) return false
	return true
}

function trialSubscriptionActive(ent) {
	if (!ent || ent.planKey !== 'trial' || !ent.trialEndsAt) return false
	return new Date(ent.trialEndsAt) > new Date()
}

function formatPlanDate(iso, localeTag) {
	if (!iso) return '—'
	try {
		return new Date(iso).toLocaleDateString(localeTag, { dateStyle: 'long' })
	} catch {
		return String(iso)
	}
}

/** Ostatni dzień włącznie (grace kończy się o północy następnego dnia w PL). */
function formatLegacyGraceLastInclusiveDay(iso, localeTag) {
	if (!iso) return '—'
	try {
		const endExclusive = new Date(iso).getTime()
		return formatPlanDate(new Date(endExclusive - 1).toISOString(), localeTag)
	} catch {
		return String(iso)
	}
}

/** Zgodnie z planopia-next-landing (LandingPricing). */
const PLN_PER_USD = 3.69

function plnToUsd(pln) {
	return pln / PLN_PER_USD
}

function formatMoneyUsd(amount) {
	return amount.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
}

function isEnglishResolved(resolved) {
	return typeof resolved === 'string' && resolved.toLowerCase().startsWith('en')
}

function formatCatalogPln(n) {
	if (n == null) return '—'
	return `${n} PLN`
}

/** Cena katalogowa (np. pakiet AI): PLN lub USD w zależności od języka. */
function formatCatalogPrice(n, resolvedLang) {
	if (n == null) return '—'
	if (isEnglishResolved(resolvedLang)) return `$${formatMoneyUsd(plnToUsd(n))}`
	return formatCatalogPln(n)
}

function p24BusyKeyForBody(body) {
	if (body?.kind === 'plan' && body.planKey) return `plan:${body.planKey}`
	if (body?.kind === 'addon' && body.addonId) return `addon:${body.addonId}`
	return null
}

function priceBlock(monthlyNet, billing, t, resolvedLang) {
	if (isEnglishResolved(resolvedLang)) {
		if (billing === 'monthly') {
			return {
				main: `$${formatMoneyUsd(plnToUsd(monthlyNet))}`,
				sub: t('billingPackages.netPerMonthShort'),
			}
		}
		const annualTotalPln = monthlyNet * 10
		const eqPln = annualTotalPln / 12
		return {
			main: `$${formatMoneyUsd(plnToUsd(eqPln))}`,
			sub: t('billingPackages.annualSummary', {
				total: `$${formatMoneyUsd(plnToUsd(annualTotalPln))}`,
			}),
		}
	}
	if (billing === 'monthly') {
		return { main: formatCatalogPln(monthlyNet), sub: t('billingPackages.netPerMonthShort') }
	}
	const annualTotal = monthlyNet * 10
	const eq = annualTotal / 12
	return {
		main: `${eq.toFixed(2)} PLN`,
		sub: t('billingPackages.annualSummary', { total: annualTotal }),
	}
}

export default function PackagesPage() {
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const { role, isCheckingAuth } = useAuth()
	const canSubmitPurchaseRequest = isAdmin(role) || isHR(role)
	const { data: catalog, isLoading: catLoading } = useBillingCatalog()
	const { data: ent, isLoading: entLoading } = useBillingEntitlements()
	const purchase = useBillingPurchaseRequest()
	const { data: p24Status, isPending: p24StatusLoading } = useBillingP24Status()
	const p24Checkout = useBillingP24Checkout()
	const patchTeamInvoice = useBillingPatchTeamInvoice()
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const location = useLocation()
	const appliedQueryRef = useRef(false)
	const p24ReturnHandledRef = useRef(false)

	const [billing, setBilling] = useState('monthly')
	const [modal, setModal] = useState(null)
	const [note, setNote] = useState('')
	const [justSent, setJustSent] = useState(false)
	const [p24BusyKey, setP24BusyKey] = useState(null)
	const [invCompany, setInvCompany] = useState('')
	const [invAddress, setInvAddress] = useState('')
	const [invNip, setInvNip] = useState('')

	const loading = catLoading || !catalog
	const teamSeats = typeof ent?.teamMemberCount === 'number' ? ent.teamMemberCount : null

	useEffect(() => {
		const bi = ent?.billingInvoice
		if (!bi) return
		setInvCompany(bi.companyName ?? '')
		setInvAddress(bi.address ?? '')
		setInvNip(bi.nip ?? '')
	}, [ent?.billingInvoice?.companyName, ent?.billingInvoice?.address, ent?.billingInvoice?.nip])

	const startP24Checkout = useCallback(
		async body => {
			if (!canSubmitPurchaseRequest) return
			if (body.kind === 'plan' && catalog && teamSeats != null) {
				const tier = catalog.tiers.find(t => t.id === body.planKey)
				if (tier && teamSeats > tier.maxUsers) {
					await showAlert(
						t('billingPackages.planSeatLimitExceeded', { used: teamSeats, maxUsers: tier.maxUsers })
					)
					return
				}
			}
			const busyKey = p24BusyKeyForBody(body)
			if (busyKey) setP24BusyKey(busyKey)
			try {
				const data = await p24Checkout.mutateAsync(body)
				if (data.redirectUrl) {
					window.location.assign(data.redirectUrl)
				}
			} catch (e) {
				await showAlert(
					billingAxiosErrorMessage(e, t) ||
						e.response?.data?.message ||
						e.message ||
						t('billingPackages.p24PayError')
				)
			} finally {
				setP24BusyKey(null)
			}
		},
		[canSubmitPurchaseRequest, catalog, teamSeats, p24Checkout, t, showAlert]
	)

	useEffect(() => {
		if (p24ReturnHandledRef.current) return
		if (searchParams.get('p24') !== '1') return
		p24ReturnHandledRef.current = true
		queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		void showAlert(t('billingPackages.p24ReturnHint'))
		navigate('/packages', { replace: true })
	}, [searchParams, navigate, queryClient, showAlert, t])

	useEffect(() => {
		if (!catalog || appliedQueryRef.current || isCheckingAuth || p24StatusLoading) return
		if (!canSubmitPurchaseRequest) {
			if (searchParams.get('plan')) appliedQueryRef.current = true
			return
		}
		const plan = searchParams.get('plan')
		const bill = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly'
		if (plan === 'addon') {
			const addonId = searchParams.get('addon')
			if (addonId && catalog.addons?.some(a => a.id === addonId)) {
				appliedQueryRef.current = true
				setNote('')
				if (p24Status?.ready) {
					void startP24Checkout({ kind: 'addon', addonId })
				} else {
					setModal({ kind: 'addon', addonId })
				}
			}
			return
		}
		if (plan && catalog.tiers?.some(t => t.id === plan)) {
			if (ent && paidSubscriptionActive(ent) && ent.planKey === plan) {
				appliedQueryRef.current = true
				return
			}
			if (!ent) return
			const tier = catalog.tiers.find(t => t.id === plan)
			const seats = typeof ent.teamMemberCount === 'number' ? ent.teamMemberCount : null
			if (seats != null && tier && seats > tier.maxUsers) {
				appliedQueryRef.current = true
				return
			}
			appliedQueryRef.current = true
			setBilling(bill)
			setNote('')
			if (p24Status?.ready) {
				void startP24Checkout({ kind: 'plan', planKey: plan, billingCycle: bill })
			} else {
				setModal({ kind: 'plan', planKey: plan, billingCycle: bill })
			}
		}
	}, [
		catalog,
		ent,
		searchParams,
		canSubmitPurchaseRequest,
		isCheckingAuth,
		p24Status,
		p24StatusLoading,
		startP24Checkout,
	])

	useEffect(() => {
		if (loading || !catalog) return
		if (location.hash !== '#legal-documents') return
		const timer = window.setTimeout(() => {
			document.getElementById('legal-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 150)
		return () => window.clearTimeout(timer)
	}, [loading, catalog, location.hash])

	const modalLabels = useMemo(
		() => ({
			noteLabel: t('billingPackages.noteLabel'),
			send: t('billingPackages.send'),
			sending: t('billingPackages.sending'),
			cancel: i18n.resolvedLanguage === 'pl' ? 'Anuluj' : 'Cancel',
		}),
		[t, i18n.resolvedLanguage]
	)

	const submitOrder = async () => {
		if (!modal || !canSubmitPurchaseRequest) return
		if (modal.kind === 'plan' && catalog && teamSeats != null) {
			const tier = catalog.tiers.find(t => t.id === modal.planKey)
			if (tier && teamSeats > tier.maxUsers) {
				await showAlert(
					t('billingPackages.planSeatLimitExceeded', { used: teamSeats, maxUsers: tier.maxUsers })
				)
				return
			}
		}
		try {
			if (modal.kind === 'plan') {
				await purchase.mutateAsync({
					kind: 'plan',
					planKey: modal.planKey,
					billingCycle: modal.billingCycle,
					note,
				})
			} else {
				await purchase.mutateAsync({
					kind: 'addon',
					addonId: modal.addonId,
					note,
				})
			}
			setModal(null)
			setNote('')
			setJustSent(true)
			await showAlert(t('billingPackages.sent'))
		} catch (e) {
			await showAlert(billingAxiosErrorMessage(e, t) || e.message || 'Error')
		}
	}

	if (loading) {
		return (
			<>
				<Sidebar />
				<Loader />
			</>
		)
	}

	const localeTag = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB'
	const activePaid = ent ? paidSubscriptionActive(ent) : false
	const activeTrial = ent ? trialSubscriptionActive(ent) : false

	let currentPlanBody = null
	if (ent) {
		const cycleShort =
			ent.billingCycle === 'annual' ? t('billingPackages.billingAnnualShort') : t('billingPackages.billingMonthlyShort')
		if (ent.ai?.unrestricted) {
			currentPlanBody = t('billingPackages.currentPlanInternal')
		} else if (ent.legacy && ent.legacyGrandfatheredActive) {
			currentPlanBody = t('billingPackages.currentPlanLegacyGrandfathered', {
				date: formatLegacyGraceLastInclusiveDay(ent.legacyGrandfatheredAccessEndsAt, localeTag),
			})
		} else if (ent.legacy && !ent.legacyGrandfatheredActive) {
			currentPlanBody = t('billingPackages.currentPlanLegacyGraceEnded')
		} else if (activeTrial) {
			currentPlanBody = t('billingPackages.currentPlanTrial', {
				date: formatPlanDate(ent.trialEndsAt, localeTag),
			})
		} else if (activePaid) {
			if (ent.hideBillingPeriodEnd) {
				currentPlanBody = t('billingPackages.currentPlanPaidNoEnd', {
					plan: TIER_LABELS[ent.planKey] || ent.planKey,
					cycle: cycleShort,
				})
			} else {
				currentPlanBody = t('billingPackages.currentPlanPaid', {
					plan: TIER_LABELS[ent.planKey] || ent.planKey,
					cycle: cycleShort,
					until: formatPlanDate(ent.billingPeriodEnd, localeTag),
				})
			}
		} else if (ent.planKey === 'trial' && ent.trialEndsAt) {
			currentPlanBody = t('billingPackages.currentPlanTrialEnded')
		} else if (
			ent.billingHadPaidPlan &&
			ent.planKey &&
			PAID_PLAN_IDS.includes(ent.planKey) &&
			!activePaid
		) {
			currentPlanBody = t('billingPackages.currentPlanLapsed', {
				plan: TIER_LABELS[ent.planKey] || ent.planKey,
			})
		} else {
			currentPlanBody = t('billingPackages.currentPlanNoSubscription')
		}
	}

	return (
		<>
			<Helmet>
				<title>{t('billingPackages.title')} — Planopia</title>
			</Helmet>
			<Sidebar />
			<div className="logs-container packages-page">
				<div className="logs-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
					<h2 style={{ color: '#2c3e50', fontSize: '26px', fontWeight: 600 }}>
						<img src="/img/wallet.png" alt="" style={{ marginRight: '10px', verticalAlign: 'middle' }} />{' '}
						{t('billingPackages.title')}
					</h2>
					<hr />
				</div>

				{isEnglishResolved(i18n.resolvedLanguage) && (
					<p className="packages-usd-hint" role="note">
						{t('billingPackages.usdIndicativeNote')}
					</p>
				)}

				{justSent && <div className="packages-sent-banner">{t('billingPackages.sent')}</div>}

				{ent?.freemiumSeatBlocked && typeof ent?.freemiumMaxSeats === 'number' && teamSeats != null && (
					<div className="packages-freemium-seat-banner" role="alert">
						{canSubmitPurchaseRequest
							? t('billingPackages.freemiumSeatBlockedAdmin', {
									count: teamSeats,
									max: ent.freemiumMaxSeats,
								})
							: t('billingPackages.freemiumSeatBlockedWorker', { max: ent.freemiumMaxSeats })}
					</div>
				)}

				{!canSubmitPurchaseRequest && (
					<div className="packages-admin-only-banner" role="status">
						{t('billingPackages.purchaseRequestAdminOnly')}
					</div>
				)}

				{entLoading && ent == null && (
					<p className="packages-entitlements-hint" role="status" aria-live="polite">
						{t('billingPackages.loadingEntitlements')}
					</p>
				)}

				{currentPlanBody != null && (
					<div className="packages-current-plan">
						<h3>{t('billingPackages.currentPlanTitle')}</h3>
						<p className="packages-current-plan__body">{currentPlanBody}</p>
						{teamSeats != null && (
							<p className="packages-current-plan__seats" role="status">
								{t('billingPackages.teamSeatsInTeam', { count: teamSeats })}
							</p>
						)}
					</div>
				)}

				{ent && (
					<div className="packages-usage">
						<h3>{t('billingPackages.usageTitle')}</h3>
						{ent.ai?.unrestricted ? (
							<p className="packages-usage__text">{t('billingPackages.internalUnlimitedAi')}</p>
						) : ent.legacy && ent.legacyGrandfatheredActive ? (
							<p className="packages-usage__text">{t('billingPackages.usageLegacyGrandfathered')}</p>
						) : ent.legacy && !ent.legacyGrandfatheredActive ? (
							<p className="packages-usage__text">{t('billingPackages.legacyGraceEndedUsage')}</p>
						) : (
							<dl>
								<dt>{t('billingPackages.remaining')}</dt>
								<dd>
									{ent.ai.remainingApprox === Number.POSITIVE_INFINITY || ent.ai.remainingApprox == null
										? '—'
										: String(ent.ai.remainingApprox)}
								</dd>
								{ent.ai.trialCap != null && (
									<>
										<dt>{t('billingPackages.trialPool')}</dt>
										<dd>
											{Math.max(0, ent.ai.trialCap - (ent.ai.trialUsed || 0))} / {ent.ai.trialCap}
										</dd>
									</>
								)}
								{ent.ai.monthlyIncluded != null && (
									<>
										<dt>{t('billingPackages.monthlyPool')}</dt>
										<dd>
											{Math.max(0, ent.ai.monthlyIncluded - (ent.ai.usedInMonth || 0))} / {ent.ai.monthlyIncluded}
										</dd>
									</>
								)}
								<dt>{t('billingPackages.packBalance')}</dt>
								<dd>{ent.ai.packBalance ?? 0}</dd>
							</dl>
						)}
					</div>
				)}

				<div className="packages-billing-block">
					<div className="packages-billing-toggle">
						<span className="packages-billing-toggle__label">{t('billingPackages.billingToggle')}:</span>
						<div className="packages-billing-toggle__buttons">
							<button type="button" className={billing === 'monthly' ? 'is-on' : ''} onClick={() => setBilling('monthly')}>
								{t('billingPackages.billingMonthly')}
							</button>
							<button type="button" className={billing === 'annual' ? 'is-on' : ''} onClick={() => setBilling('annual')}>
								{t('billingPackages.billingAnnual')}
							</button>
						</div>
					</div>
					{billing === 'annual' && (
						<div className="packages-billing-annual-note" role="status">
							<span className="packages-billing-annual-badge">{t('billingPackages.billingYearlyBadge')}</span>
							<p className="packages-billing-annual-hint">{t('billingPackages.billingYearlyHint')}</p>
						</div>
					)}
				</div>

				<div className="packages-grid">
					{catalog.tiers.map(tier => {
						const isPro = tier.id === 'pro'
						const isCurrentPlan = Boolean(ent && activePaid && ent.planKey === tier.id)
						const planSeatsBlocked = teamSeats != null && teamSeats > tier.maxUsers
						const { main, sub } = priceBlock(tier.monthlyNetPln, billing, t, i18n.resolvedLanguage)
						const cycle = billing === 'monthly' ? 'monthly' : 'annual'
						return (
							<div
								key={tier.id}
								className={`packages-tier ${isPro ? 'packages-tier--highlight' : ''}${isCurrentPlan ? ' packages-tier--current' : ''}`}
							>
								{isCurrentPlan && (
									<span className="packages-tier__badge packages-tier__badge--current">
										{t('billingPackages.planCurrentBadge')}
									</span>
								)}
								{isPro && !isCurrentPlan && (
									<span className="packages-tier__badge">{t('billingPackages.recommended')}</span>
								)}
								<h3>{TIER_LABELS[tier.id] || tier.id}</h3>
								<div className="packages-tier__price">{main}</div>
								<div className="packages-tier__price-sub">{sub}</div>
								<ul className="packages-tier__features">
									{(() => {
										const feats = t(`billingPackages.tierFeatures.${tier.id}`, { returnObjects: true })
										const lines =
											Array.isArray(feats) && feats.length
												? feats
												: [
														t('billingPackages.planMaxUsers', { n: tier.maxUsers }),
														t('billingPackages.planAi', { n: tier.aiMessagesPerMonth }),
													]
										return lines.map((line, i) => (
											<li key={i} className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">{line}</span>
											</li>
										))
									})()}
								</ul>
								<button
									type="button"
									disabled={
										isCurrentPlan ||
										!canSubmitPurchaseRequest ||
										planSeatsBlocked ||
										p24StatusLoading ||
										p24BusyKey !== null
									}
									title={
										isCurrentPlan
											? t('billingPackages.planOrderDisabledOwn')
											: planSeatsBlocked
												? t('billingPackages.planSeatsExceededHint', {
														used: teamSeats,
														maxUsers: tier.maxUsers,
													})
												: !canSubmitPurchaseRequest
													? t('billingPackages.orderEmailAdminOnlyHint')
													: undefined
									}
									onClick={() => {
										if (isCurrentPlan || !canSubmitPurchaseRequest || planSeatsBlocked) return
										setJustSent(false)
										setNote('')
										if (p24Status?.ready) {
											void startP24Checkout({
												kind: 'plan',
												planKey: tier.id,
												billingCycle: cycle,
											})
										} else {
											setModal({ kind: 'plan', planKey: tier.id, billingCycle: cycle })
										}
									}}
								>
									{p24BusyKey === `plan:${tier.id}` ? (
										<span className="packages-modal__submit-pending">
											<span
												className="spinner-border spinner-border-sm packages-modal__spinner"
												role="status"
												aria-hidden="true"
											/>
											{t('billingPackages.p24Redirecting')}
										</span>
									) : isCurrentPlan ? (
										t('billingPackages.planAlreadyActive')
									) : planSeatsBlocked ? (
										t('billingPackages.planSeatsExceededShort')
									) : !canSubmitPurchaseRequest ? (
										t('billingPackages.orderEmailAdminOnlyShort')
									) : p24StatusLoading ? (
										t('billingPackages.checkingPaymentOptions')
									) : p24Status?.ready ? (
										t('billingPackages.payOnlineCta')
									) : (
										t('billingPackages.orderEmail')
									)}
								</button>
							</div>
						)
					})}
				</div>

				<div className="packages-addons">
					<h3>{t('billingPackages.addonsTitle')}</h3>
					<p className="packages-addons__sub">{t('billingPackages.addonsSubtitle')}</p>
					{ent && !ent.ai?.unrestricted && !ent.billingHadPaidPlan && (
						<p className="packages-addons__locked">{t('billingPackages.addonsLocked')}</p>
					)}
					{catalog.addons.map(a => {
						const addonLocked = !ent || (!ent.ai?.unrestricted && !ent.billingHadPaidPlan)
						const orderDisabled =
							addonLocked || !canSubmitPurchaseRequest || p24StatusLoading || p24BusyKey !== null
						return (
							<div
								key={a.id}
								className={`packages-addon-row${addonLocked ? ' packages-addon-row--locked' : ''}`}
							>
								<div>
									<strong>+{a.messages}</strong>
									<span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
										{formatCatalogPrice(a.pricePlnNet, i18n.resolvedLanguage)}
									</span>
								</div>
								<button
									type="button"
									disabled={orderDisabled}
									title={!canSubmitPurchaseRequest && !addonLocked ? t('billingPackages.orderEmailAdminOnlyHint') : undefined}
									onClick={() => {
										if (addonLocked || !canSubmitPurchaseRequest) return
										setJustSent(false)
										setNote('')
										if (p24Status?.ready) {
											void startP24Checkout({ kind: 'addon', addonId: a.id })
										} else {
											setModal({ kind: 'addon', addonId: a.id })
										}
									}}
								>
									{p24BusyKey === `addon:${a.id}` ? (
										<span className="packages-modal__submit-pending">
											<span
												className="spinner-border spinner-border-sm packages-modal__spinner"
												role="status"
												aria-hidden="true"
											/>
											{t('billingPackages.p24Redirecting')}
										</span>
									) : !canSubmitPurchaseRequest ? (
										t('billingPackages.orderEmailAdminOnlyShort')
									) : p24StatusLoading ? (
										t('billingPackages.checkingPaymentOptions')
									) : p24Status?.ready ? (
										t('billingPackages.payOnlineCta')
									) : (
										t('billingPackages.orderEmail')
									)}
								</button>
							</div>
						)
					})}
				</div>

				{canSubmitPurchaseRequest && (
					<section className="packages-invoice-section" aria-labelledby="packages-invoice-heading">
						<h3 id="packages-invoice-heading" className="packages-invoice-section__title">
							{t('billingPackages.invoiceSectionTitle')}
						</h3>
						<p className="packages-invoice-section__hint">{t('billingPackages.invoiceSectionHint')}</p>
						<div className="packages-invoice-section__grid">
							<label className="packages-invoice-section__field">
								<span className="packages-invoice-section__label">{t('billingPackages.invoiceCompany')}</span>
								<input
									type="text"
									value={invCompany}
									onChange={e => setInvCompany(e.target.value)}
									autoComplete="organization"
									disabled={patchTeamInvoice.isPending}
								/>
							</label>
							<label className="packages-invoice-section__field packages-invoice-section__field--wide">
								<span className="packages-invoice-section__label">{t('billingPackages.invoiceAddress')}</span>
								<textarea
									rows={3}
									value={invAddress}
									onChange={e => setInvAddress(e.target.value)}
									disabled={patchTeamInvoice.isPending}
								/>
							</label>
							<label className="packages-invoice-section__field">
								<span className="packages-invoice-section__label">{t('billingPackages.invoiceNip')}</span>
								<input
									type="text"
									value={invNip}
									onChange={e => setInvNip(e.target.value)}
									autoComplete="off"
									disabled={patchTeamInvoice.isPending}
								/>
							</label>
						</div>
						<button
							type="button"
							className="packages-invoice-section__save"
							disabled={patchTeamInvoice.isPending}
							onClick={async () => {
								try {
									await patchTeamInvoice.mutateAsync({
										companyName: invCompany,
										address: invAddress,
										nip: invNip,
									})
									await showAlert(t('billingPackages.invoiceSaved'))
								} catch (e) {
									await showAlert(
										e?.response?.data?.message || e?.message || t('billingPackages.p24PayError')
									)
								}
							}}
						>
							{patchTeamInvoice.isPending ? t('billingPackages.invoiceSaving') : t('billingPackages.invoiceSave')}
						</button>
					</section>
				)}

				<section id="legal-documents" className="packages-legal-section" aria-label={t('legal.title')}>
					<LegalDocumentsSection />
				</section>
			</div>

			{modal && (
				<div
					className="packages-modal-overlay"
					role="dialog"
					aria-modal="true"
					onClick={() => !purchase.isPending && setModal(null)}
				>
					<div className="packages-modal" onClick={e => e.stopPropagation()}>
						<h4>
							{modal.kind === 'plan'
								? `${TIER_LABELS[modal.planKey] || modal.planKey} · ${modal.billingCycle === 'annual' ? t('billingPackages.billingAnnual') : t('billingPackages.billingMonthly')}`
								: `AI +${catalog.addons.find(x => x.id === modal.addonId)?.messages ?? modal.addonId}`}
						</h4>
						<p className="packages-modal__fallback-intro" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>
							{t('billingPackages.emailOrderFallbackIntro')}
						</p>
						<label htmlFor="pkg-note" style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
							{modalLabels.noteLabel}
						</label>
						<textarea
							id="pkg-note"
							value={note}
							onChange={e => setNote(e.target.value)}
							placeholder={t('billingPackages.notePlaceholder')}
							disabled={purchase.isPending}
						/>
						{p24Status?.configured && !p24Status?.webhookConfigured && (
							<p className="packages-modal__p24-hint" role="status">
								{t('billingPackages.p24WebhookHint')}
							</p>
						)}
						<div className="packages-modal__actions packages-modal__actions--stack">
							<button
								type="button"
								className="primary"
								onClick={() => submitOrder()}
								disabled={purchase.isPending}
								aria-busy={purchase.isPending}
							>
								{purchase.isPending ? (
									<span className="packages-modal__submit-pending">
										<span
											className="spinner-border spinner-border-sm packages-modal__spinner"
											role="status"
											aria-hidden="true"
										/>
										{modalLabels.sending}
									</span>
								) : (
									modalLabels.send
								)}
							</button>
							<button type="button" onClick={() => setModal(null)} disabled={purchase.isPending}>
								{modalLabels.cancel}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
