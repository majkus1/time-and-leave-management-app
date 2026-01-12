/**
 * Migracja danych dla nowego systemu typów wniosków urlopowych
 * 
 * 1. Inicjalizuje domyślne typy systemowe w Settings dla wszystkich zespołów
 * 2. Przenosi vacationDays użytkowników na leaveTypeDays dla typu 'leaveform.option1' (Urlop wypoczynkowy)
 * 
 * Użycie:
 *   node server/migrations/migrateLeaveTypes.js
 */

const path = require('path');
const fs = require('fs');

// Załaduj .env z folderu server/
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
const Settings = require('../models/Settings')(firmDb);
const User = require('../models/user')(firmDb);
const Team = require('../models/Team')(firmDb);

// Domyślne typy systemowe (taki sam jak w Settings.js)
const getDefaultSystemLeaveTypes = () => [
	{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', nameEn: 'Paid Vacation', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: true },
	{ id: 'leaveform.option2', name: 'Urlop okolicznościowy', nameEn: 'Special Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option3', name: 'Urlop na żądanie', nameEn: 'On-Demand Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option4', name: 'Urlop bezpłatny', nameEn: 'Unpaid Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option5', name: 'Inna nieobecność', nameEn: 'Other Absence', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option6', name: 'Zwolnienie Lekarskie (L4)', nameEn: 'Sick Leave (L4)', isSystem: true, isEnabled: true, requireApproval: false, allowDaysLimit: false }
];

async function migrateLeaveTypes() {
	try {
		console.log('🔄 Rozpoczynam migrację typów wniosków urlopowych...\n');

		// Krok 1: Inicjalizuj domyślne typy systemowe w Settings dla wszystkich zespołów
		console.log('📋 Krok 1: Inicjalizacja domyślnych typów systemowych w Settings...');
		const teams = await Team.find({ 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] 
		}).select('_id name');
		
		let settingsUpdated = 0;
		for (const team of teams) {
			let settings = await Settings.findOne({ teamId: team._id });
			
			if (!settings) {
				// Utwórz nowe ustawienia z domyślnymi typami
				settings = await Settings.create({
					teamId: team._id,
					workOnWeekends: true,
					includePolishHolidays: false,
					includeCustomHolidays: false,
					customHolidays: [],
					leaveRequestTypes: getDefaultSystemLeaveTypes()
				});
				settingsUpdated++;
				console.log(`   ✅ Utworzono Settings dla zespołu: ${team.name || team._id}`);
			} else {
				// Sprawdź czy leaveRequestTypes istnieje i czy zawiera wszystkie typy systemowe
				if (!settings.leaveRequestTypes || settings.leaveRequestTypes.length === 0) {
					settings.leaveRequestTypes = getDefaultSystemLeaveTypes();
					await settings.save();
					settingsUpdated++;
					console.log(`   ✅ Zaktualizowano Settings dla zespołu: ${team.name || team._id} (dodano typy systemowe)`);
				} else {
					// Upewnij się, że wszystkie typy systemowe są obecne
					const defaultTypes = getDefaultSystemLeaveTypes();
					const existingTypeIds = new Set(settings.leaveRequestTypes.map(t => t.id));
					const systemTypesToAdd = defaultTypes.filter(dt => !existingTypeIds.has(dt.id));
					
					if (systemTypesToAdd.length > 0) {
						settings.leaveRequestTypes.push(...systemTypesToAdd);
						await settings.save();
						settingsUpdated++;
						console.log(`   ✅ Zaktualizowano Settings dla zespołu: ${team.name || team._id} (dodano brakujące typy systemowe)`);
					}
				}
			}
		}
		
		console.log(`\n✅ Zaktualizowano Settings dla ${settingsUpdated} zespołów\n`);

		// Krok 2: Przenieś vacationDays na leaveTypeDays dla typu 'leaveform.option1'
		console.log('👥 Krok 2: Migracja vacationDays na leaveTypeDays...');
		const users = await User.find({
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('_id username firstName lastName vacationDays leaveTypeDays');
		
		let usersUpdated = 0;
		for (const user of users) {
			let needsUpdate = false;
			
			// Sprawdź czy użytkownik ma vacationDays i czy nie ma jeszcze leaveTypeDays dla option1
			if (user.vacationDays && user.vacationDays > 0) {
				// Inicjalizuj leaveTypeDays jeśli nie istnieje
				if (!user.leaveTypeDays || typeof user.leaveTypeDays !== 'object') {
					user.leaveTypeDays = {};
				}
				
				// Sprawdź czy już ma leaveTypeDays dla option1
				const currentValue = user.leaveTypeDays['leaveform.option1'];
				if (!currentValue || currentValue === 0) {
					user.leaveTypeDays['leaveform.option1'] = user.vacationDays;
					needsUpdate = true;
				}
			}
			
			if (needsUpdate) {
				// Oznacz pole jako zmodyfikowane, aby Mongoose zapisał zmiany (ważne dla Mixed type)
				user.markModified('leaveTypeDays');
				await user.save();
				usersUpdated++;
				console.log(`   ✅ Zaktualizowano użytkownika: ${user.firstName} ${user.lastName} (${user.username}) - przeniesiono ${user.vacationDays} dni urlopu`);
			}
		}
		
		console.log(`\n✅ Zaktualizowano ${usersUpdated} użytkowników\n`);

		console.log('='.repeat(60));
		console.log('📊 PODSUMOWANIE MIGRACJI');
		console.log('='.repeat(60));
		console.log(`✅ Zaktualizowano Settings: ${settingsUpdated} zespołów`);
		console.log(`✅ Zaktualizowano użytkowników: ${usersUpdated}`);
		console.log('='.repeat(60));
		console.log('\n✅ Migracja zakończona pomyślnie!');
		
	} catch (error) {
		console.error('\n❌ Błąd podczas migracji:', error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		console.log('\n🔌 Zamknięto połączenie z bazą danych');
		process.exit(0);
	}
}

// Uruchom migrację
migrateLeaveTypes().catch(error => {
	console.error('❌ Nieoczekiwany błąd:', error);
	process.exit(1);
});
