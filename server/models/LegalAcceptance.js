const mongoose = require('mongoose');

const legalAcceptanceSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true,
		index: true
	},
	documentType: {
		type: String,
		required: true,
		enum: ['TERMS', 'PRIVACY', 'DPA'],
		index: true
	},
	documentVersion: {
		type: String,
		required: true
	},
	documentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'LegalDocument'
	},
	acceptedAt: {
		type: Date,
		default: Date.now,
		index: true
	},
	ipAddress: {
		type: String,
		required: false
	},
	userAgent: {
		type: String,
		required: false
	}
}, {
	collection: 'legal_acceptances',
	timestamps: true
});

// Unique index: one acceptance per user per document type per version
legalAcceptanceSchema.index({ userId: 1, documentType: 1, documentVersion: 1 }, { unique: true });

// Compound index for querying by team
legalAcceptanceSchema.index({ teamId: 1, documentType: 1, documentVersion: 1 });

// Index for querying user acceptances by date
legalAcceptanceSchema.index({ userId: 1, acceptedAt: -1 });

module.exports = conn => (conn.models.LegalAcceptance || conn.model('LegalAcceptance', legalAcceptanceSchema));

