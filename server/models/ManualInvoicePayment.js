const mongoose = require('mongoose')

/**
 * Opłacona faktura wystawiona poza aplikacją (np. Halo) — wpisuje ją admin platformy, żeby naliczyć prowizję partnera.
 * Kwota netto w groszach; numer faktury unikalny w obrębie zespołu.
 */
const manualInvoicePaymentSchema = new mongoose.Schema(
	{
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
		invoiceNumber: { type: String, required: true, trim: true, maxlength: 100 },
		netGrosze: { type: Number, required: true, min: 1 },
		paidAt: { type: Date, required: true },
		note: { type: String, default: '', maxlength: 500 },
		createdBy: { type: String, default: '', maxlength: 100 },
	},
	{ collection: 'manualinvoicepayments', timestamps: true }
)

manualInvoicePaymentSchema.index({ teamId: 1, invoiceNumber: 1 }, { unique: true })

module.exports = conn => conn.models.ManualInvoicePayment || conn.model('ManualInvoicePayment', manualInvoicePaymentSchema)
