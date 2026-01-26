const mongoose = require('mongoose')

const pushSubscriptionSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true,
		index: true
	},
	endpoint: {
		type: String,
		required: true,
		unique: true
	},
	keys: {
		p256dh: {
			type: String,
			required: true
		},
		auth: {
			type: String,
			required: true
		}
	},
	userAgent: {
		type: String,
		default: ''
	},
	enabled: {
		type: Boolean,
		default: true
	},
	preferences: {
		chat: {
			type: Boolean,
			default: true
		},
		tasks: {
			type: Boolean,
			default: true
		},
		taskStatusChanges: {
			type: Boolean,
			default: true
		},
		leaves: {
			type: Boolean,
			default: true
		}
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	lastUsed: {
		type: Date,
		default: Date.now
	}
}, { collection: 'pushSubscriptions' })

// Index for efficient queries
pushSubscriptionSchema.index({ userId: 1, enabled: 1 })
pushSubscriptionSchema.index({ teamId: 1, enabled: 1 })

module.exports = conn => (conn.models.PushSubscription || conn.model('PushSubscription', pushSubscriptionSchema))
