// Migration script to update existing #ogólny channels to use team names
require('dotenv').config()
const { firmDb } = require('../db/db')
const Channel = require('../models/Channel')(firmDb)
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)

async function updateGeneralChannels() {
	try {
		console.log('Starting migration: Update general channels...')
		
		// Find all general channels with old name #ogólny
		const oldGeneralChannels = await Channel.find({ 
			type: 'general',
			name: '#ogólny',
			isActive: true
		})
		
		console.log(`Found ${oldGeneralChannels.length} channels to update`)
		
		for (const channel of oldGeneralChannels) {
			try {
				// Get team name
				const team = await Team.findById(channel.teamId)
				if (!team) {
					console.log(`Team not found for channel ${channel._id}, skipping...`)
					continue
				}
				
				// Get all users in the team
				const allUsers = await User.find({ teamId: channel.teamId }).select('_id')
				const memberIds = allUsers.map(user => user._id)
				
				// Update channel
				channel.name = `#${team.name}`
				channel.description = `Kanał ogólny dla całego zespołu ${team.name}`
				channel.members = memberIds
				channel.isTeamChannel = true
				
				await channel.save()
				console.log(`Updated channel for team "${team.name}" (${channel._id})`)
			} catch (error) {
				console.error(`Error updating channel ${channel._id}:`, error)
			}
		}
		
		// Also update any general channels that might have incorrect names
		const allGeneralChannels = await Channel.find({ 
			type: 'general',
			isActive: true
		})
		
		for (const channel of allGeneralChannels) {
			try {
				const team = await Team.findById(channel.teamId)
				if (!team) {
					continue
				}
				
				const expectedName = `#${team.name}`
				if (channel.name === expectedName) {
					// This is the automatic team channel - mark it as such
					const allUsers = await User.find({ teamId: channel.teamId }).select('_id')
					const memberIds = allUsers.map(user => user._id)
					
					channel.isTeamChannel = true
					channel.description = `Kanał ogólny dla całego zespołu ${team.name}`
					
					// Update members if needed
					const existingMemberIds = channel.members.map(m => m.toString())
					const currentMemberIds = memberIds.map(id => id.toString())
					
					const needsUpdate = existingMemberIds.length !== currentMemberIds.length ||
						!existingMemberIds.every(id => currentMemberIds.includes(id))
					
					if (needsUpdate) {
						channel.members = memberIds
					}
					
					await channel.save()
					console.log(`Marked and synced team channel "${team.name}" (${channel._id})`)
				}
			} catch (error) {
				console.error(`Error processing channel ${channel._id}:`, error)
			}
		}
		
		console.log('Migration completed successfully!')
		process.exit(0)
	} catch (error) {
		console.error('Migration failed:', error)
		process.exit(1)
	}
}

// Run migration
updateGeneralChannels()

