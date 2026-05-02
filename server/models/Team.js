const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		minlength: 2,
		maxlength: 100
	},
	adminEmail: {
		type: String,
		required: true,
		lowercase: true
	},
	adminPassword: {
		type: String,
		required: true
	},
	adminFirstName: {
		type: String,
		required: true,
		trim: true
	},
	adminLastName: {
		type: String,
		required: true,
		trim: true
	},
	maxUsers: {
		type: Number,
		default: 4
	},
	currentUserCount: {
		type: Number,
		default: 1
	},
	isActive: {
		type: Boolean,
		default: true,
		index: true
	},
	deletedAt: {
		type: Date,
		default: null
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	subscriptionType: {
		type: String,
		default: 'free',
		enum: ['free', 'premium', 'enterprise']
	},
	/** true after at least one paid plan activation (required to apply AI add-on packs) */
	billingHadPaidPlan: {
		type: Boolean,
		default: false,
	},
	/** null/undefined = pre-billing legacy team (app seats as stored; AI only after purchase) */
	billingPlanKey: {
		type: String,
		default: null,
	},
	billingStatus: {
		type: String,
		default: null,
	},
	billingCycle: {
		type: String,
		default: null,
	},
	trialEndsAt: {
		type: Date,
		default: null,
	},
	billingPeriodEnd: {
		type: Date,
		default: null,
	},
	stripeCustomerId: {
		type: String,
		default: null,
	},
	stripeSubscriptionId: {
		type: String,
		default: null,
	},
	stripeSubscriptionStatus: {
		type: String,
		default: null,
	},
	stripeCancelAtPeriodEnd: {
		type: Boolean,
		default: false,
	},
	stripePendingPlanKey: {
		type: String,
		default: null,
	},
	stripePendingBillingCycle: {
		type: String,
		default: null,
	},
	trialAiMessagesUsed: {
		type: Number,
		default: 0,
		min: 0,
	},
	/** Zużycie jednorazowej puli AI w okresie legacy (np. lip420 — osobno od trialu) */
	legacyOneOffAiMessagesUsed: {
		type: Number,
		default: 0,
		min: 0,
	},
	aiMessagesUsedInMonth: {
		type: Number,
		default: 0,
		min: 0,
	},
	/** YYYY-MM — resets aiMessagesUsedInMonth when calendar month changes */
	aiUsageMonthKey: {
		type: String,
		default: '',
	},
	aiPackBalance: {
		type: Number,
		default: 0,
		min: 0,
	},
	aiBillingLockVersion: {
		type: Number,
		default: 0,
		min: 0,
	},
	/** Dane do faktury (Admin/HR w Pakietach) — firma lub osoba fizyczna */
	billingInvoiceBuyerType: {
		type: String,
		enum: ['company', 'individual'],
		default: 'company',
	},
	/** Nazwa firmy lub imię i nazwisko (osoba fizyczna) */
	billingInvoiceCompanyName: {
		type: String,
		default: '',
		trim: true,
		maxlength: 200,
	},
	billingInvoiceAddress: {
		type: String,
		default: '',
		trim: true,
		maxlength: 500,
	},
	billingInvoiceNip: {
		type: String,
		default: '',
		trim: true,
		maxlength: 32,
	},
	/** Ostatnia synchronizacja po fakturze Stripe: zespół ma więcej kont niż limit pakietu */
	billingSeatLimitExceededActive: {
		type: Boolean,
		default: false,
	},
	/** Ostatni mail „nad limit miejsc” (throttle kolejnych powiadomień) */
	billingSeatLimitExceededEmailAt: {
		type: Date,
		default: null,
	},
}, {
	collection: 'teams',
	timestamps: true
});

// Partial unique indexes - wymuszają unikalność tylko dla aktywnych zespołów
// Soft-deleted zespoły (isActive: false) nie blokują rejestracji z tym samym name/adminEmail
// Używa $ne: false aby obejmować zarówno isActive: true jak i brak pola isActive
teamSchema.index(
    { name: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: { $ne: false } }
    }
);

teamSchema.index(
    { adminEmail: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: { $ne: false } }
    }
);

module.exports = conn => (conn.models.Team || conn.model('Team', teamSchema));
