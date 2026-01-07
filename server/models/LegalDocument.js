const mongoose = require('mongoose');
const crypto = require('crypto');

const legalDocumentSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: ['TERMS', 'PRIVACY', 'DPA'],
		index: true
	},
	version: {
		type: String,
		required: true,
		trim: true
	},
	effectiveAt: {
		type: Date,
		required: true,
		index: true
	},
	content: {
		type: String,
		required: true
	},
	checksum: {
		type: String,
		required: true,
		index: true
	},
	isCurrent: {
		type: Boolean,
		default: false,
		index: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
}, {
	collection: 'legaldocuments',
	timestamps: true
});

// Unique index: only one current document per type
legalDocumentSchema.index({ type: 1, isCurrent: 1 }, { unique: true, partialFilterExpression: { isCurrent: true } });

// Pre-save hook to generate checksum
legalDocumentSchema.pre('save', function(next) {
	// Generate checksum if content is present and checksum is not already set or content is modified
	if (this.content && (!this.checksum || this.isModified('content'))) {
		this.checksum = crypto.createHash('sha256').update(this.content).digest('hex');
	}
	next();
});

// Static method to set document as current (unset others of same type)
legalDocumentSchema.statics.setAsCurrent = async function(documentId) {
	const doc = await this.findById(documentId);
	if (!doc) {
		throw new Error('Document not found');
	}

	// Unset isCurrent for all other documents of the same type
	await this.updateMany(
		{ type: doc.type, _id: { $ne: documentId } },
		{ $set: { isCurrent: false } }
	);

	// Set this document as current
	doc.isCurrent = true;
	await doc.save();

	return doc;
};

module.exports = conn => (conn.models.LegalDocument || conn.model('LegalDocument', legalDocumentSchema));

