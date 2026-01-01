/**
 * Migracja ról do nowego systemu
 * Zamienia stare role na nowe:
 * - "Może zatwierdzać urlopy swojego działu (Approve Leaves Department)" → "Przełożony (Supervisor)"
 * - "Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)" → "Przełożony (Supervisor)"
 * - "Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)" → "HR"
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

if (!process.env.DB_URI) {
	console.error('Error: DB_URI environment variable is not set!')
	console.error('Please make sure .env file exists in the server folder and contains DB_URI')
	process.exit(1)
}

const { firmDb } = require('../db/db');
const User = require('../models/user')(firmDb);
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb);

async function migrateRoles() {
    try {
        console.log('Rozpoczynam migrację ról...');

        // Znajdź wszystkich użytkowników ze starymi rolami
        const oldApproveRole = 'Może zatwierdzać urlopy swojego działu (Approve Leaves Department)';
        const oldTimesheetRole = 'Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)';
        const oldHRRole = 'Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)';
        const newSupervisorRole = 'Przełożony (Supervisor)';
        const newHRRole = 'HR';

        // Znajdź wszystkich użytkowników ze starymi rolami (używając $in dla wszystkich starych ról)
        const allUsersWithOldRoles = await User.find({
            $or: [
                { roles: oldApproveRole },
                { roles: oldTimesheetRole },
                { roles: oldHRRole }
            ]
        }).lean();

        // Podziel użytkowników na kategorie
        const usersWithApproveRole = allUsersWithOldRoles.filter(user => 
            Array.isArray(user.roles) && user.roles.includes(oldApproveRole)
        );
        const usersWithTimesheetRole = allUsersWithOldRoles.filter(user => 
            Array.isArray(user.roles) && user.roles.includes(oldTimesheetRole)
        );
        const usersWithHRRole = allUsersWithOldRoles.filter(user => 
            Array.isArray(user.roles) && user.roles.includes(oldHRRole)
        );

        console.log(`Znaleziono ${usersWithApproveRole.length} użytkowników z rolą zatwierdzania urlopów`);
        console.log(`Znaleziono ${usersWithTimesheetRole.length} użytkowników z rolą widzenia ewidencji`);
        console.log(`Znaleziono ${usersWithHRRole.length} użytkowników z rolą HR`);

        // Zbierz wszystkich unikalnych użytkowników, którzy będą przełożonymi
        const supervisorUserIds = new Set();
        const allUsersToUpdate = new Map(); // Map<userId, user> - aby uniknąć duplikatów
        
        // Dodaj użytkowników z rolą zatwierdzania urlopów
        usersWithApproveRole.forEach(user => {
            supervisorUserIds.add(user._id.toString());
            allUsersToUpdate.set(user._id.toString(), user);
        });
        
        // Dodaj użytkowników z rolą widzenia ewidencji
        usersWithTimesheetRole.forEach(user => {
            supervisorUserIds.add(user._id.toString());
            allUsersToUpdate.set(user._id.toString(), user);
        });

        // Aktualizuj role dla wszystkich użytkowników używając updateMany (omija walidację Mongoose)
        let updatedCount = 0;

        // Aktualizuj wszystkich użytkowników, którzy mają stare role przełożonego
        for (const [userId, user] of allUsersToUpdate) {
            // Pobierz aktualne role z bazy danych (może się zmienić po poprzednich aktualizacjach)
            const currentUser = await User.findById(user._id).lean();
            if (!currentUser) continue;
            
            const currentRoles = Array.isArray(currentUser.roles) ? [...currentUser.roles] : [];
            let newRoles = currentRoles.filter(role => 
                role !== oldApproveRole && 
                role !== oldTimesheetRole
            );
            
            // Dodaj nową rolę przełożonego jeśli nie ma
            if (!newRoles.includes(newSupervisorRole)) {
                newRoles.push(newSupervisorRole);
            }
            
            // Użyj updateOne z runValidators: false aby ominąć walidację enum
            await User.updateOne(
                { _id: user._id },
                { $set: { roles: newRoles } },
                { runValidators: false }
            );
            updatedCount++;
            console.log(`✓ Zaktualizowano użytkownika: ${user.username || currentUser.username} (${user.firstName || currentUser.firstName} ${user.lastName || currentUser.lastName}) - role: ${newRoles.join(', ')}`);
        }

        // Aktualizuj użytkowników z rolą HR
        for (const user of usersWithHRRole) {
            // Pobierz aktualne role z bazy danych (może się zmienić po poprzednich aktualizacjach)
            const currentUser = await User.findById(user._id).lean();
            if (!currentUser) continue;
            
            const currentRoles = Array.isArray(currentUser.roles) ? [...currentUser.roles] : [];
            let newRoles = currentRoles.filter(role => role !== oldHRRole);
            if (!newRoles.includes(newHRRole)) {
                newRoles.push(newHRRole);
            }
            // Użyj updateOne z runValidators: false aby ominąć walidację enum
            await User.updateOne(
                { _id: user._id },
                { $set: { roles: newRoles } },
                { runValidators: false }
            );
            updatedCount++;
            console.log(`✓ Zaktualizowano użytkownika: ${user.username || currentUser.username} (${user.firstName || currentUser.firstName} ${user.lastName || currentUser.lastName}) - role: ${newRoles.join(', ')}`);
        }

        console.log(`Zaktualizowano role dla ${updatedCount} użytkowników`);

        // Utwórz domyślne konfiguracje dla przełożonych
        let configsCreated = 0;
        for (const supervisorId of supervisorUserIds) {
            const user = await User.findById(supervisorId);
            if (!user) continue;

            // Sprawdź czy konfiguracja już istnieje
            const existingConfig = await SupervisorConfig.findOne({ supervisorId });
            if (existingConfig) continue;

            // Utwórz domyślną konfigurację z wszystkimi uprawnieniami włączonymi
            const supervisorConfig = new SupervisorConfig({
                supervisorId: user._id,
                teamId: user.teamId,
                permissions: {
                    canApproveLeaves: true,
                    canApproveLeavesDepartment: true,
                    canApproveLeavesSelectedEmployees: true,
                    canViewTimesheets: true,
                    canViewTimesheetsDepartment: true,
                    canViewTimesheetsSelectedEmployees: true,
                    canManageSchedule: true,
                    canManageScheduleDepartment: true,
                    canManageScheduleCustom: true
                },
                selectedEmployees: []
            });

            await supervisorConfig.save();
            configsCreated++;
        }

        console.log(`Utworzono ${configsCreated} domyślnych konfiguracji przełożonych`);

        console.log('Migracja zakończona pomyślnie!');
        process.exit(0);
    } catch (error) {
        console.error('Błąd podczas migracji:', error);
        process.exit(1);
    }
}

// Uruchom migrację jeśli plik jest wykonywany bezpośrednio
if (require.main === module) {
	if (firmDb.readyState !== 1) {
		console.log('Waiting for database connection...')
		firmDb.once('connected', () => {
			console.log('Połączono z bazą danych')
			migrateRoles()
		})
	} else {
		console.log('Połączono z bazą danych')
		migrateRoles()
	}
}

module.exports = { migrateRoles };

