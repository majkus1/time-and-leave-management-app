const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
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
		enum: ['team', 'department', 'custom'],
		required: true,
		default: 'custom'
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
	isTeamBoard: {
		type: Boolean,
		default: false
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
}, {
	collection: 'boards',
	timestamps: true
});

// Index for efficient queries
boardSchema.index({ teamId: 1, type: 1 });
boardSchema.index({ teamId: 1, departmentName: 1 });
boardSchema.index({ teamId: 1, name: 1 });
boardSchema.index({ members: 1 });

module.exports = conn => (conn.models.Board || conn.model('Board', boardSchema));











