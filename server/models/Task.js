const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		default: ''
	},
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true
	},
	status: {
		type: String,
		enum: ['todo', 'in-progress', 'review', 'done'],
		required: true,
		default: 'todo'
	},
	priority: {
		type: String,
		enum: ['low', 'medium', 'high', 'urgent'],
		required: true,
		default: 'medium'
	},
	attachments: [{
		filename: String,
		path: String,
		uploadedAt: {
			type: Date,
			default: Date.now
		}
	}],
	assignedTo: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	assignedScope: {
		type: String,
		enum: ['specific', 'all-members'],
		required: true,
		default: 'specific'
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	order: {
		type: Number,
		default: 0
	},
	isActive: {
		type: Boolean,
		default: true
	},
	/** Pojedynczy termin (deadline) — dzień końcowy */
	dueDate: {
		type: Date,
		default: null,
	},
	/** Początek okresu realizacji (wraz z workPeriodEnd) */
	workPeriodStart: {
		type: Date,
		default: null,
	},
	/** Koniec okresu realizacji */
	workPeriodEnd: {
		type: Date,
		default: null,
	},
	/** Widoczne tylko w kalendarzu zadań, nie na tablicy Kanban */
	calendarOnly: {
		type: Boolean,
		default: false,
	},
}, {
	collection: 'tasks',
	timestamps: true
});

// Index for efficient queries
taskSchema.index({ boardId: 1, status: 1 });
taskSchema.index({ boardId: 1, order: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ boardId: 1, dueDate: 1 });
taskSchema.index({ boardId: 1, workPeriodStart: 1, workPeriodEnd: 1 });

module.exports = conn => (conn.models.Task || conn.model('Task', taskSchema));





















