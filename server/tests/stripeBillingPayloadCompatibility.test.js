const test = require('node:test')
const assert = require('node:assert/strict')
const {
	resolveInvoiceSubscriptionId,
	resolvePlanAndPeriodFromInvoice,
	resolveSubscriptionPeriodEndSeconds,
} = require('../services/stripe/stripeBillingPayloadCompatibility')

const PRICE_PRO_MONTHLY = 'price_pro_monthly'

function priceDefinition(priceId) {
	if (priceId === PRICE_PRO_MONTHLY) {
		return {
			priceId,
			kind: 'plan',
			planKey: 'pro',
			billingCycle: 'monthly',
		}
	}
	if (priceId === 'price_tasks_monthly') {
		return {
			priceId,
			kind: 'module',
			moduleKey: 'tasks',
			billingCycle: 'monthly',
		}
	}
	throw new Error(`Unknown test price: ${priceId}`)
}

test('resolves Clover invoice from parent, line pricing, metadata and line period', () => {
	const invoice = {
		id: 'in_clover',
		billing_reason: 'subscription_cycle',
		parent: {
			type: 'subscription_details',
			subscription_details: {
				subscription: 'sub_clover',
				metadata: {
					teamId: '6a09ff25a39ac4abd4721951',
					planKey: 'pro',
					billingCycle: 'monthly',
				},
			},
		},
		lines: {
			data: [
				{
					metadata: {
						teamId: '6a09ff25a39ac4abd4721951',
						planKey: 'pro',
						billingCycle: 'monthly',
						priceId: PRICE_PRO_MONTHLY,
					},
					parent: {
						type: 'subscription_item_details',
						subscription_item_details: { subscription: 'sub_clover' },
					},
					pricing: { price_details: { price: PRICE_PRO_MONTHLY } },
					period: { end: 1787128547 },
				},
			],
		},
	}

	const resolved = resolvePlanAndPeriodFromInvoice({
		invoice,
		subscription: null,
		teamSnapshot: { billingPlanKey: 'pro', billingCycle: 'monthly' },
		getPriceDefinition: priceDefinition,
	})

	assert.equal(resolved.subscriptionId, 'sub_clover')
	assert.equal(resolved.metadataTeamId, '6a09ff25a39ac4abd4721951')
	assert.equal(resolved.planKey, 'pro')
	assert.equal(resolved.billingCycle, 'monthly')
	assert.equal(new Date(resolved.periodEnd * 1000).toISOString(), '2026-08-19T08:35:47.000Z')
})

test('resolves subscription id available only on invoice line parent', () => {
	assert.equal(
		resolveInvoiceSubscriptionId({
			lines: {
				data: [
					{
						parent: {
							subscription_item_details: { subscription: 'sub_from_line' },
						},
					},
				],
			},
		}),
		'sub_from_line'
	)
})

test('keeps legacy invoice.subscription and line.price.id support', () => {
	const resolved = resolvePlanAndPeriodFromInvoice({
		invoice: {
			id: 'in_legacy',
			subscription: 'sub_legacy',
			lines: {
				data: [{ price: { id: PRICE_PRO_MONTHLY }, period: { end: 1787128547 } }],
			},
		},
		subscription: {
			id: 'sub_legacy',
			metadata: {
				teamId: '6a09ff25a39ac4abd4721951',
				planKey: 'pro',
				billingCycle: 'monthly',
			},
			items: { data: [{ price: { id: PRICE_PRO_MONTHLY } }] },
			current_period_end: 1787128547,
		},
		teamSnapshot: {},
		getPriceDefinition: priceDefinition,
	})

	assert.equal(resolved.subscriptionId, 'sub_legacy')
	assert.equal(resolved.planKey, 'pro')
	assert.equal(resolved.periodEnd, 1787128547)
})

test('reads subscription period from items when top-level period is absent', () => {
	const periodEnd = resolveSubscriptionPeriodEndSeconds(
		{
			items: {
				data: [{ price: { id: PRICE_PRO_MONTHLY }, current_period_end: 1787128547 }],
			},
		},
		priceDefinition
	)
	assert.equal(periodEnd, 1787128547)
})

test('uses current team plan only for a subscription-cycle renewal', () => {
	const renewal = resolvePlanAndPeriodFromInvoice({
		invoice: {
			billing_reason: 'subscription_cycle',
			parent: { subscription_details: { subscription: 'sub_renewal' } },
			lines: { data: [{ period: { end: 1787128547 } }] },
		},
		subscription: null,
		teamSnapshot: {
			billingPlanKey: 'pro',
			billingCycle: 'monthly',
			billingModuleKeys: ['tasks'],
		},
		getPriceDefinition: priceDefinition,
	})
	assert.equal(renewal.planKey, 'pro')
	assert.equal(renewal.billingCycle, 'monthly')
	assert.deepEqual(renewal.moduleKeys, ['tasks'])

	const initial = resolvePlanAndPeriodFromInvoice({
		invoice: {
			billing_reason: 'subscription_create',
			parent: { subscription_details: { subscription: 'sub_initial' } },
			lines: { data: [{ period: { end: 1787128547 } }] },
		},
		subscription: null,
		teamSnapshot: { billingPlanKey: 'pro', billingCycle: 'monthly' },
		getPriceDefinition: priceDefinition,
	})
	assert.equal(initial.planKey, null)
	assert.equal(initial.billingCycle, null)
})

test('rejects conflicting subscription ids, metadata and ambiguous periods', () => {
	assert.throws(
		() =>
			resolveInvoiceSubscriptionId({
				subscription: 'sub_one',
				parent: { subscription_details: { subscription: 'sub_two' } },
			}),
		/Conflicting Stripe subscription ids/
	)

	assert.throws(
		() =>
			resolvePlanAndPeriodFromInvoice({
				invoice: {
					billing_reason: 'subscription_cycle',
					parent: { subscription_details: { metadata: { teamId: 'team_one' } } },
					lines: {
						data: [
							{ metadata: { teamId: 'team_two' }, period: { end: 100 } },
							{ period: { end: 200 } },
						],
					},
				},
				subscription: null,
				teamSnapshot: { billingPlanKey: 'pro', billingCycle: 'monthly' },
				getPriceDefinition: priceDefinition,
			}),
		/Conflicting Stripe metadata teamId/
	)

	assert.throws(
		() =>
			resolvePlanAndPeriodFromInvoice({
				invoice: {
					billing_reason: 'subscription_cycle',
					lines: { data: [{ period: { end: 100 } }, { period: { end: 200 } }] },
				},
				subscription: null,
				teamSnapshot: { billingPlanKey: 'pro', billingCycle: 'monthly' },
				getPriceDefinition: priceDefinition,
			}),
		/Conflicting invoice line periods/
	)
})
