// models/Ticket.js
module.exports = connection => {
	const mongoose = require('mongoose')
	const ticketSchema = new mongoose.Schema({
		company: { type: String, required: true },
		userEmail: { type: String, required: true },
		topic: { type: String, required: true },
		status: {
			type: String,
			enum: ['Otwarte', 'Zamknięte'],
			default: 'Otwarte',
		},
		messages: [
			{
				sender: { type: String, required: true },
				author: { type: String, required: true },
				content: { type: String, required: true },
				files: [String],
				timestamp: { type: Date, default: Date.now },
			},
		],
		createdAt: { type: Date, default: Date.now },
	})

	ticketSchema.index({ company: 1 });
	ticketSchema.index({ userEmail: 1 });

	return connection.models.Ticket || connection.model('Ticket', ticketSchema)
}
