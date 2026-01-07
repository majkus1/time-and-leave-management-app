const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		minlength: 2,
		maxlength: 100
	},
	adminEmail: {
		type: String,
		required: true,
		lowercase: true
	},
	adminPassword: {
		type: String,
		required: true
	},
	adminFirstName: {
		type: String,
		required: true,
		trim: true
	},
	adminLastName: {
		type: String,
		required: true,
		trim: true
	},
	maxUsers: {
		type: Number,
		default: 6
	},
	currentUserCount: {
		type: Number,
		default: 1
	},
	isActive: {
		type: Boolean,
		default: true,
		index: true
	},
	deletedAt: {
		type: Date,
		default: null
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	subscriptionType: {
		type: String,
		default: 'free',
		enum: ['free', 'premium', 'enterprise']
	}
}, {
	collection: 'teams',
	timestamps: true
});

// Partial unique indexes - wymuszają unikalność tylko dla aktywnych zespołów
// Soft-deleted zespoły (isActive: false) nie blokują rejestracji z tym samym name/adminEmail
// Używa $ne: false aby obejmować zarówno isActive: true jak i brak pola isActive
teamSchema.index(
    { name: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: { $ne: false } }
    }
);

teamSchema.index(
    { adminEmail: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: { $ne: false } }
    }
);

module.exports = conn => (conn.models.Team || conn.model('Team', teamSchema));
