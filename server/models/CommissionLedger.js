const mongoose = require('mongoose')

/**
 * Księga prowizji partnerów: naliczenia (dodatnie) i cofnięcia (ujemne). Wpisów nie edytujemy — korekta to nowy wpis.
 * idempotencyKey (unikalny) chroni przed podwójnym naliczeniem przy ponowionym webhooku albo podwójnym kliknięciu.
 */
const commissionLedgerSchema = new mongoose.Schema(
	{
		idempotencyKey: { type: String, required: true, maxlength: 200 },
		partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
		sourceType: { type: String, enum: ['stripe_invoice', 'p24_session', 'manual_invoice'], required: true },
		/** id faktury Stripe / sessionId P24 / _id ManualInvoicePayment */
		sourceId: { type: String, required: true, maxlength: 200 },
		kind: { type: String, enum: ['accrual', 'reversal'], required: true },
		/** Cofnięcie wskazuje naliczenie, które pomniejsza */
		accrualId: { type: mongoose.Schema.Types.ObjectId, default: null },
		/** Naliczenie: kwota netto płatności; cofnięcie: zwrócona kwota netto (jeśli znana) */
		baseNetGrosze: { type: Number, default: 0 },
		/** Kwota faktycznie pobrana (Stripe: ładunek) — mianownik przy zwrotach częściowych */
		paidGrosze: { type: Number, default: 0 },
		rate: { type: Number, required: true, min: 0, max: 1 },
		/** Ujemna przy cofnięciu */
		commissionGrosze: { type: Number, required: true },
		/**
		 * Tylko naliczenie: ile już cofnięto (grosze, dodatnio). Rezerwowane warunkowym zapisem przed utworzeniem
		 * cofnięcia — dwa równoległe zwroty nie cofną razem więcej niż prowizja.
		 */
		reversedGrosze: { type: Number, default: 0, min: 0 },
		currency: { type: String, default: 'PLN', maxlength: 3 },
		/** Klient Stripe płatności — każdy zakup kartą tworzy nowego klienta, więc zwrot starej faktury szukamy po nim */
		stripeCustomerId: { type: String, default: null, maxlength: 100 },
		/** Miesiąc rozliczeniowy 'YYYY-MM' (Europe/Warsaw) */
		month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
		occurredAt: { type: Date, required: true },
		status: { type: String, enum: ['accrued', 'payable', 'paid'], default: 'accrued' },
		payableAt: { type: Date, default: null },
		paidAt: { type: Date, default: null },
		payoutNote: { type: String, default: '', maxlength: 500 },
		/** 'stripe' | 'p24' | userId admina */
		createdBy: { type: String, default: '', maxlength: 100 },
		note: { type: String, default: '', maxlength: 500 },
	},
	{ collection: 'commissionledger', timestamps: true }
)

commissionLedgerSchema.index({ idempotencyKey: 1 }, { unique: true })
commissionLedgerSchema.index({ partnerId: 1, month: 1 })
commissionLedgerSchema.index({ month: 1, status: 1 })
commissionLedgerSchema.index({ sourceType: 1, sourceId: 1 })
commissionLedgerSchema.index({ accrualId: 1 })
commissionLedgerSchema.index({ stripeCustomerId: 1 }, { partialFilterExpression: { stripeCustomerId: { $type: 'string' } } })

module.exports = conn => conn.models.CommissionLedger || conn.model('CommissionLedger', commissionLedgerSchema)
