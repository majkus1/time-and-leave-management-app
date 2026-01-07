const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Załaduj .env z folderu server/ (nie z miejsca gdzie skrypt jest uruchamiany)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
	require('dotenv').config({ path: envPath });
} else {
	console.error(`❌ Nie znaleziono pliku .env w: ${envPath}`);
	console.error('   Upewnij się, że plik server/.env istnieje');
	process.exit(1);
}

const mongoose = require('mongoose');
const { firmDb } = require('../db/db');
const LegalDocument = require('../models/LegalDocument')(firmDb);

const DOCUMENTS_DIR = path.join(__dirname, '../../legal-documents');

async function publishDocument(type, version, effectiveDate, content) {
	try {
		// Validate type
		if (!['TERMS', 'PRIVACY', 'DPA'].includes(type)) {
			throw new Error(`Invalid document type: ${type}. Must be TERMS, PRIVACY, or DPA.`);
		}

		// Validate effectiveDate
		const effectiveAt = new Date(effectiveDate);
		if (isNaN(effectiveAt.getTime())) {
			throw new Error(`Invalid date: ${effectiveDate}`);
		}

		// Generate checksum before creating the document
		const checksum = crypto.createHash('sha256').update(content).digest('hex');

		// Create new document
		const newDoc = new LegalDocument({
			type,
			version,
			effectiveAt,
			content,
			checksum // Assign the generated checksum
		});

		await newDoc.save();

		// Set as current (this will unset others of the same type)
		await LegalDocument.setAsCurrent(newDoc._id);

		console.log(`✅ Published ${type} version ${version}, effective from ${effectiveAt.toISOString().split('T')[0]}`);
		return newDoc;
	} catch (error) {
		console.error(`❌ Error publishing ${type}:`, error.message);
		throw error;
	}
}

async function publishFromFile(type, version, effectiveDate) {
	const fileMap = {
		'TERMS': 'TERMS.md',
		'PRIVACY': 'PRIVACY.md',
		'DPA': 'DPA.md'
	};

	const filename = fileMap[type];
	if (!filename) {
		throw new Error(`Unknown document type: ${type}`);
	}

	const filePath = path.join(DOCUMENTS_DIR, filename);

	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	return await publishDocument(type, version, effectiveDate, content);
}

async function listCurrentDocuments() {
	try {
		const currentDocs = await LegalDocument.find({ isCurrent: true })
			.select('type version effectiveAt createdAt')
			.sort({ type: 1 });

		console.log('\n📋 Current legal documents:');
		if (currentDocs.length === 0) {
			console.log('   No documents published yet.');
		} else {
			currentDocs.forEach(doc => {
				console.log(`   ${doc.type}: v${doc.version} (effective: ${doc.effectiveAt.toISOString().split('T')[0]})`);
			});
		}
		console.log('');
	} catch (error) {
		console.error('Error listing documents:', error);
	}
}

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	try {
		// Connect to database
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve);
			firmDb.once('error', reject);
			if (firmDb.readyState === 1) resolve();
		});

		if (command === 'list') {
			await listCurrentDocuments();
		} else if (command === 'publish') {
			const type = args[1]?.toUpperCase();
			const version = args[2];
			const effectiveDate = args[3];

			if (!type || !version || !effectiveDate) {
				console.error('Usage: node seedLegalDocuments.js publish <TYPE> <VERSION> <EFFECTIVE_DATE>');
				console.error('Example: node seedLegalDocuments.js publish TERMS 1.0 2026-01-15');
				console.error('Types: TERMS, PRIVACY, DPA');
				process.exit(1);
			}

			await publishFromFile(type, version, effectiveDate);
			await listCurrentDocuments();
		} else {
			console.log('Legal Documents Seed Tool');
			console.log('');
			console.log('Usage:');
			console.log('  node seedLegalDocuments.js list                    - List current documents');
			console.log('  node seedLegalDocuments.js publish <TYPE> <VERSION> <DATE> - Publish new version');
			console.log('');
			console.log('Examples:');
			console.log('  node seedLegalDocuments.js list');
			console.log('  node server/scripts/seedLegalDocuments.js publish TERMS 1.0 2026-01-07');
			console.log('  node server/scripts/seedLegalDocuments.js publish PRIVACY 1.0 2026-01-07');
			console.log('  node server/scripts/seedLegalDocuments.js publish DPA 1.0 2026-01-07');
			console.log('');
			console.log('Document files should be in: legal-documents/');
			console.log('  - TERMS.md');
			console.log('  - PRIVACY.md');
			console.log('  - DPA.md');
			process.exit(1);
		}

		process.exit(0);
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

module.exports = { publishDocument, publishFromFile, listCurrentDocuments };

