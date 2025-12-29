const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
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
            'Może zatwierdzać urlopy swojego działu (Approve Leaves Department)',   
            'Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)',
            'Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)'
        ],
        required: true
    },
    department: { type: [String], default: [] }, // Tablica działów - użytkownik może być w wielu działach
    position: { type: String, required: false },
    leaveDays: { type: Number, default: 0 },
    vacationDays: { type: Number, default: 0 },
    isTeamAdmin: { type: Boolean, default: false },
}, { collection: 'users' });

userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password && !this.password.startsWith('$2a$12$')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

module.exports = conn => (conn.models.User || conn.model('User', userSchema));
