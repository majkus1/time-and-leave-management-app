const mongoose = require('mongoose')

const billingPaymentSessionSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
			unique: true,
			index: true,
			maxlength: 100,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
			index: true,
		},
		createdByUserId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		kind: {
			type: String,
			enum: ['plan', 'addon'],
			required: true,
		},
		planKey: { type: String },
		addonId: { type: String },
		billingCycle: {
			type: String,
			enum: ['monthly', 'annual'],
		},
		/** Moduły CORE dokupione razem z planem (P24); aktywacja przez webhook */
		moduleKeys: [{ type: String }],
		amountGrosze: { type: Number, required: true },
		currency: { type: String, default: 'PLN', maxlength: 3 },
		customerEmail: { type: String, required: true },
		note: { type: String, default: '' },
		status: {
			type: String,
			enum: ['pending', 'paid', 'failed', 'register_error'],
			default: 'pending',
			index: true,
		},
		p24OrderId: { type: String },
		registerError: { type: String },
		/**
		 * Przedłużenie tego samego planu przed końcem okresu: koniec opłaconego okresu z chwili założenia sesji.
		 * Finalizacja liczy nowy okres od tej daty (z sesji, nie z bieżącego stanu zespołu), więc ponowiona albo
		 * równoległa finalizacja tej samej płatności nie dokłada drugiego okresu.
		 */
		renewFromPeriodEnd: { type: Date },
		/** Płatność zaksięgowana bez zmiany zespołu — do ręcznego rozliczenia (plan_changed / already_covered) */
		settlementNote: { type: String, maxlength: 200 },
	},
	{ collection: 'billingpaymentsessions', timestamps: true }
)

module.exports = conn =>
	conn.models.BillingPaymentSession || conn.model('BillingPaymentSession', billingPaymentSessionSchema)
