const { firmDb } = require('../db/db');
const LegalDocument = require('../models/LegalDocument')(firmDb);
const LegalAcceptance = require('../models/LegalAcceptance')(firmDb);

// Helper to get client IP
const getClientIp = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	return forwarded ? forwarded.split(',')[0].trim() : req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

// GET /api/legal/current - Get current versions of all legal documents
exports.getCurrentDocuments = async (req, res) => {
	try {
		const currentDocs = await LegalDocument.find({ isCurrent: true })
			.select('type version effectiveAt checksum')
			.sort({ type: 1 });

		const documents = currentDocs.map(doc => ({
			type: doc.type,
			version: doc.version,
			effectiveAt: doc.effectiveAt,
			checksum: doc.checksum,
			url: `/api/legal/${doc.type.toLowerCase()}`
		}));

		res.json({
			success: true,
			documents
		});
	} catch (error) {
		console.error('Error fetching current legal documents:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas pobierania dokumentów'
		});
	}
};

// GET /api/legal/:type - Get content of specific document type
exports.getDocumentByType = async (req, res) => {
	try {
		const { type } = req.params;
		const upperType = type.toUpperCase();

		if (!['TERMS', 'PRIVACY', 'DPA'].includes(upperType)) {
			return res.status(400).json({
				success: false,
				message: 'Nieprawidłowy typ dokumentu'
			});
		}

		const doc = await LegalDocument.findOne({ type: upperType, isCurrent: true });
		if (!doc) {
			return res.status(404).json({
				success: false,
				message: 'Dokument nie znaleziony lub nieopublikowany'
			});
		}

		res.json({
			success: true,
			document: {
				type: doc.type,
				version: doc.version,
				content: doc.content,
				effectiveAt: doc.effectiveAt
			}
		});
	} catch (error) {
		console.error(`Error fetching legal document ${req.params.type}:`, error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas pobierania treści dokumentu'
		});
	}
};

// POST /api/legal/accept - Accept legal documents
exports.acceptDocuments = async (req, res) => {
	try {
		const { documentTypes } = req.body; // Array of document types to accept
		const userId = req.user?.userId || req.body.userId; // Support both authenticated and registration flow
		const teamId = req.user?.teamId || req.body.teamId;

		if (!userId || !teamId) {
			return res.status(400).json({
				success: false,
				message: 'Brak wymaganych danych użytkownika'
			});
		}

		if (!Array.isArray(documentTypes) || documentTypes.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Nieprawidłowe typy dokumentów'
			});
		}

		const validTypes = ['TERMS', 'PRIVACY', 'DPA'];
		const invalidTypes = documentTypes.filter(type => !validTypes.includes(type));
		if (invalidTypes.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Nieprawidłowe typy dokumentów: ${invalidTypes.join(', ')}`
			});
		}

		// Get current versions of requested documents
		const currentDocs = await LegalDocument.find({
			type: { $in: documentTypes },
			isCurrent: true
		});

		if (currentDocs.length !== documentTypes.length) {
			return res.status(400).json({
				success: false,
				message: 'Nie wszystkie dokumenty mają aktualną wersję'
			});
		}

		const ipAddress = getClientIp(req);
		const userAgent = req.headers['user-agent'] || '';

		// Create acceptance records
		const acceptances = [];
		for (const doc of currentDocs) {
			const acceptance = new LegalAcceptance({
				userId,
				teamId,
				documentType: doc.type,
				documentVersion: doc.version,
				documentId: doc._id,
				acceptedAt: new Date(),
				ipAddress,
				userAgent
			});
			acceptances.push(acceptance.save());
		}
		await Promise.all(acceptances);

		res.json({
			success: true,
			message: 'Dokumenty zostały zaakceptowane.'
		});
	} catch (error) {
		console.error('Error accepting legal documents:', error);
		if (error.code === 11000) {
			// Duplicate key error - document already accepted
			return res.status(400).json({
				success: false,
				message: 'Dokumenty zostały już wcześniej zaakceptowane'
			});
		}
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas akceptacji dokumentów.'
		});
	}
};

// GET /api/legal/acceptance/status - Get acceptance status for current user
exports.getAcceptanceStatus = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const teamId = req.user?.teamId;

		if (!userId || !teamId) {
			return res.status(400).json({
				success: false,
				message: 'Brak danych użytkownika lub zespołu.'
			});
		}

		const types = ['TERMS', 'PRIVACY', 'DPA'];
		const status = { allAccepted: true, requiredDocuments: {} };

		for (const type of types) {
			const currentDoc = await LegalDocument.findOne({ type, isCurrent: true });
			if (!currentDoc) {
				status.allAccepted = false;
				status.requiredDocuments[type] = {
					isAccepted: false,
					currentVersion: null,
					effectiveAt: null,
					url: `/api/legal/${type.toLowerCase()}`
				};
				continue;
			}

			const userAcceptance = await LegalAcceptance.findOne({ 
				userId, 
				teamId, 
				documentType: type,
				documentVersion: currentDoc.version
			}).sort({ acceptedAt: -1 });

			const isAccepted = !!userAcceptance;

			if (!isAccepted) {
				status.allAccepted = false;
			}

			status.requiredDocuments[type] = {
				isAccepted,
				currentVersion: currentDoc.version,
				effectiveAt: currentDoc.effectiveAt,
				url: `/api/legal/${type.toLowerCase()}`
			};
		}

		res.json({ success: true, status });
	} catch (error) {
		console.error('Error fetching legal acceptance status:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Błąd serwera podczas sprawdzania statusu akceptacji.' 
		});
	}
};

// GET /api/legal/user-acceptances - Get acceptance history for current user
exports.getUserAcceptances = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(400).json({ 
				success: false, 
				message: 'Brak danych użytkownika.' 
			});
		}

		const acceptances = await LegalAcceptance.find({ userId })
			.sort({ acceptedAt: -1 })
			.lean();

		res.json({ success: true, acceptances });
	} catch (error) {
		console.error('Error fetching user acceptances:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Błąd serwera podczas pobierania historii akceptacji.' 
		});
	}
};

