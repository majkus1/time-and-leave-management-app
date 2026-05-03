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
	useBillingStripeStatus,
	useBillingStripeCheckout,
	useBillingStripeCancelSubscription,
	useBillingStripeCardSummary,
	useBillingStripeBillingPortal,
	useBillingPatchTeamInvoice,
	BILLING_ENTITLEMENTS_QUERY_KEY,
	BILLING_STRIPE_CARD_QUERY_KEY,
} from '../../hooks/useBilling'
import LegalDocumentsSection from '../legal/LegalDocumentsSection'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './PackagesPage.css'

/** Zgodnie z serwerem (billingPurchaseIntentValidator) — min. sensowna długość adresu */
const MIN_INVOICE_ADDRESS_LEN = 6

const TIER_LABELS = {
	starter: 'Core — do 15 użytkowników',
	base_s: 'Core — do 15 użytkowników',
	base_m: 'Core — do 30 użytkowników',
	base_l: 'Core — do 100 użytkowników',
	pro: 'PRO',
	business: 'Business',
	enterprise: 'Enterprise',
}

const PAID_PLAN_IDS = ['base_s', 'base_m', 'base_l', 'pro', 'business', 'enterprise']

const MODULE_LABELS = {
	timer_qr: 'Timer + QR',
	schedules_ai: 'Grafiki + AI',
	tasks: 'Zadania (kanban)',
	chat: 'Czat zespołowy',
	ai_assistant: 'Asystent AI',
}

function collectPriceIdsForStripeCheckout(stripeStatus, planKey, billingCycle, moduleKeys) {
	const map = Array.isArray(stripeStatus?.priceMap) ? stripeStatus.priceMap : []
	const planRow = map.find(
		r => r.kind === 'plan' && r.planKey === planKey && r.billingCycle === billingCycle
	)
	if (!planRow) return null
	const ids = [planRow.priceId]
	for (const mk of moduleKeys || []) {
		const mr = map.find(
			r => r.kind === 'module' && r.moduleKey === mk && r.billingCycle === billingCycle
		)
		if (!mr) return null
		ids.push(mr.priceId)
	}
	return ids
}

function stripeMapsAllPriceIds(stripeStatus, ids) {
	const set = new Set((stripeStatus?.priceMap || []).map(r => r.priceId))
	return ids.every(id => set.has(id))
}

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
	if (d?.code === 'INVOICE_INCOMPLETE' && d?.meta?.i18nKey && typeof d.meta.i18nKey === 'string') {
		return t(`billingPackages.${d.meta.i18nKey}`)
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

function formatStripeBrandLabel(brand, t) {
	const b = String(brand || '').trim().toLowerCase()
	if (!b) return t('billingPackages.stripeCardBrandUnknown')
	return b.charAt(0).toUpperCase() + b.slice(1)
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

function hasStripeMappingForBody(stripeStatus, body) {
	const map = Array.isArray(stripeStatus?.priceMap) ? stripeStatus.priceMap : []
	if (body?.kind === 'plan') {
		return map.some(
			r =>
				r.kind === 'plan' &&
				r.planKey === body.planKey &&
				r.billingCycle === body.billingCycle
		)
	}
	if (body?.kind === 'addon') {
		return map.some(r => r.kind === 'addon' && r.addonId === body.addonId)
	}
	return false
}

function parseModulesFromSearchParams(searchParams, catalog) {
	const raw = searchParams.get('modules')
	if (!raw?.trim() || !catalog?.modules?.length) return []
	const allowed = new Set(catalog.modules.map(m => m.id))
	return raw
		.split(',')
		.map(s => s.trim())
		.filter(id => allowed.has(id))
}

function corePlanCheckoutAvailableFromUrl(stripeStatus, p24Status, planKey, billingCycle, moduleKeys) {
	if (billingCycle === 'annual') {
		return p24Status?.ready === true
	}
	if (!moduleKeys?.length) {
		const body = { kind: 'plan', planKey, billingCycle }
		return p24Status?.ready === true || hasStripeMappingForBody(stripeStatus, body)
	}
	const compositeIds = collectPriceIdsForStripeCheckout(stripeStatus, planKey, billingCycle, moduleKeys)
	const compositeOk =
		compositeIds && stripeStatus?.ready === true && stripeMapsAllPriceIds(stripeStatus, compositeIds)
	return p24Status?.ready === true || compositeOk === true
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
	const { data: stripeStatus, isPending: stripeStatusLoading } = useBillingStripeStatus()
	const p24Checkout = useBillingP24Checkout()
	const stripeCheckout = useBillingStripeCheckout()
	const stripeCancelSubscription = useBillingStripeCancelSubscription()
	const stripeBillingPortal = useBillingStripeBillingPortal()
	const stripeCardSummaryEnabled = Boolean(ent?.stripe?.canManagePaymentMethod)
	const { data: stripeCardPayload, isPending: stripeCardLoading } = useBillingStripeCardSummary({
		enabled: stripeCardSummaryEnabled,
	})
	const patchTeamInvoice = useBillingPatchTeamInvoice()
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const location = useLocation()
	const appliedQueryRef = useRef(false)
	const p24ReturnHandledRef = useRef(false)
	const stripeReturnHandledRef = useRef(false)
	/** Pierwsze wczytanie billingInvoice z API zawsze stosujemy (nie blokować kliknięciem przełącznika Firma/Osoba). */
	const invoiceHydratedOnceRef = useRef(false)
	/** Po edycji nie nadpisujemy formularza refetchem — do czasu udanego zapisu. */
	const invoiceEditedByUserRef = useRef(false)

	const [billing, setBilling] = useState('monthly')
	const [modal, setModal] = useState(null)
	const [paymentChoiceModal, setPaymentChoiceModal] = useState(null)
	const [cancelStripeModalOpen, setCancelStripeModalOpen] = useState(false)
	const [note, setNote] = useState('')
	const [coreConfiguratorOpen, setCoreConfiguratorOpen] = useState(false)
	const [coreConfiguratorPlanKey, setCoreConfiguratorPlanKey] = useState('base_s')
	const [coreConfiguratorMods, setCoreConfiguratorMods] = useState([])
	const [justSent, setJustSent] = useState(false)
	const [p24BusyKey, setP24BusyKey] = useState(null)
	const [invBuyerType, setInvBuyerType] = useState('company')
	const [compName, setCompName] = useState('')
	const [compAddress, setCompAddress] = useState('')
	const [compNip, setCompNip] = useState('')
	const [indName, setIndName] = useState('')
	const [indAddress, setIndAddress] = useState('')

	const loading = catLoading || !catalog
	const teamSeats = typeof ent?.teamMemberCount === 'number' ? ent.teamMemberCount : null
	const onlineStatusLoading = p24StatusLoading || stripeStatusLoading
	const isPl = i18n.resolvedLanguage === 'pl'

	const coreTierList = useMemo(() => {
		if (!catalog?.tiers) return []
		return catalog.tiers.filter(t => t.tierType === 'core')
	}, [catalog])

	const proTier = useMemo(() => catalog?.tiers?.find(t => t.id === 'pro'), [catalog])
	const businessTier = useMemo(() => catalog?.tiers?.find(t => t.id === 'business'), [catalog])

	const coreMonthlyMinPln = useMemo(() => {
		if (!coreTierList.length) return null
		const nums = coreTierList.map(t => t.monthlyNetPln).filter(n => n != null && Number.isFinite(n))
		return nums.length ? Math.min(...nums) : null
	}, [coreTierList])

	const coreEstimatedMonthlyPln = useMemo(() => {
		if (!catalog?.tiers) return 0
		const tier = catalog.tiers.find(t => t.id === coreConfiguratorPlanKey)
		const base = tier?.monthlyNetPln ?? 0
		let mods = 0
		for (const id of coreConfiguratorMods) {
			mods += catalog.modules?.find(m => m.id === id)?.monthlyNetPln ?? 0
		}
		return base + mods
	}, [catalog, coreConfiguratorPlanKey, coreConfiguratorMods])

	const coreUpsellVsPro = useMemo(() => {
		const proPln = proTier?.monthlyNetPln
		if (proPln == null || !Number.isFinite(proPln)) return false
		return coreEstimatedMonthlyPln > proPln
	}, [coreEstimatedMonthlyPln, proTier])

	const coreConfiguratorPriceDisplay = useMemo(
		() => priceBlock(coreEstimatedMonthlyPln, billing, t, i18n.resolvedLanguage),
		[coreEstimatedMonthlyPln, billing, t, i18n.resolvedLanguage]
	)

	const hasCoreOptionalModules = Boolean(Array.isArray(catalog?.modules) && catalog.modules.length > 0)
	const coreConfiguratorSummaryStepNum = hasCoreOptionalModules ? 3 : 2

	useEffect(() => {
		const bi = ent?.billingInvoice
		if (!bi) return

		const apply = () => {
			const buyer = bi.buyerType === 'individual' ? 'individual' : 'company'
			setInvBuyerType(buyer)
			if (buyer === 'individual') {
				setIndName(bi.companyName ?? '')
				setIndAddress(bi.address ?? '')
				setCompName('')
				setCompAddress('')
				setCompNip('')
			} else {
				setCompName(bi.companyName ?? '')
				setCompAddress(bi.address ?? '')
				setCompNip(bi.nip ?? '')
				setIndName('')
				setIndAddress('')
			}
		}

		if (!invoiceHydratedOnceRef.current) {
			invoiceHydratedOnceRef.current = true
			apply()
			return
		}
		if (invoiceEditedByUserRef.current) return
		apply()
	}, [
		ent?.billingInvoice?.buyerType,
		ent?.billingInvoice?.companyName,
		ent?.billingInvoice?.address,
		ent?.billingInvoice?.nip,
	])

	const ensureInvoiceForPurchase = useCallback(async () => {
		// Invoice data is optional for starting checkout.
		return true
	}, [])

	const startOnlineCheckout = useCallback(
		async (body, options = {}) => {
			if (!canSubmitPurchaseRequest) return false
			if (body.kind === 'plan' && catalog && teamSeats != null) {
				const tier = catalog.tiers.find(t => t.id === body.planKey)
				if (tier && teamSeats > tier.maxUsers) {
					await showAlert(
						t('billingPackages.planSeatLimitExceeded', { used: teamSeats, maxUsers: tier.maxUsers })
					)
					return false
				}
			}
			if (!(await ensureInvoiceForPurchase())) return false
			const busyKey = p24BusyKeyForBody(body)
			if (busyKey) setP24BusyKey(busyKey)
			try {
				const stripeReady =
					body?.kind === 'plan' &&
					stripeStatus?.ready === true &&
					hasStripeMappingForBody(stripeStatus, body)
				const p24Ready = p24Status?.ready === true
				const preferred = options?.forceProvider
				const provider =
					preferred === 'stripe' || preferred === 'p24'
						? preferred
						: stripeReady
							? 'stripe'
							: 'p24'

				if (provider === 'stripe' && !stripeReady) {
					await showAlert(
						isPl
							? 'Płatność kartą cykliczną nie jest teraz dostępna dla wybranego pakietu.'
							: 'Recurring card checkout is not available for this plan right now.'
					)
					return false
				}
				if (provider === 'p24' && !p24Ready) {
					await showAlert(
						isPl
							? 'Platnosc Przelewy24 nie jest teraz dostepna.'
							: 'Przelewy24 checkout is not available right now.'
					)
					return false
				}

				const data = provider === 'stripe' ? await stripeCheckout.mutateAsync(body) : await p24Checkout.mutateAsync(body)
				if (data.redirectUrl) {
					window.location.assign(data.redirectUrl)
					return true
				}
				return false
			} catch (e) {
				await showAlert(
					billingAxiosErrorMessage(e, t) ||
						e.response?.data?.message ||
						e.message ||
						t('billingPackages.p24PayError')
				)
				return false
			} finally {
				setP24BusyKey(null)
			}
		},
		[
			canSubmitPurchaseRequest,
			catalog,
			teamSeats,
			stripeStatus?.ready,
			stripeCheckout,
			p24Status?.ready,
			p24Checkout,
			isPl,
			t,
			showAlert,
			ensureInvoiceForPurchase,
		]
	)

	const requestPlanOnlineCheckout = useCallback(
		body => {
			const stripeReady = stripeStatus?.ready === true && hasStripeMappingForBody(stripeStatus, body)
			const p24Ready = p24Status?.ready === true
			if (body.billingCycle === 'annual') {
				void startOnlineCheckout(body, { forceProvider: 'p24' })
				return
			}
			if (body.billingCycle === 'monthly' && stripeReady && p24Ready) {
				setPaymentChoiceModal(body)
				return
			}
			void startOnlineCheckout(body)
		},
		[stripeStatus, p24Status, startOnlineCheckout]
	)

	const executeCoreCheckout = useCallback(
		async provider => {
			if (provider !== 'stripe' && provider !== 'p24') return
			if (!canSubmitPurchaseRequest) return
			const planKey = coreConfiguratorPlanKey
			const mods = coreConfiguratorMods
			const tier = catalog?.tiers?.find(t => t.id === planKey)
			if (catalog && teamSeats != null && tier && teamSeats > tier.maxUsers) {
				await showAlert(
					t('billingPackages.planSeatLimitExceeded', { used: teamSeats, maxUsers: tier.maxUsers })
				)
				return
			}
			setJustSent(false)
			setNote('')
			const cycle = billing === 'monthly' ? 'monthly' : 'annual'

			if (mods.length > 0) {
				if (provider === 'p24') {
					await startOnlineCheckout(
						{ kind: 'plan', planKey, billingCycle: cycle, moduleKeys: mods },
						{ forceProvider: 'p24' }
					)
					return
				}
				const compositeIds = collectPriceIdsForStripeCheckout(stripeStatus, planKey, cycle, mods)
				const compositeOk =
					compositeIds && stripeStatus?.ready === true && stripeMapsAllPriceIds(stripeStatus, compositeIds)
				if (!stripeStatus?.ready || !compositeIds || !compositeOk) {
					await showAlert(t('billingPackages.stripeModulesNeedStripe'))
					return
				}
				setP24BusyKey(`plan:${planKey}`)
				try {
					const data = await stripeCheckout.mutateAsync({ priceIds: compositeIds })
					if (data?.redirectUrl) window.location.assign(data.redirectUrl)
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
				return
			}

			const body = { kind: 'plan', planKey, billingCycle: cycle }
			const anyOnline = p24Status?.ready === true || hasStripeMappingForBody(stripeStatus, body)

			if (!anyOnline) {
				setCoreConfiguratorOpen(false)
				setModal({ kind: 'plan', planKey, billingCycle: cycle })
				return
			}

			if (cycle === 'annual' && provider === 'stripe') {
				await showAlert(t('billingPackages.coreConfiguratorAnnualStripeUnavailable'))
				return
			}

			await startOnlineCheckout(body, { forceProvider: provider })
		},
		[
			canSubmitPurchaseRequest,
			catalog,
			teamSeats,
			billing,
			stripeStatus,
			p24Status,
			stripeCheckout,
			t,
			showAlert,
			startOnlineCheckout,
			coreConfiguratorPlanKey,
			coreConfiguratorMods,
		]
	)

	const coreConfiguratorPayDisabled = useMemo(() => {
		const planKey = coreConfiguratorPlanKey
		const mods = coreConfiguratorMods
		const cycle = billing === 'monthly' ? 'monthly' : 'annual'
		const tier = catalog?.tiers?.find(t => t.id === planKey)
		const seatBlocked = teamSeats != null && tier && teamSeats > tier.maxUsers
		const baseBusy = !canSubmitPurchaseRequest || onlineStatusLoading || seatBlocked || p24BusyKey !== null

		const body = { kind: 'plan', planKey, billingCycle: cycle }
		const stripeMapped = hasStripeMappingForBody(stripeStatus, body)
		const stripeReadyPlan = stripeStatus?.ready === true && stripeMapped
		const p24Ready = p24Status?.ready === true
		const anyOnline = p24Ready || stripeMapped

		let stripeDisabled = baseBusy
		let p24Disabled = baseBusy

		if (mods.length > 0) {
			const compositeIds = collectPriceIdsForStripeCheckout(stripeStatus, planKey, cycle, mods)
			const compositeOk =
				Boolean(compositeIds) &&
				stripeStatus?.ready === true &&
				stripeMapsAllPriceIds(stripeStatus, compositeIds)
			stripeDisabled = baseBusy || !compositeOk
			p24Disabled = baseBusy || !p24Ready
		} else if (cycle === 'annual') {
			stripeDisabled = true
			p24Disabled = baseBusy || (anyOnline && !p24Ready)
		} else {
			stripeDisabled = baseBusy || (anyOnline && !stripeReadyPlan)
			p24Disabled = baseBusy || (anyOnline && !p24Ready)
		}

		return { stripeDisabled, p24Disabled }
	}, [
		coreConfiguratorPlanKey,
		coreConfiguratorMods,
		billing,
		catalog,
		teamSeats,
		canSubmitPurchaseRequest,
		onlineStatusLoading,
		p24BusyKey,
		stripeStatus,
		p24Status,
	])

	useEffect(() => {
		if (p24ReturnHandledRef.current) return
		if (searchParams.get('p24') !== '1') return
		p24ReturnHandledRef.current = true
		queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		void showAlert(t('billingPackages.p24ReturnHint'))
		navigate('/packages', { replace: true })
	}, [searchParams, navigate, queryClient, showAlert, t])

	useEffect(() => {
		if (stripeReturnHandledRef.current) return
		if (searchParams.get('stripe') !== 'success') return
		stripeReturnHandledRef.current = true
		queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		queryClient.invalidateQueries({ queryKey: BILLING_STRIPE_CARD_QUERY_KEY })
		navigate('/packages', { replace: true })
	}, [searchParams, navigate, queryClient])

	useEffect(() => {
		if (!catalog || appliedQueryRef.current || isCheckingAuth || onlineStatusLoading) return
		if (!canSubmitPurchaseRequest) {
			if (searchParams.get('plan')) appliedQueryRef.current = true
			return
		}
		let plan = searchParams.get('plan')
		if (plan === 'starter') plan = 'base_s'
		const bill = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly'
		if (plan === 'addon') {
			const addonId = searchParams.get('addon')
			if (addonId && catalog.addons?.some(a => a.id === addonId)) {
				const body = { kind: 'addon', addonId }
				const canOnline = p24Status?.ready
				appliedQueryRef.current = true
				setNote('')
				if (canOnline) {
					void startOnlineCheckout(body)
				} else {
					setModal({ kind: 'addon', addonId })
				}
			}
			return
		}
		if (plan && ['base_s', 'base_m', 'base_l'].includes(plan)) {
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
			const modulesFiltered = parseModulesFromSearchParams(searchParams, catalog)
			const checkoutNow = searchParams.get('checkout') === '1'
			appliedQueryRef.current = true
			setBilling(bill)
			setNote('')
			setCoreConfiguratorPlanKey(plan)
			setCoreConfiguratorMods(modulesFiltered)
			if (
				checkoutNow &&
				corePlanCheckoutAvailableFromUrl(stripeStatus, p24Status, plan, bill, modulesFiltered)
			) {
				const body = {
					kind: 'plan',
					planKey: plan,
					billingCycle: bill,
					...(modulesFiltered.length ? { moduleKeys: modulesFiltered } : {}),
				}
				requestPlanOnlineCheckout(body)
				return
			}
			setCoreConfiguratorOpen(true)
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
			const body = { kind: 'plan', planKey: plan, billingCycle: bill }
			const canOnline = p24Status?.ready || hasStripeMappingForBody(stripeStatus, body)
			if (canOnline) {
				requestPlanOnlineCheckout(body)
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
		stripeStatus,
		p24Status,
		onlineStatusLoading,
		requestPlanOnlineCheckout,
		startOnlineCheckout,
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
		if (!(await ensureInvoiceForPurchase())) return
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
	const legacyGraceLastDay =
		ent?.legacy && ent.legacyGrandfatheredActive && ent.legacyGrandfatheredAccessEndsAt
			? formatLegacyGraceLastInclusiveDay(ent.legacyGrandfatheredAccessEndsAt, localeTag)
			: null
	const legacyGrandfatheredUsageStats =
		Boolean(ent?.legacy && ent.legacyGrandfatheredActive) &&
		(ent?.ai?.trialCap != null ||
			ent?.ai?.monthlyIncluded != null ||
			(ent?.ai?.packBalance ?? 0) > 0)

	let currentPlanBody = null
	let stripeCancellationBody = null
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
			if (ent?.stripe?.cancelAtPeriodEnd && ent.billingPeriodEnd) {
				stripeCancellationBody = isPl
					? `Subskrypcja cykliczna jest anulowana na koniec okresu rozliczeniowego (${formatPlanDate(ent.billingPeriodEnd, localeTag)}).`
					: `Recurring subscription is set to cancel at period end (${formatPlanDate(ent.billingPeriodEnd, localeTag)}).`
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

				{ent?.paidPlanSeatLimitExceeded &&
					typeof ent?.maxUsers === 'number' &&
					teamSeats != null &&
					ent?.planKey && (
						<div className="packages-paid-plan-seat-banner" role="alert">
							{canSubmitPurchaseRequest
								? t('billingPackages.paidSeatLimitBannerAdmin', {
										count: teamSeats,
										max: ent.maxUsers,
										plan: TIER_LABELS[ent.planKey] || ent.planKey,
									})
								: t('billingPackages.paidSeatLimitBannerWorker', {
										count: teamSeats,
										max: ent.maxUsers,
										plan: TIER_LABELS[ent.planKey] || ent.planKey,
									})}
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
						{stripeCancellationBody && (
							<p className="packages-current-plan__body">{stripeCancellationBody}</p>
						)}
						{teamSeats != null && (
							<p className="packages-current-plan__seats" role="status">
								{t('billingPackages.teamSeatsInTeam', { count: teamSeats })}
							</p>
						)}
						{ent?.stripe?.canManagePaymentMethod && (
							<div className="packages-stripe-card">
								<p className="packages-stripe-card__heading">{t('billingPackages.stripeRecurringCardHeading')}</p>
								{stripeCardLoading ? (
									<p className="packages-current-plan__body">{t('billingPackages.stripeCardLoading')}</p>
								) : stripeCardPayload?.card?.last4 ? (
									<p className="packages-current-plan__body">
										{t('billingPackages.stripeCardSummary', {
											brand: formatStripeBrandLabel(stripeCardPayload.card.brand, t),
											last4: stripeCardPayload.card.last4,
											expMonth: String(stripeCardPayload.card.expMonth ?? '').padStart(2, '0'),
											expYear: String(stripeCardPayload.card.expYear ?? ''),
										})}
									</p>
								) : (
									<p className="packages-current-plan__body">{t('billingPackages.stripeCardUnknown')}</p>
								)}
								<button
									type="button"
									className="packages-stripe-card__update"
									disabled={stripeBillingPortal.isPending}
									onClick={async () => {
										try {
											const data = await stripeBillingPortal.mutateAsync()
											if (data?.url) window.location.href = data.url
										} catch (e) {
											void showAlert(
												billingAxiosErrorMessage(e, t) || t('billingPackages.stripePortalError')
											)
										}
									}}
								>
									{stripeBillingPortal.isPending
										? t('billingPackages.stripeChangeCardBusy')
										: t('billingPackages.stripeChangeCard')}
								</button>
							</div>
						)}
						{ent?.stripe?.canCancelSubscription && (
							<button
								type="button"
								disabled={stripeCancelSubscription.isPending}
								onClick={() => setCancelStripeModalOpen(true)}
							>
								{stripeCancelSubscription.isPending
									? isPl
										? 'Anulowanie...'
										: 'Cancelling...'
									: isPl
										? 'Anuluj płatność cykliczną'
										: 'Cancel recurring payment'}
							</button>
						)}
					</div>
				)}

				{ent && (
					<div className="packages-usage">
						<h3>{t('billingPackages.usageTitle')}</h3>
						{ent.ai?.unrestricted ? (
							<p className="packages-usage__text">{t('billingPackages.internalUnlimitedAi')}</p>
						) : ent.legacy && ent.legacyGrandfatheredActive ? (
							legacyGrandfatheredUsageStats ? (
								<>
									<p className="packages-usage__text">
										{t('billingPackages.usageLegacyGrandfatheredPooledIntro', {
											date: legacyGraceLastDay || '—',
										})}
									</p>
									<dl className="packages-usage__stats">
										<dt>{t('billingPackages.remaining')}</dt>
										<dd>
											{ent.ai.remainingApprox === Number.POSITIVE_INFINITY ||
											ent.ai.remainingApprox == null
												? '—'
												: String(ent.ai.remainingApprox)}
										</dd>
										{ent.ai.trialCap != null && (
											<>
												<dt>{t('billingPackages.legacyTransitionAiPool')}</dt>
												<dd>
													{Math.max(0, ent.ai.trialCap - (ent.ai.trialUsed || 0))} / {ent.ai.trialCap}
												</dd>
											</>
										)}
										{ent.ai.monthlyIncluded != null && (
											<>
												<dt>{t('billingPackages.monthlyPool')}</dt>
												<dd>
													{Math.max(0, ent.ai.monthlyIncluded - (ent.ai.usedInMonth || 0))} /{' '}
													{ent.ai.monthlyIncluded}
												</dd>
											</>
										)}
										<dt>{t('billingPackages.packBalance')}</dt>
										<dd>{ent.ai.packBalance ?? 0}</dd>
									</dl>
								</>
							) : (
								<p className="packages-usage__text">{t('billingPackages.usageLegacyGrandfathered')}</p>
							)
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

				{(() => {
					const cycle = billing === 'monthly' ? 'monthly' : 'annual'
					const isCorePlanActive =
						activePaid && ent && ['base_s', 'base_m', 'base_l'].includes(ent.planKey)
					const corePb =
						coreMonthlyMinPln != null
							? priceBlock(coreMonthlyMinPln, billing, t, i18n.resolvedLanguage)
							: { main: '—', sub: '' }

					const renderBundleCard = tier => {
						if (!tier) return null
						const isPro = tier.id === 'pro'
						const isCurrentPlan = Boolean(ent && activePaid && ent.planKey === tier.id)
						const planSeatsBlocked = teamSeats != null && teamSeats > tier.maxUsers
						const { main, sub } = priceBlock(tier.monthlyNetPln, billing, t, i18n.resolvedLanguage)
						const planBody = { kind: 'plan', planKey: tier.id, billingCycle: cycle }
						const stripePlanReady = hasStripeMappingForBody(stripeStatus, planBody)
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
								{tier.id === 'pro' && (
									<p className="packages-tier__lead">{t('billingPackages.heroProLead')}</p>
								)}
								{tier.id === 'business' && (
									<p className="packages-tier__lead">{t('billingPackages.heroBusinessLead')}</p>
								)}
								<ul className="packages-tier__features">
									{tier.id === 'pro' ? (
										<>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">
													<strong>{t('billingPackages.proBulletModules')}</strong>
												</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">{t('billingPackages.proBulletAi')}</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">{t('billingPackages.proBulletUsers')}</span>
											</li>
										</>
									) : tier.id === 'business' ? (
										<>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">
													<strong>{t('billingPackages.businessBulletModules')}</strong>
												</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">{t('billingPackages.businessBulletAi')}</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">{t('billingPackages.businessBulletUsers')}</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">
													<strong>{t('billingPackages.businessBulletPriority')}</strong>
												</span>
											</li>
											<li className="packages-tier__feature">
												<span className="packages-tier__feature-check" aria-hidden>
													✓
												</span>
												<span className="packages-tier__feature-text">
													<strong>{t('billingPackages.businessBulletIntegrations')}</strong>
												</span>
											</li>
										</>
									) : (
										(() => {
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
										})()
									)}
								</ul>
								<button
									type="button"
									disabled={
										isCurrentPlan ||
										!canSubmitPurchaseRequest ||
										planSeatsBlocked ||
										onlineStatusLoading ||
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
										const body = { kind: 'plan', planKey: tier.id, billingCycle: cycle }
										if (p24Status?.ready || hasStripeMappingForBody(stripeStatus, body)) {
											requestPlanOnlineCheckout(body)
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
									) : onlineStatusLoading ? (
										t('billingPackages.checkingPaymentOptions')
									) : p24Status?.ready || stripePlanReady ? (
										t('billingPackages.payOnlineCta')
									) : (
										t('billingPackages.orderEmail')
									)}
								</button>
							</div>
						)
					}

					return (
						<>
							<div className="packages-grid packages-grid--hero">
								<div
									className={`packages-tier packages-tier--core-summary${
										isCorePlanActive ? ' packages-tier--current' : ''
									}`}
								>
									{isCorePlanActive && (
										<span className="packages-tier__badge packages-tier__badge--current">
											{t('billingPackages.planCurrentBadge')}
										</span>
									)}
									<h3>{t('billingPackages.heroCoreTitle')}</h3>
									<div className="packages-tier__price">
										{t('billingPackages.fromWord')} {corePb.main}
									</div>
									<div className="packages-tier__price-sub">{corePb.sub}</div>
									<p className="packages-tier__lead">{t('billingPackages.heroCoreLead')}</p>
									<ul className="packages-tier__features">
										<li className="packages-tier__feature">
											<span className="packages-tier__feature-check" aria-hidden>
												✓
											</span>
											<span className="packages-tier__feature-text">
												<strong>{t('billingPackages.heroCoreFeat1')}</strong>
											</span>
										</li>
										<li className="packages-tier__feature">
											<span className="packages-tier__feature-check" aria-hidden>
												✓
											</span>
											<span className="packages-tier__feature-text">
												<strong>{t('billingPackages.heroCoreFeat2')}</strong>
											</span>
										</li>
										<li className="packages-tier__feature">
											<span className="packages-tier__feature-check" aria-hidden>
												✓
											</span>
											<span className="packages-tier__feature-text">{t('billingPackages.heroCoreFeat3')}</span>
										</li>
									</ul>
									<p className="packages-tier__hint">{t('billingPackages.heroCoreTeamHint')}</p>
									<button
										type="button"
										className="packages-tier__cta"
										disabled={!canSubmitPurchaseRequest || onlineStatusLoading}
										onClick={() => {
											setCoreConfiguratorPlanKey('base_s')
											setCoreConfiguratorMods([])
											setCoreConfiguratorOpen(true)
										}}
									>
										{t('billingPackages.heroCoreCta')}
									</button>
								</div>

								{renderBundleCard(proTier)}
								{renderBundleCard(businessTier)}
							</div>

							<section className="packages-enterprise-strip" aria-labelledby="packages-enterprise-heading">
								<div className="packages-enterprise-strip__main">
									<h3 id="packages-enterprise-heading">{t('billingPackages.enterpriseStripTitle')}</h3>
									<p className="packages-enterprise-strip__body">{t('billingPackages.enterpriseStripBody')}</p>
								</div>
								<div className="packages-enterprise-strip__cta">
									<button
										type="button"
										className="packages-enterprise-strip__btn"
										onClick={() => navigate('/helpcenter')}
									>
										{t('billingPackages.enterpriseCta')}
									</button>
								</div>
							</section>
						</>
					)
				})()}

				<div className="packages-addons">
					<h3>{t('billingPackages.addonsTitle')}</h3>
					<p className="packages-addons__sub">{t('billingPackages.addonsSubtitle')}</p>
					{ent && !ent.ai?.unrestricted && ent.ai?.canPurchaseAddon === false && (
						<p className="packages-addons__locked">{t('billingPackages.addonsLocked')}</p>
					)}
					{catalog.addons.map(a => {
						const addonLocked =
							!ent || (!ent.ai?.unrestricted && ent.ai?.canPurchaseAddon !== true)
						const orderDisabled =
							addonLocked || !canSubmitPurchaseRequest || onlineStatusLoading || p24BusyKey !== null
						return (
							<div
								key={a.id}
								className={`packages-addon-row${addonLocked ? ' packages-addon-row--locked' : ''}`}
							>
								<div>
									<strong>+{a.messages}</strong>
									<span className="packages-addon-row__price">
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
										const body = { kind: 'addon', addonId: a.id }
										if (p24Status?.ready) {
											void startOnlineCheckout(body)
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
									) : onlineStatusLoading ? (
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
					<section
						id="packages-invoice-section"
						className="packages-invoice-section"
						aria-labelledby="packages-invoice-heading"
					>
						<h3 id="packages-invoice-heading" className="packages-invoice-section__title">
							{t('billingPackages.invoiceSectionTitle')}
						</h3>
						<p className="packages-invoice-section__hint">{t('billingPackages.invoiceSectionHint')}</p>
						<div className="packages-billing-toggle packages-invoice-section__buyer-toggle">
							<span className="packages-billing-toggle__label">{t('billingPackages.invoiceBuyerTypeLabel')}:</span>
							<div
								className="packages-billing-toggle__buttons"
								role="group"
								aria-label={t('billingPackages.invoiceBuyerTypeLabel')}
							>
								<button
									type="button"
									className={invBuyerType === 'company' ? 'is-on' : ''}
									disabled={patchTeamInvoice.isPending}
									onClick={() => {
										invoiceEditedByUserRef.current = true
										setInvBuyerType('company')
									}}
								>
									{t('billingPackages.invoiceBuyerCompany')}
								</button>
								<button
									type="button"
									className={invBuyerType === 'individual' ? 'is-on' : ''}
									disabled={patchTeamInvoice.isPending}
									onClick={() => {
										invoiceEditedByUserRef.current = true
										setInvBuyerType('individual')
									}}
								>
									{t('billingPackages.invoiceBuyerIndividual')}
								</button>
							</div>
						</div>
						<div className="packages-invoice-section__grid">
							{invBuyerType === 'company' ? (
								<>
									<label className="packages-invoice-section__field">
										<span className="packages-invoice-section__label">{t('billingPackages.invoiceCompany')}</span>
										<input
											type="text"
											value={compName}
											onChange={e => {
												invoiceEditedByUserRef.current = true
												setCompName(e.target.value)
											}}
											autoComplete="organization"
											disabled={patchTeamInvoice.isPending}
										/>
									</label>
									<label className="packages-invoice-section__field packages-invoice-section__field--wide">
										<span className="packages-invoice-section__label">{t('billingPackages.invoiceAddress')}</span>
										<textarea
											rows={3}
											value={compAddress}
											onChange={e => {
												invoiceEditedByUserRef.current = true
												setCompAddress(e.target.value)
											}}
											disabled={patchTeamInvoice.isPending}
										/>
									</label>
									<label className="packages-invoice-section__field">
										<span className="packages-invoice-section__label-inline">
											<span className="packages-invoice-section__label">{t('billingPackages.invoiceNip')}</span>
											<span className="packages-invoice-section__nip-hint">{t('billingPackages.invoiceNipHint')}</span>
										</span>
										<input
											type="text"
											value={compNip}
											onChange={e => {
												invoiceEditedByUserRef.current = true
												setCompNip(e.target.value)
											}}
											autoComplete="off"
											inputMode="numeric"
											disabled={patchTeamInvoice.isPending}
										/>
									</label>
								</>
							) : (
								<>
									<label className="packages-invoice-section__field">
										<span className="packages-invoice-section__label">{t('billingPackages.invoiceFullName')}</span>
										<input
											type="text"
											value={indName}
											onChange={e => {
												invoiceEditedByUserRef.current = true
												setIndName(e.target.value)
											}}
											autoComplete="name"
											disabled={patchTeamInvoice.isPending}
										/>
									</label>
									<label className="packages-invoice-section__field packages-invoice-section__field--wide">
										<span className="packages-invoice-section__label">{t('billingPackages.invoiceAddress')}</span>
										<textarea
											rows={3}
											value={indAddress}
											onChange={e => {
												invoiceEditedByUserRef.current = true
												setIndAddress(e.target.value)
											}}
											disabled={patchTeamInvoice.isPending}
										/>
									</label>
								</>
							)}
						</div>
						<button
							type="button"
							className="packages-invoice-section__save"
							disabled={patchTeamInvoice.isPending}
							onClick={async () => {
								try {
									const type = invBuyerType === 'individual' ? 'individual' : 'company'
									if (type === 'individual') {
										const n = indName.trim()
										const a = indAddress.trim()
										if (n.length < 3 || a.length < MIN_INVOICE_ADDRESS_LEN) {
											await showAlert(t('billingPackages.invoiceRequiredBeforePay'))
											return
										}
										await patchTeamInvoice.mutateAsync({
											buyerType: 'individual',
											companyName: indName,
											address: indAddress,
											nip: '',
										})
									} else {
										const nipDigits = compNip.replace(/\D/g, '')
										if (nipDigits.length !== 10) {
											await showAlert(t('billingPackages.invoiceNipInvalid10'))
											return
										}
										if (
											compName.trim().length < 2 ||
											compAddress.trim().length < MIN_INVOICE_ADDRESS_LEN
										) {
											await showAlert(t('billingPackages.invoiceRequiredBeforePay'))
											return
										}
										await patchTeamInvoice.mutateAsync({
											buyerType: 'company',
											companyName: compName,
											address: compAddress,
											nip: compNip,
										})
									}
									invoiceEditedByUserRef.current = false
									await showAlert(t('billingPackages.invoiceSaved'))
								} catch (e) {
									await showAlert(
										billingAxiosErrorMessage(e, t) ||
											e?.response?.data?.message ||
											e?.message ||
											t('billingPackages.p24PayError')
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

			{coreConfiguratorOpen && (
				<div
					className="packages-modal-overlay packages-modal-overlay--scroll"
					role="dialog"
					aria-labelledby="core-configurator-title"
					aria-modal="true"
					onClick={() => setCoreConfiguratorOpen(false)}
				>
					<div className="packages-modal packages-modal--wide" onClick={e => e.stopPropagation()}>
						<h4 id="core-configurator-title">{t('billingPackages.coreConfiguratorTitle')}</h4>
						<p className="packages-modal__fallback-intro packages-modal__fallback-intro--compact">
							{t('billingPackages.coreConfiguratorHint')}
						</p>
						<div className="packages-core-step">
							<div className="packages-core-step__head">
								<span className="packages-core-step__num" aria-hidden>
									1
								</span>
								<p className="packages-core-step__title">{t('billingPackages.coreConfiguratorStep1Title')}</p>
							</div>
							<fieldset className="packages-core-fieldset">
								<legend className="packages-core-legend packages-core-legend--vh">
									{t('billingPackages.coreConfiguratorStep1Title')}
								</legend>
								{coreTierList.map(ct => (
									<label key={ct.id} className="packages-core-radio">
										<input
											type="radio"
											name="corePlan"
											checked={coreConfiguratorPlanKey === ct.id}
											onChange={() => setCoreConfiguratorPlanKey(ct.id)}
										/>
										<span>
											{t('billingPackages.coreConfiguratorSeatShort', {
												maxUsers: ct.maxUsers,
											})}
										</span>
									</label>
								))}
							</fieldset>
						</div>
						{hasCoreOptionalModules && (
							<div className="packages-core-step">
								<div className="packages-core-step__head">
									<span className="packages-core-step__num" aria-hidden>
										2
									</span>
									<p className="packages-core-step__title">{t('billingPackages.coreConfiguratorStep2Title')}</p>
								</div>
								<fieldset className="packages-core-fieldset">
									<legend className="packages-core-legend packages-core-legend--vh">
										{t('billingPackages.coreConfiguratorStep2Title')}
									</legend>
									{catalog.modules.map(m => (
										<label key={m.id} className="packages-core-check">
											<input
												type="checkbox"
												checked={coreConfiguratorMods.includes(m.id)}
												onChange={() => {
													setCoreConfiguratorMods(prev =>
														prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
													)
												}}
											/>
											<span>
												{MODULE_LABELS[m.id] || m.id}
												{m.monthlyNetPln != null ? ` (+${m.monthlyNetPln} PLN)` : ''}
											</span>
										</label>
									))}
								</fieldset>
								<p className="packages-core-module-footnote" role="note">
									{t('billingPackages.coreConfiguratorAiModuleFootnote')}
								</p>
							</div>
						)}
						<div className="packages-core-step packages-core-step--summary">
							<div className="packages-core-step__head">
								<span className="packages-core-step__num" aria-hidden>
									{coreConfiguratorSummaryStepNum}
								</span>
								<p className="packages-core-step__title">{t('billingPackages.coreConfiguratorStep3Title')}</p>
							</div>
							<div className="packages-core-total" role="status">
								<div className="packages-core-total__row">
									<strong>{t('billingPackages.coreConfiguratorTotalEmphasis')}</strong>{' '}
									<span className="packages-core-total__amount">
										{coreConfiguratorPriceDisplay.main}
									</span>
									{billing === 'monthly' && (
										<span className="packages-core-total-note">
											{' '}
											{coreConfiguratorPriceDisplay.sub}
										</span>
									)}
								</div>
								{billing === 'annual' && (
									<p className="packages-core-total-annual-note">{coreConfiguratorPriceDisplay.sub}</p>
								)}
							</div>
							{coreUpsellVsPro && (
								<div className="packages-core-upsell" role="status">
									{t('billingPackages.coreUpsellPro', { proPrice: proTier?.monthlyNetPln ?? 239 })}
								</div>
							)}
						</div>
						<div className="packages-modal__actions packages-modal__actions--stack packages-modal__actions--pay">
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--primary"
								disabled={coreConfiguratorPayDisabled.stripeDisabled}
								onClick={() => void executeCoreCheckout('stripe')}
							>
								{t('billingPackages.coreConfiguratorPayCard')}
							</button>
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--secondary"
								disabled={coreConfiguratorPayDisabled.p24Disabled}
								onClick={() => void executeCoreCheckout('p24')}
							>
								{t('billingPackages.coreConfiguratorPayP24')}
							</button>
							{coreUpsellVsPro && proTier && (
								<button
									type="button"
									className="packages-pay-btn packages-pay-btn--upsell"
									onClick={() => {
										setCoreConfiguratorOpen(false)
										setJustSent(false)
										setNote('')
										const billCycle = billing === 'monthly' ? 'monthly' : 'annual'
										const body = { kind: 'plan', planKey: 'pro', billingCycle: billCycle }
										if (p24Status?.ready || hasStripeMappingForBody(stripeStatus, body)) {
											requestPlanOnlineCheckout(body)
										} else {
											setModal({ kind: 'plan', planKey: 'pro', billingCycle: billCycle })
										}
									}}
								>
									{t('billingPackages.coreUpsellProCta')}
								</button>
							)}
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--ghost"
								onClick={() => setCoreConfiguratorOpen(false)}
							>
								{modalLabels.cancel}
							</button>
						</div>
						<p className="packages-core-payment-footnote" role="note">
							{t('billingPackages.coreConfiguratorPayFootnote')}
						</p>
					</div>
				</div>
			)}

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
			{paymentChoiceModal && (
				<div
					className="packages-modal-overlay"
					role="dialog"
					aria-modal="true"
					onClick={() => setPaymentChoiceModal(null)}
				>
					<div className="packages-modal" onClick={e => e.stopPropagation()}>
						<h4>{t('billingPackages.paymentChoiceTitle')}</h4>
						<p className="packages-modal__fallback-intro packages-modal__fallback-intro--compact">
							{t('billingPackages.paymentChoiceIntro')}
						</p>
						<div className="packages-modal__actions packages-modal__actions--stack packages-modal__actions--pay">
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--primary"
								onClick={() => {
									const body = paymentChoiceModal
									setPaymentChoiceModal(null)
									void startOnlineCheckout(body, { forceProvider: 'stripe' })
								}}
							>
								{t('billingPackages.paymentChoiceStripeBtn')}
							</button>
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--secondary"
								onClick={() => {
									const body = paymentChoiceModal
									setPaymentChoiceModal(null)
									void startOnlineCheckout(body, { forceProvider: 'p24' })
								}}
							>
								{t('billingPackages.paymentChoiceP24Btn')}
							</button>
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--ghost"
								onClick={() => setPaymentChoiceModal(null)}
							>
								{modalLabels.cancel}
							</button>
						</div>
					</div>
				</div>
			)}
			{cancelStripeModalOpen && (
				<div
					className="packages-modal-overlay"
					role="dialog"
					aria-modal="true"
					onClick={() => !stripeCancelSubscription.isPending && setCancelStripeModalOpen(false)}
				>
					<div className="packages-modal" onClick={e => e.stopPropagation()}>
						<h4>
							{isPl ? 'Potwierdź anulowanie subskrypcji' : 'Confirm subscription cancellation'}
						</h4>
						<p
							className="packages-modal__fallback-intro"
							style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.9rem' }}
						>
							{isPl
								? 'Czy na pewno anulować subskrypcję cykliczną na koniec bieżącego okresu?'
								: 'Cancel recurring subscription at the end of the current period?'}
						</p>
						<div className="packages-modal__actions">
							<button
								type="button"
								onClick={() => setCancelStripeModalOpen(false)}
								disabled={stripeCancelSubscription.isPending}
							>
								{isPl ? 'Nie, zostaw subskrypcję' : 'No, keep subscription'}
							</button>
							<button
								type="button"
								className="primary"
								disabled={stripeCancelSubscription.isPending}
								aria-busy={stripeCancelSubscription.isPending}
								onClick={async () => {
									try {
										await stripeCancelSubscription.mutateAsync()
										setCancelStripeModalOpen(false)
										await showAlert(
											isPl
												? 'Subskrypcja została ustawiona do anulowania na koniec okresu rozliczeniowego.'
												: 'Subscription has been set to cancel at period end.'
										)
										queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
									} catch (e) {
										await showAlert(
											billingAxiosErrorMessage(e, t) ||
												e?.response?.data?.message ||
												e?.message ||
												(isPl ? 'Nie udało się anulować subskrypcji.' : 'Could not cancel subscription.')
										)
									}
								}}
							>
								{stripeCancelSubscription.isPending
									? isPl
										? 'Anulowanie...'
										: 'Cancelling...'
									: isPl
										? 'Tak, anuluj'
										: 'Yes, cancel'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
