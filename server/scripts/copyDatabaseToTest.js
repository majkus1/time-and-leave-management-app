/**
 * Skrypt do kopiowania danych z bazy produkcyjnej do bazy testowej lokalnej
 * 
 * UWAGA: Ten skrypt NIE usuwa danych z bazy produkcyjnej - tylko kopiuje je do testowej.
 * Przed kopiowaniem czyści wszystkie kolekcje w bazie testowej.
 * 
 * Użycie:
 *   node server/scripts/copyDatabaseToTest.js
 * 
 * Wymagane zmienne środowiskowe w server/.env:
 *   DB_URI - URI bazy produkcyjnej (źródło)
 *   DB_URI_TEST - URI bazy testowej (docelowa)
 */

const path = require('path');
const fs = require('fs');

// Sprawdź czy dotenv jest dostępny
let dotenv;
try {
	dotenv = require('dotenv');
} catch (error) {
	console.error('❌ Błąd: Nie można załadować modułu "dotenv"');
	console.error('');
	console.error('   Rozwiązanie: Zainstaluj zależności projektu:');
	console.error('   npm install');
	console.error('');
	console.error('   Lub jeśli używasz yarn:');
	console.error('   yarn install');
	console.error('');
	process.exit(1);
}

// Załaduj .env z folderu server/
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath });
} else {
	console.error(`❌ Nie znaleziono pliku .env w: ${envPath}`);
	console.error('   Upewnij się, że plik server/.env istnieje');
	process.exit(1);
}

const mongoose = require('mongoose');

// Sprawdź wymagane zmienne środowiskowe
if (!process.env.DB_URI) {
	console.error('❌ Błąd: DB_URI nie jest ustawione w .env');
	console.error('   Upewnij się, że plik server/.env zawiera DB_URI (baza produkcyjna)');
	process.exit(1);
}

if (!process.env.DB_URI_TEST) {
	console.error('❌ Błąd: DB_URI_TEST nie jest ustawione w .env');
	console.error('   Upewnij się, że plik server/.env zawiera DB_URI_TEST (baza testowa)');
	process.exit(1);
}

// Lista wszystkich kolekcji w aplikacji (na podstawie modeli)
const COLLECTIONS = [
	'teams',
	'users',
	'workdays',
	'leaverequests',
	'leaveplans',
	'calendarconfirmations',
	'logs',
	'settings',
	'departments',
	'channels',
	'messages',
	'boards',
	'schedules',
	'tasks',
	'taskcomments',
	'supervisorconfigs',
	'legaldocuments',
	'legal_acceptances'  // Uwaga: z podkreślnikiem (zgodnie z modelem)
];

/**
 * Kopiuje wszystkie dokumenty z jednej kolekcji do drugiej
 */
async function copyCollection(sourceDb, targetDb, collectionName) {
	try {
		const sourceCollection = sourceDb.collection(collectionName);
		const targetCollection = targetDb.collection(collectionName);

		// Sprawdź czy kolekcja istnieje w źródle
		const collections = await sourceDb.listCollections({ name: collectionName }).toArray();
		if (collections.length === 0) {
			console.log(`   ⏭️  Pominięto ${collectionName} (nie istnieje w źródle)`);
			return { copied: 0, skipped: true };
		}

		// Pobierz wszystkie dokumenty ze źródła
		const documents = await sourceCollection.find({}).toArray();
		
		if (documents.length === 0) {
			console.log(`   ⏭️  Pominięto ${collectionName} (pusta w źródle)`);
			return { copied: 0, skipped: true };
		}

		// Wyczyść kolekcję docelową
		await targetCollection.deleteMany({});

		// Wstaw dokumenty do docelowej bazy (batch insert dla wydajności)
		if (documents.length > 0) {
			await targetCollection.insertMany(documents, { ordered: false });
		}

		return { copied: documents.length, skipped: false };
	} catch (error) {
		console.error(`   ❌ Błąd podczas kopiowania ${collectionName}:`, error.message);
		return { copied: 0, error: error.message };
	}
}

/**
 * Główna funkcja kopiowania
 */
async function copyDatabase() {
	let sourceConnection = null;
	let targetConnection = null;

	try {
		console.log('🔄 Rozpoczynam kopiowanie bazy danych...\n');

		// Połącz z bazą źródłową (produkcyjna)
		console.log('📡 Łączenie z bazą produkcyjną (źródło)...');
		sourceConnection = await mongoose.createConnection(process.env.DB_URI).asPromise();
		console.log('✅ Połączono z bazą produkcyjną\n');

		// Połącz z bazą docelową (testowa)
		console.log('📡 Łączenie z bazą testową (docelowa)...');
		targetConnection = await mongoose.createConnection(process.env.DB_URI_TEST).asPromise();
		console.log('✅ Połączono z bazą testową\n');

		console.log('🗑️  Czyszczenie bazy testowej przed kopiowaniem...\n');

		// Wyczyść wszystkie kolekcje w bazie testowej
		for (const collectionName of COLLECTIONS) {
			try {
				const targetCollection = targetConnection.db.collection(collectionName);
				const count = await targetCollection.countDocuments();
				if (count > 0) {
					await targetCollection.deleteMany({});
					console.log(`   🗑️  Wyczyszczono ${collectionName} (${count} dokumentów)`);
				}
			} catch (error) {
				// Ignoruj błędy jeśli kolekcja nie istnieje
				if (error.codeName !== 'NamespaceNotFound') {
					console.warn(`   ⚠️  Ostrzeżenie przy czyszczeniu ${collectionName}:`, error.message);
				}
			}
		}

		console.log('\n📦 Kopiowanie kolekcji...\n');

		const results = {
			success: 0,
			skipped: 0,
			errors: 0,
			totalCopied: 0
		};

		// Kopiuj każdą kolekcję
		for (const collectionName of COLLECTIONS) {
			process.stdout.write(`   📋 Kopiowanie ${collectionName}... `);
			const result = await copyCollection(sourceConnection.db, targetConnection.db, collectionName);
			
			if (result.error) {
				console.log(`❌ BŁĄD`);
				results.errors++;
			} else if (result.skipped) {
				console.log(`⏭️  POMINIĘTO`);
				results.skipped++;
			} else {
				console.log(`✅ ${result.copied} dokumentów`);
				results.success++;
				results.totalCopied += result.copied;
			}
		}

		// Podsumowanie
		console.log('\n' + '='.repeat(60));
		console.log('📊 PODSUMOWANIE KOPIOWANIA');
		console.log('='.repeat(60));
		console.log(`✅ Skopiowano: ${results.success} kolekcji (${results.totalCopied} dokumentów)`);
		console.log(`⏭️  Pominięto: ${results.skipped} kolekcji`);
		if (results.errors > 0) {
			console.log(`❌ Błędy: ${results.errors} kolekcji`);
		}
		console.log('='.repeat(60));
		console.log('\n✅ Kopiowanie zakończone pomyślnie!');
		console.log('⚠️  UWAGA: Dane w bazie produkcyjnej pozostały niezmienione.');

	} catch (error) {
		console.error('\n❌ Krytyczny błąd podczas kopiowania:', error);
		process.exit(1);
	} finally {
		// Zamknij połączenia
		if (sourceConnection) {
			await sourceConnection.close();
			console.log('\n🔌 Zamknięto połączenie z bazą produkcyjną');
		}
		if (targetConnection) {
			await targetConnection.close();
			console.log('🔌 Zamknięto połączenie z bazą testową');
		}
		process.exit(0);
	}
}

// Uruchom kopiowanie
copyDatabase().catch(error => {
	console.error('❌ Nieoczekiwany błąd:', error);
	process.exit(1);
});
