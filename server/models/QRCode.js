const mongoose = require('mongoose')
const crypto = require('crypto')

const qrCodeSchema = new mongoose.Schema({
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true,
		index: true
	},
	code: {
		type: String,
		required: true,
		unique: true,
		index: true,
		sparse: true
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	isActive: {
		type: Boolean,
		default: true
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	}
}, {
	timestamps: true
})

module.exports = conn => conn.models.QRCode || conn.model('QRCode', qrCodeSchema)
