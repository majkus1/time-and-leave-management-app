require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { firmDb } = require('../db/db');

// Import all models that support soft delete
// NOTE: Users are hard-deleted immediately, only Teams use soft-delete with retention
const Team = require('../models/Team')(firmDb);
const User = require('../models/user')(firmDb);
const Board = require('../models/Board')(firmDb);
const Schedule = require('../models/Schedule')(firmDb);
const Department = require('../models/Department')(firmDb);
const Channel = require('../models/Channel')(firmDb);
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb);

// Import historical records that should be cleaned up when user/team is deleted
const Workday = require('../models/Workday')(firmDb);
const LeaveRequest = require('../models/LeaveRequest')(firmDb);
const LeavePlan = require('../models/LeavePlan')(firmDb);
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb);
const Log = require('../models/log')(firmDb);
const Message = require('../models/Message')(firmDb);

const RETENTION_DAYS = 30; // Days after which soft-deleted records are permanently removed

async function cleanupSoftDeletedRecords() {
	console.log(`Starting cleanup of soft-deleted records older than ${RETENTION_DAYS} days...`);
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

	// Find teams that should be permanently deleted
	const teamsToDelete = await Team.find({
		isActive: false,
		deletedAt: { $ne: null, $lte: cutoffDate }
	}).select('_id');

	const teamIds = teamsToDelete.map(t => t._id);

	// For each team, delete all related data
	for (const teamId of teamIds) {
		try {
			// Get all users in this team (including soft-deleted)
			const teamUsers = await User.find({ teamId }).select('_id');
			const userIds = teamUsers.map(u => u._id);

			// Delete historical records for all users in this team
			if (userIds.length > 0) {
				await Promise.all([
					Workday.deleteMany({ userId: { $in: userIds } }),
					LeaveRequest.deleteMany({ userId: { $in: userIds } }),
					LeavePlan.deleteMany({ userId: { $in: userIds } }),
					CalendarConfirmation.deleteMany({ userId: { $in: userIds } }),
					Log.deleteMany({ user: { $in: userIds } }),
					Message.deleteMany({ userId: { $in: userIds } })
				]);
				console.log(`  Deleted historical records for ${userIds.length} users from team ${teamId}`);
			}

			// Get all channels for this team and delete messages
			const teamChannels = await Channel.find({ teamId }).select('_id');
			const channelIds = teamChannels.map(c => c._id);
			if (channelIds.length > 0) {
				await Message.deleteMany({ channelId: { $in: channelIds } });
				console.log(`  Deleted messages from ${channelIds.length} channels in team ${teamId}`);
			}

			// Delete team resources
			await Promise.all([
				Channel.deleteMany({ teamId }),
				Board.deleteMany({ teamId }),
				Schedule.deleteMany({ teamId }),
				Department.deleteMany({ teamId }),
				SupervisorConfig.deleteMany({ teamId }),
				User.deleteMany({ teamId })
			]);

			// Finally delete the team
			await Team.deleteOne({ _id: teamId });
			console.log(`  ✅ Permanently deleted team ${teamId} and all related data`);
		} catch (error) {
			console.error(`  ❌ Error deleting team ${teamId}:`, error.message);
		}
	}

	// Find individual soft-deleted users (not in teams being deleted) that should be permanently deleted
	const usersToDelete = await User.find({
		isActive: false,
		deletedAt: { $ne: null, $lte: cutoffDate },
		teamId: { $nin: teamIds } // Don't delete users from teams that are already being deleted
	}).select('_id');

	for (const user of usersToDelete) {
		try {
			const userId = user._id;

			// Delete historical records for this user
			await Promise.all([
				Workday.deleteMany({ userId }),
				LeaveRequest.deleteMany({ userId }),
				LeavePlan.deleteMany({ userId }),
				CalendarConfirmation.deleteMany({ userId }),
				Log.deleteMany({ user: userId }),
				Message.deleteMany({ userId })
			]);

			// Delete the user
			await User.deleteOne({ _id: userId });
			console.log(`  ✅ Permanently deleted user ${userId} and related data`);
		} catch (error) {
			console.error(`  ❌ Error deleting user ${user._id}:`, error.message);
		}
	}

	// Delete soft-deleted resources (boards, schedules, departments, channels, supervisor configs)
	// that don't belong to teams/users being deleted
	const modelsToCleanup = [
		{ model: Board, name: 'Boards' },
		{ model: Schedule, name: 'Schedules' },
		{ model: Department, name: 'Departments' },
		{ model: Channel, name: 'Channels' },
		{ model: SupervisorConfig, name: 'SupervisorConfigs' },
	];

	for (const { model, name } of modelsToCleanup) {
		try {
			// Only delete if teamId is not in teamIds (teams being deleted) or is null
			const query = {
				isActive: false,
				deletedAt: { $ne: null, $lte: cutoffDate },
				$or: [
					{ teamId: { $exists: false } },
					{ teamId: null },
					{ teamId: { $nin: teamIds } }
				]
			};

			const result = await model.deleteMany(query);
			if (result.deletedCount > 0) {
				console.log(`  Deleted ${result.deletedCount} soft-deleted ${name}.`);
			}
		} catch (error) {
			console.error(`  Error cleaning up ${name}:`, error.message);
		}
	}

	console.log('✅ Cleanup finished.');
}

async function main() {
	try {
		await new Promise((resolve, reject) => {
			firmDb.once('connected', resolve);
			firmDb.once('error', reject);
			if (firmDb.readyState === 1) resolve();
		});
		console.log('Connected to MongoDB for cleanup.');

		await cleanupSoftDeletedRecords();

		mongoose.connection.close();
		firmDb.close();
	} catch (error) {
		console.error('Database connection or cleanup error:', error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = { cleanupSoftDeletedRecords };

