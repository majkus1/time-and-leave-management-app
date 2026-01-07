const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    teamId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Team', 
        required: true 
    },
    roles: {
        type: [String],
        enum: [
            'Admin',                             
            'Pracownik (Worker)',                         
            'Przełożony (Supervisor)',
            'HR'
        ],
        required: true
    },
    department: { type: [String], default: [] }, // Tablica działów - użytkownik może być w wielu działach
    supervisors: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }], // Kto jest przełożonym tego użytkownika
    position: { type: String, required: false },
    leaveDays: { type: Number, default: 0 },
    vacationDays: { type: Number, default: 0 },
    isTeamAdmin: { type: Boolean, default: false },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { collection: 'users' });

// Partial unique index - wymusza unikalność username tylko dla aktywnych użytkowników
// Soft-deleted użytkownicy (isActive: false) nie blokują rejestracji z tym samym username
userSchema.index(
    { username: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: { $ne: false } }
    }
);

userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password && !this.password.startsWith('$2a$12$')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

module.exports = conn => (conn.models.User || conn.model('User', userSchema));
