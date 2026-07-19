const mongoose = require('mongoose')
const Stripe = require('stripe')
const { firmDb } = require('../../db/db')
const BillingLedgerEntry = require('../../models/BillingLedgerEntry')(firmDb)
const Team = require('../../models/Team')(firmDb)
const {
	validateBillingPurchaseIntent,
	validateStripeSubscriptionCheckout,
} = require('../billingPurchaseIntentValidator')
const billingActivationService = require('../billingActivationService')
const { syncSeatLimitAfterStripePaidInvoice } = require('../billingPlanSeatLimitService')
const { getStripeConfig } = require('./stripeConfig')
const { getStripePriceDefinition } = require('./stripePriceMapService')
const {
	stripeId,
	requireConsistentValue,
	resolveInvoiceSubscriptionId,
	resolvePlanAndPeriodFromInvoice,
	resolveSubscriptionPeriodEndSeconds,
} = require('./stripeBillingPayloadCompatibility')
const { isPaidPlanKey, normalizePaidPlanKey, isCorePlanKey, isModuleKey } = require('../../constants/planCatalog')
const entitlementsService = require('../entitlementsService')

let stripeClient = null
let stripeClientKey = ''

function throwStripeNotConfigured(detail) {
	console.error('[stripe]', detail)
	const err = new Error('Stripe is not configured')
	err.code = 'STRIPE_NOT_CONFIGURED'
	throw err
}

function getStripeClient() {
	const cfg = getStripeConfig()
	if (!cfg.credsOk) {
		throwStripeNotConfigured('STRIPE_SECRET_KEY is not configured')
	}
	if (!stripeClient || stripeClientKey !== cfg.secretKey) {
		stripeClient = new Stripe(cfg.secretKey)
		stripeClientKey = cfg.secretKey
	}
	return stripeClient
}

function assertStripeWebhookReady() {
	const cfg = getStripeConfig()
	if (!cfg.webhookOk) {
		throwStripeNotConfigured('STRIPE_WEBHOOK_SECRET is not configured')
	}
}

function safeObjectId(v) {
	return mongoose.Types.ObjectId.isValid(v) ? String(v) : null
}

function periodEndIsoFromUnixSeconds(sec) {
	const n = Number(sec)
	if (!Number.isFinite(n) || n <= 0) return null
	return new Date(n * 1000).toISOString()
}

function eventSeenKey(eventId) {
	return `stripe:event:${eventId}`
}

function invoiceSeenKey(invoiceId) {
	return `stripe:invoice:${invoiceId}`
}

function checkoutActivationKey(sessionId) {
	return `stripe:checkout:${sessionId}:activation`
}

function subscriptionPeriodEndIso(subscription) {
	return periodEndIsoFromUnixSeconds(
		resolveSubscriptionPeriodEndSeconds(subscription, getStripePriceDefinition)
	)
}

function resolvePlanIntentFromSubscriptionMetadata(metadata = {}) {
	const planKey = String(metadata.planKey || '').trim()
	const billingCycle = String(metadata.billingCycle || '').trim()
	if (!isPaidPlanKey(planKey)) return null
	if (billingCycle !== 'monthly' && billingCycle !== 'annual') return null
	return { planKey, billingCycle }
}

function parseModuleKeysMetadataCsv(s) {
	if (s == null || s === '') return []
	return String(s)
		.split(',')
		.map(x => x.trim())
		.filter(k => isModuleKey(k))
}

function mergeModuleKeysArrays(...arrays) {
	const set = new Set()
	for (const arr of arrays) {
		if (!Array.isArray(arr)) continue
		for (const k of arr) {
			if (isModuleKey(k)) set.add(k)
		}
	}
	return [...set]
}

function collectModuleKeysFromStripeSubscription(subscription) {
	const set = new Set()
	const metadata = subscription?.metadata || {}
	if (metadata.moduleKeys) {
		parseModuleKeysMetadataCsv(metadata.moduleKeys).forEach(k => set.add(k))
	}
	for (const item of subscription?.items?.data || []) {
		const pid = item.price?.id
		if (!pid) continue
		try {
			const def = getStripePriceDefinition(pid)
			if (def.kind === 'module') set.add(def.moduleKey)
		} catch (_) {
			// ignore unknown price ids (np. brak wpisu w STRIPE_PRICE_MAP_JSON na serwerze)
		}
	}
	return [...set].filter(isModuleKey)
}

async function resolveTeamIdFromSubscription(subscription) {
	const candidateTeamIds = []
	if (subscription?.metadata?.teamId) {
		const metadataTeamId = safeObjectId(subscription.metadata.teamId)
		if (!metadataTeamId) {
			const error = new Error('Invalid Stripe subscription metadata teamId')
			error.code = 'STRIPE_PAYLOAD'
			throw error
		}
		candidateTeamIds.push(metadataTeamId)
	}
	const subscriptionId = stripeId(subscription)
	if (subscriptionId) {
		const teamBySubscription = await Team.findOne({ stripeSubscriptionId: subscriptionId }).select('_id')
		if (teamBySubscription) candidateTeamIds.push(String(teamBySubscription._id))
	}
	const customerId = stripeId(subscription?.customer)
	if (customerId) {
		const teamByCustomer = await Team.findOne({ stripeCustomerId: customerId }).select('_id')
		if (teamByCustomer) candidateTeamIds.push(String(teamByCustomer._id))
	}
	return requireConsistentValue(candidateTeamIds, 'Planopia team ids for Stripe subscription')
}

async function markStripeEvent(teamId, eventId, action, payload = {}) {
	const idempotencyKey = eventSeenKey(eventId)
	const existing = await BillingLedgerEntry.findOne({ idempotencyKey }).select('_id')
	if (existing) return false
	await BillingLedgerEntry.create({
		idempotencyKey,
		teamId,
		action,
		payload,
	})
	return true
}

async function createStripeCheckoutSession(params) {
	const cfg = getStripeConfig()
	if (!cfg.ready) {
		throwStripeNotConfigured(
			'Stripe is not ready (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_APP_PUBLIC_URL)'
		)
	}
	const stripe = getStripeClient()
	const { teamId, userId, priceId, priceIds } = params
	const ids =
		Array.isArray(priceIds) && priceIds.length > 0
			? priceIds.map(String)
			: priceId
				? [String(priceId)]
				: []
	if (!ids.length) {
		const err = new Error('Podaj priceId lub tablicę priceIds.')
		err.code = 'VALIDATION'
		throw err
	}

	const defs = ids.map(id => getStripePriceDefinition(id))
	const hasAddon = defs.some(d => d.kind === 'addon')
	if (hasAddon && defs.length > 1) {
		const err = new Error('Pakietu wiadomości AI nie łącz z innymi pozycjami w jednej sesji.')
		err.code = 'VALIDATION'
		throw err
	}

	if (hasAddon) {
		const stripeDef = defs[0]
		const { team, requester } = await validateBillingPurchaseIntent({
			teamId,
			requestingUserId: userId,
			kind: 'addon',
			addonId: stripeDef.addonId,
		})
		const sessionParams = {
			mode: 'payment',
			success_url: `${cfg.appPublicUrl}/packages?stripe=success`,
			cancel_url: `${cfg.appPublicUrl}/packages?stripe=cancel`,
			client_reference_id: String(team._id),
			customer_email: (team.adminEmail || requester.username || '').trim() || undefined,
			line_items: [{ price: stripeDef.priceId, quantity: 1 }],
			metadata: {
				teamId: String(team._id),
				userId: String(requester._id),
				kind: stripeDef.kind,
				priceId: stripeDef.priceId,
				addonId: stripeDef.addonId || '',
			},
		}
		const session = await stripe.checkout.sessions.create(sessionParams)
		return {
			provider: 'stripe',
			checkoutSessionId: session.id,
			redirectUrl: session.url,
		}
	}

	const { team, requester, planDef, moduleDefs } = await validateStripeSubscriptionCheckout({
		teamId,
		requestingUserId: userId,
		priceDefinitions: defs,
	})

	const moduleKeysJoined = moduleDefs.map(m => m.moduleKey).join(',')
	const line_items = defs.map(d => ({ price: d.priceId, quantity: 1 }))

	team.stripePendingPlanKey = planDef.planKey
	team.stripePendingBillingCycle = planDef.billingCycle
	team.stripePendingModuleKeys = moduleDefs.map(m => m.moduleKey).filter(isModuleKey)
	await team.save()

	const sessionParams = {
		mode: 'subscription',
		success_url: `${cfg.appPublicUrl}/packages?stripe=success`,
		cancel_url: `${cfg.appPublicUrl}/packages?stripe=cancel`,
		client_reference_id: String(team._id),
		customer_email: (team.adminEmail || requester.username || '').trim() || undefined,
		line_items,
		metadata: {
			teamId: String(team._id),
			userId: String(requester._id),
			kind: 'subscription',
			planKey: planDef.planKey,
			billingCycle: planDef.billingCycle,
			moduleKeys: moduleKeysJoined,
			priceIds: ids.join(','),
			planPriceId: planDef.priceId,
		},
		subscription_data: {
			metadata: {
				teamId: String(team._id),
				planKey: planDef.planKey,
				billingCycle: planDef.billingCycle,
				moduleKeys: moduleKeysJoined,
				priceId: planDef.priceId,
			},
		},
	}

	const session = await stripe.checkout.sessions.create(sessionParams)
	return {
		provider: 'stripe',
		checkoutSessionId: session.id,
		redirectUrl: session.url,
	}
}

async function resolveTeamAndPlanFromInvoice(stripe, invoice) {
	const invoiceId = String(invoice.id || '')
	const subscriptionId = resolveInvoiceSubscriptionId(invoice)
	let subscription = null
	if (subscriptionId) {
		subscription = await stripe.subscriptions.retrieve(subscriptionId, {
			expand: ['items.data.price'],
		})
	}

	const initialFacts = resolvePlanAndPeriodFromInvoice({
		invoice,
		subscription,
		teamSnapshot: null,
		getPriceDefinition: getStripePriceDefinition,
	})
	const candidateTeamIds = []
	if (initialFacts.metadataTeamId) {
		const metadataTeamId = safeObjectId(initialFacts.metadataTeamId)
		if (!metadataTeamId) {
			const error = new Error(`Invalid Stripe metadata teamId for invoice ${invoiceId}`)
			error.code = 'STRIPE_PAYLOAD'
			throw error
		}
		candidateTeamIds.push(metadataTeamId)
	}

	const customerId = stripeId(invoice.customer)
	if (customerId) {
		const teamByCustomer = await Team.findOne({ stripeCustomerId: customerId }).select('_id')
		if (teamByCustomer) candidateTeamIds.push(String(teamByCustomer._id))
	}
	if (subscriptionId) {
		const teamBySub = await Team.findOne({ stripeSubscriptionId: subscriptionId }).select('_id')
		if (teamBySub) candidateTeamIds.push(String(teamBySub._id))
	}

	if (!candidateTeamIds.length) {
		const invEmail = String(invoice.customer_email || '').trim().toLowerCase()
		if (invEmail) {
			const teamByEmail = await Team.findOne({ adminEmail: invEmail }).select('_id')
			if (teamByEmail) candidateTeamIds.push(String(teamByEmail._id))
		}
	}
	const teamId = requireConsistentValue(candidateTeamIds, 'Planopia team ids for Stripe invoice')
	if (!teamId) {
		console.warn(`[stripe] invoice.paid skipped: cannot resolve teamId for invoice=${invoiceId}`)
		return null
	}

	const teamSnap = await Team.findById(teamId).select(
		'billingPlanKey billingCycle billingModuleKeys stripeCustomerId stripeSubscriptionId stripePendingPlanKey stripePendingBillingCycle stripePendingModuleKeys'
	)
	if (!teamSnap) {
		const error = new Error(`Team not found for Stripe invoice ${invoiceId}`)
		error.code = 'STRIPE_PAYLOAD'
		throw error
	}
	if (customerId && teamSnap.stripeCustomerId && customerId !== teamSnap.stripeCustomerId) {
		const error = new Error(`Stripe customer does not match team for invoice ${invoiceId}`)
		error.code = 'STRIPE_PAYLOAD'
		throw error
	}
	if (subscriptionId && teamSnap.stripeSubscriptionId && subscriptionId !== teamSnap.stripeSubscriptionId) {
		const error = new Error(`Stripe subscription does not match team for invoice ${invoiceId}`)
		error.code = 'STRIPE_PAYLOAD'
		throw error
	}

	const facts = resolvePlanAndPeriodFromInvoice({
		invoice,
		subscription,
		teamSnapshot: teamSnap,
		getPriceDefinition: getStripePriceDefinition,
	})
	let planKey = facts.planKey
	let billingCycle = facts.billingCycle
	if (!planKey || !billingCycle) {
		const pending = resolvePlanIntentFromSubscriptionMetadata({
			planKey: teamSnap.stripePendingPlanKey,
			billingCycle: teamSnap.stripePendingBillingCycle,
		})
		if (pending) {
			planKey = pending.planKey
			billingCycle = pending.billingCycle
		}
	}
	if (!planKey || !billingCycle) {
		console.warn(`[stripe] invoice.paid skipped: cannot resolve plan intent for invoice=${invoiceId}`)
		return null
	}
	if (facts.usedTeamPlanFallback) {
		const customerMatches = customerId && customerId === teamSnap.stripeCustomerId
		const subscriptionMatches = subscriptionId && subscriptionId === teamSnap.stripeSubscriptionId
		if (!customerMatches && !subscriptionMatches) {
			const error = new Error(`Unsafe team-plan fallback for Stripe invoice ${invoiceId}`)
			error.code = 'STRIPE_PAYLOAD'
			throw error
		}
	}

	const periodEndIso = periodEndIsoFromUnixSeconds(facts.periodEnd)
	if (!periodEndIso) {
		const err = new Error(`Missing period end for Stripe invoice ${invoiceId}`)
		err.code = 'STRIPE_PAYLOAD'
		throw err
	}
	const moduleKeys = mergeModuleKeysArrays(
		facts.moduleKeys,
		collectModuleKeysFromStripeSubscription(subscription),
		teamSnap.stripePendingModuleKeys
	)

	return {
		teamId,
		planKey,
		billingCycle,
		moduleKeys,
		periodEndIso,
		invoiceId,
		subscriptionId: subscriptionId || stripeId(subscription) || '',
	}
}

async function handleCheckoutSessionCompleted(event) {
	const data = event.data?.object || {}
	if (data.mode === 'subscription') {
		let teamId = safeObjectId(data.metadata?.teamId || data.client_reference_id)
		if (!teamId) {
			const email = String(data.customer_email || '').trim().toLowerCase()
			if (email) {
				const teamByEmail = await Team.findOne({ adminEmail: email }).select('_id')
				teamId = teamByEmail ? String(teamByEmail._id) : null
			}
		}
		if (!teamId && data.customer) {
			const teamByCustomer = await Team.findOne({ stripeCustomerId: String(data.customer) }).select('_id')
			teamId = teamByCustomer ? String(teamByCustomer._id) : null
		}
		if (!teamId) return { handled: true, eventType: event.type, skipped: true }
		const marked = await markStripeEvent(teamId, event.id, 'stripe_checkout_completed', {
			sessionId: data.id,
			mode: data.mode,
			subscriptionId: data.subscription || null,
			customerId: data.customer || null,
			customerEmail: data.customer_email || data.customer_details?.email || null,
			planKey: data.metadata?.planKey || null,
			billingCycle: data.metadata?.billingCycle || null,
		})
		if (!marked) return { handled: true, eventType: event.type, duplicate: true }
		const team = await Team.findById(teamId)
		if (team) {
			team.stripeCustomerId = data.customer ? String(data.customer) : team.stripeCustomerId
			team.stripeSubscriptionId = data.subscription ? String(data.subscription) : team.stripeSubscriptionId
			team.stripeSubscriptionStatus = 'active'
			await team.save()
		}

		// Fallback aktywacji gdy invoice.paid przyjdzie później lub mapowanie jest niepełne.
		try {
			if (data.subscription) {
				const stripe = getStripeClient()
				const sub = await stripe.subscriptions.retrieve(String(data.subscription), {
					expand: ['items.data.price'],
				})
				const periodEndIso = subscriptionPeriodEndIso(sub)
				let planKey = null
				let billingCycle = null
				for (const item of sub.items?.data || []) {
					const pid = item.price?.id
					if (!pid) continue
					try {
						const d = getStripePriceDefinition(pid)
						if (d.kind === 'plan') {
							planKey = d.planKey
							billingCycle = d.billingCycle
							break
						}
					} catch (_) {}
				}
				const teamPending = await Team.findById(teamId).select('stripePendingModuleKeys')
				const moduleKeys = mergeModuleKeysArrays(
					collectModuleKeysFromStripeSubscription(sub),
					parseModuleKeysMetadataCsv(data.metadata?.moduleKeys),
					teamPending?.stripePendingModuleKeys
				)
				if (periodEndIso && planKey && billingCycle) {
					await billingActivationService.activatePaidPlan({
						teamId,
						planKey,
						billingCycle,
						periodEnd: periodEndIso,
						idempotencyKey: checkoutActivationKey(data.id),
						actorLabel: 'stripe',
						moduleKeys,
					})
					const tClear = await Team.findById(teamId)
					if (tClear) {
						tClear.stripePendingModuleKeys = undefined
						await tClear.save()
					}
				}
			}
		} catch (e) {
			console.warn('[stripe] checkout.session.completed fallback activation skipped:', e.message)
		}
		return { handled: true, eventType: event.type, duplicate: false }
	}
	if (data.mode !== 'payment' || data.payment_status !== 'paid') {
		return { handled: true, eventType: event.type, skipped: true }
	}
	const teamId = safeObjectId(data.metadata?.teamId)
	if (!teamId) return { handled: true, eventType: event.type, skipped: true }

	const priceId = data.metadata?.priceId
	const stripeDef = getStripePriceDefinition(priceId)
	if (stripeDef.kind !== 'addon') return { handled: true, eventType: event.type, skipped: true }

	await billingActivationService.applyAiAddonPack({
		teamId,
		addonId: stripeDef.addonId,
		idempotencyKey: eventSeenKey(event.id),
		actorLabel: 'stripe',
	})
	return { handled: true, eventType: event.type, duplicate: false }
}

async function handleInvoicePaid(event, stripe) {
	const invoice = event.data?.object || {}
	const resolved = await resolveTeamAndPlanFromInvoice(stripe, invoice)
	if (!resolved) return { handled: true, eventType: event.type, skipped: true }

	/** Kolejna rata subskrypcji — nie blokuj przedłużenia przy nadwyżce miejsc (sync + mail poniżej). */
	const isRenewalCycle = String(invoice.billing_reason || '') === 'subscription_cycle'

	const activation = await billingActivationService.activatePaidPlan({
		teamId: resolved.teamId,
		planKey: resolved.planKey,
		billingCycle: resolved.billingCycle,
		periodEnd: resolved.periodEndIso,
		idempotencyKey: invoiceSeenKey(resolved.invoiceId),
		actorLabel: 'stripe',
		enforceSeatLimit: !isRenewalCycle,
		moduleKeys: resolved.moduleKeys,
	})
	const team = await Team.findById(resolved.teamId)
	if (team) {
		team.stripeCustomerId = stripeId(invoice.customer) || team.stripeCustomerId
		team.stripeSubscriptionId = resolved.subscriptionId || team.stripeSubscriptionId
		team.stripeSubscriptionStatus = 'active'
		team.stripeCancelAtPeriodEnd = false
		team.stripePendingPlanKey = null
		team.stripePendingBillingCycle = null
		team.stripePendingModuleKeys = undefined
		await team.save()
	}

	try {
		await syncSeatLimitAfterStripePaidInvoice(resolved.teamId, resolved.planKey)
	} catch (e) {
		console.error('[stripe] syncSeatLimitAfterStripePaidInvoice:', e.message || e)
	}

	return { handled: true, eventType: event.type, duplicate: activation.duplicate === true }
}

async function handleSubscriptionUpdated(event) {
	const sub = event.data?.object || {}
	const teamId = await resolveTeamIdFromSubscription(sub)
	if (!teamId) return { handled: true, eventType: event.type, skipped: true }
	const currentPeriodEnd = resolveSubscriptionPeriodEndSeconds(sub, getStripePriceDefinition)

	const marked = await markStripeEvent(teamId, event.id, 'stripe_subscription_updated', {
		subscriptionId: sub.id,
		status: sub.status,
		cancelAtPeriodEnd: sub.cancel_at_period_end === true,
		currentPeriodEnd: currentPeriodEnd || null,
	})
	if (!marked) return { handled: true, eventType: event.type, duplicate: true }

	const team = await Team.findById(teamId)
	if (team) {
		team.stripeSubscriptionId = sub.id ? String(sub.id) : team.stripeSubscriptionId
		team.stripeCustomerId = sub.customer ? String(sub.customer) : team.stripeCustomerId
		team.stripeSubscriptionStatus = sub.status || team.stripeSubscriptionStatus
		team.stripeCancelAtPeriodEnd = sub.cancel_at_period_end === true
		const endIso = periodEndIsoFromUnixSeconds(currentPeriodEnd)
		if (endIso) team.billingPeriodEnd = new Date(endIso)
		if (sub.status && sub.status !== 'active' && sub.status !== 'trialing') {
			team.billingStatus = 'inactive'
		}
		if (
			(sub.status === 'active' || sub.status === 'trialing') &&
			isCorePlanKey(normalizePaidPlanKey(team.billingPlanKey))
		) {
			try {
				const stripe = getStripeClient()
				const full = await stripe.subscriptions.retrieve(String(sub.id), {
					expand: ['items.data.price'],
				})
				let keys = collectModuleKeysFromStripeSubscription(full)
				if (!keys.length && team.stripePendingModuleKeys?.length) {
					keys = team.stripePendingModuleKeys.filter(isModuleKey)
				}
				team.billingModuleKeys = keys
			} catch (e) {
				console.warn('[stripe] subscription.updated module sync skipped:', e.message)
			}
		}
		await team.save()
		await entitlementsService.syncTimerEnabledSettingForTeam(teamId)
	}
	return { handled: true, eventType: event.type, duplicate: false }
}

async function handleSubscriptionDeleted(event) {
	const sub = event.data?.object || {}
	const teamId = await resolveTeamIdFromSubscription(sub)
	if (!teamId) return { handled: true, eventType: event.type, skipped: true }

	const marked = await markStripeEvent(teamId, event.id, 'stripe_subscription_deleted', {
		subscriptionId: sub.id,
		status: sub.status,
	})
	if (!marked) return { handled: true, eventType: event.type, duplicate: true }

	const team = await Team.findById(teamId)
	if (team) {
		team.billingStatus = 'inactive'
		team.stripeSubscriptionStatus = sub.status || 'canceled'
		team.stripeCancelAtPeriodEnd = false
		team.stripeSubscriptionId = sub.id ? String(sub.id) : null
		team.stripeCustomerId = sub.customer ? String(sub.customer) : team.stripeCustomerId
		const endIso =
			periodEndIsoFromUnixSeconds(sub.ended_at) ||
			subscriptionPeriodEndIso(sub)
		if (endIso) team.billingPeriodEnd = new Date(endIso)
		await team.save()
	}
	return { handled: true, eventType: event.type, duplicate: false }
}

function summarizeStripeCardFromPaymentMethod(pm) {
	if (!pm || pm.type !== 'card' || !pm.card) return null
	const c = pm.card
	return {
		brand: c.brand ? String(c.brand) : null,
		last4: c.last4 ? String(c.last4) : null,
		expMonth: typeof c.exp_month === 'number' ? c.exp_month : null,
		expYear: typeof c.exp_year === 'number' ? c.exp_year : null,
	}
}

/**
 * Zwraca maskę karty z Stripe (brand, last4, exp) — bez pełnego numeru (Stripe go nie udostępnia).
 */
async function getStripeCardSummaryForTeam(teamId) {
	const team = await Team.findById(teamId)
	if (!team?.stripeCustomerId) {
		return { card: null }
	}
	const stripe = getStripeClient()
	let pm = null

	try {
		const customer = await stripe.customers.retrieve(team.stripeCustomerId, {
			expand: ['invoice_settings.default_payment_method'],
		})
		const def = customer.invoice_settings?.default_payment_method
		if (def && typeof def === 'object' && def.type === 'card') {
			pm = def
		}
	} catch (e) {
		console.error('getStripeCardSummaryForTeam customer:', e.message)
	}

	if (!pm && team.stripeSubscriptionId) {
		try {
			const sub = await stripe.subscriptions.retrieve(String(team.stripeSubscriptionId), {
				expand: ['default_payment_method'],
			})
			const d = sub.default_payment_method
			if (d && typeof d === 'object' && d.type === 'card') {
				pm = d
			}
		} catch (e) {
			console.error('getStripeCardSummaryForTeam subscription:', e.message)
		}
	}

	if (!pm) {
		try {
			const list = await stripe.paymentMethods.list({
				customer: team.stripeCustomerId,
				type: 'card',
				limit: 5,
			})
			const firstCard = list.data.find(x => x.type === 'card')
			if (firstCard) pm = firstCard
		} catch (e) {
			console.error('getStripeCardSummaryForTeam list:', e.message)
		}
	}

	const card = summarizeStripeCardFromPaymentMethod(pm)
	return { card }
}

/**
 * Stripe Customer Portal — aktualizacja karty, anulowanie itd. (konfiguracja w Dashboard → Billing → Customer portal).
 */
async function createStripeBillingPortalSession(teamId) {
	const cfg = getStripeConfig()
	if (!cfg.ready) {
		throwStripeNotConfigured(
			'Stripe is not ready (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_APP_PUBLIC_URL)'
		)
	}
	const stripe = getStripeClient()
	const team = await Team.findById(teamId)
	if (!team) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}
	if (!team.stripeCustomerId) {
		const err = new Error('No saved billing profile for this team')
		err.code = 'VALIDATION'
		throw err
	}
	let session
	try {
		session = await stripe.billingPortal.sessions.create({
			customer: team.stripeCustomerId,
			return_url: `${cfg.appPublicUrl}/packages`,
		})
	} catch (e) {
		console.error('[stripe] billing portal session failed:', e?.message || e)
		const err = new Error('Stripe billing portal is not available')
		err.code = 'STRIPE_PORTAL'
		throw err
	}
	return { url: session.url }
}

async function cancelStripeSubscriptionForTeam(teamId) {
	const stripe = getStripeClient()
	const team = await Team.findById(teamId)
	if (!team) {
		const err = new Error('Team not found')
		err.code = 'NOT_FOUND'
		throw err
	}
	if (!team.stripeSubscriptionId) {
		const err = new Error('No active Stripe subscription to cancel')
		err.code = 'VALIDATION'
		throw err
	}
	const sub = await stripe.subscriptions.update(String(team.stripeSubscriptionId), {
		cancel_at_period_end: true,
	})
	team.stripeSubscriptionStatus = sub.status || team.stripeSubscriptionStatus
	team.stripeCancelAtPeriodEnd = sub.cancel_at_period_end === true
	const endIso = subscriptionPeriodEndIso(sub)
	if (endIso) team.billingPeriodEnd = new Date(endIso)
	await team.save()
	return {
		ok: true,
		subscriptionId: sub.id,
		cancelAtPeriodEnd: sub.cancel_at_period_end === true,
		currentPeriodEnd: endIso,
	}
}

async function handleStripeWebhookEvent(rawBody, signatureHeader) {
	assertStripeWebhookReady()
	const cfg = getStripeConfig()
	const stripe = getStripeClient()
	if (!signatureHeader) {
		const err = new Error('Missing Stripe signature header')
		err.code = 'STRIPE_SIGN'
		throw err
	}
	const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8')
	let event
	try {
		event = stripe.webhooks.constructEvent(payload, signatureHeader, cfg.webhookSecret)
	} catch (e) {
		const err = new Error(`Stripe signature verification failed: ${e.message}`)
		err.code = 'STRIPE_SIGN'
		throw err
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed':
				return handleCheckoutSessionCompleted(event)
			case 'invoice.paid':
				return handleInvoicePaid(event, stripe)
			case 'customer.subscription.updated':
				return handleSubscriptionUpdated(event)
			case 'customer.subscription.deleted':
				return handleSubscriptionDeleted(event)
			default:
				return { handled: true, eventType: event.type, ignored: true }
		}
	} catch (e) {
		if (e.code === 'VALIDATION') {
			e.code = 'STRIPE_PAYLOAD'
		}
		throw e
	}
}

module.exports = {
	createStripeCheckoutSession,
	handleStripeWebhookEvent,
	cancelStripeSubscriptionForTeam,
	getStripeCardSummaryForTeam,
	createStripeBillingPortalSession,
}
