const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true
	},
	type: {
		type: String,
		enum: ['general', 'department', 'private'],
		required: true,
		default: 'general'
	},
	members: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	departmentName: {
		type: String,
		required: function() {
			return this.type === 'department';
		}
	},
	description: {
		type: String,
		default: ''
	},
	isActive: {
		type: Boolean,
		default: true
	},
	isTeamChannel: {
		type: Boolean,
		default: false
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
}, {
	collection: 'channels',
	timestamps: true
});

// Index for efficient queries
channelSchema.index({ teamId: 1, type: 1 });
channelSchema.index({ teamId: 1, departmentName: 1 });
channelSchema.index({ teamId: 1, name: 1 }, { unique: true });
channelSchema.index({ members: 1 });

module.exports = conn => (conn.models.Channel || conn.model('Channel', channelSchema));

