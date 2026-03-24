const mongoose = require('mongoose')

const billingLedgerEntrySchema = new mongoose.Schema(
	{
		idempotencyKey: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
			index: true,
		},
		action: {
			type: String,
			required: true,
		},
		payload: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{ collection: 'billingledgerentries', timestamps: true }
)

module.exports = conn => conn.models.BillingLedgerEntry || conn.model('BillingLedgerEntry', billingLedgerEntrySchema)
