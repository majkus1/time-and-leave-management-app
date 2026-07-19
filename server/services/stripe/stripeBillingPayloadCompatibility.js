const { isPaidPlanKey, isModuleKey } = require('../../constants/planCatalog')

function stripeId(value) {
	if (typeof value === 'string') return value.trim() || null
	if (value && typeof value === 'object' && typeof value.id === 'string') {
		return value.id.trim() || null
	}
	return null
}

function payloadError(message) {
	const error = new Error(message)
	error.code = 'STRIPE_PAYLOAD'
	return error
}

function uniqueValues(values) {
	return [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))]
}

function requireConsistentValue(values, label) {
	const unique = uniqueValues(values)
	if (unique.length > 1) {
		throw payloadError(`Conflicting ${label}: ${unique.join(', ')}`)
	}
	return unique[0] || null
}

function invoiceLines(invoice) {
	return Array.isArray(invoice?.lines?.data) ? invoice.lines.data : []
}

function collectInvoiceSubscriptionIds(invoice) {
	return uniqueValues([
		stripeId(invoice?.subscription),
		stripeId(invoice?.parent?.subscription_details?.subscription),
		...invoiceLines(invoice).map(line =>
			stripeId(line?.parent?.subscription_item_details?.subscription)
		),
	])
}

function resolveInvoiceSubscriptionId(invoice) {
	return requireConsistentValue(collectInvoiceSubscriptionIds(invoice), 'Stripe subscription ids')
}

function collectMetadataSources(invoice, subscription) {
	const sources = []
	if (subscription?.metadata) sources.push(subscription.metadata)
	if (invoice?.parent?.subscription_details?.metadata) {
		sources.push(invoice.parent.subscription_details.metadata)
	}
	for (const line of invoiceLines(invoice)) {
		if (line?.metadata) sources.push(line.metadata)
	}
	if (invoice?.metadata) sources.push(invoice.metadata)
	return sources
}

function metadataValue(sources, key) {
	return requireConsistentValue(
		sources.map(source => source?.[key]),
		`Stripe metadata ${key}`
	)
}

function parseModuleKeys(value) {
	if (value == null || value === '') return []
	return String(value)
		.split(',')
		.map(key => key.trim())
		.filter(isModuleKey)
}

function periodSeconds(value) {
	const parsed = Number(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function linePriceId(line) {
	return (
		stripeId(line?.pricing?.price_details?.price) ||
		stripeId(line?.price) ||
		stripeId(line?.metadata?.priceId)
	)
}

function collectPriceRefs(invoice, subscription) {
	const refs = []
	for (const item of subscription?.items?.data || []) {
		const priceId = stripeId(item?.price)
		if (priceId) {
			refs.push({
				priceId,
				periodEnd: periodSeconds(item.current_period_end),
				source: 'subscription_item',
			})
		}
	}
	for (const line of invoiceLines(invoice)) {
		const priceId = linePriceId(line)
		if (priceId) {
			refs.push({
				priceId,
				periodEnd: periodSeconds(line?.period?.end),
				source: 'invoice_line',
			})
		}
	}
	return refs
}

function consistentPeriod(values, label) {
	const periods = [...new Set(values.map(periodSeconds).filter(Boolean))]
	if (periods.length > 1) {
		throw payloadError(`Conflicting ${label}: ${periods.join(', ')}`)
	}
	return periods[0] || null
}

function resolveInvoicePeriodEndSeconds(invoice, subscription, planPriceIds = []) {
	const targetPrices = new Set(planPriceIds.filter(Boolean))
	const refs = collectPriceRefs(invoice, subscription)
	const targetLinePeriod = consistentPeriod(
		refs
			.filter(ref => ref.source === 'invoice_line' && targetPrices.has(ref.priceId))
			.map(ref => ref.periodEnd),
		'plan invoice line periods'
	)
	if (targetLinePeriod) return targetLinePeriod

	const targetItemPeriod = consistentPeriod(
		refs
			.filter(ref => ref.source === 'subscription_item' && targetPrices.has(ref.priceId))
			.map(ref => ref.periodEnd),
		'plan subscription item periods'
	)
	if (targetItemPeriod) return targetItemPeriod

	const linePeriod = consistentPeriod(
		invoiceLines(invoice).map(line => line?.period?.end),
		'invoice line periods'
	)
	if (linePeriod) return linePeriod

	const itemPeriod = consistentPeriod(
		(subscription?.items?.data || []).map(item => item?.current_period_end),
		'subscription item periods'
	)
	if (itemPeriod) return itemPeriod

	return periodSeconds(subscription?.current_period_end)
}

function resolveSubscriptionPeriodEndSeconds(subscription, getPriceDefinition) {
	const items = subscription?.items?.data || []
	const planPeriods = []
	for (const item of items) {
		const priceId = stripeId(item?.price)
		if (!priceId || typeof getPriceDefinition !== 'function') continue
		try {
			const definition = getPriceDefinition(priceId)
			if (definition?.kind === 'plan') planPeriods.push(item.current_period_end)
		} catch (_) {
			// Unknown prices are handled by the unambiguous item-period fallback below.
		}
	}
	const planPeriod = consistentPeriod(planPeriods, 'plan subscription item periods')
	if (planPeriod) return planPeriod

	const itemPeriod = consistentPeriod(
		items.map(item => item?.current_period_end),
		'subscription item periods'
	)
	return itemPeriod || periodSeconds(subscription?.current_period_end)
}

function resolvePlanAndPeriodFromInvoice({
	invoice,
	subscription,
	teamSnapshot,
	getPriceDefinition,
}) {
	const metadataSources = collectMetadataSources(invoice, subscription)
	const metadataTeamId = metadataValue(metadataSources, 'teamId')
	const metadataPlanKey = metadataValue(metadataSources, 'planKey')
	const metadataBillingCycle = metadataValue(metadataSources, 'billingCycle')
	const subscriptionId = resolveInvoiceSubscriptionId(invoice) || stripeId(subscription)
	const priceRefs = collectPriceRefs(invoice, subscription)
	const planDefinitions = []
	const moduleKeys = new Set()

	for (const ref of priceRefs) {
		if (typeof getPriceDefinition !== 'function') continue
		try {
			const definition = getPriceDefinition(ref.priceId)
			if (definition?.kind === 'plan') planDefinitions.push(definition)
			if (definition?.kind === 'module' && isModuleKey(definition.moduleKey)) {
				moduleKeys.add(definition.moduleKey)
			}
		} catch (_) {
			// Metadata and renewal-team fallbacks remain available for unknown historic prices.
		}
	}

	const mappedPlanKey = requireConsistentValue(
		planDefinitions.map(definition => definition.planKey),
		'Stripe plan price mappings'
	)
	const mappedBillingCycle = requireConsistentValue(
		planDefinitions.map(definition => definition.billingCycle),
		'Stripe billing-cycle price mappings'
	)

	if (mappedPlanKey && metadataPlanKey && mappedPlanKey !== metadataPlanKey) {
		throw payloadError(`Stripe plan metadata does not match price mapping`)
	}
	if (mappedBillingCycle && metadataBillingCycle && mappedBillingCycle !== metadataBillingCycle) {
		throw payloadError(`Stripe billing-cycle metadata does not match price mapping`)
	}

	let planKey = mappedPlanKey
	let billingCycle = mappedBillingCycle
	let usedTeamPlanFallback = false
	if (!planKey && isPaidPlanKey(metadataPlanKey)) planKey = metadataPlanKey
	if (!billingCycle && ['monthly', 'annual'].includes(metadataBillingCycle)) {
		billingCycle = metadataBillingCycle
	}

	const isRenewal = String(invoice?.billing_reason || '') === 'subscription_cycle'
	if ((!planKey || !billingCycle) && isRenewal) {
		if (!planKey && isPaidPlanKey(teamSnapshot?.billingPlanKey)) {
			planKey = teamSnapshot.billingPlanKey
			usedTeamPlanFallback = true
		}
		if (!billingCycle && ['monthly', 'annual'].includes(teamSnapshot?.billingCycle)) {
			billingCycle = teamSnapshot.billingCycle
			usedTeamPlanFallback = true
		}
	}

	for (const source of metadataSources) {
		parseModuleKeys(source?.moduleKeys).forEach(key => moduleKeys.add(key))
	}
	if (isRenewal) {
		for (const key of teamSnapshot?.billingModuleKeys || []) {
			if (isModuleKey(key)) moduleKeys.add(key)
		}
	}

	const planPriceIds = planDefinitions.map(definition => definition.priceId)
	const periodEnd = resolveInvoicePeriodEndSeconds(invoice, subscription, planPriceIds)

	return {
		metadataTeamId,
		planKey,
		billingCycle,
		moduleKeys: [...moduleKeys],
		periodEnd,
		subscriptionId,
		usedTeamPlanFallback,
	}
}

module.exports = {
	stripeId,
	payloadError,
	requireConsistentValue,
	collectInvoiceSubscriptionIds,
	resolveInvoiceSubscriptionId,
	collectMetadataSources,
	metadataValue,
	collectPriceRefs,
	resolveInvoicePeriodEndSeconds,
	resolveSubscriptionPeriodEndSeconds,
	resolvePlanAndPeriodFromInvoice,
}
