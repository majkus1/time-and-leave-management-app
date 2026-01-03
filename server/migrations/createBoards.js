// migrations/createBoards.js
// Migracja do utworzenia tablic zadań dla istniejących zespołów i działów

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
const Board = require('../models/Board')(firmDb)
const Department = require('../models/Department')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const { createTeamBoard, createBoardForDepartment } = require('../controllers/boardController')

const createBoards = async () => {
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
		
		console.log('Starting migration: Creating boards for existing teams and departments...')
		
		// Pobierz wszystkie zespoły
		const teams = await Team.find({})
		console.log(`Found ${teams.length} teams`)
		
		let totalBoardsCreated = 0
		let totalBoardsSkipped = 0
		
		for (const team of teams) {
			console.log(`\nProcessing team: ${team.name} (${team._id})`)
			
			// Utwórz tablicę zespołu
			try {
				await createTeamBoard(team._id)
				console.log(`  ✓ Synced team board for team "${team.name}"`)
				totalBoardsCreated++
			} catch (error) {
				console.error(`  ✗ Error creating team board for "${team.name}":`, error.message)
			}
			
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
			
			// Dla każdego działu utwórz tablicę jeśli nie istnieje
			for (const dept of departments) {
				const departmentName = dept.name || dept
				
				try {
					await createBoardForDepartment(team._id, departmentName)
					console.log(`  ✓ Created board for department: ${departmentName}`)
					totalBoardsCreated++
				} catch (error) {
					console.error(`  ✗ Error creating board for department ${departmentName}:`, error.message)
				}
			}
		}
		
		console.log('\n' + '='.repeat(50))
		console.log('Migration completed!')
		console.log(`Total boards created/synced: ${totalBoardsCreated}`)
		console.log('='.repeat(50))
		
		process.exit(0)
	} catch (error) {
		console.error('Error during migration:', error)
		process.exit(1)
	}
}

// Uruchom migrację jeśli plik jest wywoływany bezpośrednio
if (require.main === module) {
	createBoards()
}

module.exports = createBoards











