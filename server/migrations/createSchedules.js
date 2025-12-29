// Migration script to create schedules for all teams and departments
// Run this from server/migrations directory with: node createSchedules.js

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
const Team = require('../models/Team')(firmDb)
const Department = require('../models/Department')(firmDb)
const User = require('../models/user')(firmDb)
const { createTeamSchedule, createScheduleForDepartment } = require('../controllers/scheduleController')

async function createSchedules() {
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
		
		console.log('Starting schedule creation migration...')
		
		const allTeams = await Team.find({ isActive: true })
		console.log(`Found ${allTeams.length} active teams`)
		
		for (const team of allTeams) {
			try {
				console.log(`\nProcessing team: ${team.name}`)
				
				// Create team schedule
				await createTeamSchedule(team._id)
				console.log(`✓ Created team schedule for "${team.name}"`)
				
				// Get departments for this team
				const departments = await Department.find({ teamId: team._id, isActive: true }).select('name')
				
				// If no departments in Department model, get from users
				if (departments.length === 0) {
					const users = await User.find({ 
						teamId: team._id, 
						department: { $ne: null, $ne: [], $exists: true } 
					}).select('department')
					
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
					
					// Create schedules for departments from users
					for (const deptName of allDepartments) {
						try {
							await createScheduleForDepartment(team._id, deptName)
							console.log(`✓ Created department schedule "${deptName}" for team "${team.name}"`)
						} catch (error) {
							console.error(`✗ Error creating department schedule "${deptName}" for team "${team.name}":`, error.message)
						}
					}
				} else {
					// Create schedules for departments from Department model
					for (const dept of departments) {
						try {
							await createScheduleForDepartment(team._id, dept.name)
							console.log(`✓ Created department schedule "${dept.name}" for team "${team.name}"`)
						} catch (error) {
							console.error(`✗ Error creating department schedule "${dept.name}" for team "${team.name}":`, error.message)
						}
					}
				}
			} catch (error) {
				console.error(`✗ Error processing team "${team.name}":`, error.message)
			}
		}
		
		console.log('\n✓ Schedule creation migration completed!')
		process.exit(0)
	} catch (error) {
		console.error('✗ Migration failed:', error)
		process.exit(1)
	}
}

// Run migration if called directly
if (require.main === module) {
	createSchedules()
}

module.exports = createSchedules

