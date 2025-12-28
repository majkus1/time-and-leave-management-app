// migrations/createDepartmentChannels.js
// Migracja do utworzenia kanałów czatu dla istniejących działów

const path = require('path')
// Załaduj .env z folderu server (jeden poziom wyżej od migrations/)
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// Sprawdź czy DB_URI jest ustawione
if (!process.env.DB_URI) {
	console.error('Error: DB_URI environment variable is not set!')
	console.error('Please make sure .env file exists in the server folder and contains DB_URI')
	process.exit(1)
}

const { firmDb } = require('../db/db')
const Channel = require('../models/Channel')(firmDb)
const Department = require('../models/Department')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const { createChannelForDepartment } = require('../controllers/chatController')

const createDepartmentChannels = async () => {
	try {
		// Sprawdź czy połączenie z bazą jest gotowe
		if (firmDb.readyState !== 1) {
			console.log('Waiting for database connection...')
			await new Promise((resolve, reject) => {
				firmDb.once('connected', resolve)
				firmDb.once('error', reject)
				setTimeout(() => reject(new Error('Connection timeout')), 10000)
			})
		}
		
		console.log('Starting migration: Creating department channels for existing departments...')
		
		// Pobierz wszystkie zespoły
		const teams = await Team.find({})
		console.log(`Found ${teams.length} teams`)
		
		let totalChannelsCreated = 0
		let totalChannelsSkipped = 0
		
		for (const team of teams) {
			console.log(`\nProcessing team: ${team.name} (${team._id})`)
			
			// Pobierz działy z modelu Department
			let departments = await Department.find({ teamId: team._id, isActive: true }).select('name')
			
			// Jeśli nie ma działów w modelu Department, pobierz z użytkowników
			if (departments.length === 0) {
				console.log('  No departments in Department model, checking users...')
				const users = await User.find({ 
					teamId: team._id, 
					department: { $ne: null, $ne: [], $exists: true } 
				}).select('department')
				
				// Zbierz wszystkie unikalne działy z tablic
				const allDepartments = new Set()
				users.forEach(user => {
					if (Array.isArray(user.department)) {
						user.department.forEach(dept => {
							if (dept && dept.trim() !== '') {
								allDepartments.add(dept.trim())
							}
						})
					} else if (user.department && user.department.trim() !== '') {
						allDepartments.add(user.department.trim())
					}
				})
				
				departments = Array.from(allDepartments).map(name => ({ name }))
			}
			
			console.log(`  Found ${departments.length} departments`)
			
			// Dla każdego działu utwórz kanał jeśli nie istnieje
			for (const dept of departments) {
				const departmentName = dept.name || dept
				const channelName = `#${departmentName}`
				
				// Sprawdź czy kanał już istnieje
				const existingChannel = await Channel.findOne({ 
					teamId: team._id, 
					name: channelName,
					type: 'department'
				})
				
				if (existingChannel) {
					console.log(`  ✓ Channel already exists for department: ${departmentName}`)
					totalChannelsSkipped++
				} else {
					// Utwórz nowy kanał używając funkcji z chatController
					try {
						await createChannelForDepartment(team._id, departmentName)
						console.log(`  ✓ Created channel for department: ${departmentName}`)
						totalChannelsCreated++
					} catch (error) {
						console.error(`  ✗ Error creating channel for department ${departmentName}:`, error.message)
					}
				}
			}
		}
		
		console.log('\n' + '='.repeat(50))
		console.log('Migration completed!')
		console.log(`Total channels created: ${totalChannelsCreated}`)
		console.log(`Total channels skipped (already exist): ${totalChannelsSkipped}`)
		console.log('='.repeat(50))
		
		process.exit(0)
	} catch (error) {
		console.error('Error during migration:', error)
		process.exit(1)
	}
}

// Uruchom migrację jeśli plik jest wywoływany bezpośrednio
if (require.main === module) {
	createDepartmentChannels()
}

module.exports = createDepartmentChannels

