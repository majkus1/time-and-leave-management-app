const { firmDb } = require('../db/db');
const LegalDocument = require('../models/LegalDocument')(firmDb);
const LegalAcceptance = require('../models/LegalAcceptance')(firmDb);

/**
 * Middleware to check if user has accepted all current legal documents
 * Returns 403 if documents are not accepted
 */
const requireLegalAcceptance = async (req, res, next) => {
	try {
		const userId = req.user?.userId;
		const teamId = req.user?.teamId;

		if (!userId || !teamId) {
			// Not authenticated - let auth middleware handle it
			return next();
		}

		// Get all current document versions
		const currentDocs = await LegalDocument.find({ isCurrent: true })
			.select('type version');

		if (currentDocs.length === 0) {
			// No documents defined, allow access
			return next();
		}

		// Get user's latest acceptances for each document type
		const userAcceptances = await LegalAcceptance.find({ 
			userId,
			teamId 
		}).sort({ acceptedAt: -1 });

		// Create a map of document type -> latest acceptance
		const acceptanceMap = {};
		userAcceptances.forEach(acc => {
			if (!acceptanceMap[acc.documentType] ||
				acceptanceMap[acc.documentType].acceptedAt < acc.acceptedAt) {
				acceptanceMap[acc.documentType] = acc;
			}
		});

		// Check if user has accepted all current versions
		const missingDocuments = [];
		for (const doc of currentDocs) {
			const acceptance = acceptanceMap[doc.type];
			if (!acceptance || acceptance.documentVersion !== doc.version) {
				missingDocuments.push(doc.type);
			}
		}

		if (missingDocuments.length > 0) {
			// User hasn't accepted all current documents
			return res.status(403).json({
				success: false,
				code: 'LEGAL_ACCEPTANCE_REQUIRED',
				message: 'Wymagana akceptacja aktualnych dokumentów prawnych',
				missingDocuments
			});
		}

		// All documents accepted, allow access
		next();
	} catch (error) {
		console.error('Error in legal guard middleware:', error);
		// On error, allow access (fail open) - better UX than blocking all users
		next();
	}
};

module.exports = { requireLegalAcceptance };

