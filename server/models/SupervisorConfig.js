const mongoose = require('mongoose');

const supervisorConfigSchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    // Uprawnienia przełożonego
    permissions: {
        // Zatwierdzanie urlopów
        canApproveLeaves: {
            type: Boolean,
            default: true
        },
        canApproveLeavesDepartment: {
            type: Boolean,
            default: true
        },
        canApproveLeavesSelectedEmployees: {
            type: Boolean,
            default: true
        },
        // Widoczność ewidencji czasu pracy
        canViewTimesheets: {
            type: Boolean,
            default: true
        },
        canViewTimesheetsDepartment: {
            type: Boolean,
            default: true
        },
        canViewTimesheetsSelectedEmployees: {
            type: Boolean,
            default: true
        },
        // Zarządzanie grafikiem
        canManageSchedule: {
            type: Boolean,
            default: true
        },
        canManageScheduleDepartment: {
            type: Boolean,
            default: true
        },
        canManageScheduleCustom: {
            type: Boolean,
            default: true
        }
    },
    // Lista ID pracowników, dla których przełożony ma uprawnienia (jeśli wybrane indywidualnie)
    selectedEmployees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { 
    collection: 'supervisorconfigs',
    timestamps: true 
});

supervisorConfigSchema.index({ supervisorId: 1 }, { unique: true });
supervisorConfigSchema.index({ teamId: 1 });

module.exports = conn => (conn.models.SupervisorConfig || conn.model('SupervisorConfig', supervisorConfigSchema));

