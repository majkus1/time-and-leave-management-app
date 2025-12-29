// Migration script to update old role name to new role name
// Run this from server/migrations directory with: node updateRoleName.js

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

if (!process.env.DB_URI) {
	console.error('Error: DB_URI environment variable is not set!')
	console.error('Please make sure .env file exists in the server folder and contains DB_URI')
	process.exit(1)
}

const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)

const OLD_ROLE_NAME = 'Może widzieć ewidencję czasu pracy swojego działu (View Timesheets Department)'
const NEW_ROLE_NAME = 'Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)'

async function updateRoleName() {
	try {
		if (firmDb.readyState !== 1) {
			console.log('Waiting for database connection...')
			await new Promise((resolve, reject) => {
				firmDb.once('connected', resolve)
				firmDb.once('error', reject)
				setTimeout(() => reject(new Error('Connection timeout')), 10000)
			})
		}

		console.log('Starting role name update migration...')
		console.log(`Updating: "${OLD_ROLE_NAME}"`)
		console.log(`To: "${NEW_ROLE_NAME}"`)
		
		// Find all users with the old role name
		const usersWithOldRole = await User.find({
			roles: OLD_ROLE_NAME
		})
		
		console.log(`\nFound ${usersWithOldRole.length} users with old role name`)
		
		if (usersWithOldRole.length === 0) {
			console.log('No users found with old role name. Migration not needed.')
			process.exit(0)
		}
		
		let updatedCount = 0
		
		// Update each user
		for (const user of usersWithOldRole) {
			try {
				// Replace old role name with new role name
				user.roles = user.roles.map(role => 
					role === OLD_ROLE_NAME ? NEW_ROLE_NAME : role
				)
				
				// Validate before saving
				const validationError = user.validateSync()
				if (validationError) {
					console.error(`✗ Error validating user ${user.username}:`, validationError.message)
					continue
				}
				
				await user.save()
				console.log(`✓ Updated user: ${user.username} (${user.firstName} ${user.lastName})`)
				updatedCount++
			} catch (error) {
				console.error(`✗ Error updating user ${user.username}:`, error.message)
			}
		}
		
		console.log('\n' + '='.repeat(50))
		console.log('Migration completed!')
		console.log(`Total users updated: ${updatedCount}/${usersWithOldRole.length}`)
		console.log('='.repeat(50))
		
		process.exit(0)
	} catch (error) {
		console.error('Error during migration:', error)
		process.exit(1)
	}
}

if (require.main === module) {
	updateRoleName()
}

module.exports = updateRoleName

