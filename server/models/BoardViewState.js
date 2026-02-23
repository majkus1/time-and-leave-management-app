const mongoose = require('mongoose')

const boardViewStateSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true,
	},
	lastViewedAt: {
		type: Date,
		default: Date.now,
	},
}, {
	collection: 'boardviewstates',
	timestamps: true,
})

boardViewStateSchema.index({ userId: 1, boardId: 1 }, { unique: true })
boardViewStateSchema.index({ boardId: 1, userId: 1 })

module.exports = conn => (conn.models.BoardViewState || conn.model('BoardViewState', boardViewStateSchema))

