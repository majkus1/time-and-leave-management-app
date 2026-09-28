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
	useBillingP24ConfirmReturn,
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
import PackagesPlanPicker from './PackagesPlanPicker'
import { pricingFromCatalog, recommendPlan } from '../../utils/pricingCalculator'
import { ANNUAL_MONTHS_CHARGED, formatPlanMoney, isEnglishLang } from '../../utils/planPriceFormat'
import { ownedSaleModules, usedSaleModules } from '../../utils/planModules'
import { clearPricingIntent, readPricingIntent } from '../../utils/pricingIntent'
import { paidPlanIdsFromCatalog, paidSubscriptionActive, planChangeByRequest } from '../../utils/billingPlanState'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './PackagesPage.css'

/** Zgodnie z serwerem (billingInvoiceValidation) — min. sensowna długość adresu */
const MIN_INVOICE_ADDRESS_LEN = 6

function isInvoiceCompleteFromEnt(bi) {
	if (!bi) return false
	const type = bi.buyerType === 'individual' ? 'individual' : 'company'
	const name = (bi.companyName || '').trim()
	const addr = (bi.address || '').trim()
	const addrOk = addr.length >= MIN_INVOICE_ADDRESS_LEN
	if (type === 'individual') {
		return name.length >= 3 && addrOk
	}
	const nipDigits = String(bi.nip || '').replace(/\D/g, '')
	return name.length >= 2 && addrOk && nipDigits.length === 10
}

/** Etykieta planu z katalogu API (PL/EN); stary klucz `starter` to Core do 15 osób */
function planLabelFromCatalog(catalog, planKey, resolvedLang) {
	const key = planKey === 'starter' ? 'base_s' : planKey
	const label = catalog?.tiers?.find(t => t.id === key)?.label
	if (!label) return planKey || '—'
	return isEnglishLang(resolvedLang) ? label.en : label.pl
}

function moduleDisplayLabel(catalog, moduleId, resolvedLang) {
	const label = catalog?.modules?.find(m => m.id === moduleId)?.label
	if (!label) return moduleId
	return isEnglishLang(resolvedLang) ? label.en : label.pl
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
	// Serwer odpowiada po polsku — kod mapujemy na tekst w języku interfejsu
	if (d?.code === 'PLAN_CHANGE_REQUIRES_REQUEST') return t('billingPackages.planChangeRequiresRequest')
	return d?.message || error?.message || null
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

const isEnglishResolved = isEnglishLang

function formatStripeBrandLabel(brand, t) {
	const b = String(brand || '').trim().toLowerCase()
	if (!b) return t('billingPackages.stripeCardBrandUnknown')
	return b.charAt(0).toUpperCase() + b.slice(1)
}

/** Cena katalogowa (moduł, pakiet AI): złote albo orientacyjnie USD w zależności od języka. */
function formatCatalogPrice(n, resolvedLang) {
	return formatPlanMoney(n, resolvedLang)
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

function priceBlock(monthlyNet, billing, t, resolvedLang) {
	if (billing === 'monthly') {
		return { main: formatPlanMoney(monthlyNet, resolvedLang), sub: t('billingPackages.netPerMonthShort') }
	}
	const annualTotal = monthlyNet * ANNUAL_MONTHS_CHARGED
	return {
		main: formatPlanMoney(annualTotal / 12, resolvedLang),
		sub: t('billingPackages.annualSummary', { total: formatPlanMoney(annualTotal, resolvedLang) }),
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
	const p24ConfirmReturn = useBillingP24ConfirmReturn()
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
	const paidPlanIds = useMemo(() => paidPlanIdsFromCatalog(catalog), [catalog])
	const planLabel = useCallback(
		key => planLabelFromCatalog(catalog, key, i18n.resolvedLanguage),
		[catalog, i18n.resolvedLanguage]
	)

	const coreTierList = useMemo(() => {
		if (!catalog?.tiers) return []
		return catalog.tiers.filter(t => t.tierType === 'core')
	}, [catalog])

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

	const pickerPricing = useMemo(() => pricingFromCatalog(catalog), [catalog])

	/** Pakiet z tą samą liczbą miejsc, gdy wychodzi taniej albo niewiele drożej niż Core z modułami (reguła kalkulatora) */
	const coreUpsellBundle = useMemo(() => {
		if (!coreConfiguratorMods.length) return null
		const selectedCore = catalog?.tiers?.find(x => x.id === coreConfiguratorPlanKey)
		if (!selectedCore) return null
		const rec = recommendPlan(selectedCore.maxUsers, { leave: true, modules: coreConfiguratorMods }, pickerPricing)
		if (rec.kind !== 'bundle') return null
		if (teamSeats != null && teamSeats > rec.bundle.maxUsers) return null
		return rec.bundle
	}, [catalog, coreConfiguratorPlanKey, coreConfiguratorMods, pickerPricing, teamSeats])

	const pricingIntent = useMemo(() => readPricingIntent(), [])

	/** Podpowiedź kalkulatora: link (plan / moduły / add), wybór z landingu przy rejestracji, obecny plan zespołu */
	const pickerPrefill = useMemo(() => {
		if (!catalog) return null
		const saleIds = pickerPricing.modules.map(m => m.id)
		const needsForPlan = (planKey, mods) => {
			const tier = catalog.tiers?.find(x => x.id === planKey)
			if (tier?.tierType === 'bundle') return { leave: true, modules: [...saleIds] }
			return { leave: true, modules: (mods || []).filter(m => saleIds.includes(m)) }
		}
		const payingNow = ent ? planChangeByRequest(ent, paidPlanIds) : false
		const urlPlan = searchParams.get('plan')
		const urlUsers = Math.floor(Number(searchParams.get('users')))
		let wantedUsers = Number.isFinite(urlUsers) && urlUsers >= 1 ? urlUsers : null
		let needs
		if (urlPlan && catalog.tiers?.some(x => x.id === urlPlan)) {
			needs = needsForPlan(urlPlan, parseModulesFromSearchParams(searchParams, catalog))
		} else if (!payingNow && pricingIntent) {
			needs = pricingIntent.plan
				? needsForPlan(pricingIntent.plan, pricingIntent.modules)
				: { leave: false, modules: pricingIntent.modules.filter(m => saleIds.includes(m)) }
			wantedUsers = wantedUsers ?? pricingIntent.users
		} else if (payingNow) {
			needs = needsForPlan(ent.planKey, usedSaleModules(catalog.modules, ent.modules?.effectiveKeys))
		} else {
			needs = { leave: true, modules: [] }
		}
		const add = searchParams.get('add')
		if (add && saleIds.includes(add) && !needs.modules.includes(add)) {
			needs = { ...needs, leave: true, modules: [...needs.modules, add] }
		}
		// Płacący: próg co najmniej jak obecny plan — kalkulator nie podsuwa tańszego progu wbrew „cena się nie zmienia”
		const currentCapacity = payingNow ? catalog.tiers?.find(x => x.id === ent.planKey)?.maxUsers ?? 1 : 1
		return { users: Math.max(teamSeats ?? 1, wantedUsers ?? 1, currentCapacity), needs }
	}, [catalog, pickerPricing, ent, paidPlanIds, searchParams, pricingIntent, teamSeats])

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
		if (isInvoiceCompleteFromEnt(ent?.billingInvoice)) {
			return true
		}

		const scrollInv = () => {
			requestAnimationFrame(() => {
				document.getElementById('packages-invoice-section')?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				})
			})
		}

		const type = invBuyerType === 'individual' ? 'individual' : 'company'

		if (type === 'individual') {
			const name = indName.trim()
			const addr = indAddress.trim()
			const addrOk = addr.length >= MIN_INVOICE_ADDRESS_LEN
			if (name.length < 3 || !addrOk) {
				await showAlert(t('billingPackages.invoiceRequiredBeforePay'))
				scrollInv()
				return false
			}
			try {
				await patchTeamInvoice.mutateAsync({
					buyerType: 'individual',
					companyName: indName,
					address: indAddress,
					nip: '',
				})
				invoiceEditedByUserRef.current = false
			} catch (e) {
				await showAlert(
					billingAxiosErrorMessage(e, t) ||
						e?.response?.data?.message ||
						e?.message ||
						t('billingPackages.p24PayError')
				)
				return false
			}
			return true
		}

		const nipDigits = compNip.replace(/\D/g, '')
		if (nipDigits.length !== 10) {
			await showAlert(t('billingPackages.invoiceNipInvalid10'))
			scrollInv()
			return false
		}
		const name = compName.trim()
		const addr = compAddress.trim()
		const addrOk = addr.length >= MIN_INVOICE_ADDRESS_LEN
		if (name.length < 2 || !addrOk) {
			await showAlert(t('billingPackages.invoiceRequiredBeforePay'))
			scrollInv()
			return false
		}
		try {
			await patchTeamInvoice.mutateAsync({
				buyerType: 'company',
				companyName: compName,
				address: compAddress,
				nip: compNip,
			})
			invoiceEditedByUserRef.current = false
		} catch (e) {
			await showAlert(
				billingAxiosErrorMessage(e, t) ||
					e?.response?.data?.message ||
					e?.message ||
					t('billingPackages.p24PayError')
			)
			return false
		}
		return true
	}, [
		ent?.billingInvoice,
		invBuyerType,
		indName,
		indAddress,
		compName,
		compAddress,
		compNip,
		patchTeamInvoice,
		t,
		showAlert,
	])

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

	/**
	 * Zespół z opłaconym planem (albo działającą subskrypcją kartą): zamiast płatności prośba mailem — drugi plan online
	 * naliczyłby się obok starego. Opłacony okres przenosimy ręcznie; serwer i tak odmówi płatności (PLAN_CHANGE_REQUIRES_REQUEST).
	 */
	const openPlanChangeRequest = useCallback(
		(planKey, mods) => {
			if (!canSubmitPurchaseRequest) return
			const cycle = billing === 'monthly' ? 'monthly' : 'annual'
			const modules = Array.isArray(mods) ? mods : []
			const lang = i18n.resolvedLanguage
			const from = [planLabel(ent?.planKey), ...usedSaleModules(catalog?.modules, ent?.modules?.effectiveKeys).map(m => moduleDisplayLabel(catalog, m, lang))].join(' + ')
			const to = [planLabel(planKey), ...modules.map(m => moduleDisplayLabel(catalog, m, lang))].join(' + ')
			setJustSent(false)
			setCoreConfiguratorOpen(false)
			setNote(t('billingPackages.changeRequestNote', { from, to }))
			setModal({ kind: 'plan', planKey, billingCycle: cycle, moduleKeys: modules, change: true })
		},
		[canSubmitPurchaseRequest, billing, i18n.resolvedLanguage, planLabel, ent, catalog, t]
	)

	/** Core z kalkulatora albo „Wszystkich planów” — płatność przez konfigurator (karta / BLIK / przelew) */
	const chooseCore = useCallback(
		(planKey, mods) => {
			if (!canSubmitPurchaseRequest) return
			if (planChangeByRequest(ent, paidPlanIds)) {
				openPlanChangeRequest(planKey, mods)
				return
			}
			setJustSent(false)
			setNote('')
			setCoreConfiguratorPlanKey(planKey)
			setCoreConfiguratorMods(Array.isArray(mods) ? mods : [])
			setCoreConfiguratorOpen(true)
		},
		[canSubmitPurchaseRequest, ent, paidPlanIds, openPlanChangeRequest]
	)

	/** Pakiet (PRO / Business) — ta sama ścieżka co dawne karty pakietów */
	const chooseBundle = useCallback(
		async planKey => {
			if (!canSubmitPurchaseRequest || !catalog) return
			const tier = catalog.tiers.find(x => x.id === planKey)
			if (!tier) return
			if (teamSeats != null && teamSeats > tier.maxUsers) {
				await showAlert(t('billingPackages.planSeatLimitExceeded', { used: teamSeats, maxUsers: tier.maxUsers }))
				return
			}
			if (planChangeByRequest(ent, paidPlanIds)) {
				openPlanChangeRequest(planKey, [])
				return
			}
			setJustSent(false)
			setNote('')
			const cycle = billing === 'monthly' ? 'monthly' : 'annual'
			const body = { kind: 'plan', planKey, billingCycle: cycle }
			if (p24Status?.ready || hasStripeMappingForBody(stripeStatus, body)) {
				requestPlanOnlineCheckout(body)
			} else {
				setModal({ kind: 'plan', planKey, billingCycle: cycle })
			}
		},
		[canSubmitPurchaseRequest, catalog, teamSeats, billing, p24Status, stripeStatus, requestPlanOnlineCheckout, showAlert, t, ent, paidPlanIds, openPlanChangeRequest]
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
		const sessionId = searchParams.get('session')
		if (!sessionId) return
		p24ReturnHandledRef.current = true

		const run = async () => {
			try {
				const data = await p24ConfirmReturn.mutateAsync({ sessionId })
				await queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
				if (data?.activated || data?.alreadyPaid) {
					await showAlert(
						isPl
							? 'Płatność potwierdzona — plan został aktywowany.'
							: 'Payment confirmed — your plan is now active.'
					)
				} else if (data?.pending) {
					await showAlert(t('billingPackages.p24ReturnHint'))
				} else {
					await showAlert(t('billingPackages.p24ReturnHint'))
				}
			} catch (e) {
				await showAlert(
					billingAxiosErrorMessage(e, t) ||
						e.response?.data?.message ||
						t('billingPackages.p24ReturnHint')
				)
			}
			navigate('/packages', { replace: true })
		}
		void run()
	}, [searchParams, navigate, queryClient, showAlert, t, isPl, p24ConfirmReturn, billingAxiosErrorMessage])

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
		// Z adresu tylko plany w sprzedaży — Enterprise to wycena indywidualna, nie płatność z linku
		const saleTier = plan ? [...(catalog.coreTiers || []), ...(catalog.bundles || [])].find(x => x.id === plan) : null
		if (!saleTier) {
			if (plan) appliedQueryRef.current = true
			return
		}
		if (!ent) return
		appliedQueryRef.current = true
		// Opłacony plan: adres tylko podpowiada w kalkulatorze, płatność nie rusza (zmiana planu — prośbą)
		if (planChangeByRequest(ent, paidPlanIds)) return
		const seats = typeof ent.teamMemberCount === 'number' ? ent.teamMemberCount : null
		if (seats != null && seats > saleTier.maxUsers) return
		setBilling(bill)
		setNote('')
		if (saleTier.tierType === 'core') {
			// Core z adresu zawsze przez konfigurator: karta tylko z kompletem cen Stripe (plan + moduły), inaczej BLIK / przelew;
			// moduł nieznany w katalogu (stary link) odpada, ale nic nie płaci się samo
			setCoreConfiguratorPlanKey(plan)
			setCoreConfiguratorMods(parseModulesFromSearchParams(searchParams, catalog))
			setCoreConfiguratorOpen(true)
			return
		}
		// Pakiet: płatność rusza sama tylko z checkout=1 (link „mam konto” z kalkulatora na landingu)
		if (searchParams.get('checkout') !== '1') return
		const body = { kind: 'plan', planKey: plan, billingCycle: bill }
		if (p24Status?.ready || hasStripeMappingForBody(stripeStatus, body)) {
			requestPlanOnlineCheckout(body)
		} else {
			setModal({ kind: 'plan', planKey: plan, billingCycle: bill })
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
		paidPlanIds,
	])

	useEffect(() => {
		if (loading || !catalog) return
		if (location.hash !== '#legal-documents') return
		const timer = window.setTimeout(() => {
			document.getElementById('legal-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 150)
		return () => window.clearTimeout(timer)
	}, [loading, catalog, location.hash])

	// Po zakupie podpowiedź z landingu nie jest już potrzebna
	useEffect(() => {
		if (ent && paidSubscriptionActive(ent, paidPlanIds)) clearPricingIntent()
	}, [ent, paidPlanIds])

	// Link z menu (moduł z kłódką) — od razu do kalkulatora
	useEffect(() => {
		if (loading || !searchParams.get('add')) return
		const timer = window.setTimeout(() => {
			document.getElementById('packages-plan-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 150)
		return () => window.clearTimeout(timer)
	}, [loading, searchParams])

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
					...(modal.moduleKeys?.length ? { moduleKeys: modal.moduleKeys } : {}),
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
	const activePaid = ent ? paidSubscriptionActive(ent, paidPlanIds) : false
	const planChangeOnly = planChangeByRequest(ent, paidPlanIds)
	const currentPlanForPicker =
		planChangeOnly && ent
			? {
					planKey: ent.planKey,
					label: planLabel(ent.planKey),
					modules: ownedSaleModules(catalog.modules, ent.modules?.effectiveKeys),
				}
			: null
	const coreIncludedRaw = t('billingPackages.coreIncludedItems', { returnObjects: true })
	const coreIncludedItems = Array.isArray(coreIncludedRaw) ? coreIncludedRaw : []
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

	// Podgląd wyglądu baneru na dev: /packages?previewPaymentFailed=1 (tylko UI, bez zmian w API)
	const previewPaymentFailed =
		import.meta.env.DEV && new URLSearchParams(window.location.search).get('previewPaymentFailed') === '1'
	const stripePaymentPastDue = Boolean(ent?.stripe?.paymentPastDue) || previewPaymentFailed
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
					plan: planLabel(ent.planKey),
					cycle: cycleShort,
				})
			} else {
				currentPlanBody = t('billingPackages.currentPlanPaid', {
					plan: planLabel(ent.planKey),
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
			stripePaymentPastDue &&
			ent.planKey &&
			paidPlanIds.has(ent.planKey) &&
			ent.billingPeriodEnd &&
			new Date(ent.billingPeriodEnd) > new Date()
		) {
			// Nieudane odnowienie kartą — dostęp trwa do końca okresu, plan nie jest „nieaktywny”
			currentPlanBody = t('billingPackages.currentPlanPaymentPastDue', {
				plan: planLabel(ent.planKey),
				until: formatPlanDate(ent.billingPeriodEnd, localeTag),
			})
		} else if (
			ent.billingHadPaidPlan &&
			ent.planKey &&
			paidPlanIds.has(ent.planKey) &&
			!activePaid
		) {
			currentPlanBody = t('billingPackages.currentPlanLapsed', {
				plan: planLabel(ent.planKey),
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

				{stripePaymentPastDue && (
					<div className="packages-payment-failed-banner" role="alert">
						<span>
							{!canSubmitPurchaseRequest
								? t('billingPackages.paymentFailedBannerWorker')
								: t(
										ent?.stripe?.subscriptionStatus === 'unpaid'
											? 'billingPackages.paymentFailedBannerAdminUnpaid'
											: 'billingPackages.paymentFailedBannerAdmin',
										{ until: ent?.billingPeriodEnd ? formatPlanDate(ent.billingPeriodEnd, localeTag) : '—' }
									)}
						</span>
						{canSubmitPurchaseRequest && (ent?.stripe?.canManagePaymentMethod || previewPaymentFailed) && (
							<button
								type="button"
								className="packages-payment-failed-banner__btn"
								disabled={stripeBillingPortal.isPending}
								onClick={async () => {
									try {
										const data = await stripeBillingPortal.mutateAsync()
										if (data?.url) window.location.href = data.url
									} catch (e) {
										void showAlert(billingAxiosErrorMessage(e, t) || t('billingPackages.stripePortalError'))
									}
								}}
							>
								{stripeBillingPortal.isPending
									? t('billingPackages.stripeChangeCardBusy')
									: t('billingPackages.stripeChangeCard')}
							</button>
						)}
					</div>
				)}

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
										plan: planLabel(ent.planKey),
									})
								: t('billingPackages.paidSeatLimitBannerWorker', {
										count: teamSeats,
										max: ent.maxUsers,
										plan: planLabel(ent.planKey),
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
						) : ent.ai?.fairUse ? (
							<p className="packages-usage__text">
								{ent.ai.hasAccess
									? t('billingPackages.aiUnlimitedUsage', { n: ent.ai.usedInMonth || 0 })
									: t('billingPackages.aiFairUseReached')}
							</p>
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
						) : !((ent.ai?.packBalance ?? 0) > 0) ? (
							<p className="packages-usage__text">{t('billingPackages.aiNotInPlan')}</p>
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

				<PackagesPlanPicker
					catalog={catalog}
					billing={billing}
					onBillingChange={setBilling}
					teamSeats={teamSeats}
					currentPlan={currentPlanForPicker}
					prefill={pickerPrefill}
					canBuy={canSubmitPurchaseRequest}
					canContact={isAdmin(role)}
					changeByRequest={planChangeOnly}
					busy={onlineStatusLoading || p24BusyKey !== null}
					busyPlanKey={p24BusyKey?.startsWith('plan:') ? p24BusyKey.slice(5) : null}
					planLabel={planLabel}
					onChooseCore={chooseCore}
					onChooseBundle={chooseBundle}
					onContact={() => navigate('/helpcenter')}
				/>

				<section className="packages-enterprise-strip" aria-labelledby="packages-enterprise-heading">
					<div className="packages-enterprise-strip__main">
						<h3 id="packages-enterprise-heading">{t('billingPackages.enterpriseStripTitle')}</h3>
						<p className="packages-enterprise-strip__body">{t('billingPackages.enterpriseStripBody')}</p>
					</div>
					<div className="packages-enterprise-strip__cta">
						{isAdmin(role) && (
							<button
								type="button"
								className="packages-enterprise-strip__btn"
								onClick={() => navigate('/helpcenter')}
							>
								{t('billingPackages.enterpriseCta')}
							</button>
						)}
					</div>
				</section>

				{catalog.addons?.length > 0 && (
				<div className="packages-addons">
					<h3>
						<span className="packages-addons__icon" aria-hidden="true" />
						{t('billingPackages.addonsTitle')}
					</h3>
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
				)}

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
						<div className="packages-modal__header">
							<h4 id="core-configurator-title" className="packages-modal__title">
								{t('billingPackages.coreConfiguratorTitle')}
							</h4>
							<button
								type="button"
								className="packages-modal__close"
								aria-label={t('billingPackages.modalCloseAriaLabel')}
								onClick={() => setCoreConfiguratorOpen(false)}
							>
								×
							</button>
						</div>
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
									<p className="packages-core-modules-group-label">
										{t('billingPackages.coreConfiguratorIncludedLabel')}
									</p>
									{coreIncludedItems.map(item => (
										<label key={item} className="packages-core-check packages-core-check--included">
											<input type="checkbox" checked disabled readOnly />
											<span>{item}</span>
											<span className="packages-core-included-badge">
												{t('billingPackages.coreConfiguratorIncludedBadge')}
											</span>
										</label>
									))}
									<p className="packages-core-modules-group-label packages-core-modules-group-label--optional">
										{t('billingPackages.coreConfiguratorOptionalLabel')}
									</p>
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
												{moduleDisplayLabel(catalog, m.id, i18n.resolvedLanguage)}
												{m.monthlyNetPln != null
													? ` (+${formatCatalogPrice(m.monthlyNetPln, i18n.resolvedLanguage)})`
													: ''}
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
							{coreUpsellBundle && (
								<div className="packages-core-upsell" role="status">
									{t('billingPackages.coreUpsellBundle', {
										plan: planLabel(coreUpsellBundle.planKey),
										price: priceBlock(coreUpsellBundle.monthlyNetPln, billing, t, i18n.resolvedLanguage).main,
									})}
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
							<p className="packages-pay-note" role="note">
								{t('billingPackages.stripeRecurringHint')}
							</p>
							<button
								type="button"
								className="packages-pay-btn packages-pay-btn--secondary"
								disabled={coreConfiguratorPayDisabled.p24Disabled}
								onClick={() => void executeCoreCheckout('p24')}
							>
								{t('billingPackages.coreConfiguratorPayP24')}
							</button>
							<p className="packages-pay-note" role="note">
								{t('billingPackages.p24OneTimeHint')}
							</p>
							{coreUpsellBundle && (
								<button
									type="button"
									className="packages-pay-btn packages-pay-btn--upsell"
									onClick={() => {
										setCoreConfiguratorOpen(false)
										void chooseBundle(coreUpsellBundle.planKey)
									}}
								>
									{t('billingPackages.coreUpsellBundleCta', { plan: planLabel(coreUpsellBundle.planKey) })}
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
								? `${[planLabel(modal.planKey), ...(modal.moduleKeys || []).map(m => moduleDisplayLabel(catalog, m, i18n.resolvedLanguage))].join(' + ')} · ${modal.billingCycle === 'annual' ? t('billingPackages.billingAnnual') : t('billingPackages.billingMonthly')}`
								: `AI +${catalog.addons.find(x => x.id === modal.addonId)?.messages ?? modal.addonId}`}
						</h4>
						<p className="packages-modal__fallback-intro" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>
							{modal.change ? t('billingPackages.changeRequestIntro') : t('billingPackages.emailOrderFallbackIntro')}
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
					aria-labelledby="payment-choice-title"
					aria-modal="true"
					onClick={() => setPaymentChoiceModal(null)}
				>
					<div className="packages-modal" onClick={e => e.stopPropagation()}>
						<div className="packages-modal__header">
							<h4 id="payment-choice-title" className="packages-modal__title">
								{t('billingPackages.paymentChoiceTitle')}
							</h4>
							<button
								type="button"
								className="packages-modal__close"
								aria-label={t('billingPackages.modalCloseAriaLabel')}
								onClick={() => setPaymentChoiceModal(null)}
							>
								×
							</button>
						</div>
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
							<p className="packages-pay-note" role="note">
								{t('billingPackages.stripeRecurringHint')}
							</p>
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
							<p className="packages-pay-note" role="note">
								{t('billingPackages.p24OneTimeHint')}
							</p>
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
